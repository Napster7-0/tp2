// components/MpmChart.tsx
import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import { ProjectData } from '../types'

interface MpmChartProps {
  projectData: ProjectData
}

export const MpmChart = ({ projectData }: MpmChartProps) => {
  const chartRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (projectData && chartRef.current) {
      renderChart()
    }
  }, [projectData])

  const renderChart = () => {
    if (!projectData || !chartRef.current) return

    const tasks = Object.values(projectData)
    const width = 1200
    const height = 800
    const nodeWidth = 120
    const nodeHeight = 80

    d3.select(chartRef.current).selectAll('*').remove()

    const svg = d3.select(chartRef.current)
      .append('svg')
      .attr('width', width)
      .attr('height', height)

    // Calculer les niveaux des tâches pour le positionnement
    const levels: Record<string, number> = {}
    const calculateLevel = (taskId: string, visited = new Set<string>()): number => {
      if (visited.has(taskId)) return 0
      visited.add(taskId)
      
      const task = projectData[taskId]
      if (!task.predecessors.length) return 0
      
      return 1 + Math.max(...task.predecessors.map(pred => calculateLevel(pred, visited)))
    }

    // Ajouter les nœuds DEBUT et FIN
    const allNodes = [
      { id: 'DEBUT', isStart: true, isEnd: false, level: -1 },
      ...tasks.map(task => ({ 
        id: task.id, 
        isStart: false, 
        isEnd: false, 
        level: calculateLevel(task.id) 
      })),
      { id: 'FIN', isStart: false, isEnd: true, level: -1 }
    ]

    // Calculer le niveau maximum
    const maxLevel = Math.max(...tasks.map(task => calculateLevel(task.id)))
    
    // Assigner le niveau FIN
    allNodes.find(n => n.id === 'FIN')!.level = maxLevel + 1

    // Grouper par niveau pour le positionnement
    const nodesByLevel: Record<number, typeof allNodes> = {}
    allNodes.forEach(node => {
      if (!nodesByLevel[node.level]) nodesByLevel[node.level] = []
      nodesByLevel[node.level].push(node)
    })

    // Calculer les positions
    const levelWidth = (width - 200) / (maxLevel + 2)
    const nodePositions: Record<string, { x: number; y: number }> = {}

    Object.entries(nodesByLevel).forEach(([levelStr, levelNodes]) => {
      const level = parseInt(levelStr)
      const levelHeight = height / (levelNodes.length + 1)
      
      levelNodes.forEach((node, index) => {
        nodePositions[node.id] = {
          x: 100 + levelWidth * (level + 1),
          y: levelHeight * (index + 1)
        }
      })
    })

    // Définir les marqueurs de flèches
    const defs = svg.append('defs')
    
    // Flèche normale
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

    // Flèche critique
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

    // Dessiner les connexions
    const connections: Array<{ from: string; to: string; isCritical: boolean }> = []
    
    // Connexions du DEBUT vers les tâches sans prédécesseurs
    const startTasks = tasks.filter(task => task.predecessors.length === 0)
    startTasks.forEach(task => {
      connections.push({ from: 'DEBUT', to: task.id, isCritical: task.isCritical })
    })

    // Connexions entre tâches
    tasks.forEach(task => {
      task.predecessors.forEach(predId => {
        connections.push({ from: predId, to: task.id, isCritical: task.isCritical && projectData[predId].isCritical })
      })
    })

    // Connexions vers la FIN
    const endTasks = tasks.filter(task => 
      !tasks.some(t => t.predecessors.includes(task.id))
    )
    endTasks.forEach(task => {
      connections.push({ from: task.id, to: 'FIN', isCritical: task.isCritical })
    })

    // Dessiner les flèches
    connections.forEach(conn => {
      const fromPos = nodePositions[conn.from]
      const toPos = nodePositions[conn.to]
      
      if (fromPos && toPos) {
        // Calculer les points de connexion sur les bords des rectangles
        const startX = fromPos.x + nodeWidth / 2
        const startY = fromPos.y
        const endX = toPos.x - nodeWidth / 2
        const endY = toPos.y
        
        svg.append('line')
          .attr('x1', startX)
          .attr('y1', startY)
          .attr('x2', endX)
          .attr('y2', endY)
          .attr('stroke', conn.isCritical ? '#ef4444' : '#000')
          .attr('stroke-width', conn.isCritical ? 3 : 2)
          .attr('marker-end', conn.isCritical ? 'url(#arrowhead-critical)' : 'url(#arrowhead-normal)')
      }
    })

    // Dessiner les nœuds
    allNodes.forEach(node => {
      const pos = nodePositions[node.id]
      if (!pos) return

      const nodeGroup = svg.append('g')
        .attr('transform', `translate(${pos.x - nodeWidth/2}, ${pos.y - nodeHeight/2})`)

      // Rectangle principal
      nodeGroup.append('rect')
        .attr('width', nodeWidth)
        .attr('height', nodeHeight)
        .attr('fill', 'white')
        .attr('stroke', '#333')
        .attr('stroke-width', 2)
        .attr('rx', 5)

      if (node.isStart) {
        // Nœud DEBUT
        nodeGroup.append('text')
          .attr('x', nodeWidth / 2)
          .attr('y', nodeHeight / 2)
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'central')
          .attr('fill', '#000')
          .style('font-size', '14px')
          .style('font-weight', 'bold')
          .text('DEBUT')

        // Dates (0, 0)
        nodeGroup.append('text')
          .attr('x', 15)
          .attr('y', 15)
          .attr('fill', '#000')
          .style('font-size', '12px')
          .style('font-weight', 'bold')
          .text('0')

        nodeGroup.append('text')
          .attr('x', nodeWidth - 15)
          .attr('y', 15)
          .attr('text-anchor', 'end')
          .attr('fill', '#000')
          .style('font-size', '12px')
          .style('font-weight', 'bold')
          .text('0')

      } else if (node.isEnd) {
        // Nœud FIN
        const projectEnd = Math.max(...tasks.map(t => t.earliestFinish || 0))
        
        nodeGroup.append('text')
          .attr('x', nodeWidth / 2)
          .attr('y', nodeHeight / 2)
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'central')
          .attr('fill', '#000')
          .style('font-size', '14px')
          .style('font-weight', 'bold')
          .text('FIN')

        // Dates (projectEnd, projectEnd)
        nodeGroup.append('text')
          .attr('x', 15)
          .attr('y', 15)
          .attr('fill', '#000')
          .style('font-size', '12px')
          .style('font-weight', 'bold')
          .text(projectEnd.toString())

        nodeGroup.append('text')
          .attr('x', nodeWidth - 15)
          .attr('y', 15)
          .attr('text-anchor', 'end')
          .attr('fill', '#000')
          .style('font-size', '12px')
          .style('font-weight', 'bold')
          .text(projectEnd.toString())

      } else {
        // Nœud de tâche normale
        const task = projectData[node.id]
        
        // Ligne de séparation horizontale
        nodeGroup.append('line')
          .attr('x1', 0)
          .attr('y1', nodeHeight / 2)
          .attr('x2', nodeWidth)
          .attr('y2', nodeHeight / 2)
          .attr('stroke', '#333')
          .attr('stroke-width', 1)

        // Ligne de séparation verticale pour les dates
        nodeGroup.append('line')
          .attr('x1', nodeWidth / 2)
          .attr('y1', 0)
          .attr('x2', nodeWidth / 2)
          .attr('y2', nodeHeight / 2)
          .attr('stroke', '#333')
          .attr('stroke-width', 1)

        // Date au plus tôt (en haut à gauche)
        nodeGroup.append('text')
          .attr('x', nodeWidth / 4)
          .attr('y', nodeHeight / 4)
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'central')
          .attr('fill', '#000')
          .style('font-size', '12px')
          .style('font-weight', 'bold')
          .text((task.earliestStart || 0).toString())

        // Date au plus tard (en haut à droite)
        nodeGroup.append('text')
          .attr('x', 3 * nodeWidth / 4)
          .attr('y', nodeHeight / 4)
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'central')
          .attr('fill', '#000')
          .style('font-size', '12px')
          .style('font-weight', 'bold')
          .text((task.latestStart || 0).toString())

        // ID de la tâche (en bas)
        nodeGroup.append('text')
          .attr('x', nodeWidth / 2)
          .attr('y', 3 * nodeHeight / 4)
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'central')
          .attr('fill', task.isCritical ? '#ef4444' : '#000')
          .style('font-size', '16px')
          .style('font-weight', 'bold')
          .text(task.id)

        // Durée (petit, en bas à droite)
        nodeGroup.append('text')
          .attr('x', nodeWidth - 5)
          .attr('y', nodeHeight - 5)
          .attr('text-anchor', 'end')
          .attr('fill', '#666')
          .style('font-size', '10px')
          .text(`(${task.duration})`)

        // Marge (si non critique)
        if (!task.isCritical && task.slack > 0) {
          nodeGroup.append('text')
            .attr('x', 5)
            .attr('y', nodeHeight - 5)
            .attr('fill', '#666')
            .style('font-size', '10px')
            .text(`M:${task.slack}`)
        }

        // Nom de la tâche (au centre, tronqué si nécessaire)
        const taskName = task.name.length > 10 ? task.name.substring(0, 10) + '...' : task.name
        nodeGroup.append('text')
          .attr('x', nodeWidth / 2)
          .attr('y', 5 * nodeHeight / 8)
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'central')
          .attr('fill', '#666')
          .style('font-size', '10px')
          .text(taskName)
      }
    })

    // Légende
    const legend = svg.append('g')
      .attr('transform', 'translate(20, 20)')

    legend.append('text')
      .attr('x', 0)
      .attr('y', 0)
      .attr('fill', '#333')
      .style('font-size', '16px')
      .style('font-weight', 'bold')
      .text('Diagramme MPM (Méthode des Potentiels Métra)')

    // Structure d'un nœud exemple
    const exampleNode = legend.append('g')
      .attr('transform', 'translate(0, 30)')

    exampleNode.append('rect')
      .attr('width', 80)
      .attr('height', 50)
      .attr('fill', 'white')
      .attr('stroke', '#333')
      .attr('stroke-width', 1)
      .attr('rx', 3)

    exampleNode.append('line')
      .attr('x1', 0)
      .attr('y1', 25)
      .attr('x2', 80)
      .attr('y2', 25)
      .attr('stroke', '#333')
      .attr('stroke-width', 1)

    exampleNode.append('line')
      .attr('x1', 40)
      .attr('y1', 0)
      .attr('x2', 40)
      .attr('y2', 25)
      .attr('stroke', '#333')
      .attr('stroke-width', 1)

    exampleNode.append('text')
      .attr('x', 20)
      .attr('y', 15)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .style('font-size', '10px')
      .text('Date+tôt')

    exampleNode.append('text')
      .attr('x', 60)
      .attr('y', 15)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .style('font-size', '10px')
      .text('Date+tard')

    exampleNode.append('text')
      .attr('x', 40)
      .attr('y', 38)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .style('font-size', '10px')
      .text('Tâche')

    // Légende des traits
    legend.append('line')
      .attr('x1', 100)
      .attr('y1', 45)
      .attr('x2', 140)
      .attr('y2', 45)
      .attr('stroke', '#000')
      .attr('stroke-width', 2)
      .attr('marker-end', 'url(#arrowhead-normal)')

    legend.append('text')
      .attr('x', 145)
      .attr('y', 50)
      .attr('fill', '#000')
      .style('font-size', '11px')
      .text('Liaison normale')

    legend.append('line')
      .attr('x1', 100)
      .attr('y1', 65)
      .attr('x2', 140)
      .attr('y2', 65)
      .attr('stroke', '#ef4444')
      .attr('stroke-width', 3)
      .attr('marker-end', 'url(#arrowhead-critical)')

    legend.append('text')
      .attr('x', 145)
      .attr('y', 70)
      .attr('fill', '#ef4444')
      .style('font-size', '11px')
      .text('Chemin critique')
  }

  return <div ref={chartRef} className="w-full overflow-x-auto bg-gray-50 p-4 rounded-lg" />
}