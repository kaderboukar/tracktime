import { useState, useMemo, useEffect, useCallback } from "react";
import { TimeEntry } from "./types";
import { ChartBarIcon, FunnelIcon, ArrowDownTrayIcon } from "@heroicons/react/24/outline";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type ProjectStats = {
  projectId: number;
  projectName: string;
  projectNumber: string;
  totalHours: number;
  totalPercentage: number;
  totalCost: number;
  totalProformaCost: number;
  entries: TimeEntry[];
};

interface ProjectStatsData {
  projectId: number;
  projectName: string;
  projectNumber: string;
  year: number;
  semester: string;
  totalHours: number;
  entriesCount: number;
  usersCount: number;
  activitiesCount: number;
  totalCalculatedCost: number;
  totalProformaCosts: number;
}

interface TimePeriod {
  id: number;
  year: number;
  semester: "S1" | "S2";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

type ProjectsStatsProps = {
  projectStats: ProjectStatsData[];
  maxHoursPerSemester: number;
};

const formatNumber = (num: number) => {
  return num.toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export function ProjectsStats({
  projectStats,
  maxHoursPerSemester,
}: ProjectsStatsProps) {

  // États pour la pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Période active (automatique)
  const [activePeriod, setActivePeriod] = useState<TimePeriod | null>(null);

  // Récupérer la période active
  const fetchActivePeriod = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/time-periods", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          const active = result.data.find((period: TimePeriod) => period.isActive);
          if (active) {
            setActivePeriod(active);
            console.log(`Période active détectée dans ProjectsStats: ${active.year} - ${active.semester}`);
          }
        }
      }
    } catch (error) {
      console.error("Erreur lors de la récupération de la période active:", error);
    }
  }, []);

  // Récupérer la période active au chargement
  useEffect(() => {
    fetchActivePeriod();
  }, [fetchActivePeriod]);

  // Utiliser la période active au lieu des sélecteurs manuels
  const filter = useMemo(() => ({
    semester: activePeriod?.semester || "S1",
    year: activePeriod?.year || new Date().getFullYear(),
  }), [activePeriod]);

  const filteredProjectStats = useMemo(() => {

    // Filtrer par période uniquement
    const filteredStats = projectStats.filter(
      (stat) =>
        stat.semester === filter.semester && stat.year === filter.year
    );

    // Utiliser les calculs de l'API et calculer les pourcentages
    const finalStats = filteredStats.map((stat) => ({
      ...stat,
      totalPercentage: (stat.totalHours / maxHoursPerSemester) * 100,
      // Utiliser les calculs de l'API
      totalCost: stat.totalCalculatedCost || 0,
      totalProformaCost: stat.totalProformaCosts || 0,
      entries: [], // Pas d'entrées détaillées dans les nouvelles données
    }));
    return finalStats;
  }, [projectStats, filter, maxHoursPerSemester]);

  // Pagination des données
  const totalItems = filteredProjectStats.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = filteredProjectStats.slice(startIndex, endIndex);

  // Réinitialiser la page quand les filtres changent
  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  // Fonction d'export Excel
  const exportToExcel = async () => {
    try {
      // Import dynamique de XLSX
      const XLSX = await import('xlsx');

      // Préparer les données pour l'export
      const exportData = filteredProjectStats.map((stat, index) => ({
        'N°': index + 1,
        'Projet': stat.projectName,
        'Numéro': stat.projectNumber,
        'Année': stat.year,
        'Semestre': stat.semester,
        'Heures': stat.totalHours,
        'Coût Proforma Utilisateurs (USD)': Math.round(stat.totalProformaCost),
        'Coût Calculé Projet (USD)': Math.round(stat.totalCost)
      }));

      // Créer le workbook et la worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);

      // Ajuster la largeur des colonnes
      const colWidths = [
        { wch: 5 },   // N°
        { wch: 30 },  // Projet (plus large)
        { wch: 15 },  // Numéro (plus large)
        { wch: 10 },  // Année
        { wch: 12 },  // Semestre
        { wch: 10 },  // Heures
        { wch: 25 },  // Coût Proforma (plus large)
        { wch: 20 }   // Coût Calculé (plus large)
      ];
      ws['!cols'] = colWidths;

      // Ajouter la worksheet au workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Statistiques Projets');

      // Générer le nom du fichier
      const fileName = `Statistiques_Projets_${filter.year}_${filter.semester}_${new Date().toISOString().split('T')[0]}.xlsx`;

      // Télécharger le fichier
      XLSX.writeFile(wb, fileName);

    } catch (error) {
      console.error('Erreur lors de l\'export Excel:', error);
      alert('Erreur lors de l\'export Excel');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
            <ChartBarIcon className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Statistiques par projet
          </h2>
        </div>

        {/* Affichage de la période active et Export */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <FunnelIcon className="w-5 h-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">
              Période active : {activePeriod ? `${activePeriod.year} - ${activePeriod.semester}` : 'Chargement...'}
            </span>
          </div>

          {/* Bouton Export */}
          <button
            onClick={exportToExcel}
            disabled={filteredProjectStats.length === 0}
            className="flex items-center px-3 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg
                     hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-md hover:shadow-lg
                     transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                     text-sm font-medium"
            title="Exporter les statistiques en Excel"
          >
            <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
            Exporter
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="pb-3 px-4 text-left">
                <span className="text-xs font-medium text-gray-500 uppercase">
                  Projet
                </span>
              </th>
              <th className="pb-3 px-4 text-right">
                <span className="text-xs font-medium text-gray-500 uppercase">
                  Heures
                </span>
              </th>
              <th className="pb-3 px-4 text-right">
                <span className="text-xs font-medium text-gray-500 uppercase">
                  % du semestre
                </span>
              </th>
              <th className="pb-3 px-4 text-right">
                <span className="text-xs font-medium text-gray-500 uppercase">
                  Coût Proforma Utilisateurs
                </span>
              </th>
              <th className="pb-3 px-4 text-right">
                <span className="text-xs font-medium text-gray-500 uppercase">
                  Coût Calculé Projet
                </span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {paginatedData.map((stat) => (
              <tr
                key={stat.projectNumber}
                className="group hover:bg-gray-50/50"
              >
                <td className="py-4 px-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {stat.projectName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {stat.projectNumber}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {stat.entriesCount} entrées
                    </p>
                  </div>
                </td>
                <td className="py-4 px-4 text-right">
                  <span className="text-sm font-medium text-gray-900">
                    {formatNumber(stat.totalHours)}h
                  </span>
                </td>
                <td className="py-4 px-4 text-right">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                ${
                                  stat.totalPercentage >= 90
                                    ? "bg-red-50 text-red-700"
                                    : stat.totalPercentage >= 70
                                    ? "bg-yellow-50 text-yellow-700"
                                    : "bg-blue-50 text-blue-700"
                                }`}
                  >
                    {formatNumber(stat.totalPercentage)}%
                  </span>
                </td>
                <td className="py-4 px-4 text-right">
                  <span className="text-sm font-medium text-gray-900">
                    {formatNumber(stat.totalProformaCost)} USD
                  </span>
                </td>
                <td className="py-4 px-4 text-right">
                  <span className="text-sm font-medium text-green-600">
                    ${formatNumber(stat.totalCost)} USD
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 bg-white/50 backdrop-blur-xl rounded-lg border border-white/50">
          <div className="flex items-center text-sm text-gray-700">
            <span>
              Affichage de {startIndex + 1} à {Math.min(endIndex, totalItems)} sur {totalItems} projets
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Précédent
            </button>
            <div className="flex items-center space-x-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1 text-sm rounded-md ${
                    currentPage === page
                      ? 'bg-blue-600 text-white'
                      : 'border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Suivant
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
