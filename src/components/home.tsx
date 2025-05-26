"use client"
import React, { useState, useRef, useEffect } from 'react'
import * as d3 from 'd3'
import { Plus, Trash2, Calculator, Table, BarChart3, Network, Save, Download } from 'lucide-react'

interface Task {
  id: string
  name: string
  description: string
  duration: number
  predecessors: string[]
  earliestStart?: number
  earliestFinish?: number
  latestStart?: number
  latestFinish?: number
  totalSlack?: number
  freeSlack?: number
  isCritical?: boolean
}

interface ProjectData {
  [key: string]: Task
}

export default function ModernProjectManager() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [projectData, setProjectData] = useState<ProjectData | null>(null)
  const [activeView, setActiveView] = useState<'input' | 'table' | 'gantt' | 'pert'>('input')
  const [taskCounter, setTaskCounter] = useState(0)
  const [projectName, setProjectName] = useState('Nouveau Projet')

  const ganttRef = useRef<HTMLDivElement>(null)
  const pertRef = useRef<HTMLDivElement>(null)

  const generateTaskId = (index: number) => {
    if (index < 26) return String.fromCharCode(65 + index)
    if (index < 52) return String.fromCharCode(97 + (index - 26))
    const first = String.fromCharCode(65 + Math.floor((index - 52) / 26))
    const second = String.fromCharCode(65 + ((index - 52) % 26))
    return first + second
  }

  const addTask = () => {
    const newTask: Task = {
      id: generateTaskId(taskCounter),
      name: '',
      description: '',
      duration: 1,
      predecessors: []
    }
    setTasks([...tasks, newTask])
    setTaskCounter(prev => prev + 1)
  }

  const updateTask = (index: number, field: keyof Task, value: any) => {
    const updatedTasks = [...tasks]
    if (field === 'predecessors' && typeof value === 'string') {
      updatedTasks[index] = { 
        ...updatedTasks[index], 
        [field]: value.split(',').map(p => p.trim()).filter(p => p) 
      }
    } else {
      updatedTasks[index] = { ...updatedTasks[index], [field]: value }
    }
    setTasks(updatedTasks)
  }

  const removeTask = (index: number) => {
    const removedId = tasks[index].id
    const updatedTasks = tasks.filter((_, i) => i !== index)
      .map(task => ({
        ...task,
        predecessors: task.predecessors.filter(p => p !== removedId)
      }))
    setTasks(updatedTasks)
    setTaskCounter(prev => prev - 1)
  }

  const calculateProject = () => {
  if (tasks.length === 0) {
    alert('Veuillez ajouter au moins une tâche.')
    return
  }
  if (tasks.some(t => !t.name.trim())) {
    alert('Veuillez nommer toutes les tâches.')
    return
  }
  const calculatedData = calculateCPM()
  setProjectData(calculatedData)
  setActiveView('table') 
}

  const calculateCPM = (): ProjectData => {
    const schedule: ProjectData = {}

    // Initialisation
    tasks.forEach(task => {
      schedule[task.id] = {
        ...task,
        earliestStart: 0,
        earliestFinish: 0,
        latestStart: 0,
        latestFinish: 0,
        totalSlack: 0,
        freeSlack: 0,
        isCritical: false
      }
    })

    // Forward pass
    let changed = true
    let iterations = 0
    const maxIterations = 100

    while (changed && iterations < maxIterations) {
      changed = false
      iterations++
      
      tasks.forEach(task => {
        const current = schedule[task.id]
        let maxPredFinish = 0
        
        if (current.predecessors.length > 0) {
          maxPredFinish = Math.max(
            ...current.predecessors
              .filter(p => schedule[p])
              .map(p => schedule[p].earliestFinish || 0)
          )
        }

        const newES = maxPredFinish
        const newEF = newES + task.duration

        if (newES !== current.earliestStart || newEF !== current.earliestFinish) {
          current.earliestStart = newES
          current.earliestFinish = newEF
          changed = true
        }
      })
    }

    // Backward pass
    const projectEnd = Math.max(...Object.values(schedule).map(t => t.earliestFinish || 0))
    
    Object.values(schedule).forEach(task => {
      if (task.earliestFinish === projectEnd) {
        task.latestFinish = projectEnd
        task.latestStart = projectEnd - task.duration
      }
    })

    changed = true
    iterations = 0
    
    while (changed && iterations < maxIterations) {
      changed = false
      iterations++
      
      tasks.slice().reverse().forEach(task => {
        const current = schedule[task.id]
        const successors = tasks.filter(t => t.predecessors.includes(task.id))
        
        if (successors.length > 0) {
          const minLS = Math.min(...successors.map(s => schedule[s.id].latestStart || 0))
          const newLF = minLS
          const newLS = newLF - task.duration
          
          if (current.latestFinish !== newLF || current.latestStart !== newLS) {
            current.latestFinish = newLF
            current.latestStart = newLS
            changed = true
          }
        }
      })
    }

    // Calcul des marges et chemin critique
    Object.values(schedule).forEach(task => {
      task.totalSlack = (task.latestStart || 0) - (task.earliestStart || 0)
      task.isCritical = task.totalSlack === 0
      
      // Calcul de la marge libre
      const successors = tasks.filter(t => t.predecessors.includes(task.id))
      if (successors.length > 0) {
        const minSuccessorES = Math.min(...successors.map(s => schedule[s.id].earliestStart || 0))
        task.freeSlack = minSuccessorES - (task.earliestFinish || 0)
      } else {
        task.freeSlack = task.totalSlack
      }
    })

    return schedule
  }

  const renderGanttChart = () => {
    if (!projectData || !ganttRef.current) return

    const taskList = Object.values(projectData)
    const margin = { top: 60, right: 50, bottom: 60, left: 250 }
    const width = Math.max(1000, taskList.length * 80) - margin.left - margin.right
    const height = Math.max(400, taskList.length * 60) - margin.top - margin.bottom

    d3.select(ganttRef.current).selectAll('*').remove()

    const svg = d3.select(ganttRef.current)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .style('background', 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)')
      .style('border-radius', '12px')

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    const maxTime = Math.max(...taskList.map(t => t.earliestFinish || 0))
    const x = d3.scaleLinear().domain([0, maxTime]).range([0, width])
    const y = d3.scaleBand().domain(taskList.map(t => t.id)).range([0, height]).padding(0.3)

    // Grille
    const xTicks = x.ticks(Math.min(15, maxTime))
    g.selectAll('.grid-line')
      .data(xTicks)
      .enter()
      .append('line')
      .attr('class', 'grid-line')
      .attr('x1', d => x(d))
      .attr('x2', d => x(d))
      .attr('y1', 0)
      .attr('y2', height)
      .attr('stroke', 'rgba(255,255,255,0.2)')
      .attr('stroke-width', 1)

    // Barres des tâches avec animation
    const bars = g.selectAll('.bar')
      .data(taskList)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', d => x(d.earliestStart || 0))
      .attr('y', d => y(d.id) || 0)
      .attr('width', 0)
      .attr('height', y.bandwidth())
      .attr('fill', d => d.isCritical ? 
        'url(#criticalGradient)' : 
        'url(#normalGradient)')
      .attr('rx', 8)
      .style('filter', 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))')

    // Gradients
    const defs = svg.append('defs')
    
    const criticalGradient = defs.append('linearGradient')
      .attr('id', 'criticalGradient')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '100%').attr('y2', '100%')
    
    criticalGradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#ff6b6b')
    
    criticalGradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#ee5a24')

    const normalGradient = defs.append('linearGradient')
      .attr('id', 'normalGradient')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '100%').attr('y2', '100%')
    
    normalGradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#74b9ff')
    
    normalGradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#0984e3')

    // Animation des barres
    bars.transition()
      .duration(1000)
      .delay((d, i) => i * 100)
      .attr('width', d => x(d.duration) - x(0))

    // Labels des tâches
    g.selectAll('.task-label')
      .data(taskList)
      .enter()
      .append('text')
      .attr('class', 'task-label')
      .text(d => `${d.name} (${d.duration}j)`)
      .attr('x', d => x(d.earliestStart || 0) + 10)
      .attr('y', d => (y(d.id) || 0) + y.bandwidth() / 2)
      .attr('dy', '0.35em')
      .attr('fill', 'white')
      .style('font-size', '12px')
      .style('font-weight', '600')
      .style('text-shadow', '0 1px 2px rgba(0,0,0,0.5)')

    // Axe X
    const xAxis = d3.axisTop(x)
      .ticks(Math.min(15, maxTime))
      .tickFormat(d => `J${d}`)
    
    g.append('g')
      .attr('class', 'x-axis')
      .call(xAxis)
      .selectAll('text')
      .style('font-size', '12px')
      .style('fill', 'white')
      .style('font-weight', '500')

    // Axe Y
    const yAxis = d3.axisLeft(y)
    g.append('g')
      .attr('class', 'y-axis')
      .call(yAxis)
      .selectAll('text')
      .style('font-size', '14px')
      .style('fill', 'white')
      .style('font-weight', '600')

    // Titre
    svg.append('text')
      .attr('x', (width + margin.left + margin.right) / 2)
      .attr('y', 30)
      .attr('text-anchor', 'middle')
      .attr('fill', 'white')
      .style('font-size', '18px')
      .style('font-weight', 'bold')
      .text(`Diagramme de Gantt - ${projectName}`)
  }

  const renderPertChart = () => {
    if (!projectData || !pertRef.current) return

    const taskList = Object.values(projectData)
    const width = 1400
    const height = 800
    const nodeRadius = 50

    d3.select(pertRef.current).selectAll('*').remove()

    const svg = d3.select(pertRef.current)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .style('background', 'radial-gradient(circle at center, #2c3e50 0%, #34495e 100%)')
      .style('border-radius', '12px')

    // Calcul des positions
    const positions = {}
    const levels = {}
    
    const calculateLevel = (taskId, visited = new Set()) => {
      if (visited.has(taskId)) return 0
      visited.add(taskId)
      
      const task = projectData[taskId]
      if (!task.predecessors.length) return 0
      
      return 1 + Math.max(...task.predecessors.map(pred => calculateLevel(pred, visited)))
    }

    taskList.forEach(task => {
      levels[task.id] = calculateLevel(task.id)
    })

    const maxLevel = Math.max(...Object.values(levels).map(Number))
    const levelWidth = width / (maxLevel + 2)
    
    const tasksByLevel = {}
    taskList.forEach(task => {
      const level = levels[task.id]
      if (!tasksByLevel[level]) tasksByLevel[level] = []
      tasksByLevel[level].push(task)
    })

    Object.keys(tasksByLevel).forEach(level => {
      const levelTasks = tasksByLevel[level]
      const levelHeight = height / (levelTasks.length + 1)
      
      levelTasks.forEach((task, index) => {
        positions[task.id] = {
          x: levelWidth * (parseInt(level) + 1),
          y: levelHeight * (index + 1)
        }
      })
    })

    // Définir les marqueurs
    const defs = svg.append('defs')
    
    const criticalArrow = defs.append('marker')
      .attr('id', 'critical-arrow')
      .attr('viewBox', '0 0 10 10')
      .attr('refX', 8)
      .attr('refY', 3)
      .attr('markerWidth', 8)
      .attr('markerHeight', 8)
      .attr('orient', 'auto')
    
    criticalArrow.append('path')
      .attr('d', 'M0,0 L0,6 L9,3 z')
      .attr('fill', '#ff6b6b')

    const normalArrow = defs.append('marker')
      .attr('id', 'normal-arrow')
      .attr('viewBox', '0 0 10 10')
      .attr('refX', 8)
      .attr('refY', 3)
      .attr('markerWidth', 8)
      .attr('markerHeight', 8)
      .attr('orient', 'auto')
    
    normalArrow.append('path')
      .attr('d', 'M0,0 L0,6 L9,3 z')
      .attr('fill', '#74b9ff')

    // Connexions
    taskList.forEach(task => {
      task.predecessors.forEach(predId => {
        if (positions[predId] && positions[task.id]) {
          const startPos = positions[predId]
          const endPos = positions[task.id]
          const isCriticalPath = task.isCritical && projectData[predId].isCritical
          
          svg.append('line')
            .attr('x1', startPos.x + nodeRadius/2)
            .attr('y1', startPos.y)
            .attr('x2', endPos.x - nodeRadius/2)
            .attr('y2', endPos.y)
            .attr('stroke', isCriticalPath ? '#ff6b6b' : '#74b9ff')
            .attr('stroke-width', isCriticalPath ? 4 : 2)
            .attr('marker-end', isCriticalPath ? 'url(#critical-arrow)' : 'url(#normal-arrow)')
            .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))')
        }
      })
    })

    // Nœuds
    const nodes = svg.selectAll('.node')
      .data(taskList)
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${positions[d.id].x}, ${positions[d.id].y})`)

    // Cercles principaux
    nodes.append('circle')
      .attr('r', 0)
      .attr('fill', d => d.isCritical ? '#ff6b6b' : '#74b9ff')
      .style('filter', 'drop-shadow(0 6px 12px rgba(0,0,0,0.4))')
      .transition()
      .duration(800)
      .delay((d, i) => i * 100)
      .attr('r', nodeRadius)

    // Lignes de division
    nodes.append('line')
      .attr('x1', -nodeRadius * 0.7)
      .attr('y1', 0)
      .attr('x2', nodeRadius * 0.7)
      .attr('y2', 0)
      .attr('stroke', 'white')
      .attr('stroke-width', 2)

    nodes.append('line')
      .attr('x1', 0)
      .attr('y1', -nodeRadius * 0.7)
      .attr('x2', 0)
      .attr('y2', nodeRadius * 0.7)
      .attr('stroke', 'white')
      .attr('stroke-width', 2)

    // Textes
    nodes.append('text')
      .attr('x', -nodeRadius/3)
      .attr('y', -nodeRadius/4)
      .attr('text-anchor', 'middle')
      .attr('fill', 'white')
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .text(d => d.earliestStart || 0)

    nodes.append('text')
      .attr('x', nodeRadius/3)
      .attr('y', -nodeRadius/4)
      .attr('text-anchor', 'middle')
      .attr('fill', 'white')
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .text(d => d.earliestFinish || 0)

    nodes.append('text')
      .attr('x', -nodeRadius/3)
      .attr('y', nodeRadius/3)
      .attr('text-anchor', 'middle')
      .attr('fill', 'white')
      .style('font-size', '12px')
      .text(d => d.latestStart || 0)

    nodes.append('text')
      .attr('x', nodeRadius/3)
      .attr('y', nodeRadius/3)
      .attr('text-anchor', 'middle')
      .attr('fill', 'white')
      .style('font-size', '12px')
      .text(d => d.latestFinish || 0)

    // Labels des tâches
    nodes.append('text')
      .attr('x', 0)
      .attr('y', -nodeRadius - 15)
      .attr('text-anchor', 'middle')
      .attr('fill', 'white')
      .style('font-size', '14px')
      .style('font-weight', 'bold')
      .text(d => `${d.id} (${d.duration}j)`)

    // Titre
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 30)
      .attr('text-anchor', 'middle')
      .attr('fill', 'white')
      .style('font-size', '18px')
      .style('font-weight', 'bold')
      .text(`Diagramme PERT - ${projectName}`)
  }

  useEffect(() => {
    if (activeView === 'gantt' && projectData) {
      setTimeout(renderGanttChart, 100)
    }
  }, [activeView, projectData])

  useEffect(() => {
    if (activeView === 'pert' && projectData) {
      setTimeout(renderPertChart, 100)
    }
  }, [activeView, projectData])

  const getAvailablePredecessors = (currentIndex: number) => {
    return tasks.slice(0, currentIndex).map(t => t.id)
  }

  const criticalPath = projectData ? 
    Object.values(projectData).filter(t => t.isCritical).map(t => t.id).join(' → ') : ''

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
     <header className="bg-white/10 backdrop-blur-lg border-b border-white/20">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white mb-2">
              Gestionnaire de Projet Avancé
            </h1>
            <p className="text-white/70">
              Planification PERT & Gantt - Recherche Opérationnelle
            </p>
          </div>
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="bg-white/20 backdrop-blur text-white placeholder-white/50 px-4 py-2 rounded-lg border border-white/30 focus:border-white/50 focus:outline-none"
            placeholder="Nom du projet"
          />
        </div>
      </div>
    </header>

      {/* Navigation */}
      <nav className="bg-white/5 backdrop-blur border-b border-white/10">
        <div className="container mx-auto px-6">
          <div className="flex space-x-1">
            {[
              { id: 'input', label: 'Saisie', icon: Plus },
              { id: 'table', label: 'Tableau', icon: Table },
              { id: 'gantt', label: 'Gantt', icon: BarChart3 },
              { id: 'pert', label: 'PERT', icon: Network }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveView(id as any)}
                disabled={id !== 'input' && !projectData}
                className={`flex items-center space-x-2 px-6 py-4 font-medium transition-all duration-200 ${
                  activeView === id
                    ? 'bg-white/20 text-white border-b-2 border-blue-400'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                } ${id !== 'input' && !projectData ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Icon size={20} />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-8">
        {/* Vue Saisie */}
        {activeView === 'input' && (
          <div className="space-y-8">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden">
              <div className="p-6 border-b border-white/20">
                <h2 className="text-2xl font-bold text-white mb-2">
                  Définition des Tâches
                </h2>
                <p className="text-white/70">
                  Ajoutez les tâches avec leurs durées, descriptions et prédécesseurs
                </p>
              </div>
              
              <div className="p-6">
                <div className="space-y-4 mb-8">
                  {tasks.map((task, index) => (
                    <div key={task.id} className="bg-white/5 rounded-xl p-6 border border-white/10">
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                        <div className="lg:col-span-1">
                          <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-lg text-center font-bold">
                            {task.id}
                          </div>
                        </div>
                        
                        <div className="lg:col-span-3 space-y-2">
                          <label className="text-white/80 text-sm font-medium">Nom de la tâche</label>
                          <input
                            type="text"
                            value={task.name}
                            onChange={(e) => updateTask(index, 'name', e.target.value)}
                            className="w-full bg-white/10 backdrop-blur text-white placeholder-white/50 px-4 py-3 rounded-lg border border-white/20 focus:border-blue-400 focus:outline-none transition-colors"
                            placeholder="Ex: Analyse des besoins"
                          />
                        </div>

                        <div className="lg:col-span-3 space-y-2">
                          <label className="text-white/80 text-sm font-medium">Description</label>
                          <input
                            type="text"
                            value={task.description}
                            onChange={(e) => updateTask(index, 'description', e.target.value)}
                            className="w-full bg-white/10 backdrop-blur text-white placeholder-white/50 px-4 py-3 rounded-lg border border-white/20 focus:border-blue-400 focus:outline-none transition-colors"
                            placeholder="Description détaillée..."
                          />
                        </div>
                        
                        <div className="lg:col-span-2 space-y-2">
                          <label className="text-white/80 text-sm font-medium">Durée (unités de temps)</label>
                          <input
                            type="number"
                            value={task.duration}
                            onChange={(e) => updateTask(index, 'duration', parseInt(e.target.value) || 1)}
                            className="w-full bg-white/10 backdrop-blur text-white px-4 py-3 rounded-lg border border-white/20 focus:border-blue-400 focus:outline-none transition-colors"
                            min="1"
                          />
                        </div>
                        
                        <div className="lg:col-span-2 space-y-2">
                          <label className="text-white/80 text-sm font-medium">Prédécesseurs</label>
                          <input
                            type="text"
                            value={task.predecessors.join(', ')}
                            onChange={(e) => updateTask(index, 'predecessors', e.target.value)}
                            className="w-full bg-white/10 backdrop-blur text-white placeholder-white/50 px-4 py-3 rounded-lg border border-white/20 focus:border-blue-400 focus:outline-none transition-colors"
                            placeholder={getAvailablePredecessors(index).join(', ') || 'Aucun'}
                            disabled={index === 0}
                          />
                        </div>
                        
                        <div className="lg:col-span-1">
                          <button
                            onClick={() => removeTask(index)}
                            className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 p-3 rounded-lg transition-all duration-200 border border-red-500/30"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-4">
                  <button
                    onClick={addTask}
                    className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    <Plus size={20} />
                    <span>Ajouter une Tâche</span>
                  </button>
                  
                  <button
                    onClick={calculateProject}
                    className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-8 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    <Calculator size={20} />
                    <span>Calculer le Projet</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Vue Tableau */}
        {activeView === 'table' && projectData && (
          <div className="space-y-8">
            {/* Résumé du projet */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-lg rounded-2xl p-6 border border-blue-400/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-300 text-sm font-medium">Durée Totale</p>
                    <p className="text-3xl font-bold text-white">
                      {Math.max(...Object.values(projectData).map(t => t.earliestFinish || 0))}
                    </p>
                    <p className="text-blue-300 text-sm">unités de temps</p>
                  </div>
                  <div className="text-blue-400">
                    <BarChart3 size={32} />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-red-500/20 to-red-600/20 backdrop-blur-lg rounded-2xl p-6 border border-red-400/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-300 text-sm font-medium">Tâches Critiques</p>
                    <p className="text-3xl font-bold text-white">
                      {Object.values(projectData).filter(t => t.isCritical).length}
                    </p>
                    <p className="text-red-300 text-sm">tâches</p>
                  </div>
                  <div className="text-red-400">
                    <Network size={32} />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-lg rounded-2xl p-6 border border-green-400/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-300 text-sm font-medium">Total Tâches</p>
                    <p className="text-3xl font-bold text-white">
                      {Object.keys(projectData).length}
                    </p>
                    <p className="text-green-300 text-sm">tâches</p>
                  </div>
                  <div className="text-green-400">
                    <Table size={32} />
                  </div>
                </div>
              </div>

            </div>

            {/* Chemin critique */}
            {criticalPath && (
              <div className="bg-gradient-to-r from-red-500/20 to-orange-500/20 backdrop-blur-lg rounded-2xl p-6 border border-red-400/30">
                <h3 className="text-xl font-bold text-white mb-3">Chemin Critique</h3>
                <p className="text-lg text-red-300 font-mono">{criticalPath}</p>
                <p className="text-white/70 text-sm mt-2">
                  Les tâches du chemin critique ne peuvent pas être retardées sans affecter la durée totale du projet.
                </p>
              </div>
            )}

            {/* Tableau détaillé */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden">
              <div className="p-6 border-b border-white/20">
                <h2 className="text-2xl font-bold text-white mb-2">
                  Tableau Détaillé des Tâches
                </h2>
                <p className="text-white/70">
                  Analyse complète avec dates au plus tôt, au plus tard et marges
                </p>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-white/5 border-b border-white/10">
                      <th className="text-left p-4 text-white font-semibold">Tâche</th>
                      <th className="text-left p-4 text-white font-semibold">Nom</th>
                      <th className="text-left p-4 text-white font-semibold">Description</th>
                      <th className="text-left p-4 text-white font-semibold">Durée</th>
                      <th className="text-left p-4 text-white font-semibold">Prédécesseurs</th>
                      <th className="text-left p-4 text-white font-semibold">Début au plus tôt</th>
                      <th className="text-left p-4 text-white font-semibold">Fin au plus tôt</th>
                      <th className="text-left p-4 text-white font-semibold">Début au plus tard</th>
                      <th className="text-left p-4 text-white font-semibold">Fin au plus tard</th>
                      <th className="text-left p-4 text-white font-semibold">Marge Totale</th>
                      <th className="text-left p-4 text-white font-semibold">Marge Libre</th>
                      <th className="text-left p-4 text-white font-semibold">Critique</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.values(projectData).map((task, index) => (
                      <tr
                        key={task.id}
                        className={`border-b border-white/10 transition-colors hover:bg-white/5 ${
                          task.isCritical ? 'bg-red-500/10' : ''
                        }`}
                      >
                        <td className="p-4">
                          <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                            task.isCritical 
                              ? 'bg-red-500/20 text-red-300 border border-red-500/30' 
                              : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          }`}>
                            {task.id}
                          </span>
                        </td>
                        <td className="p-4 text-white font-medium">{task.name}</td>
                        <td className="p-4 text-white/70 max-w-48 truncate" title={task.description}>
                          {task.description || '-'}
                        </td>
                        <td className="p-4 text-white text-center">{task.duration}</td>
                        <td className="p-4 text-white/70">
                          {task.predecessors.length > 0 ? task.predecessors.join(', ') : '-'}
                        </td>
                        <td className="p-4 text-blue-300 font-mono">{task.earliestStart}</td>
                        <td className="p-4 text-blue-300 font-mono">{task.earliestFinish}</td>
                        <td className="p-4 text-orange-300 font-mono">{task.latestStart}</td>
                        <td className="p-4 text-orange-300 font-mono">{task.latestFinish}</td>
                        <td className="p-4 text-center">
                          <span className={`px-2 py-1 rounded text-sm font-medium ${
                            (task.totalSlack || 0) === 0
                              ? 'bg-red-500/20 text-red-300'
                              : 'bg-green-500/20 text-green-300'
                          }`}>
                            {task.totalSlack}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <span className={`px-2 py-1 rounded text-sm font-medium ${
                            (task.freeSlack || 0) === 0
                              ? 'bg-orange-500/20 text-orange-300'
                              : 'bg-green-500/20 text-green-300'
                          }`}>
                            {task.freeSlack}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          {task.isCritical ? (
                            <span className="inline-block w-3 h-3 bg-red-500 rounded-full"></span>
                          ) : (
                            <span className="inline-block w-3 h-3 bg-gray-500 rounded-full"></span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Légendes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/5 backdrop-blur rounded-xl p-6 border border-white/10">
                <h3 className="text-lg font-bold text-white mb-4">Légende des Marges</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 bg-green-500 rounded"></div>
                    <span className="text-white/80">Marge Totale : Retard possible sans affecter la durée du projet</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 bg-orange-500 rounded"></div>
                    <span className="text-white/80">Marge Libre : Retard possible sans affecter les tâches suivantes</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 bg-red-500 rounded"></div>
                    <span className="text-white/80">Tâche Critique : Aucune marge disponible</span>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur rounded-xl p-6 border border-white/10">
                <h3 className="text-lg font-bold text-white mb-4">Dates de Planification</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 bg-blue-500 rounded"></div>
                    <span className="text-white/80">Dates au plus tôt : Début/fin possibles le plus rapidement</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 bg-orange-500 rounded"></div>
                    <span className="text-white/80">Dates au plus tard : Début/fin limites sans retard</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Vue Gantt */}
        {activeView === 'gantt' && projectData && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden">
            <div className="p-6 border-b border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Diagramme de Gantt
                  </h2>
                  <p className="text-white/70">
                    Visualisation temporelle des tâches et du chemin critique
                  </p>
                </div>
               
              </div>
            </div>
            
            <div className="p-6">
              <div ref={ganttRef} className="w-full overflow-x-auto" />
            </div>
          </div>
        )}

        {/* Vue PERT */}
        {activeView === 'pert' && projectData && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden">
            <div className="p-6 border-b border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Diagramme PERT
                  </h2>
                  <p className="text-white/70">
                    Réseau des tâches avec dates et marges critiques
                  </p>
                </div>
                
              </div>
            </div>
            
            <div className="p-6">
              <div ref={pertRef} className="w-full overflow-x-auto" />
              
              {/* Légende PERT */}
              <div className="mt-8 bg-white/5 rounded-xl p-6 border border-white/10">
                <h3 className="text-lg font-bold text-white mb-4">Légende du Diagramme PERT</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 bg-red-500 rounded-full"></div>
                      <span className="text-white/80">Nœud critique (marge = 0)</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 bg-blue-500 rounded-full"></div>
                      <span className="text-white/80">Nœud normal (marge {'>'} 0)</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="text-white/80">
                      <strong>Structure du nœud :</strong>
                    </div>
                    <div className="text-sm text-white/70 space-y-1">
                      <div>Haut gauche : Date de début au plus tôt</div>
                      <div>Haut droite : Date de fin au plus tôt</div>
                      <div>Bas gauche : Date de début au plus tard</div>
                      <div>Bas droite : Date de fin au plus tard</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}