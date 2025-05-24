'use client'
// ProjectManager.tsx
import { TaskForm } from './TaskForm'
import { ChartViewer } from './ChartViewer'
import { useProjectManager } from '../hooks/useProjectManager'
import { Plus, Trash2, Calculator, Table, BarChart3, Network, Save, Download } from 'lucide-react'
import React from 'react'
import { TableStat } from './Table'


export default function ProjectManager() {
  const {
    tasks,
    activeTab,
    projectData,
    projectName,
    ProjectMetrics,
    addTask,
    updateTask,
    removeTask,
    setProjectName,
    setActiveTab,
    calculateProject
  } = useProjectManager()
  const ganttRef = React.useRef<HTMLDivElement>(null)
  const pertRef = React.useRef<HTMLDivElement>(null)
  const mpmRef = React.useRef<HTMLDivElement>(null)
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
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
                onClick={() => setActiveTab(id as any)}
                disabled={id !== 'input' && !projectData}
                className={`flex items-center space-x-2 px-6 py-4 font-medium transition-all duration-200 ${
                  activeTab === id
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
        {activeTab === 'input' && (
        <TaskForm
          tasks={tasks}
          onTaskUpdate={updateTask}
          onTaskRemove={removeTask}
          onTaskAdd={addTask}
          onCalculateProject={calculateProject}
        />
        )}
        {activeTab === 'table' && projectData && (
          <TableStat
            projectData={projectData}
          />
        )}
        {/* Table*/}
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
           
              <div ref={ganttRef} className="w-full overflow-x-auto" />
            </div>
        )}

      </main>
        {/* {projectData && (
          <>
            <ProjectMetrics projectData={projectData} />
            <ChartViewer projectData={projectData} />
          </>
        )} */}
      </div>
    </div>
  )
}