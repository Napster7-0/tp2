'use client'
// ProjectManager.tsx
import { TaskForm } from './TaskForm'
import { ChartViewer } from './ChartViewer'
import { useProjectManager } from '../hooks/useProjectManager'
import React from 'react'
import { TableStat } from './Table'
import Header from './Header'


export default function ProjectManager() {
  const {
    tasks,
    activeTab,
    projectData,
    projectName,
    addTask,
    updateTask,
    removeTask,
    setProjectName,
    setActiveTab,
    calculateProject
  } = useProjectManager()

  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
              {/* Header */}
      <Header
        projectName={projectName}
        setProjectName={setProjectName}
        setActiveTab={setActiveTab}
        projectData={projectData}
        activeTab={activeTab}
      />
      <main className="container mx-auto px-6 py-8">
        {/* Vue Saisie */}
        {activeTab === 'input' && (
        <TaskForm
          tasks={tasks}
          onTaskUpdate={updateTask}
          onTaskRemove={removeTask}
          onTaskAdd={addTask}
          onCalculateProject={calculateProject}
        />
        )}
         {/* Table*/}
        {activeTab === 'table' && projectData && (
          <TableStat
            projectData={projectData}
          />
        )}
        {/* Vue Gantt */}
        {activeTab === 'gantt' && projectData && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden">
            <div className="p-6 border-b border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Ordonnancement
                  </h2>
                  <p className="text-white/70">
                    Visualisation temporelle des tâches et du chemin critique
                  </p>
                </div>
               
              </div>
            </div>
            {projectData && (
            <>
              <ChartViewer projectData={projectData} />
            </>
          )} 
          </div>
        )}
      </main>
      </div>
    </div>
  )
}