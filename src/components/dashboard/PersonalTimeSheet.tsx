/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useMemo } from "react";
import { TimeEntry } from "./types";
import {
  DocumentArrowDownIcon,
  FunnelIcon,
  ChartBarIcon,
  ClockIcon,
  CurrencyDollarIcon,
} from "@heroicons/react/24/outline";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { HOURS_PER_SEMESTER } from "@/lib/workHours";

interface PersonalTimeSheetProps {
  timeEntries: TimeEntry[];
  user: {
    id: number;
    name: string;
    indice: string;
    role: string;
    grade?: string;
    proformaCost?: number;
  };
}

export const PersonalTimeSheet: React.FC<PersonalTimeSheetProps> = ({
  timeEntries,
  user,
}) => {
  const currentYear = new Date().getFullYear();
  const availableYears = [currentYear, currentYear - 1, currentYear - 2];

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedSemester, setSelectedSemester] = useState<"S1" | "S2">(
    new Date().getMonth() < 6 ? "S1" : "S2"
  );

  // États pour la pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Filtrer les entrées selon la période sélectionnée
  const filteredEntries = timeEntries.filter(
    (entry) =>
      entry.year === selectedYear && entry.semester === selectedSemester
  );

  // Grouper par projet et activité
  const groupedData = filteredEntries.reduce((acc, entry) => {
    const projectKey = entry.project.name;
    if (!acc[projectKey]) {
      acc[projectKey] = {
        projectName: entry.project.name,
        projectNumber: entry.project.projectNumber,
        activities: {},
        totalHours: 0,
      };
    }

    const activityKey = entry.activity.name;
    if (!acc[projectKey].activities[activityKey]) {
      acc[projectKey].activities[activityKey] = {
        name: entry.activity.name,
        hours: 0,
      };
    }

    acc[projectKey].activities[activityKey].hours += entry.hours;
    acc[projectKey].totalHours += entry.hours;

    return acc;
  }, {} as Record<string, any>);

  const totalHours = Object.values(groupedData).reduce(
    (sum: number, project: any) => sum + project.totalHours,
    0
  );

  // ✅ UTILISER LA FORMULE STANDARDISÉE
  const semesterCost = user.proformaCost ? user.proformaCost / 2 : 0;
  const hourlyCost = semesterCost / HOURS_PER_SEMESTER;
  const totalCost = hourlyCost * totalHours;

  // Créer une liste plate des activités pour la pagination
  const flatActivities = useMemo(() => {
    const activities: any[] = [];
    Object.values(groupedData).forEach((project: any) => {
      Object.values(project.activities).forEach((activity: any) => {
        activities.push({
          projectName: project.projectName,
          projectNumber: project.projectNumber,
          activityName: activity.name,
          hours: activity.hours,
          cost: hourlyCost * activity.hours,
        });
      });
    });
    return activities;
  }, [groupedData, hourlyCost]);

  // Pagination des données
  const totalItems = flatActivities.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedActivities = flatActivities.slice(startIndex, endIndex);

  // Réinitialiser la page quand les filtres changent
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedYear, selectedSemester]);

  // Fonction d'export PDF (définie après flatActivities)
  const exportToPDF = () => {
    // Fonction utilitaire pour formater les montants sans problème d'affichage
    const formatAmount = (amount: number): string => {
      return `${Math.round(amount)} USD`;
    };

    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    // Ajouter le logo du PNUD
    doc.addImage("/logoundp.png", "PNG", 250, 18, 25, 35);

    // En-tête
    doc.setFontSize(20);
    doc.setTextColor(66, 139, 202);
    doc.text("FICHE DE TEMPS PERSONNELLE", 148, 50, { align: "center" });

    // Informations de l'employé
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text(`Nom: ${user.name}`, 20, 70);
    doc.text(`Grade: ${user.grade || "N/A"}`, 20, 75);
    doc.text(`Période: ${selectedYear} - ${selectedSemester}`, 20, 80);

    // Préparer les données pour le tableau
    const tableData: string[][] = [];

    // Utiliser flatActivities pour l'export PDF (toutes les données)
    flatActivities.forEach((activity) => {
      tableData.push([
        activity.projectName,
        activity.activityName,
        `${activity.hours}h`,
        formatAmount(activity.cost),
      ]);
    });

    // Ajouter le tableau
    autoTable(doc, {
      startY: 95,
      head: [["Projet", "Activité", "Heures", "Coût"]],
      body: tableData,
      foot: [
        [
          "Total",
          "",
          `${totalHours}h`,
          formatAmount(totalCost),
        ],
      ],
      theme: "grid",
      styles: {
        fontSize: 10,
        cellPadding: 5,
      },
      headStyles: {
        fillColor: [66, 139, 202],
        textColor: 255,
        fontStyle: "bold",
      },
      footStyles: {
        fillColor: [240, 240, 240],
        textColor: 0,
        fontStyle: "bold",
      },
      columnStyles: {
        0: { cellWidth: 75 },
        1: { cellWidth: 90 },
        2: { cellWidth: 35 },
        3: { cellWidth: 50 },
      },
      margin: { left: 20, right: 20 },
    });

    // Sauvegarder le PDF
    doc.save(`ma_fiche_de_temps_${selectedYear}_${selectedSemester}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
            <ChartBarIcon className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Ma Feuille de Temps
          </h2>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <FunnelIcon className="w-5 h-5 text-gray-400" />
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="text-sm border-gray-200 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            >
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <select
              value={selectedSemester}
              onChange={(e) =>
                setSelectedSemester(e.target.value as "S1" | "S2")
              }
              className="text-sm border-gray-200 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="S1">S1</option>
              <option value="S2">S2</option>
            </select>
          </div>

          <button
            onClick={exportToPDF}
            className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl
                     hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg
                     transform hover:-translate-y-0.5"
          >
            <DocumentArrowDownIcon className="w-5 h-5 mr-2" />
            Exporter PDF
          </button>
        </div>
      </div>

      {/* Résumé */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/50">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
              <ClockIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Heures</p>
              <p className="text-2xl font-bold text-blue-600">{totalHours}h</p>
            </div>
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/50">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl">
              <ChartBarIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Projets</p>
              <p className="text-2xl font-bold text-green-600">
                {Object.keys(groupedData).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/50">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl">
              <CurrencyDollarIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Coût Total</p>
              <p className="text-2xl font-bold text-purple-600">
                {Math.round(totalCost)} USD
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tableau détaillé */}
      {Object.keys(groupedData).length === 0 ? (
        <div className="text-center py-8 bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50">
          <p className="text-gray-500">
            Aucune donnée disponible pour cette période
          </p>
        </div>
      ) : (
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="pb-3 px-4 text-left">
                    <span className="text-xs font-medium text-gray-500 uppercase">
                      Projet
                    </span>
                  </th>
                  <th className="pb-3 px-4 text-left">
                    <span className="text-xs font-medium text-gray-500 uppercase">
                      Activité
                    </span>
                  </th>
                  <th className="pb-3 px-4 text-right">
                    <span className="text-xs font-medium text-gray-500 uppercase">
                      Heures
                    </span>
                  </th>
                  <th className="pb-3 px-4 text-right">
                    <span className="text-xs font-medium text-gray-500 uppercase">
                      Coût
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginatedActivities.map((activity, index) => (
                  <tr
                    key={`${activity.projectName}-${activity.activityName}-${index}`}
                    className="hover:bg-gray-50/50"
                  >
                    <td className="px-4 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {activity.projectName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {activity.projectNumber}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-gray-900">
                        {activity.activityName}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className="text-sm font-medium text-gray-900">
                        {activity.hours}h
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className="text-sm font-medium text-blue-600">
                        {Math.round(activity.cost)} USD
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 bg-white/50 backdrop-blur-xl rounded-lg border border-white/50 mt-4">
          <div className="flex items-center text-sm text-gray-700">
            <span>
              Affichage de {startIndex + 1} à {Math.min(endIndex, totalItems)}{" "}
              sur {totalItems} activités
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Précédent
            </button>
            <div className="flex items-center space-x-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 text-sm rounded-md ${
                      currentPage === page
                        ? "bg-blue-600 text-white"
                        : "border border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {page}
                  </button>
                )
              )}
            </div>
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
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
};
