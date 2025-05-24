// components/TaskForm.tsx
import { Calculator, Plus, Trash2 } from 'lucide-react'
import { Task } from '../types'

interface TaskFormProps {
  tasks: Task[]
  onTaskUpdate: (index: number, field: keyof Task, value: any) => void
  onTaskRemove: (index: number) => void
  onTaskAdd: () => void
  onCalculateProject: () => void
}

export const TaskForm = ({ 
  tasks, 
  onTaskUpdate, 
  onTaskRemove, 
  onTaskAdd, 
  onCalculateProject 
}: TaskFormProps) => {
  const getAvailablePredecessors = (currentIndex: number) => {
    return tasks.slice(0, currentIndex).map(t => t.id)
  }

  return (
    <div className="space-y-8">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden">
              <div className="p-6 border-b border-white/20">
                <h2 className="text-2xl font-bold text-white mb-2">
                  Définition des Tâches
                </h2>
                <p className="text-white/70">
                  Ajoutez les tâches avec leurs durées, descriptions et prédécesseurs
                </p>
              </div>
              
              <div className="p-6">
                <div className="space-y-4 mb-8">
                  {tasks.map((task, index) => (
                    <div key={task.id} className="bg-white/5 rounded-xl p-6 border border-white/10">
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                        <div className="lg:col-span-1">
                          <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-lg text-center font-bold">
                            {task.id}
                          </div>
                        </div>
                        
                        <div className="lg:col-span-3 space-y-2">
                          <label className="text-white/80 text-sm font-medium">Nom de la tâche</label>
                          <input
                            type="text"
                            value={task.name}
                            onChange={(e) => onTaskUpdate(index, 'name', e.target.value)}
                            className="w-full bg-white/10 backdrop-blur text-white placeholder-white/50 px-4 py-3 rounded-lg border border-white/20 focus:border-blue-400 focus:outline-none transition-colors"
                            placeholder="Ex: Analyse des besoins"
                          />
                        </div>

                        <div className="lg:col-span-3 space-y-2">
                          <label className="text-white/80 text-sm font-medium">Description</label>
                          <input
                            type="text"
                            value={task.description}
                            onChange={(e) => onTaskUpdate(index, 'description', e.target.value)}
                            className="w-full bg-white/10 backdrop-blur text-white placeholder-white/50 px-4 py-3 rounded-lg border border-white/20 focus:border-blue-400 focus:outline-none transition-colors"
                            placeholder="Description détaillée..."
                          />
                        </div>
                        
                        <div className="lg:col-span-2 space-y-2">
                          <label className="text-white/80 text-sm font-medium">Durée (jours)</label>
                          <input
                            type="number"
                            value={task.duration}
                            onChange={(e) => onTaskUpdate(index, 'duration', parseInt(e.target.value) || 1)}
                            className="w-full bg-white/10 backdrop-blur text-white px-4 py-3 rounded-lg border border-white/20 focus:border-blue-400 focus:outline-none transition-colors"
                            min="1"
                          />
                        </div>
                        
                        <div className="lg:col-span-2 space-y-2">
                          <label className="text-white/80 text-sm font-medium">Prédécesseurs</label>
                          <input
                            type="text"
                            value={task.predecessors.join(', ')}
                            onChange={(e) => onTaskUpdate(index, 'predecessors', e.target.value)}
                            className="w-full bg-white/10 backdrop-blur text-white placeholder-white/50 px-4 py-3 rounded-lg border border-white/20 focus:border-blue-400 focus:outline-none transition-colors"
                            placeholder={getAvailablePredecessors(index).join(', ') || 'Aucun'}
                            disabled={index === 0}
                          />
                        </div>
                        
                        <div className="lg:col-span-1">
                          <button
                            onClick={() => onTaskRemove(index)}
                            className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 p-3 rounded-lg transition-all duration-200 border border-red-500/30"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-4">
                  <button
                    onClick={onTaskAdd}
                    className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    <Plus size={20} />
                    <span>Ajouter une Tâche</span>
                  </button>
                  
                  <button
                    onClick={onCalculateProject}
                    className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-8 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    <Calculator size={20} />
                    <span>Génerer les diagrammes</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
  )
}