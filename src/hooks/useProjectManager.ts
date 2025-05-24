// hooks/useProjectManager.ts
import { useState } from 'react'
import { Task, ProjectData, ProjectMetrics } from '../types'
import { generateTaskId, validateTasks, calculateCPM } from '../utils/projectCalculations'
import { ChartType } from '../types'

export const useProjectManager = () => {
  const [tasks, setTasks] = useState<Task[]>([])
  const [projectData, setProjectData] = useState<ProjectData | null>(null)
  const [ProjectMetrics, setProjectMetrics] = useState<ProjectMetrics | null>(null)
  const [taskCounter, setTaskCounter] = useState(0)
  const [projectName, setProjectName] = useState('Nouveau Projet')
  const [activeTab, setActiveTab] = useState<ChartType>('input')
  const addTask = () => {
    const newTask: Task = {
      id: generateTaskId(taskCounter),
      name: '',
      duration: 1,
      predecessors: [],
      description: ''
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
    const validation = validateTasks(tasks)
    if (!validation.isValid) {
      alert(validation.message)
      return
    }
    setProjectData(calculateCPM(tasks))
  }

  return {
    tasks,
    activeTab,
    projectName,
    projectData,
    ProjectMetrics,
    addTask,
    updateTask,
    removeTask,
    setActiveTab,
    setProjectName,
    calculateProject,
    setProjectMetrics,
  }
}