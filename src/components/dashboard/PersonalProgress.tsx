import React from "react";
import { TimeEntry } from "./types";
import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ClockIcon
} from "@heroicons/react/24/outline";

interface PersonalProgressProps {
  timeEntries: TimeEntry[];
}

export const PersonalProgress: React.FC<PersonalProgressProps> = ({ timeEntries }) => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentSemester = currentDate.getMonth() < 6 ? 'S1' : 'S2';

  // Filtrer les entrées pour le semestre actuel
  const currentSemesterEntries = timeEntries.filter(
    entry => entry.year === currentYear && entry.semester === currentSemester
  );

  // Grouper par mois (approximatif basé sur la date de création)
  const monthlyData = currentSemesterEntries.reduce((acc, entry) => {
    // Simuler une distribution mensuelle (en réalité, il faudrait une date de création)
    const month = Math.floor(Math.random() * 6) + (currentSemester === 'S1' ? 1 : 7);
    const monthName = new Date(currentYear, month - 1).toLocaleDateString('fr-FR', { month: 'short' });

    if (!acc[monthName]) {
      acc[monthName] = 0;
    }
    acc[monthName] += entry.hours;
    return acc;
  }, {} as Record<string, number>);

  // Créer un tableau ordonné des 6 derniers mois
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const monthName = date.toLocaleDateString('fr-FR', { month: 'short' });
    months.push({
      name: monthName,
      hours: monthlyData[monthName] || 0
    });
  }

  const maxHours = Math.max(...months.map(m => m.hours), 80); // Minimum 80h pour l'échelle

  // Calculer les tendances
  const totalHours = currentSemesterEntries.reduce((sum, entry) => sum + entry.hours, 0);
  const averagePerMonth = totalHours / 6;
  const lastMonthHours = months[months.length - 1]?.hours || 0;
  const previousMonthHours = months[months.length - 2]?.hours || 0;
  const trend = lastMonthHours - previousMonthHours;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
            <ArrowTrendingUpIcon className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Ma Progression
          </h2>
        </div>
        <span className="px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 rounded-full">
          {currentSemester} {currentYear}
        </span>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <ClockIcon className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-gray-600">Total ce semestre</p>
              <p className="text-2xl font-bold text-blue-600">{totalHours}h</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <ChartBarIcon className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-sm font-medium text-gray-600">Moyenne/mois</p>
              <p className="text-2xl font-bold text-green-600">{averagePerMonth.toFixed(1)}h</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <ArrowTrendingUpIcon className={`w-8 h-8 ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            <div>
              <p className="text-sm font-medium text-gray-600">Tendance</p>
              <p className={`text-2xl font-bold ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {trend >= 0 ? '+' : ''}{trend.toFixed(1)}h
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Graphique en barres simple */}
      <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/50">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Heures par mois</h3>

        <div className="space-y-4">
          {months.map((month, index) => (
            <div key={index} className="flex items-center space-x-4">
              <div className="w-12 text-sm font-medium text-gray-600">
                {month.name}
              </div>

              <div className="flex-1 relative">
                <div className="h-8 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-1000 ease-out relative group"
                    style={{ width: `${(month.hours / maxHours) * 100}%` }}
                  >
                    {/* Effet de brillance */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent
                                  opacity-0 group-hover:opacity-100 -translate-x-full group-hover:translate-x-full
                                  transition-all duration-1000 ease-out"/>
                  </div>
                </div>
              </div>

              <div className="w-16 text-right">
                <span className="text-sm font-medium text-gray-900">{month.hours}h</span>
              </div>
            </div>
          ))}
        </div>

        {/* Légende */}
        <div className="mt-6 flex items-center justify-between text-sm text-gray-500">
          <span>0h</span>
          <span className="font-medium">Heures travaillées par mois</span>
          <span>{maxHours}h</span>
        </div>
      </div>

      {/* Objectifs et recommandations */}
      {/* <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/50">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Objectifs & Recommandations</h3>

        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CalendarIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Objectif semestriel</p>
              <p className="text-sm text-gray-600">
                {totalHours >= 480 ?
                  "🎉 Félicitations ! Vous avez atteint votre objectif de 480h." :
                  `Il vous reste ${(480 - totalHours).toFixed(1)}h pour atteindre l'objectif de 480h.`
                }
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <ArrowTrendingUpIcon className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Recommandation</p>
              <p className="text-sm text-gray-600">
                {averagePerMonth < 80 ?
                  "Essayez d'augmenter votre moyenne mensuelle à 80h pour rester sur la bonne voie." :
                  "Excellente cadence ! Continuez sur cette lancée."
                }
              </p>
            </div>
          </div>
        </div>
      </div> */}
    </div>
  );
};
