import React from "react";
import { TimeEntry, User } from "./types";
import {
  ChartBarIcon,
  ClockIcon,
  CurrencyDollarIcon,
  DocumentTextIcon
} from "@heroicons/react/24/outline";
import { calculateHourlyCost, HOURS_PER_SEMESTER } from "@/lib/workHours";

interface PersonalStatsProps {
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

export const PersonalStats: React.FC<PersonalStatsProps> = ({ timeEntries, user }) => {
  const currentDate = new Date();
  const currentSemester = currentDate.getMonth() < 6 ? 'S1' : 'S2';
  const currentYear = currentDate.getFullYear();

  // Calculer les statistiques
  const currentSemesterEntries = timeEntries.filter(
    entry => entry.semester === currentSemester && entry.year === currentYear
  );

  const totalHoursCurrentSemester = currentSemesterEntries.reduce((sum, entry) => sum + entry.hours, 0);
  const totalEntriesCurrentSemester = currentSemesterEntries.length;

  // ✅ UTILISER LA FORMULE STANDARDISÉE
  const hourlyCost = user.proformaCost ? calculateHourlyCost(user.proformaCost) : 0;
  const generatedCost = hourlyCost * totalHoursCurrentSemester;

  // Calculer les heures par projet
  // const projectHours = currentSemesterEntries.reduce((acc, entry) => {
  //   const projectName = entry.project.name;
  //   acc[projectName] = (acc[projectName] || 0) + entry.hours;
  //   return acc;
  // }, {} as Record<string, number>);

  //const topProject = Object.entries(projectHours).sort(([,a], [,b]) => b - a)[0];

  // Calculer la moyenne d'heures par entrée
  //const avgHoursPerEntry = totalEntriesCurrentSemester > 0 ? totalHoursCurrentSemester / totalEntriesCurrentSemester : 0;

  // Calculer le pourcentage d'objectif atteint (480h par semestre)
  //const objectivePercentage = (totalHoursCurrentSemester / 480) * 100;

  const stats = [
    {
      title: "Heures ce semestre",
      value: `${totalHoursCurrentSemester.toFixed(1)}h`,
      subtitle: `${currentSemester} ${currentYear}`,
      icon: ClockIcon,
      color: "from-blue-500 to-indigo-600",
      bgColor: "bg-blue-50",
      textColor: "text-blue-600"
    },
    {
      title: "Entrées créées",
      value: totalEntriesCurrentSemester.toString(),
      subtitle: "Ce semestre",
      icon: DocumentTextIcon,
      color: "from-green-500 to-emerald-600",
      bgColor: "bg-green-50",
      textColor: "text-green-600"
    },
    {
      title: "Coût généré",
      value: `${Math.round(generatedCost).toLocaleString('fr-FR')} USD`,
      subtitle: "Basé sur les heures",
      icon: CurrencyDollarIcon,
      color: "from-purple-500 to-pink-600",
      bgColor: "bg-purple-50",
      textColor: "text-purple-600"
    },
    // {
    //   title: "Objectif atteint",
    //   value: `${objectivePercentage.toFixed(1)}%`,
    //   subtitle: "Sur 480h/semestre",
    //   icon: ArrowTrendingUpIcon,
    //   color: objectivePercentage >= 90 ? "from-red-500 to-red-600" :
    //          objectivePercentage >= 70 ? "from-yellow-500 to-yellow-600" :
    //          "from-blue-500 to-indigo-600",
    //   bgColor: objectivePercentage >= 90 ? "bg-red-50" :
    //            objectivePercentage >= 70 ? "bg-yellow-50" :
    //            "bg-blue-50",
    //   textColor: objectivePercentage >= 90 ? "text-red-600" :
    //              objectivePercentage >= 70 ? "text-yellow-600" :
    //              "text-blue-600"
    // },
    // {
    //   title: "Moyenne/entrée",
    //   value: `${avgHoursPerEntry.toFixed(1)}h`,
    //   subtitle: "Heures par entrée",
    //   icon: ChartBarIcon,
    //   color: "from-indigo-500 to-purple-600",
    //   bgColor: "bg-indigo-50",
    //   textColor: "text-indigo-600"
    // },
    // {
    //   title: "Projet principal",
    //   value: topProject ? topProject[1].toFixed(1) + "h" : "N/A",
    //   subtitle: topProject ? topProject[0].substring(0, 20) + "..." : "Aucun projet",
    //   icon: CalendarIcon,
    //   color: "from-orange-500 to-red-600",
    //   bgColor: "bg-orange-50",
    //   textColor: "text-orange-600"
    // }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
          <ChartBarIcon className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Mes Statistiques Personnelles
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="group bg-white/70 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/50
                       hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
          >
            <div className="flex items-center space-x-4">
              <div className={`p-3 bg-gradient-to-br ${stat.color} rounded-xl group-hover:scale-110 transition-transform duration-300`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className={`text-2xl font-bold ${stat.textColor}`}>{stat.value}</p>
                <p className="text-xs text-gray-500 mt-1">{stat.subtitle}</p>
              </div>
            </div>

            {/* Effet de brillance au survol */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent
                          opacity-0 group-hover:opacity-100 -translate-x-full group-hover:translate-x-full
                          transition-all duration-1000 ease-out rounded-2xl"/>
          </div>
        ))}
      </div>

      {/* Graphique de progression mensuelle (placeholder pour future implémentation) */}
      {/* <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/50">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Progression ce semestre</h3>
        <div className="h-32 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl flex items-center justify-center">
          <p className="text-gray-500">Graphique de progression à venir</p>
        </div>
      </div> */}
    </div>
  );
};
