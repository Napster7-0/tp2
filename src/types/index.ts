// types/index.ts
export interface Task {
  id: string
  name: string
  duration: number
  predecessors: string[]
}

export interface ProjectTask extends Task {
  earliestStart: number
  earliestFinish: number
  latestStart: number
  latestFinish: number
  slack: number
  isCritical: boolean
}

export interface ProjectData {
  [taskId: string]: ProjectTask
}

export interface ProjectMetrics {
  totalDuration: number
  criticalTasksCount: number
  totalTasks: number
}