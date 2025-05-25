"use client"
import React from 'react'
import { Calculator, BarChart3, Network, ArrowRight, Github, Linkedin, Mail } from 'lucide-react'


interface LandingPageProps {
  onStartApp: () => void
}
export default function LandingPage({ onStartApp }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-slate-900">
      {/* Banner Carousel - Première chose visible */}
      <section className="relative overflow-hidden">
        {/* Carousel d'images en banner */}
        <div className="relative h-screen overflow-hidden">
          <div className="flex animate-scroll h-full">
            {/* Slide 1 - Saisie des tâches */}
            <div className="min-w-full relative h-full">
              <div className="h-full bg-gradient-to-br from-blue-500/30 to-purple-500/30 flex flex-col items-center justify-center p-12 relative">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-20">
                  <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
                  <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
                </div>
                
                <div className="relative z-10 text-center max-w-4xl">
                  <div className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-lg rounded-full px-6 py-3 mb-8">
                    <Calculator className="w-5 h-5 text-blue-400" />
                    <span className="text-white/80 text-sm font-medium">Interface Intuitive</span>
                  </div>
                  
                  <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
                    Saisie
                    <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent"> Simplifiée </span>
                  </h1>
                  
                  <p className="text-xl md:text-2xl text-white/80 mb-8 max-w-3xl mx-auto leading-relaxed">
                    Définissez vos tâches, leurs durées et dépendances avec une interface moderne et intuitive
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 opacity-60">
                    <div className="bg-white/10 backdrop-blur rounded-xl p-6 border border-white/20">
                      <div className="h-4 bg-blue-400/50 rounded mb-2"></div>
                      <div className="h-3 bg-white/30 rounded mb-1"></div>
                      <div className="h-3 bg-white/20 rounded"></div>
                    </div>
                    <div className="bg-white/10 backdrop-blur rounded-xl p-6 border border-white/20">
                      <div className="h-4 bg-purple-400/50 rounded mb-2"></div>
                      <div className="h-3 bg-white/30 rounded mb-1"></div>
                      <div className="h-3 bg-white/20 rounded"></div>
                    </div>
                    <div className="bg-white/10 backdrop-blur rounded-xl p-6 border border-white/20">
                      <div className="h-4 bg-green-400/50 rounded mb-2"></div>
                      <div className="h-3 bg-white/30 rounded mb-1"></div>
                      <div className="h-3 bg-white/20 rounded"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Slide 2 - Diagramme de Gantt */}
            <div className="min-w-full relative h-full">
              <div className="h-full bg-gradient-to-br from-green-500/30 to-emerald-500/30 flex flex-col items-center justify-center p-12 relative">
                <div className="absolute inset-0 opacity-20">
                  <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-green-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
                  <div className="absolute bottom-1/3 left-1/4 w-96 h-96 bg-emerald-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
                </div>
                
                <div className="relative z-10 text-center max-w-4xl">
                  <div className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-lg rounded-full px-6 py-3 mb-8">
                    <BarChart3 className="w-5 h-5 text-green-400" />
                    <span className="text-white/80 text-sm font-medium">Visualisation Temporelle</span>
                  </div>
                  
                  <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
                    Diagramme de
                    <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent"> Gantt </span>
                  </h1>
                  
                  <p className="text-xl md:text-2xl text-white/80 mb-8 max-w-3xl mx-auto leading-relaxed">
                    Visualisation interactive avec animations, chemin critique et export haute qualité
                  </p>
                  
                  <div className="flex flex-col space-y-3 mt-12 opacity-60 max-w-2xl mx-auto">
                    <div className="flex space-x-2">
                      <div className="w-20 h-8 bg-red-400/50 rounded"></div>
                      <div className="w-32 h-8 bg-blue-400/50 rounded"></div>
                      <div className="w-24 h-8 bg-green-400/50 rounded"></div>
                    </div>
                    <div className="flex space-x-2">
                      <div className="w-16 h-8 bg-purple-400/50 rounded"></div>
                      <div className="w-28 h-8 bg-orange-400/50 rounded"></div>
                      <div className="w-20 h-8 bg-cyan-400/50 rounded"></div>
                    </div>
                    <div className="flex space-x-2">
                      <div className="w-24 h-8 bg-pink-400/50 rounded"></div>
                      <div className="w-20 h-8 bg-yellow-400/50 rounded"></div>
                      <div className="w-32 h-8 bg-indigo-400/50 rounded"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Slide 3 - Diagramme PERT */}
            <div className="min-w-full relative h-full">
              <div className="h-full bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex flex-col items-center justify-center p-12 relative">
                <div className="absolute inset-0 opacity-20">
                  <div className="absolute top-1/4 left-1/3 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
                  <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
                </div>
                
                <div className="relative z-10 text-center max-w-4xl">
                  <div className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-lg rounded-full px-6 py-3 mb-8">
                    <Network className="w-5 h-5 text-purple-400" />
                    <span className="text-white/80 text-sm font-medium">Réseau de Tâches</span>
                  </div>
                  
                  <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
                    Diagramme
                    <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"> PERT </span>
                  </h1>
                  
                  <p className="text-xl md:text-2xl text-white/80 mb-8 max-w-3xl mx-auto leading-relaxed">
                    Calcul automatique des marges, dates critiques et optimisation du chemin projet
                  </p>
                  
                  <div className="flex items-center justify-center space-x-6 mt-12 opacity-60">
                    <div className="w-20 h-20 bg-blue-400/40 rounded-full flex items-center justify-center border-2 border-white/30">
                      <div className="w-3 h-3 bg-white/80 rounded-full"></div>
                    </div>
                    <div className="w-12 h-1 bg-white/40"></div>
                    <div className="w-20 h-20 bg-purple-400/40 rounded-full flex items-center justify-center border-2 border-white/30">
                      <div className="w-3 h-3 bg-white/80 rounded-full"></div>
                    </div>
                    <div className="w-12 h-1 bg-white/40"></div>
                    <div className="w-20 h-20 bg-green-400/40 rounded-full flex items-center justify-center border-2 border-white/30">
                      <div className="w-3 h-3 bg-white/80 rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Slide 4 - Gestionnaire complet */}
            <div className="min-w-full relative h-full">
              <div className="h-full bg-gradient-to-br from-cyan-500/30 to-blue-500/30 flex flex-col items-center justify-center p-12 relative">
                <div className="absolute inset-0 opacity-20">
                  <div className="absolute top-1/4 right-1/4 w-72 h-72 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
                  <div className="absolute bottom-1/4 left-1/4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
                </div>
                
                <div className="relative z-10 text-center max-w-4xl">
                  <div className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-lg rounded-full px-6 py-3 mb-8">
                    <Calculator className="w-5 h-5 text-cyan-400" />
                    <span className="text-white/80 text-sm font-medium">Recherche Opérationnelle</span>
                  </div>
                  
                  <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
                    Gestionnaire de
                    <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent"> Projet </span>
                    Avancé
                  </h1>
                  
                  <p className="text-xl md:text-2xl text-white/80 mb-8 max-w-3xl mx-auto leading-relaxed">
                    Solution complète pour la planification et l'optimisation de vos projets avec les méthodes PERT & Gantt
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto mt-12">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-white mb-2">100%</div>
                      <div className="text-white/60">Gratuit</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-white mb-2">⚡</div>
                      <div className="text-white/60">Instantané</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-white mb-2">🎯</div>
                      <div className="text-white/60">Précis</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Indicateurs de défilement */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-3 z-20">
            <div className="w-4 h-4 bg-white/80 rounded-full animate-pulse"></div>
            <div className="w-4 h-4 bg-white/40 rounded-full"></div>
            <div className="w-4 h-4 bg-white/40 rounded-full"></div>
            <div className="w-4 h-4 bg-white/40 rounded-full"></div>
          </div>

          {/* Bouton Démarrer flottant */}
          <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-20">
            <button onClick={onStartApp}
            className="group bg-gradient-to-r from-white/20 to-white/10 backdrop-blur-lg hover:from-white/30 hover:to-white/20 text-white px-12 py-5 rounded-xl font-bold text-xl transition-all duration-300 shadow-2xl hover:shadow-white/10 hover:scale-105 border border-white/30">
              Démarrer maintenant
              <ArrowRight className="inline-block ml-3 w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>

     

    

      <style jsx>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          22% { transform: translateX(0); }
          25% { transform: translateX(-100%); }
          47% { transform: translateX(-100%); }
          50% { transform: translateX(-200%); }
          72% { transform: translateX(-200%); }
          75% { transform: translateX(-300%); }
          97% { transform: translateX(-300%); }
          100% { transform: translateX(0); }
        }
        .animate-scroll {
          animation: scroll 20s infinite;
        }
      `}</style>
    </div>
  )
}