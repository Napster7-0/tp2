// components/ChartViewer.tsx
import { useState } from 'react'
import { ChartType, ProjectData } from '../types'
import { GanttChart } from './GanttChart'
import { PertChart } from './PertChart'
import { MpmChart } from './MpmChart'
import { useProjectManager } from '@/hooks/useProjectManager'

interface ChartViewerProps {
  projectData: ProjectData
}



export const ChartViewer = ({ projectData }: ChartViewerProps) => {
  const [activeTab, setActiveTab] = useState<ChartType>('gantt')

  return (
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
          <button
            onClick={() => setActiveTab('mpm')}
            className={`px-4 py-2 font-medium rounded-lg transition-colors ${
              activeTab === 'mpm' 
                ? 'bg-blue-600 text-white' 
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            Diagramme MPM
          </button>
        </nav>
      </div>

      <div className="p-6">
        {activeTab === 'gantt' && <GanttChart projectData={projectData} />}
        {activeTab === 'pert' && <PertChart projectData={projectData} />}
        {activeTab === 'mpm' && <MpmChart projectData={projectData} />}
      </div>
    </section>
  )
}