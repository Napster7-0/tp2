// components/ProjectMetrics.tsx
import { ProjectData } from '../types'
import { getProjectMetrics } from '../utils/projectCalculations'

interface ProjectMetricsProps {
  projectData: ProjectData
}
//comment
export const ProjectMetrics = ({ projectData }: ProjectMetricsProps) => {
  const metrics = getProjectMetrics(projectData)

  return (
    <section className="bg-white rounded-xl shadow-lg border border-slate-200 mb-8">
      <div className="p-6 border-b border-slate-200">
        <h2 className="text-xl font-semibold text-slate-800 mb-4">
          Résultats du Calcul CPM
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-50 p-4 rounded-lg">
            <h3 className="font-semibold text-slate-700 mb-2">Durée totale</h3>
            <p className="text-2xl font-bold text-blue-600">
              {metrics.totalDuration} jours
            </p>
          </div>
          <div className="bg-slate-50 p-4 rounded-lg">
            <h3 className="font-semibold text-slate-700 mb-2">Tâches critiques</h3>
            <p className="text-2xl font-bold text-red-600">
              {metrics.criticalTasksCount}
            </p>
          </div>
          <div className="bg-slate-50 p-4 rounded-lg">
            <h3 className="font-semibold text-slate-700 mb-2">Total des tâches</h3>
            <p className="text-2xl font-bold text-green-600">
              {metrics.totalTasks}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}