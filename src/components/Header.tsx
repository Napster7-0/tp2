import { BarChart3, Plus, Table } from "lucide-react"
import { ChartType } from "@/types"

type MetaData = {
    projectName: string
    setProjectName: (name: string) => void
    setActiveTab: (tab: ChartType) => void
    activeTab: ChartType
    projectData?: any // Replace with actual type if available
}

const Header = (
    {
    projectName, 
    setProjectName,
    setActiveTab,
    projectData,
    activeTab
} : MetaData
    )=>{
return (<><header className="bg-white/10 backdrop-blur-lg border-b border-white/20">
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
              { id: 'gantt', label: 'Diagrammes d\'ordonancement', icon: BarChart3 },
              
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
      </>)
}
export default Header