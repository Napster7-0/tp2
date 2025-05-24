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
    const width = 1200
    const height = 700
    const nodeWidth = 100
    const nodeHeight = 80

    d3.select(chartRef.current).selectAll('*').remove()

    const svg = d3.select(chartRef.current)
      .append('svg')
      .attr('width', width)
      .attr('height', height)

    // Calcul des positions des nœuds
    const positions: Record<string, { x: number; y: number }> = {}
    const levels: Record<string, number> = {}
    
    // Calcul des niveaux (topological sort)
    const calculateLevel = (taskId: string, visited = new Set<string>()): number => {
      if (visited.has(taskId)) return 0
      visited.add(taskId)
      
      const task = projectData[taskId]
      if (!task.predecessors.length) return 0
      
      return 1 + Math.max(...task.predecessors.map(pred => calculateLevel(pred, visited)))
    }

    tasks.forEach(task => {
      levels[task.id] = calculateLevel(task.id)
    })

    const maxLevel = Math.max(...Object.values(levels))
    const levelWidth = width / (maxLevel + 2)
    
    // Grouper les tâches par niveau
    const tasksByLevel: Record<number, typeof tasks> = {}
    tasks.forEach(task => {
      const level = levels[task.id]
      if (!tasksByLevel[level]) tasksByLevel[level] = []
      tasksByLevel[level].push(task)
    })

    // Attribution des positions avec espacement vertical amélioré
    Object.keys(tasksByLevel).forEach(levelStr => {
      const level = parseInt(levelStr)
      const levelTasks = tasksByLevel[level]
      const levelHeight = height / (levelTasks.length + 1)
      
      levelTasks.forEach((task, index) => {
        positions[task.id] = {
          x: levelWidth * (level + 1),
          y: levelHeight * (index + 1)
        }
      })
    })

    // Définir les marqueurs de flèches
    const defs = svg.append('defs')
    
    // Flèche normale
    defs.append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '0 0 10 10')
      .attr('refX', 9)
      .attr('refY', 3)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,0 L0,6 L9,3 z')
      .attr('fill', '#666')

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

    // Dessiner les connexions
    tasks.forEach(task => {
      task.predecessors.forEach(predId => {
        if (positions[predId] && positions[task.id]) {
          const startPos = positions[predId]
          const endPos = positions[task.id]
          const isCriticalPath = task.isCritical && projectData[predId].isCritical
          
          svg.append('line')
            .attr('x1', startPos.x + nodeWidth/2)
            .attr('y1', startPos.y)
            .attr('x2', endPos.x - nodeWidth/2)
            .attr('y2', endPos.y)
            .attr('stroke', isCriticalPath ? '#ef4444' : '#666')
            .attr('stroke-width', isCriticalPath ? 3 : 2)
            .attr('stroke-dasharray', isCriticalPath ? 'none' : '5,5')
            .attr('marker-end', isCriticalPath ? 'url(#arrowhead-critical)' : 'url(#arrowhead)')
        }
      })
    })

    // Dessiner les nœuds
    const nodes = svg.selectAll('.node')
      .data(tasks)
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${positions[d.id].x}, ${positions[d.id].y})`)

    // Nœuds ovales avec divisions
    nodes.append('ellipse')
      .attr('cx', 0)
      .attr('cy', 0)
      .attr('rx', nodeWidth/2)
      .attr('ry', nodeHeight/2)
      .attr('fill', 'white')
      .attr('stroke', d => d.isCritical ? '#ef4444' : '#333')
      .attr('stroke-width', d => d.isCritical ? 3 : 2)

    // Ligne horizontale de division
    nodes.append('line')
      .attr('x1', -nodeWidth/2 + 5)
      .attr('y1', 0)
      .attr('x2', nodeWidth/2 - 5)
      .attr('y2', 0)
      .attr('stroke', '#333')
      .attr('stroke-width', 1)

    // Ligne verticale gauche (séparation ES/EF)
    nodes.append('line')
      .attr('x1', -nodeWidth/4)
      .attr('y1', -nodeHeight/2 + 5)
      .attr('x2', -nodeWidth/4)
      .attr('y2', 0)
      .attr('stroke', '#333')
      .attr('stroke-width', 1)

    // Ligne verticale droite (séparation LS/LF)
    nodes.append('line')
      .attr('x1', nodeWidth/4)
      .attr('y1', 0)
      .attr('x2', nodeWidth/4)
      .attr('y2', nodeHeight/2 - 5)
      .attr('stroke', '#333')
      .attr('stroke-width', 1)

    // Texte ES (Earliest Start) - en haut à gauche
    nodes.append('text')
      .attr('x', -nodeWidth/3)
      .attr('y', -nodeHeight/6)
      .attr('text-anchor', 'middle')
      .attr('fill', 'black')
      .style('font-size', '11px')
      .style('font-weight', 'bold')
      .text(d => d.earliestStart || 0)

    // Texte EF (Earliest Finish) - en haut à droite  
    nodes.append('text')
      .attr('x', nodeWidth/3)
      .attr('y', -nodeHeight/6)
      .attr('text-anchor', 'middle')
      .attr('fill', 'black')
      .style('font-size', '11px')
      .style('font-weight', 'bold')
      .text(d => d.earliestFinish || d.duration)

    // Texte LS (Latest Start) - en bas à gauche
    nodes.append('text')
      .attr('x', -nodeWidth/3)
      .attr('y', nodeHeight/3)
      .attr('text-anchor', 'middle')
      .attr('fill', 'black')
      .style('font-size', '11px')
      .text(d => d.latestStart || d.earliestStart || 0)

    // Texte LF (Latest Finish) - en bas à droite
    nodes.append('text')
      .attr('x', nodeWidth/3)
      .attr('y', nodeHeight/3)
      .attr('text-anchor', 'middle')
      .attr('fill', 'black')
      .style('font-size', '11px')
      .text(d => d.latestFinish || d.earliestFinish || d.duration)

    // Étiquettes des tâches au-dessus des nœuds
    nodes.append('text')
      .attr('x', 0)
      .attr('y', -nodeHeight/2 - 10)
      .attr('text-anchor', 'middle')
      .attr('fill', d => d.isCritical ? '#ef4444' : '#333')
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .text(d => `${d.id}(${d.duration})`)

    // Noms des tâches en dessous
    nodes.append('text')
      .attr('x', 0)
      .attr('y', nodeHeight/2 + 20)
      .attr('text-anchor', 'middle')
      .attr('fill', '#666')
      .style('font-size', '10px')
      .text(d => d.name.length > 15 ? d.name.substring(0, 15) + '...' : d.name)

    // Légende
    const legend = svg.append('g')
      .attr('transform', 'translate(20, 20)')

    legend.append('text')
      .attr('x', 0)
      .attr('y', 0)
      .attr('fill', '#333')
      .style('font-size', '14px')
      .style('font-weight', 'bold')
      .text('Dates et marges en représentation PERT')

    legend.append('text')
      .attr('x', 0)
      .attr('y', 20)
      .attr('fill', '#666')
      .style('font-size', '11px')
      .text('Date au plus tôt | Date au plus tard')

    // Ligne critique en rouge
    legend.append('line')
      .attr('x1', 0)
      .attr('y1', 35)
      .attr('x2', 30)
      .attr('y2', 35)
      .attr('stroke', '#ef4444')
      .attr('stroke-width', 3)
      .attr('marker-end', 'url(#arrowhead-critical)')

    legend.append('text')
      .attr('x', 35)
      .attr('y', 40)
      .attr('fill', '#ef4444')
      .style('font-size', '11px')
      .text('Chemin critique')
  }

  return <div ref={chartRef} className="w-full overflow-x-auto" />
}