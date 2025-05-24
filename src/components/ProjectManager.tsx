'use client'
// ProjectManager.tsx
import { TaskForm } from './TaskForm'
import { ProjectMetrics } from './ProjectMetrics'
import { ChartViewer } from './ChartViewer'
import { useProjectManager } from '../hooks/useProjectManager'

export default function ProjectManager() {
  const {
    tasks,
    projectData,
    addTask,
    updateTask,
    removeTask,
    calculateProject
  } = useProjectManager()

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

        <TaskForm
          tasks={tasks}
          onTaskUpdate={updateTask}
          onTaskRemove={removeTask}
          onTaskAdd={addTask}
          onCalculateProject={calculateProject}
        />

        {projectData && (
          <>
            <ProjectMetrics projectData={projectData} />
            <ChartViewer projectData={projectData} />
          </>
        )}
      </div>
    </div>
  )
}