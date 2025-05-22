import React, { useState } from "react";
import {
  ChevronDownIcon,
  ChartBarIcon,
  FunnelIcon,
} from "@heroicons/react/24/outline";

type TimeSheetEntry = {
  staff: string;
  project: string;
  activity: string;
  subActivity: string;
  totalHours: number;
  grade: string;
  annualProformaCost: number;
  semesterProformaCost: number;
  projectPercentage: number;
  projectCost: number;
};

interface TimeSheetProps {
  timeEntries: TimeSheetEntry[];
}

export const TimeSheet: React.FC<TimeSheetProps> = ({ timeEntries }) => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedSemester, setSelectedSemester] = useState(
    new Date().getMonth() < 6 ? "S1" : "S2"
  );

  const years = Array.from(
    new Set(timeEntries.map((entry) => new Date().getFullYear()))
  );

  const filteredEntries = timeEntries.filter((entry) => {
    // Ajoutez ici votre logique de filtrage par année et semestre
    return true; // À modifier selon vos besoins
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
            <ChartBarIcon className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Feuille de Temps
          </h2>
        </div>

        {/* Filtres améliorés */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <FunnelIcon className="w-5 h-5 text-gray-400" />
            <select
              title="Sélectionner l'année"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="text-sm border-gray-200 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <select
              title="Sélectionner le semestre"
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
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
                  Staff
                </span>
              </th>
              <th className="pb-3 px-4 text-right">
                <span className="text-xs font-medium text-gray-500 uppercase">
                  Projet
                </span>
              </th>
              <th className="pb-3 px-4 text-right">
                <span className="text-xs font-medium text-gray-500 uppercase">
                  Activité
                </span>
              </th>
              <th className="pb-3 px-4 text-right">
                <span className="text-xs font-medium text-gray-500 uppercase">
                  Total Heures
                </span>
              </th>
              <th className="pb-3 px-4 text-right">
                <span className="text-xs font-medium text-gray-500 uppercase">
                  Grade
                </span>
              </th>
              <th className="pb-3 px-4 text-right">
                <span className="text-xs font-medium text-gray-500 uppercase">
                  Coût Proforma Annuel
                </span>
              </th>
              <th className="pb-3 px-4 text-right">
                <span className="text-xs font-medium text-gray-500 uppercase">
                  Coût Proforma Semestriel
                </span>
              </th>
              <th className="pb-3 px-4 text-right">
                <span className="text-xs font-medium text-gray-500 uppercase">
                  % Projet
                </span>
              </th>
              <th className="pb-3 px-4 text-right">
                <span className="text-xs font-medium text-gray-500 uppercase">
                  Coût par Projet
                </span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredEntries.map((entry, index) => (
              <tr
                className="group hover:bg-gray-50/50"
                key={entry.staff + index}
              >
                <td className="py-4 px-4">
                  <span className="text-sm font-medium text-gray-900">
                    {entry.staff}
                  </span>
                </td>
                <td className="py-4 px-4 text-right">
                  <span className="text-sm font-medium text-gray-900">
                    {entry.project}
                  </span>
                </td>
                <td className="py-4 px-4 text-right">
                  <span className="text-sm font-medium text-gray-900">
                    {entry.activity}
                  </span>
                </td>
                <td className="py-4 px-4 text-right">
                  <span className="text-sm font-medium text-gray-900">
                    {entry.totalHours}h
                  </span>
                </td>
                <td className="py-4 px-4 text-right">
                  <span className="text-sm font-medium text-gray-900">
                    {entry.grade}
                  </span>
                </td>
                <td className="py-4 px-4 text-right">
                  <span className="text-sm font-medium text-gray-900">
                    {entry.annualProformaCost.toLocaleString("fr-FR")} USD
                  </span>
                </td>
                <td className="py-4 px-4 text-right">
                  <span className="text-sm font-medium text-gray-900">
                    {entry.semesterProformaCost.toLocaleString("fr-FR")} USD
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${Math.min(entry.projectPercentage, 100)}%`,
                      }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-600 mt-1">
                    {entry.projectPercentage.toFixed(1)}%
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                  {entry.projectCost.toLocaleString("fr-FR")} USD
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
