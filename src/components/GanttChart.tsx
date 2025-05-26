// components/GanttChart.tsx
import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import { ProjectData } from '../types'

interface GanttChartProps {
  projectData: ProjectData
}

export const GanttChart = ({ projectData }: GanttChartProps) => {
  const chartRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (projectData && chartRef.current) {
      renderChart()
    }
  }, [projectData])

  const renderChart = () => {
    if (!projectData || !chartRef.current) return

    const tasks = Object.values(projectData)
    const margin = { top: 50, right: 30, bottom: 40, left: 200 }
    const width = 1000 - margin.left - margin.right
    const height = Math.max(400, tasks.length * 50) - margin.top - margin.bottom

    d3.select(chartRef.current).selectAll('*').remove()

    const svg = d3.select(chartRef.current)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    // Échelles
    const maxTime = Math.max(...tasks.map(t => t.earliestFinish || 0))
    const x = d3.scaleLinear()
      .domain([0, maxTime])
      .range([0, width])

    const y = d3.scaleBand()
      .domain(tasks.map(t => t.id))
      .range([0, height])
      .padding(0.2)

    // Grille verticale
    const xTicks = x.ticks(Math.min(10, maxTime))
    svg.selectAll('.grid-line')
      .data(xTicks)
      .enter()
      .append('line')
      .attr('class', 'grid-line')
      .attr('x1', d => x(d))
      .attr('x2', d => x(d))
      .attr('y1', 0)
      .attr('y2', height)
      .attr('stroke', '#e2e8f0')
      .attr('stroke-width', 1)

    // Barres des tâches
    svg.selectAll('.bar')
      .data(tasks)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', d => x(d.earliestStart || 0))
      .attr('y', d => y(d.id) || 0)
      .attr('width', d => x(d.duration) - x(0))
      .attr('height', y.bandwidth())
      .attr('fill', d => d.isCritical ? '#ef4444' : '#3b82f6')
      .attr('rx', 4)
      .attr('opacity', 0.8)

    // Texte des tâches
    svg.selectAll('.task-label')
      .data(tasks)
      .enter()
      .append('text')
      .attr('class', 'task-label')
      .text(d => `${d.name} (${d.duration}j)`)
      .attr('x', d => x(d.earliestStart || 0) + 5)
      .attr('y', d => (y(d.id) || 0) + y.bandwidth() / 2)
      .attr('dy', '0.35em')
      .attr('fill', 'white')
      .style('font-size', '11px')
      .style('font-weight', 'bold')

    // Axe des temps
    const xAxis = d3.axisTop(x)
      .ticks(Math.min(10, maxTime))
      .tickFormat(d => `${d}`)
    
    svg.append('g')
      .attr('class', 'x-axis')
      .call(xAxis)
      .selectAll('text')
      .style('font-size', '12px')
      .style('color', 'green')

    // Axe des tâches
    const yAxis = d3.axisLeft(y)
    svg.append('g')
      .attr('class', 'y-axis')
      .call(yAxis)
      .selectAll('text')
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .style('color', 'blue')

    // Légende
    const legend = svg.append('g')
      .attr('transform', `translate(${width - 150 - 5}, ${-30 - 5})`)
    
    legend.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', 15)
      .attr('height', 15)
      .attr('fill', '#ef4444')
      .attr('rx', 2)
    
    legend.append('text')
      .attr('x', 20)
      .attr('y', 12)
      .text('Chemin critique')
      .style('font-size', '12px')
    
    legend.append('rect')
      .attr('x', 120)
      .attr('y', 0)
      .attr('width', 15)
      .attr('height', 15)
      .attr('fill', '#3b82f6')
      .attr('rx', 2)
    
    legend.append('text')
      .attr('x', 140)
      .attr('y', 12)
      .text('Normal')
      .style('font-size', '12px')
  }

  return <div ref={chartRef} className="w-full overflow-x-auto" />
}