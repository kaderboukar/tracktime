"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { 
  DocumentChartBarIcon, 
  DocumentArrowDownIcon,
  ChartBarIcon,
  UsersIcon,
  GlobeAltIcon,
  CalendarIcon,
  FunnelIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';

interface TimePeriod {
  id: number;
  year: number;
  semester: "S1" | "S2";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Project {
  id: number;
  name: string;
  projectNumber: string;
  type: string;
  status: string;
}

interface User {
  id: number;
  name: string;
  grade: string;
  role: string;
}

export default function GenerateTimesheetPage() {
  const router = useRouter();
  
  // Période active (automatique)
  const [activePeriod, setActivePeriod] = useState<TimePeriod | null>(null);
  
  // Filtres
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [selectedSemester, setSelectedSemester] = useState<'S1' | 'S2'>('S1');
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [selectedUserRole, setSelectedUserRole] = useState<string>("");
  
  // États pour les données de filtres
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [availablePeriods, setAvailablePeriods] = useState<TimePeriod[]>([]);
  
  // États pour l'interface
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Récupérer la période active et les données de filtres
  const fetchActivePeriod = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch("/api/time-periods", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setAvailablePeriods(result.data);
          const active = result.data.find((period: TimePeriod) => period.isActive);
          if (active) {
            setActivePeriod(active);
            setSelectedYear(active.year);
            setSelectedSemester(active.semester);
            console.log(`Période active détectée: ${active.year} - ${active.semester}`);
          }
        }
      }
    } catch (error) {
      console.error("Erreur lors de la récupération de la période active:", error);
    }
  }, []);

  // Récupérer les projets pour les filtres
  const fetchProjects = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch("/api/projects", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setProjects(result.data);
        }
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des projets:", error);
    }
  }, []);

  // Récupérer les utilisateurs pour les filtres
  const fetchUsers = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch("/api/users", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setUsers(result.data);
        }
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des utilisateurs:", error);
    }
  }, []);

  // Récupérer les données initiales
  useEffect(() => {
    fetchActivePeriod();
    fetchProjects();
    fetchUsers();
  }, [fetchActivePeriod, fetchProjects, fetchUsers]);

  // Générer la feuille de temps STAFF
  const generateStaffTimesheet = async () => {
    setIsGenerating(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Token non trouvé, veuillez vous reconnecter");
        return;
      }

      // Rediriger vers la page des statistiques par projet avec focus sur STAFF
      router.push('/project-statistics');
      toast.success("Redirection vers la feuille de temps STAFF");
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de la génération");
    } finally {
      setIsGenerating(false);
    }
  };

  // Générer les statistiques par projet
  const generateProjectStats = async () => {
    setIsGenerating(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Token non trouvé, veuillez vous reconnecter");
        return;
      }

      // Rediriger vers la page des statistiques par projet
      router.push('/project-statistics');
      toast.success("Redirection vers les statistiques par projet");
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de la génération");
    } finally {
      setIsGenerating(false);
    }
  };

  // Générer la feuille de temps globale
  const generateGlobalTimesheet = async () => {
    setIsGenerating(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Token non trouvé, veuillez vous reconnecter");
        return;
      }

      // Rediriger vers la page des statistiques par projet avec focus sur global
      router.push('/project-statistics');
      toast.success("Redirection vers la feuille de temps globale");
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de la génération");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* En-tête */}
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 p-6 mb-8">
          <div className="flex items-center space-x-4">
            <DocumentChartBarIcon className="w-8 h-8 text-green-600" />
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Générer Feuille de Temps
              </h1>
              <p className="text-gray-600 mt-1">
                Exportez et analysez les feuilles de temps selon vos besoins
              </p>
            </div>
          </div>
        </div>

        {/* Filtres */}
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 p-6 mb-8">
          <div className="space-y-6">
            
            {/* Période Active et Sélection Alternative */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <CalendarIcon className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-gray-700">
                  Période active : {activePeriod ? `${activePeriod.year} - ${activePeriod.semester}` : 'Chargement...'}
                </span>
                
                {/* Sélecteur de période alternative */}
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">ou analyser :</span>
                  <select
                    value={`${selectedYear}-${selectedSemester}`}
                    onChange={(e) => {
                      const [year, semester] = e.target.value.split('-');
                      setSelectedYear(parseInt(year));
                      setSelectedSemester(semester as 'S1' | 'S2');
                    }}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    {availablePeriods.map((period) => (
                      <option key={`${period.year}-${period.semester}`} value={`${period.year}-${period.semester}`}>
                        {period.year} - {period.semester}
                        {period.isActive && ' (Actif)'}
                      </option>
                    ))}
                  </select>
                  
                  {/* Indicateur de période analysée */}
                  <span className={`text-sm px-2 py-1 rounded-full ${
                    selectedYear === activePeriod?.year && selectedSemester === activePeriod?.semester
                      ? 'bg-green-100 text-green-800 border border-green-200'
                      : 'bg-blue-100 text-blue-800 border border-blue-200'
                  }`}>
                    {selectedYear === activePeriod?.year && selectedSemester === activePeriod?.semester
                      ? 'Période active'
                      : 'Période historique'
                    }
                  </span>
                </div>
                
                <button 
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800"
                >
                  <FunnelIcon className="w-4 h-4" />
                  {showAdvancedFilters ? (
                    <>
                      <span>Masquer les filtres</span>
                      <ChevronUpIcon className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      <span>Afficher les filtres</span>
                      <ChevronDownIcon className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Filtres Avancés (collapsible) */}
            {showAdvancedFilters && (
              <div className="border-t pt-6 space-y-6">
                
                {/* Filtres Principaux */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  
                  {/* Projet */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Projet</label>
                    <select 
                      value={selectedProject}
                      onChange={(e) => setSelectedProject(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="">Tous les projets</option>
                      {projects.map(project => (
                        <option key={project.id} value={project.id}>
                          {project.name} ({project.projectNumber})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Utilisateur */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Utilisateur</label>
                    <select 
                      value={selectedUser}
                      onChange={(e) => setSelectedUser(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="">Tous les utilisateurs</option>
                      {users.map(user => (
                        <option key={user.id} value={user.id}>
                          {user.name} ({user.grade})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Rôle utilisateur */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Rôle</label>
                    <select 
                      value={selectedUserRole}
                      onChange={(e) => setSelectedUserRole(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="">Tous les rôles</option>
                      <option value="STAFF">STAFF</option>
                      <option value="ADMIN">ADMIN</option>
                      <option value="PMSU">PMSU</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Options de Génération */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Feuille de Temps STAFF */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-3 bg-green-500 rounded-xl">
                <UsersIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-green-800">Feuille de Temps STAFF</h3>
                <p className="text-sm text-green-600">Export Excel/PDF détaillé</p>
              </div>
            </div>
            
            <p className="text-sm text-green-700 mb-4">
              Génère une feuille de temps complète pour tous les utilisateurs STAFF avec calculs de coûts détaillés, 
              analyses par projet et activités, et exports personnalisables.
            </p>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-sm text-green-600">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span>Calculs de coûts automatiques</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-green-600">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span>Analyses par projet et utilisateur</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-green-600">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span>Exports Excel et PDF</span>
              </div>
            </div>
            
            <button
              onClick={generateStaffTimesheet}
              disabled={isGenerating}
              className="w-full mt-4 bg-green-600 text-white py-3 px-4 rounded-xl hover:bg-green-700 
                       disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
            >
              <DocumentArrowDownIcon className="w-5 h-5" />
              <span>{isGenerating ? 'Génération...' : 'Générer Feuille STAFF'}</span>
            </button>
          </div>

          {/* Statistiques par Projet */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-3 bg-blue-500 rounded-xl">
                <ChartBarIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-blue-800">Statistiques par Projet</h3>
                <p className="text-sm text-blue-600">Analyses détaillées et exports</p>
              </div>
            </div>
            
            <p className="text-sm text-blue-700 mb-4">
              Analyse complète des performances par projet avec métriques de coûts, heures travaillées, 
              répartition des utilisateurs et visualisations graphiques avancées.
            </p>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-sm text-blue-600">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                <span>Métriques de performance</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-blue-600">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                <span>Analyses de coûts détaillées</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-blue-600">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                <span>Graphiques et visualisations</span>
              </div>
            </div>
            
            <button
              onClick={generateProjectStats}
              disabled={isGenerating}
              className="w-full mt-4 bg-blue-600 text-white py-3 px-4 rounded-xl hover:bg-blue-700 
                       disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
            >
              <DocumentArrowDownIcon className="w-5 h-5" />
              <span>{isGenerating ? 'Génération...' : 'Générer Stats Projets'}</span>
            </button>
          </div>

          {/* Feuille de Temps Globale */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-3 bg-purple-500 rounded-xl">
                <GlobeAltIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-purple-800">Feuille de Temps Globale</h3>
                <p className="text-sm text-purple-600">Vue d'ensemble complète</p>
              </div>
            </div>
            
            <p className="text-sm text-purple-700 mb-4">
              Vue d'ensemble complète de tous les utilisateurs et projets avec analyses croisées, 
              tendances temporelles et reporting consolidé pour la direction.
            </p>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-sm text-purple-600">
                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                <span>Vue d'ensemble consolidée</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-purple-600">
                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                <span>Analyses croisées utilisateurs/projets</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-purple-600">
                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                <span>Reporting direction</span>
              </div>
            </div>
            
            <button
              onClick={generateGlobalTimesheet}
              disabled={isGenerating}
              className="w-full mt-4 bg-purple-600 text-white py-3 px-4 rounded-xl hover:bg-purple-700 
                       disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
            >
              <DocumentArrowDownIcon className="w-5 h-5" />
              <span>{isGenerating ? 'Génération...' : 'Générer Feuille Globale'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
