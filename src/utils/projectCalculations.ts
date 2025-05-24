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
      isCritical: false,
      totalSlack: 0,
      freeSlack: 0
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

  // Backward pass - Version corrigée
  const projectEnd = Math.max(...Object.values(schedule).map(t => t.earliestFinish || 0))
  
  // Étape 1: Identifier toutes les tâches finales et les initialiser
  const finalTasks = tasks.filter(task => {
    // Une tâche est finale si elle n'est prédécesseur d'aucune autre tâche
    return !tasks.some(otherTask => otherTask.predecessors.includes(task.id))
  })
  
  // Initialiser toutes les tâches finales avec projectEnd
  finalTasks.forEach(task => {
    const current = schedule[task.id]
    current.latestFinish = projectEnd
    current.latestStart = projectEnd - task.duration
  })
  
  // Étape 2: Propager les dates au plus tard
  changed = true
  iterations = 0
  
  while (changed && iterations < maxIterations) {
    changed = false
    iterations++
    
    // Parcourir les tâches dans l'ordre inverse topologique
    tasks.slice().reverse().forEach(task => {
      const current = schedule[task.id]
      
      // Trouver tous les successeurs de cette tâche
      const successors = tasks.filter(t => t.predecessors.includes(task.id))
      
      if (successors.length > 0) {
        // Si la tâche a des successeurs, son LF = min(LS des successeurs)
        const minSuccessorLS = Math.min(...successors.map(s => schedule[s.id].latestStart || Infinity))
        
        if (minSuccessorLS !== Infinity) {
          const newLF = minSuccessorLS
          const newLS = newLF - task.duration
          
          // Vérifier si les dates ont changé et qu'elles sont valides
          if ((current.latestFinish !== newLF || current.latestStart !== newLS) && newLS >= 0) {
            current.latestFinish = newLF
            current.latestStart = newLS
            changed = true
          }
        }
      } else {
        // Si la tâche n'a pas de successeurs, elle devrait déjà être initialisée comme tâche finale
        if (current.latestFinish === 0 && current.latestStart === 0) {
          current.latestFinish = projectEnd
          current.latestStart = projectEnd - task.duration
          changed = true
        }
      }
    })
  }

  // Calcul des marges et chemin critique
  Object.values(schedule).forEach(task => {
    task.slack = (task.latestStart || 0) - (task.earliestStart || 0)
    task.isCritical = Math.abs(task.slack) < 0.001 // Utiliser une tolérance pour les erreurs de virgule flottante
  })

  return schedule
}

export const getProjectMetrics = (projectData: ProjectData) => {
  const tasks = Object.values(projectData)
  return {
    totalDuration: Math.max(...tasks.map(t => t.earliestFinish || 0)),
    criticalTasksCount: tasks.filter(t => t.isCritical).length,
    totalTasks: tasks.length,
    criticalPath : projectData ? 
    Object.values(projectData).filter(t => t.isCritical).map(t => t.id).join(' → ') : ''
  }
}