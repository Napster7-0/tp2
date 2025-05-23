'use client'
import { useState, useRef, useEffect } from 'react'
import * as d3 from 'd3'

interface Task {
  id: string
  name: string
  duration: number
  predecessors: string[]
  earliestStart?: number
  earliestFinish?: number
  latestStart?: number
  latestFinish?: number
  slack?: number
  isCritical?: boolean
}

interface ProjectData {
  [key: string]: Task
}

export default function ProjectManager() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [projectData, setProjectData] = useState<ProjectData | null>(null)
  const [activeTab, setActiveTab] = useState<'gantt' | 'pert'>('gantt')
  const [taskCounter, setTaskCounter] = useState(0)

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
      alert('Ajoutez au moins une tâche.')
      return
    }
    if (tasks.some(t => !t.name.trim())) {
      alert('Veuillez nommer toutes les tâches.')
      return
    }
    setProjectData(calculateCPM())
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
        slack: 0,
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
    
    // Initialiser les tâches finales
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
      task.slack = (task.latestStart || 0) - (task.earliestStart || 0)
      task.isCritical = task.slack === 0
    })

    return schedule
  }

  useEffect(() => {
    if (activeTab === 'gantt' && projectData && ganttRef.current) {
      renderGanttChart()
    }
  }, [activeTab, projectData])

  useEffect(() => {
    if (activeTab === 'pert' && projectData && pertRef.current) {
      renderPertChart()
    }
  }, [activeTab, projectData])

  const renderGanttChart = () => {
    if (!projectData || !ganttRef.current) return

    const tasks = Object.values(projectData)
    const margin = { top: 50, right: 30, bottom: 40, left: 200 }
    const width = 1000 - margin.left - margin.right
    const height = Math.max(400, tasks.length * 50) - margin.top - margin.bottom

    d3.select(ganttRef.current).selectAll('*').remove()

    const svg = d3.select(ganttRef.current)
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
      .tickFormat(d => `Jour ${d}`)
    
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

const renderPertChart = () => {
  if (!projectData || !pertRef.current) return

  const tasks = Object.values(projectData)
  const width = 1200
  const height = 700
  const nodeWidth = 100
  const nodeHeight = 60

  d3.select(pertRef.current).selectAll('*').remove()

  const svg = d3.select(pertRef.current)
    .append('svg')
    .attr('width', width)
    .attr('height', height)

  // Calcul des positions des nœuds
  const positions = {}
  const levels = {}
  
  // Calcul des niveaux (topological sort)
  const calculateLevel = (taskId, visited = new Set()) => {
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
  const tasksByLevel = {}
  tasks.forEach(task => {
    const level = levels[task.id]
    if (!tasksByLevel[level]) tasksByLevel[level] = []
    tasksByLevel[level].push(task)
  })

  // Attribution des positions avec espacement vertical amélioré
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

  const getAvailablePredecessors = (currentIndex: number) => {
    return tasks.slice(0, currentIndex).map(t => t.id)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-800 mb-3">
            Gestion de Projet Avancée
          </h1>
          <p className="text-slate-600 text-lg">
            Planification interactive avec Gantt & PERT dynamiques
          </p>
        </header>

        <section className="bg-white rounded-xl shadow-lg border border-slate-200 mb-8">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-xl font-semibold text-slate-800">
              Définition des Tâches
            </h2>
          </div>
          
          <div className="p-6">
            <div className="grid gap-4 mb-6 text-black">
              {tasks.map((task, index) => (
                <div key={task.id} className=" p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                    <div className="md:col-span-1">
                      <span className="font-mono bg-slate-200 text-blue-600 px-3 py-1.5 rounded-md font-bold">
                        {task.id}
                      </span>
                    </div>
                    <input
                      type="text"
                      value={task.name}
                      onChange={(e) => updateTask(index, 'name', e.target.value)}
                      className="md:col-span-4 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Nom de la tâche"
                    />
                    <input
                      type="number"
                      value={task.duration}
                      onChange={(e) => updateTask(index, 'duration', parseInt(e.target.value) || 1)}
                      className="md:col-span-2 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="1"
                      placeholder="Durée"
                    />
                    <input
                      type="text"
                      value={task.predecessors.join(', ')}
                      onChange={(e) => updateTask(index, 'predecessors', e.target.value)}
                      className="md:col-span-3 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={`ex: ${getAvailablePredecessors(index).join(', ')}`}
                      disabled={index === 0}
                    />
                    <button
                      onClick={() => removeTask(index)}
                      className="md:col-span-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-4">
              <button
                onClick={addTask}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                + Ajouter une Tâche
              </button>
              <button
                onClick={calculateProject}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
              >
                Calculer le Projet
              </button>
            </div>
          </div>
        </section>

        {projectData && (
          <>
            <section className="bg-white rounded-xl shadow-lg border border-slate-200 mb-8">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-xl font-semibold text-slate-800 mb-4">
                  Résultats du Calcul CPM
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-slate-700 mb-2">Durée totale</h3>
                    <p className="text-2xl font-bold text-blue-600">
                      {Math.max(...Object.values(projectData).map(t => t.earliestFinish || 0))} jours
                    </p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-slate-700 mb-2">Tâches critiques</h3>
                    <p className="text-2xl font-bold text-red-600">
                      {Object.values(projectData).filter(t => t.isCritical).length}
                    </p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-slate-700 mb-2">Total des tâches</h3>
                    <p className="text-2xl font-bold text-green-600">
                      {Object.keys(projectData).length}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-white rounded-xl shadow-lg border border-slate-200 mb-8">
              <div className="p-6 border-b border-slate-200">
                <nav className="flex gap-6">
                  <button
                    onClick={() => setActiveTab('gantt')}
                    className={`px-4 py-2 font-medium rounded-lg transition-colors ${
                      activeTab === 'gantt' 
                        ? 'bg-blue-600 text-white' 
                        : 'text-slate-600 hover:text-slate-800'
                    }`}
                  >
                    Diagramme de Gantt
                  </button>
                  <button
                    onClick={() => setActiveTab('pert')}
                    className={`px-4 py-2 font-medium rounded-lg transition-colors ${
                      activeTab === 'pert' 
                        ? 'bg-blue-600 text-white' 
                        : 'text-slate-600 hover:text-slate-800'
                    }`}
                  >
                    Diagramme PERT
                  </button>
                </nav>
              </div>

              <div className="p-6">
                <div ref={activeTab === 'gantt' ? ganttRef : pertRef} className="w-full overflow-x-auto" />
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  )
}