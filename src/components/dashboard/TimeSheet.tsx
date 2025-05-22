import React, { useState, useEffect } from "react";
import {
  ChevronDownIcon,
  ChartBarIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  DocumentArrowDownIcon,
} from "@heroicons/react/24/outline";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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

interface TimeEntry {
  id: number;
  hours: number;
  semester: "S1" | "S2";
  year: number;
  user: {
    name: string;
    indice: string;
    grade?: string;
    proformaCost?: number;
  };
  project: {
    name: string;
    projectNumber: string;
  };
  activity: {
    name: string;
  };
}

interface TimeSheetProps {
  timeEntries: TimeEntry[];
}

interface UserData {
  staff: string;
  grade: string;
  annualProformaCost: number;
  semesterProformaCost: number;
  projects: {
    [key: string]: {
      name: string;
      totalHours: number;
      activities: {
        [key: string]: {
          name: string;
          hours: number;
        };
      };
      projectCost: number;
    };
  };
}

export const TimeSheet: React.FC<TimeSheetProps> = ({ timeEntries }) => {
  // Obtenir l'année actuelle
  const currentYear = new Date().getFullYear();
  
  // Créer un tableau d'années (année actuelle et 2 années précédentes)
  const availableYears = [
    currentYear,
    currentYear - 1,
    currentYear - 2
  ];

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedSemester, setSelectedSemester] = useState<"S1" | "S2">(
    new Date().getMonth() < 6 ? "S1" : "S2"
  );
  const [processedEntries, setProcessedEntries] = useState<TimeSheetEntry[]>([]);
  const [loading, setLoading] = useState(false);

  // Fonction pour mettre à jour les données
  const updateData = async (year: number, semester: "S1" | "S2") => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(`/api/timeentriesAll?year=${year}&semester=${semester}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (data.success) {
        console.log("Nouvelles données reçues:", data.data);

        // Calculer les totaux par projet
        const projectTotals = data.data.reduce((acc: Record<string, number>, entry: TimeEntry) => {
          const key = entry.project.projectNumber;
          acc[key] = (acc[key] || 0) + entry.hours;
          return acc;
        }, {});

        // Calculer le total des heures
        const totalHours = Object.values(projectTotals).reduce<number>((sum, hours) => sum + (hours as number), 0);

        // Transformer les entrées avec les calculs
        const transformedEntries = data.data.map((entry: TimeEntry) => {
          const projectHours = projectTotals[entry.project.projectNumber];
          const projectPercentage = totalHours > 0 ? (projectHours / totalHours) * 100 : 0;

          // Calculer les coûts proforma
          const annualCost = entry.user.proformaCost || 0;
          const semesterCost = annualCost / 2; // Coût par semestre
          const hourlyCost = semesterCost / 480; // Coût horaire (480 heures par semestre)
          const projectCost = hourlyCost * entry.hours;

          return {
            staff: entry.user.name,
            project: entry.project.name,
            activity: entry.activity.name,
            subActivity: "",
            totalHours: entry.hours,
            grade: entry.user.grade || "",
            annualProformaCost: annualCost,
            semesterProformaCost: semesterCost,
            projectPercentage,
            projectCost,
          };
        });

        console.log("Entrées transformées avec calculs:", transformedEntries);
        setProcessedEntries(transformedEntries);
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour des données:", error);
    } finally {
      setLoading(false);
    }
  };

  // Mettre à jour les données lorsque l'année ou le semestre change
  useEffect(() => {
    updateData(selectedYear, selectedSemester);
  }, [selectedYear, selectedSemester]);

  // Log pour vérifier les données reçues
  console.log("TimeEntries reçues:", timeEntries);
  console.log("Type des données:", {
    year: typeof timeEntries[0]?.year,
    semester: typeof timeEntries[0]?.semester,
    selectedYear: typeof selectedYear,
    selectedSemester: typeof selectedSemester
  });

  const exportToExcel = () => {
    // Regrouper les données par utilisateur et projet
    const groupedData = processedEntries.reduce((acc: Record<string, any>, entry) => {
      const userKey = entry.staff;
      if (!acc[userKey]) {
        acc[userKey] = {
          staff: entry.staff,
          grade: entry.grade,
          annualProformaCost: entry.annualProformaCost,
          semesterProformaCost: entry.semesterProformaCost,
          projects: {}
        };
      }

      const projectKey = entry.project;
      if (!acc[userKey].projects[projectKey]) {
        acc[userKey].projects[projectKey] = {
          name: projectKey,
          totalHours: 0,
          activities: {},
          projectCost: 0
        };
      }

      // Ajouter les heures et le coût au projet
      acc[userKey].projects[projectKey].totalHours += entry.totalHours;
      acc[userKey].projects[projectKey].projectCost += entry.projectCost;

      // Ajouter l'activité
      if (!acc[userKey].projects[projectKey].activities[entry.activity]) {
        acc[userKey].projects[projectKey].activities[entry.activity] = {
          name: entry.activity,
          hours: 0
        };
      }
      acc[userKey].projects[projectKey].activities[entry.activity].hours += entry.totalHours;

      return acc;
    }, {});

    // Convertir en format CSV
    let csvContent = "Staff,Grade,Project,Activity,Heures,Coût Projet (USD)\n";

    Object.values(groupedData).forEach((user: any) => {
      Object.values(user.projects).forEach((project: any) => {
        Object.values(project.activities).forEach((activity: any) => {
          csvContent += `${user.staff},${user.grade},${project.name},${activity.name},${activity.hours},${project.projectCost.toLocaleString("fr-FR")}\n`;
        });
      });
    });

    // Créer et télécharger le fichier
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `timesheet_${selectedYear}_${selectedSemester}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportUserToPDF = (userData: UserData) => {
    const doc = new jsPDF();
    
    // En-tête
    doc.setFontSize(16);
    doc.text("Feuille de Temps", 14, 15);
    doc.setFontSize(12);
    doc.text(`Période: ${selectedYear} - ${selectedSemester}`, 14, 25);
    doc.text(`Staff: ${userData.staff}`, 14, 35);
    doc.text(`Grade: ${userData.grade}`, 14, 45);
    doc.text(`Coût Proforma Annuel: ${userData.annualProformaCost.toLocaleString("fr-FR")} USD`, 14, 55);
    doc.text(`Coût Proforma Semestriel: ${userData.semesterProformaCost.toLocaleString("fr-FR")} USD`, 14, 65);

    // Préparer les données pour le tableau
    const tableData: string[][] = [];
    let totalHours = 0;
    let totalCost = 0;

    Object.values(userData.projects).forEach((project) => {
      Object.values(project.activities).forEach((activity) => {
        tableData.push([
          project.name,
          activity.name,
          `${activity.hours}h`,
          `${project.projectCost.toLocaleString("fr-FR")} USD`
        ]);
        totalHours += activity.hours;
        totalCost += project.projectCost;
      });
    });

    // Ajouter le tableau
    autoTable(doc, {
      startY: 75,
      head: [['Projet', 'Activité', 'Heures', 'Coût']],
      body: tableData,
      foot: [
        ['Total', '', `${totalHours}h`, `${totalCost.toLocaleString("fr-FR")} USD`]
      ],
      theme: 'grid',
      styles: {
        fontSize: 10,
        cellPadding: 5,
      },
      headStyles: {
        fillColor: [66, 139, 202],
        textColor: 255,
        fontStyle: 'bold',
      },
      footStyles: {
        fillColor: [240, 240, 240],
        textColor: 0,
        fontStyle: 'bold',
      }
    });

    // Sauvegarder le PDF
    doc.save(`timesheet_${userData.staff}_${selectedYear}_${selectedSemester}.pdf`);
  };

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

        {/* Filtres et bouton d'export */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <FunnelIcon className="w-5 h-5 text-gray-400" />
            <select
              title="Sélectionner l'année"
              value={selectedYear}
              onChange={(e) => {
                const year = parseInt(e.target.value);
                console.log("Année sélectionnée:", year);
                setSelectedYear(year);
              }}
              className="text-sm border-gray-200 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            >
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <select
              title="Sélectionner le semestre"
              value={selectedSemester}
              onChange={(e) => {
                const semester = e.target.value as "S1" | "S2";
                console.log("Semestre sélectionné:", semester);
                setSelectedSemester(semester);
              }}
              className="text-sm border-gray-200 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="S1">S1</option>
              <option value="S2">S2</option>
            </select>
          </div>

          <button
            onClick={exportToExcel}
            className="flex items-center px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl
                     hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-md hover:shadow-lg
                     transform hover:-translate-y-0.5"
          >
            <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
            Exporter
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50">
          <p className="text-gray-500">Chargement des données...</p>
        </div>
      ) : processedEntries.length === 0 ? (
        <div className="text-center py-8 bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50">
          <p className="text-gray-500">Aucune donnée disponible pour cette période</p>
          <p className="text-sm text-gray-400 mt-2">
            Année: {selectedYear}, Semestre: {selectedSemester}
          </p>
        </div>
      ) : (
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
                {/* <th className="pb-3 px-4 text-right">
                  <span className="text-xs font-medium text-gray-500 uppercase">
                    % Projet
                  </span>
                </th> */}
                <th className="pb-3 px-4 text-right">
                  <span className="text-xs font-medium text-gray-500 uppercase">
                    Coût par Projet
                  </span>
                </th>
                <th className="pb-3 px-4 text-right">
                  <span className="text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {processedEntries.map((entry, index) => {
                // Regrouper les données par utilisateur
                const userData = processedEntries.reduce((acc: any, e) => {
                  if (e.staff === entry.staff) {
                    if (!acc.projects) acc.projects = {};
                    if (!acc.projects[e.project]) {
                      acc.projects[e.project] = {
                        name: e.project,
                        totalHours: 0,
                        activities: {},
                        projectCost: 0
                      };
                    }
                    if (!acc.projects[e.project].activities[e.activity]) {
                      acc.projects[e.project].activities[e.activity] = {
                        name: e.activity,
                        hours: 0
                      };
                    }
                    acc.projects[e.project].activities[e.activity].hours += e.totalHours;
                    acc.projects[e.project].projectCost += e.projectCost;
                    acc.staff = e.staff;
                    acc.grade = e.grade;
                    acc.annualProformaCost = e.annualProformaCost;
                    acc.semesterProformaCost = e.semesterProformaCost;
                  }
                  return acc;
                }, {});

                return (
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
                    {/* <td className="px-6 py-4 whitespace-nowrap text-sm">
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
                    </td> */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                      {entry.projectCost.toLocaleString("fr-FR")} USD
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => exportUserToPDF(userData)}
                        className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg
                                 hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-sm hover:shadow-md
                                 transform hover:-translate-y-0.5"
                      >
                        <DocumentArrowDownIcon className="w-4 h-4 mr-1" />
                        PDF
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
