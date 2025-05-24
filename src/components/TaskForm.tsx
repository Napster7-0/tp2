// components/TaskForm.tsx
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
    <section className="bg-white rounded-xl shadow-lg border border-slate-200 mb-8">
      <div className="p-6 border-b border-slate-200">
        <h2 className="text-xl font-semibold text-slate-800">
          Définition des Tâches
        </h2>
      </div>
      
      <div className="p-6">
        <div className="grid gap-4 mb-6 text-black">
          {tasks.map((task, index) => (
            <div key={task.id} className="p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                <div className="md:col-span-1">
                  <span className="font-mono bg-slate-200 text-blue-600 px-3 py-1.5 rounded-md font-bold">
                    {task.id}
                  </span>
                </div>
                <input
                  type="text"
                  value={task.name}
                  onChange={(e) => onTaskUpdate(index, 'name', e.target.value)}
                  className="md:col-span-4 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nom de la tâche"
                />
                <input
                  type="number"
                  value={task.duration}
                  onChange={(e) => onTaskUpdate(index, 'duration', parseInt(e.target.value) || 1)}
                  className="md:col-span-2 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                  placeholder="Durée"
                />
                <input
                  type="text"
                  value={task.predecessors.join(', ')}
                  onChange={(e) => onTaskUpdate(index, 'predecessors', e.target.value)}
                  className="md:col-span-3 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={`ex: ${getAvailablePredecessors(index).join(', ')}`}
                  disabled={index === 0}
                />
                <button
                  onClick={() => onTaskRemove(index)}
                  className="md:col-span-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-4">
          <button
            onClick={onTaskAdd}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            + Ajouter une Tâche
          </button>
          <button
            onClick={onCalculateProject}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
          >
            Calculer le Projet
          </button>
        </div>
      </div>
    </section>
  )
}