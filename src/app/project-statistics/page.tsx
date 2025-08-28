"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import Navbar from '@/components/Navbar';
import { 
  DocumentChartBarIcon, 
  CurrencyDollarIcon, 
  ClockIcon, 
  UsersIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  CalendarIcon,
  FunnelIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';


ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

interface ProjectStatistic {
  projectId: number;
  projectName: string;
  projectNumber: string;
  projectType: string;
  totalHours: number;
  totalAmount: number;
  userCount: number;
  userStats: Array<{
    userId: number;
    userName: string;
    userEmail: string;
    totalHours: number;
    totalAmount: number;
  }>;
  timeEntryCount: number;
}

interface ProjectStatisticsData {
  projects: ProjectStatistic[];
  totalRecoveredAmount: number;
  summary: {
    totalProjects: number;
    totalHours: number;
    totalUsers: number;
  };
}

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

export default function ProjectStatisticsPage() {
  const [data, setData] = useState<ProjectStatisticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<ProjectStatistic | null>(null);
  
  // Période active (automatique)
  const [activePeriod, setActivePeriod] = useState<TimePeriod | null>(null);
  
  // Filtres améliorés
  const [selectedProjectFilter, setSelectedProjectFilter] = useState<string>("");
  const [selectedUserFilter, setSelectedUserFilter] = useState<string>("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("");
  const [costRange, setCostRange] = useState({ min: "", max: "" });
  const [hoursRange, setHoursRange] = useState({ min: "", max: "" });
  
  // États pour les données de filtres
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [availablePeriods, setAvailablePeriods] = useState<TimePeriod[]>([]);
  
  // États existants (non modifiés)
  const [selectedYear, setSelectedYear] = useState(2025);
  const [selectedSemester, setSelectedSemester] = useState<'S1' | 'S2'>('S1');
  const [chartType, setChartType] = useState<'pie' | 'bar'>('pie');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  const chartRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

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

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Token non trouvé, veuillez vous reconnecter");
        router.push("/login");
        return;
      }

      const response = await fetch(
        `/api/analytics/project-statistics?year=${selectedYear}&semester=${selectedSemester}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des données");
      }

      const result = await response.json();
      if (result.success) {
        setData(result.data);
      } else {
        throw new Error(result.message || "Erreur lors de la récupération des données");
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors du chargement des statistiques");
    } finally {
      setLoading(false);
    }
  }, [selectedYear, selectedSemester, router]);

  // Récupérer les données initiales
  useEffect(() => {
    fetchActivePeriod();
    fetchProjects();
    fetchUsers();
  }, [fetchActivePeriod, fetchProjects, fetchUsers]);

  // Récupérer les données quand la période change
  useEffect(() => {
    if (activePeriod) {
      fetchData();
    }
  }, [fetchData, activePeriod]);

  // Appliquer les filtres
  const applyFilters = () => {
    // Ici vous pouvez ajouter la logique pour appliquer les filtres
    // Pour l'instant, on recharge juste les données
    fetchData();
    toast.success("Filtres appliqués");
  };

  // Réinitialiser les filtres
  const resetFilters = () => {
    setSelectedProjectFilter("");
    setSelectedUserFilter("");
    setSelectedStatusFilter("");
    setCostRange({ min: "", max: "" });
    setHoursRange({ min: "", max: "" });
    toast.success("Filtres réinitialisés");
  };

  const handleProjectClick = (project: ProjectStatistic) => {
    setSelectedProject(project);
  };

  const generatePDF = async () => {
    if (!data || !chartRef.current) return;

    try {
      toast.loading("Génération du PDF en cours...");
      
      const canvas = await html2canvas(chartRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('landscape', 'mm', 'a4');
      
      // Titre
      pdf.setFontSize(20);
      pdf.text('Rapport des Statistiques par Projet', 20, 20);
      
      // Informations de période
      pdf.setFontSize(12);
      pdf.text(`Période: ${selectedSemester} ${selectedYear}`, 20, 35);
      pdf.text(`Généré le: ${new Date().toLocaleDateString('fr-FR')}`, 20, 45);
      
      // Graphique
      const imgWidth = 200;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 20, 60, imgWidth, imgHeight);
      
      // Tableau des données
      let yPosition = 60 + imgHeight + 20;
      
      // En-tête du tableau
      pdf.setFontSize(14);
      pdf.text('Détails par Projet', 20, yPosition);
      yPosition += 10;
      
      pdf.setFontSize(10);
      pdf.text('Projet', 20, yPosition);
      pdf.text('Heures', 80, yPosition);
      pdf.text('Montant (USD)', 120, yPosition);
      pdf.text('Utilisateurs', 180, yPosition);
      yPosition += 5;
      
      // Lignes de données
      data.projects.forEach((project) => {
        if (yPosition > 180) {
          pdf.addPage();
          yPosition = 20;
        }
        
        pdf.text(project.projectName.substring(0, 30), 20, yPosition);
        pdf.text(project.totalHours.toString(), 80, yPosition);
        pdf.text(project.totalAmount.toFixed(2), 120, yPosition);
        pdf.text(project.userCount.toString(), 180, yPosition);
        yPosition += 8;
      });
      
      // Total
      yPosition += 5;
      pdf.setFontSize(12);
      pdf.text('TOTAL RÉCUPÉRÉ:', 20, yPosition);
      pdf.text(data.totalRecoveredAmount.toFixed(2) + ' USD', 120, yPosition);
      
      // Sauvegarder le PDF
      pdf.save(`statistiques-projets-${selectedSemester}-${selectedYear}.pdf`);
      
      toast.dismiss();
      toast.success("PDF généré avec succès !");
    } catch (error) {
      console.error("Erreur lors de la génération du PDF:", error);
      toast.dismiss();
      toast.error("Erreur lors de la génération du PDF");
    }
  };

  const chartData = data && data.projects && data.projects.length > 0 ? {
    labels: data.projects.map(p => p.projectName),
    datasets: [
      {
        data: chartType === 'pie' 
          ? data.projects.map(p => p.totalAmount)
          : data.projects.map(p => p.totalHours),
        backgroundColor: [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
          '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384'
        ],
        borderWidth: 2,
        borderColor: '#fff',
        label: chartType === 'pie' ? 'Montants (USD)' : 'Heures'
      }
    ]
  } : {
    labels: ['Aucune donnée'],
    datasets: [{
      data: [1],
      backgroundColor: ['#C9CBCF'],
      borderWidth: 2,
      borderColor: '#fff',
      label: 'Aucune donnée'
    }]
  };



  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: { dataIndex: number; label: string }) {
            if (data && data.projects.length > 0) {
              const project = data.projects[context.dataIndex];
              if (project) {
                if (chartType === 'pie') {
                  return `${project.projectName}: $${project.totalAmount.toFixed(2)} USD`;
                } else {
                  return `${project.projectName}: ${project.totalHours} heures`;
                }
              }
            }
            return context.label;
          }
        }
      }
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onClick: (event: any, elements: any) => {
      if (elements.length > 0 && data && data.projects.length > 0) {
        const clickedIndex = elements[0].index;
        if (data.projects[clickedIndex]) {
          handleProjectClick(data.projects[clickedIndex]);
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des statistiques...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* En-tête */}
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <DocumentChartBarIcon className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Statistiques par Projet
                </h1>
                <p className="text-gray-600 mt-1">
                  Analyse détaillée des performances et coûts par projet
                </p>
              </div>
            </div>
            
            <button
              onClick={generatePDF}
              className="flex items-center px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl
                       hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-md hover:shadow-lg
                       transform hover:-translate-y-0.5"
            >
              <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
              Exporter PDF
            </button>
          </div>
        </div>

        {/* Filtres Améliorés */}
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
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              
              {/* Type de Graphique (conservé) */}
              <div className="flex items-center space-x-2">
                <select
                  value={chartType}
                  onChange={(e) => setChartType(e.target.value as 'pie' | 'bar')}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="pie">Graphique Circulaire</option>
                  <option value="bar">Graphique en Barres</option>
                </select>
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
                      value={selectedProjectFilter}
                      onChange={(e) => setSelectedProjectFilter(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                      value={selectedUserFilter}
                      onChange={(e) => setSelectedUserFilter(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Tous les utilisateurs</option>
                      {users.map(user => (
                        <option key={user.id} value={user.id}>
                          {user.name} ({user.grade})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Statut du projet */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Statut</label>
                    <select 
                      value={selectedStatusFilter}
                      onChange={(e) => setSelectedStatusFilter(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Tous</option>
                      <option value="active">Actif</option>
                      <option value="inactive">Inactif</option>
                    </select>
                  </div>
                </div>

                {/* Filtres de Performance */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  
                  {/* Fourchette de coût */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Coût (USD)</label>
                    <div className="flex space-x-2">
                      <input 
                        type="number" 
                        placeholder="Min" 
                        value={costRange.min}
                        onChange={(e) => setCostRange(prev => ({ ...prev, min: e.target.value }))}
                        className="w-20 border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                      />
                      <span className="text-gray-500 self-center">-</span>
                      <input 
                        type="number" 
                        placeholder="Max" 
                        value={costRange.max}
                        onChange={(e) => setCostRange(prev => ({ ...prev, max: e.target.value }))}
                        className="w-20 border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                      />
                    </div>
                  </div>

                  {/* Fourchette d'heures */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Heures</label>
                    <div className="flex space-x-2">
                      <input 
                        type="number" 
                        placeholder="Min" 
                        value={hoursRange.min}
                        onChange={(e) => setHoursRange(prev => ({ ...prev, min: e.target.value }))}
                        className="w-20 border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                      />
                      <span className="text-gray-500 self-center">-</span>
                      <input 
                        type="number" 
                        placeholder="Max" 
                        value={hoursRange.max}
                        onChange={(e) => setHoursRange(prev => ({ ...prev, max: e.target.value }))}
                        className="w-20 border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-end space-x-2 col-span-2">
                    <button 
                      onClick={applyFilters}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Appliquer les Filtres
                    </button>
                    <button 
                      onClick={resetFilters}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Réinitialiser
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* KPIs */}
        {data && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white/70 backdrop-blur-xl rounded-xl shadow-lg border border-white/50 p-6">
              <div className="flex items-center">
                <CurrencyDollarIcon className="w-8 h-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Récupéré</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${data.totalRecoveredAmount.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/70 backdrop-blur-xl rounded-xl shadow-lg border border-white/50 p-6">
              <div className="flex items-center">
                <DocumentChartBarIcon className="w-8 h-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Projets Actifs</p>
                  <p className="text-2xl font-bold text-gray-900">{data.summary.totalProjects}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/70 backdrop-blur-xl rounded-xl shadow-lg border border-white/50 p-6">
              <div className="flex items-center">
                <ClockIcon className="w-8 h-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Heures Totales</p>
                  <p className="text-2xl font-bold text-gray-900">{data.summary.totalHours}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/70 backdrop-blur-xl rounded-xl shadow-lg border border-white/50 p-6">
              <div className="flex items-center">
                <UsersIcon className="w-8 h-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Utilisateurs</p>
                  <p className="text-2xl font-bold text-gray-900">{data.summary.totalUsers}</p>
                </div>
              </div>
            </div>
          </div>
        )}



        {/* Graphique et Détails */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Graphique */}
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Répartition {chartType === 'pie' ? 'des Montants' : 'des Heures'} par Projet
            </h3>
            <div ref={chartRef} className="h-96">
              {chartData && (
                chartType === 'pie' ? (
                  <Pie data={chartData} options={chartOptions} />
                ) : (
                  <Bar data={chartData} options={chartOptions} />
                )
              )}
            </div>
            <p className="text-sm text-gray-500 mt-4 text-center">
              Cliquez sur un segment pour voir les détails du projet
            </p>
          </div>

          {/* Détails du projet sélectionné */}
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              {selectedProject ? `Détails: ${selectedProject.projectName}` : 'Sélectionnez un projet'}
            </h3>
            
            {selectedProject ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm font-medium text-blue-600">Montant Total</p>
                    <p className="text-2xl font-bold text-blue-900">
                      ${selectedProject.totalAmount.toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <p className="text-sm font-medium text-green-600">Heures Totales</p>
                    <p className="text-2xl font-bold text-green-900">
                      {selectedProject.totalHours}
                    </p>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-600 mb-2">Informations du Projet</p>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Numéro:</span> {selectedProject.projectNumber}</p>
                    <p><span className="font-medium">Type:</span> {selectedProject.projectType}</p>
                    <p><span className="font-medium">Utilisateurs:</span> {selectedProject.userCount}</p>
                    <p><span className="font-medium">Entrées de temps:</span> {selectedProject.timeEntryCount}</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">Détails par Utilisateur</p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                                         {selectedProject.userStats.map((user) => (
                      <div key={user.userId} className="bg-white rounded-lg p-3 border">
                        <p className="font-medium text-sm">{user.userName}</p>
                        <div className="flex justify-between text-xs text-gray-600 mt-1">
                          <span>{user.totalHours}h</span>
                          <span>${user.totalAmount.toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <EyeIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Cliquez sur un segment du graphique pour voir les détails</p>
              </div>
            )}
          </div>
        </div>

        {/* Tableau des données */}
        {data && (
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 p-6 mt-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Tableau Détaillé</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Projet
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Heures
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Montant (USD)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Utilisateurs
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.projects.map((project) => (
                    <tr 
                      key={project.projectId}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleProjectClick(project)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {project.projectName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {project.projectNumber}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {project.totalHours}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${project.totalAmount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {project.userCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button className="text-blue-600 hover:text-blue-900">
                          Voir détails
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
