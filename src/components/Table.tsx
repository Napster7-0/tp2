// components/TaskForm.tsx
import { BarChart3, Calculator, Network, Plus, Table, Trash2 } from 'lucide-react'
import { ProjectData, ProjectMetrics } from '../types'
import { getProjectMetrics } from '@/utils/projectCalculations'


interface TableFormProps {
  projectData: ProjectData
}

export const TableStat = ({ 
  projectData
}: TableFormProps) => {
    const projectMetrics = getProjectMetrics(projectData)
    const tasks = Object.values(projectData)
    if (!projectData) {
        return (
        <div className="text-center text-gray-500 p-6">
            Aucune tâche disponible. Veuillez ajouter des tâches pour afficher les métriques.
        </div>
        )
    }
    
  return (

    <div className="space-y-8">
        {/* Résumé du projet */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-lg rounded-2xl p-6 border border-blue-400/30">
            <div className="flex items-center justify-between">
                <div>
                <p className="text-blue-300 text-sm font-medium">Durée Totale</p>
                <p className="text-3xl font-bold text-white">
                    {projectMetrics.totalDuration}
                </p>
                <p className="text-blue-300 text-sm">jours</p>
                </div>
                <div className="text-blue-400">
                <BarChart3 size={32} />
                </div>
            </div>
            </div>

            <div className="bg-gradient-to-br from-red-500/20 to-red-600/20 backdrop-blur-lg rounded-2xl p-6 border border-red-400/30">
            <div className="flex items-center justify-between">
                <div>
                <p className="text-red-300 text-sm font-medium">Tâches Critiques</p>
                <p className="text-3xl font-bold text-white">
                    {projectMetrics.criticalTasksCount}
                </p>
                <p className="text-red-300 text-sm">tâches</p>
                </div>
                <div className="text-red-400">
                <Network size={32} />
                </div>
            </div>
            </div>

            <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-lg rounded-2xl p-6 border border-green-400/30">
            <div className="flex items-center justify-between">
                <div>
                <p className="text-green-300 text-sm font-medium">Total Tâches</p>
                <p className="text-3xl font-bold text-white">
                    {projectMetrics.totalTasks}
                </p>
                <p className="text-green-300 text-sm">tâches</p>
                </div>
                <div className="text-green-400">
                <Table size={32} />
                </div>
            </div>
            </div>

            
        </div>

        {/* Chemin critique */}
        {projectMetrics.criticalPath && (
            <div className="bg-gradient-to-r from-red-500/20 to-orange-500/20 backdrop-blur-lg rounded-2xl p-6 border border-red-400/30">
            <h3 className="text-xl font-bold text-white mb-3">Chemin Critique</h3>
            <p className="text-lg text-red-300 font-mono">{projectMetrics.criticalPath}</p>
            <p className="text-white/70 text-sm mt-2">
                Les tâches du chemin critique ne peuvent pas être retardées sans affecter la durée totale du projet.
            </p>
            </div>
        )}

        {/* Tableau détaillé */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden">
            <div className="p-6 border-b border-white/20">
            <h2 className="text-2xl font-bold text-white mb-2">
                Tableau Détaillé des Tâches
            </h2>
            <p className="text-white/70">
                Analyse complète avec dates au plus tôt, au plus tard et marges
            </p>
            </div>
            
            <div className="overflow-x-auto">
            <table className="w-full">
                <thead>
                <tr className="bg-white/5 border-b border-white/10">
                    <th className="text-left p-4 text-white font-semibold">Tâche</th>
                    <th className="text-left p-4 text-white font-semibold">Nom</th>
                    <th className="text-left p-4 text-white font-semibold">Description</th>
                    <th className="text-left p-4 text-white font-semibold">Durée</th>
                    <th className="text-left p-4 text-white font-semibold">Prédécesseurs</th>
                    <th className="text-left p-4 text-white font-semibold">Début au plus tôt</th>
                    <th className="text-left p-4 text-white font-semibold">Fin au plus tôt</th>
                    <th className="text-left p-4 text-white font-semibold">Début au plus tard</th>
                    <th className="text-left p-4 text-white font-semibold">Fin au plus tard</th>
                    <th className="text-left p-4 text-white font-semibold">Marge Totale</th>
                    <th className="text-left p-4 text-white font-semibold">Marge Libre</th>
                    <th className="text-left p-4 text-white font-semibold">Critique</th>
                </tr>
                </thead>
                <tbody>
                {tasks?.map((task, index) => (
                    <tr
                    key={String(task.id)}
                    className={`border-b border-white/10 transition-colors hover:bg-white/5 ${
                        task.isCritical ? 'bg-red-500/10' : ''
                    }`}
                    >
                    <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                        task.isCritical 
                            ? 'bg-red-500/20 text-red-300 border border-red-500/30' 
                            : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        }`}>
                        {String(task.id)}
                        </span>
                    </td>
                    <td className="p-4 text-white font-medium">{String(task.name)}</td>
                    <td className="p-4 text-white/70 max-w-48 truncate" title={String(task.description)}>
                        {String(task.description) || '-'}
                    </td>
                    <td className="p-4 text-white text-center">{String(task.duration)}</td>
                    <td className="p-4 text-white/70">
                        {task.predecessors.length > 0 ? task.predecessors.join(', ') : '-'}
                    </td>
                    <td className="p-4 text-blue-300 font-mono">{String(task.earliestStart)}</td>
                    <td className="p-4 text-blue-300 font-mono">{String(task.earliestFinish)}</td>
                    <td className="p-4 text-orange-300 font-mono">{String(task.latestStart)}</td>
                    <td className="p-4 text-orange-300 font-mono">{String(task.latestFinish)}</td>
                    <td className="p-4 text-center">
                        <span className={`px-2 py-1 rounded text-sm font-medium ${
                        (task.totalSlack || 0) === 0
                            ? 'bg-red-500/20 text-red-300'
                            : 'bg-green-500/20 text-green-300'
                        }`}>
                        {String(task.totalSlack)}
                        </span>
                    </td>
                    <td className="p-4 text-center">
                        <span className={`px-2 py-1 rounded text-sm font-medium ${
                        (task.freeSlack || 0) === 0
                            ? 'bg-orange-500/20 text-orange-300'
                            : 'bg-green-500/20 text-green-300'
                        }`}>
                        {String(task.freeSlack)}
                        </span>
                    </td>
                    <td className="p-4 text-center">
                        {task.isCritical ? (
                        <span className="inline-block w-3 h-3 bg-red-500 rounded-full"></span>
                        ) : (
                        <span className="inline-block w-3 h-3 bg-gray-500 rounded-full"></span>
                        )}
                    </td>
                    </tr>
                ))}
                </tbody>
            </table>
            </div>
        </div>

        {/* Légendes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/5 backdrop-blur rounded-xl p-6 border border-white/10">
            <h3 className="text-lg font-bold text-white mb-4">Légende des Marges</h3>
            <div className="space-y-3">
                <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span className="text-white/80">Marge Totale : Retard possible sans affecter la durée du projet</span>
                </div>
                <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-orange-500 rounded"></div>
                <span className="text-white/80">Marge Libre : Retard possible sans affecter les tâches suivantes</span>
                </div>
                <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span className="text-white/80">Tâche Critique : Aucune marge disponible</span>
                </div>
            </div>
            </div>

            <div className="bg-white/5 backdrop-blur rounded-xl p-6 border border-white/10">
            <h3 className="text-lg font-bold text-white mb-4">Dates de Planification</h3>
            <div className="space-y-3">
                <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                <span className="text-white/80">Dates au plus tôt : Début/fin possibles le plus rapidement</span>
                </div>
                <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-orange-500 rounded"></div>
                <span className="text-white/80">Dates au plus tard : Début/fin limites sans retard</span>
                </div>
            </div>
            </div>
        </div>
        </div>
  )
}