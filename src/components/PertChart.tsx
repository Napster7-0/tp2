// components/PertChart.tsx
import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import { ProjectData } from '../types'

interface PertChartProps {
  projectData: ProjectData
}

export const PertChart = ({ projectData }: PertChartProps) => {
  const chartRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (projectData && chartRef.current) {
      renderChart()
    }
  }, [projectData])

  const renderChart = () => {
    if (!projectData || !chartRef.current) return

    const tasks = Object.values(projectData)
    const width = 1400
    const height = 800
    const nodeRadius = 40

    d3.select(chartRef.current).selectAll('*').remove()

    const svg = d3.select(chartRef.current)
      .append('svg')
      .attr('width', width)
      .attr('height', height)

    // Créer la structure des événements (nœuds)
    const events = new Map<string, { id: string; x: number; y: number; earliestTime: number; latestTime: number }>()
    
    // Nœud de début (toujours 0,0)
    events.set('START', { id: 'START', x: 100, y: height / 2, earliestTime: 0, latestTime: 0 })
    
    // Calculer les niveaux des tâches pour positionner les événements
    const levels: Record<string, number> = {}
    const calculateLevel = (taskId: string, visited = new Set<string>()): number => {
      if (visited.has(taskId)) return 0
      visited.add(taskId)
      
      const task = projectData[taskId]
      if (!task.predecessors.length) return 1
      
      return 1 + Math.max(...task.predecessors.map(pred => calculateLevel(pred, visited)))
    }

    tasks.forEach(task => {
      levels[task.id] = calculateLevel(task.id)
    })

    const maxLevel = Math.max(...Object.values(levels))
    const levelWidth = (width - 200) / (maxLevel + 1)

    // Créer les événements pour chaque fin de tâche
    const eventsByLevel: Record<number, string[]> = {}
    tasks.forEach(task => {
      const level = levels[task.id]
      if (!eventsByLevel[level]) eventsByLevel[level] = []
      eventsByLevel[level].push(`END_${task.id}`)
    })
    console.log('Events by level:', eventsByLevel)
    // Positionner les événements
    Object.keys(eventsByLevel).forEach(levelStr => {
      const level = parseInt(levelStr)
      const levelEvents = eventsByLevel[level]
      const levelHeight = height / (levelEvents.length + 1)
      
      levelEvents.forEach((eventId, index) => {
        const taskId = eventId.replace('END_', '')
        const task = projectData[taskId]
        console.log(task)
        events.set(eventId, {
          id: eventId,
          x: 100 + levelWidth * level,
          y: levelHeight * (index + 1),
          earliestTime: task.earliestFinish || (task.earliestStart || 0) + task.duration,
          latestTime: task.latestFinish || task.earliestFinish || (task.earliestStart || 0) + task.duration
        })
        console.log(events)
      })
    })

    // Nœud de fin (TotalProjectDuration, TotalProjectDuration)
    const finalTasks = tasks.filter(task => 
      !tasks.some(t => t.predecessors.includes(task.id))
    )
    const projectEndTime = Math.max(...finalTasks.map(task => 
      task.earliestFinish || (task.earliestStart || 0) + task.duration
    ))
    
    events.set('END', { 
      id: 'END', 
      x: width - 100, 
      y: height / 2, 
      earliestTime: projectEndTime, 
      latestTime: projectEndTime 
    })

    // Définir les marqueurs de flèches
    const defs = svg.append('defs')
    
    // Flèche normale (trait fort noir)
    defs.append('marker')
      .attr('id', 'arrowhead-normal')
      .attr('viewBox', '0 0 10 10')
      .attr('refX', 9)
      .attr('refY', 3)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,0 L0,6 L9,3 z')
      .attr('fill', '#000')

    // Flèche critique (rouge)
    defs.append('marker')
      .attr('id', 'arrowhead-critical')
      .attr('viewBox', '0 0 10 10')
      .attr('refX', 9)
      .attr('refY', 3)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,0 L0,6 L9,3 z')
      .attr('fill', '#ef4444')

    // Flèche pointillée
    defs.append('marker')
      .attr('id', 'arrowhead-dashed')
      .attr('viewBox', '0 0 10 10')
      .attr('refX', 9)
      .attr('refY', 3)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,0 L0,6 L9,3 z')
      .attr('fill', '#666')

        // Dessiner les tâches (arêtes)
    tasks.forEach(task => {
      let startEvent = 'START'
      
      // Si la tâche a des prédécesseurs, trouver l'événement de fin du dernier prédécesseur
      if (task.predecessors.length > 0) {
        // Trouver le prédécesseur qui finit le plus tard
        const lastPredecessor = task.predecessors.reduce((latest, predId) => {
          const pred = projectData[predId]
          const latestPred = projectData[latest]
          const predFinish = pred.earliestFinish || (pred.earliestStart || 0) + pred.duration
          const latestFinish = latestPred.earliestFinish || (latestPred.earliestStart || 0) + latestPred.duration
          return predFinish > latestFinish ? predId : latest
        })
        
        startEvent = `END_${lastPredecessor}`
        
        // Dessiner les flèches pointillées pour les autres prédécesseurs
        task.predecessors.forEach(predId => {
          if (predId !== lastPredecessor) {
            const startPos = events.get(`END_${predId}`)
            const endPos = events.get(startEvent)
            
            if (startPos && endPos) {
              // Calculer les points de connexion sur les bords des cercles
              const dx = endPos.x - startPos.x
              const dy = endPos.y - startPos.y
              const distance = Math.sqrt(dx * dx + dy * dy)
              const unitX = dx / distance
              const unitY = dy / distance
              
              const startX = startPos.x + unitX * nodeRadius
              const startY = startPos.y + unitY * nodeRadius
              const endX = endPos.x - unitX * nodeRadius
              const endY = endPos.y - unitY * nodeRadius
              
              svg.append('line')
                .attr('x1', startX)
                .attr('y1', startY)
                .attr('x2', endX)
                .attr('y2', endY)
                .attr('stroke', '#666')
                .attr('stroke-width', 2)
                .attr('stroke-dasharray', '5,5')
                .attr('marker-end', 'url(#arrowhead-dashed)')
            }
          }
        })
      }

      const endEvent = `END_${task.id}`
      const startPos = events.get(startEvent)
      const endPos = events.get(endEvent)

      if (startPos && endPos) {
        // Calculer les points de connexion sur les bords des cercles
        const dx = endPos.x - startPos.x
        const dy = endPos.y - startPos.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        const unitX = dx / distance
        const unitY = dy / distance
        
        const startX = startPos.x + unitX * nodeRadius
        const startY = startPos.y + unitY * nodeRadius
        const endX = endPos.x - unitX * nodeRadius
        const endY = endPos.y - unitY * nodeRadius
        
        // Déterminer le type de trait
        const isCritical = task.isCritical
        
        // Dessiner la flèche principale de la tâche
        svg.append('line')
          .attr('x1', startX)
          .attr('y1', startY)
          .attr('x2', endX)
          .attr('y2', endY)
          .attr('stroke', isCritical ? '#ef4444' : '#000')
          .attr('stroke-width', isCritical ? 3 : 2)
          .attr('marker-end', isCritical ? 'url(#arrowhead-critical)' : 'url(#arrowhead-normal)')

        // Ajouter le label de la tâche sur l'arête
        const midX = (startX + endX) / 2
        const midY = (startY + endY) / 2
        
        // Décaler le texte perpendiculairement à la ligne
        const perpX = -unitY * 15
        const perpY = unitX * 15
        
        svg.append('text')
          .attr('x', midX + perpX)
          .attr('y', midY + perpY)
          .attr('text-anchor', 'middle')
          .attr('fill', isCritical ? '#ef4444' : '#000')
          .style('font-size', '12px')
          .style('font-weight', 'bold')
          .text(`${task.id}(${task.duration})`)
        
        svg.append('text')
          .attr('x', midX + perpX)
          .attr('y', midY + perpY + 15)
          .attr('text-anchor', 'middle')
          .attr('fill', '#666')
          .style('font-size', '10px')
          .text(task.name.length > 12 ? task.name.substring(0, 12) + '...' : task.name)
      }
    })

    // Connecter les tâches finales au nœud END
    const finalTaskEvents = finalTasks.map(task => `END_${task.id}`)
    finalTaskEvents.forEach(eventId => {
      const startPos = events.get(eventId)
      const endPos = events.get('END')
      
      if (startPos && endPos) {
        // Calculer les points de connexion sur les bords des cercles
        const dx = endPos.x - startPos.x
        const dy = endPos.y - startPos.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        const unitX = dx / distance
        const unitY = dy / distance
        
        const startX = startPos.x + unitX * nodeRadius
        const startY = startPos.y + unitY * nodeRadius
        const endX = endPos.x - unitX * nodeRadius
        const endY = endPos.y - unitY * nodeRadius
        
        svg.append('line')
          .attr('x1', startX)
          .attr('y1', startY)
          .attr('x2', endX)
          .attr('y2', endY)
          .attr('stroke', '#666')
          .attr('stroke-width', 2)
          .attr('stroke-dasharray', '5,5')
          .attr('marker-end', 'url(#arrowhead-dashed)')
      }
    })

    // Dessiner les nœuds (événements)
    events.forEach((event, eventId) => {
      const node = svg.append('g')
        .attr('transform', `translate(${event.x}, ${event.y})`)

      // Cercle principal
      node.append('circle')
        .attr('r', nodeRadius)
        .attr('fill', 'white')
        .attr('stroke', '#333')
        .attr('stroke-width', 2)

      // Lignes de division plus ergonomiques
      // Ligne horizontale
      node.append('line')
        .attr('x1', -nodeRadius * 1)
        .attr('y1', 0)
        .attr('x2', nodeRadius * 1)
        .attr('y2', 0)
        .attr('stroke', '#333')
        .attr('stroke-width', 1)

      // Ligne verticale
      node.append('line')
        .attr('x1', 0)
        .attr('y1', -nodeRadius * 1)
        .attr('x2', 0)
        .attr('y2', 0)
        .attr('stroke', '#333')
        .attr('stroke-width', 1)

      // Textes dans les sections du nœud
      if (eventId === 'START') {
        // Nœud DÉBUT (0,0)
        node.append('text')
          .attr('x', 0)
          .attr('y', nodeRadius/2)
          .attr('text-anchor', 'middle')
          .attr('fill', '#000')
          .style('font-size', '10px')
          .style('font-weight', 'bold')
          .text('DÉBUT')
        
        node.append('text')
          .attr('x', -nodeRadius/2)
          .attr('y', -nodeRadius/2)
          .attr('text-anchor', 'middle')
          .attr('fill', '#000')
          .style('font-size', '12px')
          .style('font-weight', 'bold')
          .text('0')

        node.append('text')
          .attr('x', nodeRadius/2)
          .attr('y', -nodeRadius/2)
          .attr('text-anchor', 'middle')
          .attr('fill', '#000')
          .style('font-size', '12px')
          .style('font-weight', 'bold')
          .text('0')
          
      } else if (eventId === 'END') {
        // Nœud FIN (ProjectDuration, ProjectDuration)
        node.append('text')
          .attr('x', 0)
          .attr('y', nodeRadius/2)
          .attr('text-anchor', 'middle')
          .attr('fill', '#000')
          .style('font-size', '10px')
          .style('font-weight', 'bold')
          .text('FIN')
        
        node.append('text')
          .attr('x', -nodeRadius/2)
          .attr('y', -nodeRadius/2)
          .attr('text-anchor', 'middle')
          .attr('fill', '#000')
          .style('font-size', '12px')
          .style('font-weight', 'bold')
          .text(event.earliestTime)

        node.append('text')
          .attr('x', nodeRadius/2)
          .attr('y', -nodeRadius/2)
          .attr('text-anchor', 'middle')
          .attr('fill', '#000')
          .style('font-size', '12px')
          .style('font-weight', 'bold')
          .text(event.latestTime)
          
      } else {
        // Nœuds intermédiaires
        // Numéro du nœud (partie haute)
        node.append('text')
          .attr('x', 0)
          .attr('y', nodeRadius/2)
          .attr('text-anchor', 'middle')
          .attr('fill', '#000')
          .style('font-size', '9px')
          .style('font-weight', 'bold')
          .text(eventId.replace('END_', ''))

        // Date au plus tôt (gauche)
        node.append('text')
          .attr('x', -nodeRadius/2)
          .attr('y', -nodeRadius/2)
          .attr('text-anchor', 'middle')
          .attr('fill', '#000')
          .style('font-size', '11px')
          .style('font-weight', 'bold')
          .text(event.earliestTime)

        // Date au plus tard (droite)
        node.append('text')
          .attr('x', nodeRadius/2)
          .attr('y', -nodeRadius/2)
          .attr('text-anchor', 'middle')
          .attr('fill', '#000')
          .style('font-size', '11px')
          .style('font-weight', 'bold')
          .text(event.latestTime)
      }
    })

    // Légende
    const legend = svg.append('g')
      .attr('transform', 'translate(20, 20)')

    legend.append('text')
      .attr('x', 0)
      .attr('y', 0)
      .attr('fill', '#333')
      .style('font-size', '14px')
      .style('font-weight', 'bold')
      .text('Diagramme PERT - Task on Edge')

    // Trait fort noir (normal)
    legend.append('line')
      .attr('x1', 0)
      .attr('y1', 25)
      .attr('x2', 30)
      .attr('y2', 25)
      .attr('stroke', '#000')
      .attr('stroke-width', 2)
      .attr('marker-end', 'url(#arrowhead-normal)')

    legend.append('text')
      .attr('x', 35)
      .attr('y', 30)
      .attr('fill', '#000')
      .style('font-size', '11px')
      .text('Tâche normale')

    // Trait rouge (critique)
    legend.append('line')
      .attr('x1', 0)
      .attr('y1', 45)
      .attr('x2', 30)
      .attr('y2', 45)
      .attr('stroke', '#ef4444')
      .attr('stroke-width', 3)
      .attr('marker-end', 'url(#arrowhead-critical)')

    legend.append('text')
      .attr('x', 35)
      .attr('y', 50)
      .attr('fill', '#ef4444')
      .style('font-size', '11px')
      .text('Chemin critique')

    // Trait pointillé
    legend.append('line')
      .attr('x1', 0)
      .attr('y1', 65)
      .attr('x2', 30)
      .attr('y2', 65)
      .attr('stroke', '#666')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '5,5')
      .attr('marker-end', 'url(#arrowhead-dashed)')

    legend.append('text')
      .attr('x', 35)
      .attr('y', 70)
      .attr('fill', '#666')
      .style('font-size', '11px')
      .text('Contrainte temporelle')
  }

  return <div ref={chartRef} className="w-full overflow-x-auto" />
}