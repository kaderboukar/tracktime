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
  CalendarIcon
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

export default function ProjectStatisticsPage() {
  const [data, setData] = useState<ProjectStatisticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<ProjectStatistic | null>(null);
  const [selectedYear, setSelectedYear] = useState(2025);
  const [selectedSemester, setSelectedSemester] = useState<'S1' | 'S2'>('S1');
  const [chartType, setChartType] = useState<'pie' | 'bar'>('pie');
  const chartRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

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

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

        {/* Filtres */}
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 p-6 mb-8">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <CalendarIcon className="w-5 h-5 text-gray-500" />
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {[2023, 2024, 2025].map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value as 'S1' | 'S2')}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="S1">Semestre 1</option>
                <option value="S2">Semestre 2</option>
              </select>
            </div>
            
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
