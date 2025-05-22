import { useState, useMemo } from "react";
import { TimeEntry } from "./types";
import { ChartBarIcon, FunnelIcon } from "@heroicons/react/24/outline";

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

type PeriodFilter = {
  semester: "S1" | "S2";
  year: number;
};

type ProjectsStatsProps = {
  timeEntries: TimeEntry[];
  maxHoursPerSemester: number;
};

const formatNumber = (num: number) => {
  return num.toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export function ProjectsStats({
  timeEntries,
  maxHoursPerSemester,
}: ProjectsStatsProps) {
  // Obtenir la liste des années uniques des entrées
  const years = useMemo(() => {
    const uniqueYears = [...new Set(timeEntries.map((entry) => entry.year))];
    console.log("Unique Years:", uniqueYears); // Log des années uniques
    return uniqueYears.sort((a, b) => b - a); // Tri décroissant
  }, [timeEntries]);

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  // État pour le filtre
  const [filter, setFilter] = useState<PeriodFilter>({
    semester: currentMonth < 6 ? "S1" : "S2",
    year: currentYear,
  });

  console.log("Filter:", filter); // Log du filtre

  const projectStats = useMemo(() => {
    console.log("Time Entries:", timeEntries); // Log des entrées de temps

    // Filtrer par période uniquement
    const filteredEntries = timeEntries.filter(
      (entry) =>
        entry.semester === filter.semester && entry.year === filter.year
    );
    console.log("Filtered Entries:", filteredEntries); // Log des entrées filtrées

    // Grouper par projet et calculer les totaux
    const projectGroups = filteredEntries.reduce(
      (acc: { [key: number]: ProjectStats }, entry) => {
        if (!acc[entry.projectId]) {
          acc[entry.projectId] = {
            projectId: entry.projectId,
            projectName: entry.project.name,
            projectNumber: entry.project.projectNumber,
            totalHours: 0,
            totalPercentage: 0,
            totalCost: 0,
            totalProformaCost: 0,
            entries: [],
          };
        }

        // Ajouter toutes les heures sans filtrer par utilisateur
        acc[entry.projectId].totalHours += entry.hours;
        acc[entry.projectId].entries.push(entry);

        return acc;
      },
      {}
    );
    console.log("Project Groups:", projectGroups); // Log des groupes de projets

    // Calculer les coûts proforma pour chaque projet
    Object.values(projectGroups).forEach((project) => {
      const uniqueUsersMap = new Map();
      project.entries.forEach((e) => {
        if (!uniqueUsersMap.has(e.user.id)) {
          uniqueUsersMap.set(e.user.id, e.user.proformaCost);
        } else {
          uniqueUsersMap.set(
            e.user.id,
            uniqueUsersMap.get(e.user.id) + e.user.proformaCost
          );
        }
      });

      // Somme des coûts proforma de tous les utilisateurs uniques
      project.totalProformaCost = Array.from(uniqueUsersMap.values()).reduce(
        (sum, cost) => sum + cost,
        0
      );

      console.log(
        `Total Proforma Cost for project ${project.projectId}:`,
        project.totalProformaCost
      ); // Log du coût proforma total pour le projet
    });

    // Calculer les pourcentages et coûts finaux
    const finalStats = Object.values(projectGroups).map((project) => ({
      ...project,
      totalPercentage: (project.totalHours / maxHoursPerSemester) * 100,
      totalCost:
        (project.totalProformaCost / 2) *
        (project.totalHours / maxHoursPerSemester),
    }));
    console.log("Final Project Stats:", finalStats); // Log des statistiques finales des projets

    return finalStats;
  }, [timeEntries, filter, maxHoursPerSemester]);

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

        {/* Filtres */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <FunnelIcon className="w-5 h-5 text-gray-400" />
            <select
              value={filter.year}
              onChange={(e) =>
                setFilter((prev) => ({ ...prev, year: Number(e.target.value) }))
              }
              className="text-sm border-gray-200 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <select
              value={filter.semester}
              onChange={(e) =>
                setFilter((prev) => ({
                  ...prev,
                  semester: e.target.value as "S1" | "S2",
                }))
              }
              className="text-sm border-gray-200 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="S1">S1</option>
              <option value="S2">S2</option>
            </select>
          </div>
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
                  Coût proforma total
                </span>
              </th>
              <th className="pb-3 px-4 text-right">
                <span className="text-xs font-medium text-gray-500 uppercase">
                  Coût du projet
                </span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {projectStats.map((stat) => (
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
                      {stat.entries.length} entrées
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
                    ${formatNumber(stat.totalProformaCost)}
                  </span>
                </td>
                <td className="py-4 px-4 text-right">
                  <span className="text-sm font-medium text-green-600">
                    ${formatNumber(stat.totalCost)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
