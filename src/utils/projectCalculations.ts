// utils/projectCalculations.ts
import { Task, ProjectData, ProjectTask } from '../types'

export const generateTaskId = (index: number): string => {
  if (index < 26) return String.fromCharCode(65 + index)
  if (index < 52) return String.fromCharCode(97 + (index - 26))
  const first = String.fromCharCode(65 + Math.floor((index - 52) / 26))
  const second = String.fromCharCode(65 + ((index - 52) % 26))
  return first + second
}

export const validateTasks = (tasks: Task[]): { isValid: boolean; message?: string } => {
  if (tasks.length === 0) {
    return { isValid: false, message: 'Ajoutez au moins une tâche.' }
  }
  
  if (tasks.some(t => !t.name.trim())) {
    return { isValid: false, message: 'Veuillez nommer toutes les tâches.' }
  }
  
  return { isValid: true }
}

export const calculateCPM = (tasks: Task[]): ProjectData => {
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

export const getProjectMetrics = (projectData: ProjectData) => {
  const tasks = Object.values(projectData)
  return {
    totalDuration: Math.max(...tasks.map(t => t.earliestFinish || 0)),
    criticalTasksCount: tasks.filter(t => t.isCritical).length,
    totalTasks: tasks.length
  }
}