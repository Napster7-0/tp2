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

  const calculateSlacks = (tasks: any[]) => {
    const taskMap = Object.fromEntries(tasks.map(task => [task.id, task]))
    
    tasks.forEach(task => {
      // Marge totale = Date au plus tard de fin - Date au plus tôt de fin
      const totalSlack = (task.latestFinish || task.earliestFinish || (task.earliestStart || 0) + task.duration) - 
                        (task.earliestFinish || (task.earliestStart || 0) + task.duration)
      
      // Marge libre = Min(Date au plus tôt de début des successeurs) - Date au plus tôt de fin de la tâche
      const successors = tasks.filter(t => t.predecessors.includes(task.id))
      let freeSlack = 0
      
      if (successors.length > 0) {
        const minSuccessorStart = Math.min(...successors.map(s => s.earliestStart || 0))
        const taskEarliestFinish = task.earliestFinish || (task.earliestStart || 0) + task.duration
        freeSlack = minSuccessorStart - taskEarliestFinish
      } else {
        // Si pas de successeurs, marge libre = marge totale
        freeSlack = totalSlack
      }
      
      task.totalSlack = Math.max(0, totalSlack)
      task.freeSlack = Math.max(0, freeSlack)
    })
    
    return tasks
  }

  const renderChart = () => {
    if (!projectData || !chartRef.current) return

    let tasks = Object.values(projectData)
    
    // Calculer les marges
    tasks = calculateSlacks(tasks)
    
    const width = 1600
    const height = 900
    const nodeRadius = 45

    d3.select(chartRef.current).selectAll('*').remove()

    const svg = d3.select(chartRef.current)
      .append('svg')
      .attr('width', width)
      .attr('height', height)

    // Créer la structure des événements (nœuds)
    const events = new Map<string, { id: string; x: number; y: number; earliestTime: number; latestTime: number }>()
    
    // Nœud de début (tous à 0,0)
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
    const levelWidth = (width - 250) / (maxLevel + 1)

    // Créer les événements pour chaque fin de tâche
    const eventsByLevel: Record<number, string[]> = {}
    tasks.forEach(task => {
      const level = levels[task.id]
      if (!eventsByLevel[level]) eventsByLevel[level] = []
      eventsByLevel[level].push(`END_${task.id}`)
    })
    
    // Positionner les événements
    Object.keys(eventsByLevel).forEach(levelStr => {
      const level = parseInt(levelStr)
      const levelEvents = eventsByLevel[level]
      const levelHeight = height / (levelEvents.length + 1)
      
      levelEvents.forEach((eventId, index) => {
        const taskId = eventId.replace('END_', '')
        const task = projectData[taskId]
        events.set(eventId, {
          id: eventId,
          x: 100 + levelWidth * level,
          y: levelHeight * (index + 1),
          earliestTime: task.earliestFinish || (task.earliestStart || 0) + task.duration,
          latestTime: task.latestFinish || task.earliestFinish || (task.earliestStart || 0) + task.duration
        })
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
      x: width - 150, 
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
        const perpX = -unitY * 25
        const perpY = unitX * 25
        
        // Informations de la tâche
        svg.append('text')
          .attr('x', midX + perpX)
          .attr('y', midY + perpY - 10)
          .attr('text-anchor', 'middle')
          .attr('fill', isCritical ? '#ef4444' : '#000')
          .style('font-size', '12px')
          .style('font-weight', 'bold')
          .text(`${task.id}(${task.duration})`)
        
        svg.append('text')
          .attr('x', midX + perpX)
          .attr('y', midY + perpY + 5)
          .attr('text-anchor', 'middle')
          .attr('fill', '#666')
          .style('font-size', '10px')
          .text(task.name.length > 15 ? task.name.substring(0, 15) + '...' : task.name)
        
        // Afficher les marges
        svg.append('text')
          .attr('x', midX + perpX)
          .attr('y', midY + perpY + 20)
          .attr('text-anchor', 'middle')
          .attr('fill', '#0066cc')
          .style('font-size', '9px')
          .style('font-weight', 'bold')
          .text(`MT: ${task.totalSlack || 0} | ML: ${task.freeSlack || 0}`)
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

    // Légende étendue
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

    // Légende pour les marges
    legend.append('text')
      .attr('x', 0)
      .attr('y', 95)
      .attr('fill', '#0066cc')
      .style('font-size', '11px')
      .style('font-weight', 'bold')
      .text('MT: Marge Totale | ML: Marge Libre')

    // Tableau récapitulatif des marges
    const tableY = 130
    legend.append('text')
      .attr('x', 0)
      .attr('y', tableY)
      .attr('fill', '#333')
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .text('Récapitulatif des marges :')

    tasks.forEach((task, index) => {
      const yPos = tableY + 20 + (index * 18)
      
      legend.append('text')
        .attr('x', 0)
        .attr('y', yPos)
        .attr('fill', task.isCritical ? '#ef4444' : '#333')
        .style('font-size', '10px')
        .style('font-weight', task.isCritical ? 'bold' : 'normal')
        .text(`${task.id}: MT=${task.totalSlack || 0}, ML=${task.freeSlack || 0}`)
    })

    // Explication des calculs
    const explanationY = tableY + 20 + (tasks.length * 18) + 30
    legend.append('text')
      .attr('x', 0)
      .attr('y', explanationY)
      .attr('fill', '#666')
      .style('font-size', '9px')
      .text('Marge Totale = Yⱼ - Xᵢ - dᵢⱼ')

    legend.append('text')
      .attr('x', 0)
      .attr('y', explanationY + 15)
      .attr('fill', '#666')
      .style('font-size', '9px')
      .text('Marge Libre = Xⱼ - Xᵢ - dᵢⱼ')
  }

  return <div ref={chartRef} className="w-full overflow-x-auto" />
}