import React, { useState, useEffect } from "react";
import {
  ChevronDownIcon,
  ChartBarIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  DocumentArrowDownIcon,
  ChevronRightIcon,
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

interface ProjectData {
  name: string;
  activities: {
    [key: string]: {
      name: string;
      hours: number;
    };
  };
  totalHours: number;
  projectCost: number;
}

interface UserData {
  staff: string;
  grade: string;
  annualProformaCost: number;
  semesterProformaCost: number;
  projects: {
    [key: string]: ProjectData;
  };
  totalHours: number;
  totalCost: number;
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
  const [expandedUsers, setExpandedUsers] = useState<Record<string, boolean>>({});

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
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });
    
    // Ajouter le logo du PNUD et ajuster la position verticale
    doc.addImage("/logoundp.png", "PNG", 250, 18, 25, 35);

    // En-tête avec titre stylisé et ajuster la position verticale (en dessous du logo)
    doc.setFontSize(20);
    doc.setTextColor(66, 139, 202); // Bleu
    doc.text("FICHE DE TEMPS", 148, 50, { align: "center" });

    // Informations de l'employé
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0); // Noir
    // doc.text("INFORMATIONS DE L'EMPLOYÉ", 20, 35);
    doc.setFontSize(10);
    doc.text(`Nom: ${userData.staff}`, 20, 70);
    doc.text(`Grade: ${userData.grade}`, 20, 75);
    doc.text(`Période: ${selectedYear} - ${selectedSemester}`, 20, 80);
    
    // Préparer les données pour le tableau
    const tableData: string[][] = [];
    let totalHours = 0;
    let totalActivityCost = 0;

    const formatAmount = (amount: number) => {
      return `${Math.round(amount).toLocaleString('fr-FR', { useGrouping: false })} USD`;
    };

    Object.values(userData.projects).forEach((project) => {
      Object.values(project.activities).forEach((activity) => {
        // Calculer le coût par activité
        const hourlyRate = userData.semesterProformaCost / 480; // Coût horaire (480 heures par semestre)
        const activityCost = hourlyRate * activity.hours;

        tableData.push([
          project.name,
          activity.name,
          `${activity.hours}h`,
          formatAmount(Math.round(activityCost))
        ]);
        totalHours += activity.hours;
        totalActivityCost += activityCost;
      });
    });

    // Ajouter le tableau
    autoTable(doc, {
      startY: 95,
      head: [['Projet', 'Activité', 'Heures', 'Coût']],
      body: tableData,
      foot: [
        ['Total', '', `${totalHours}h`, formatAmount(Math.round(totalActivityCost))]
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
      },
      columnStyles: {
        0: { cellWidth: 75 }, // Projet
        1: { cellWidth: 90 }, // Activité
        2: { cellWidth: 35 }, // Heures
        3: { cellWidth: 50 }, // Coût
      },
      margin: { left: 20, right: 20 },
      didDrawPage: function (data) {
        doc.setFontSize(8);
        doc.setTextColor(100);
        const currentDate = new Date();
        const formattedDate = currentDate.toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
        doc.text(`generer le ${formattedDate} par time-tracker`, data.settings.margin.left, (doc as any).internal.pageSize.height - 10);
      }
    });

    // Positionner la date et la signature en bas du document, après le tableau
    const tableEndY = (doc as any).lastAutoTable.finalY || 180; // Position de fin du tableau
    const bottomMargin = 20; // Marge du bas souhaitée
    const pageHeight = (doc as any).internal.pageSize.height; // Hauteur de la page
    
    // Calculer la position Y pour la date et la signature
    // Elle doit être soit à bottomMargin de la fin de la page, soit bottomMargin après le tableau, selon ce qui est le plus bas
    const signatureY = Math.max(tableEndY + bottomMargin, pageHeight - bottomMargin);

    // Date
    doc.setFontSize(10);
    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    doc.text(`Date: ${formattedDate}`, 20, signatureY);

    // Signature
    doc.text("Signature:", 200, signatureY);
    doc.line(200, signatureY + 5, 277, signatureY + 5); // Ligne 5mm en dessous du texte

    // Sauvegarder le PDF
    doc.save(`fiche_de_temps_${userData.staff}_${selectedYear}_${selectedSemester}.pdf`);
  };

  const toggleUser = (staff: string) => {
    setExpandedUsers(prev => ({
      ...prev,
      [staff]: !prev[staff]
    }));
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
                    Grade
                  </span>
                </th>
                <th className="pb-3 px-4 text-right">
                  <span className="text-xs font-medium text-gray-500 uppercase">
                    Projet
                  </span>
                </th>
                <th className="pb-3 px-4 text-right">
                  <span className="text-xs font-medium text-gray-500 uppercase">
                    Activités
                  </span>
                </th>
                <th className="pb-3 px-4 text-right">
                  <span className="text-xs font-medium text-gray-500 uppercase">
                    Total Heures
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
              {Object.entries(
                processedEntries.reduce((acc: Record<string, UserData>, entry) => {
                  if (!acc[entry.staff]) {
                    acc[entry.staff] = {
                      staff: entry.staff,
                      grade: entry.grade,
                      annualProformaCost: entry.annualProformaCost,
                      semesterProformaCost: entry.semesterProformaCost,
                      projects: {},
                      totalHours: 0,
                      totalCost: 0
                    };
                  }
                  
                  if (!acc[entry.staff].projects[entry.project]) {
                    acc[entry.staff].projects[entry.project] = {
                      name: entry.project,
                      activities: {},
                      totalHours: 0,
                      projectCost: 0
                    };
                  }

                  if (!acc[entry.staff].projects[entry.project].activities[entry.activity]) {
                    acc[entry.staff].projects[entry.project].activities[entry.activity] = {
                      name: entry.activity,
                      hours: 0
                    };
                  }

                  acc[entry.staff].projects[entry.project].activities[entry.activity].hours += entry.totalHours;
                  acc[entry.staff].projects[entry.project].totalHours += entry.totalHours;
                  acc[entry.staff].projects[entry.project].projectCost += entry.projectCost;
                  acc[entry.staff].totalHours += entry.totalHours;
                  acc[entry.staff].totalCost += entry.projectCost;

                  return acc;
                }, {})
              ).map(([staff, userData]) => (
                <React.Fragment key={staff}>
                  <tr className="border-t-2 border-blue-100">
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => toggleUser(staff)}
                          className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                        >
                          {expandedUsers[staff] ? (
                            <ChevronDownIcon className="w-5 h-5 text-gray-500" />
                          ) : (
                            <ChevronRightIcon className="w-5 h-5 text-gray-500" />
                          )}
                        </button>
                        <span className="text-sm font-medium text-gray-900">
                          {userData.staff}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className="text-sm font-medium text-gray-900">
                        {userData.grade}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className="text-sm font-medium text-gray-900">
                        {Object.keys(userData.projects).length} Projets
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className="text-sm font-medium text-gray-900">
                        {userData.totalHours}h
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className="text-sm font-medium text-gray-900">
                        {userData.annualProformaCost.toLocaleString("fr-FR")} USD
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className="text-sm font-medium text-gray-900">
                        {userData.semesterProformaCost.toLocaleString("fr-FR")} USD
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className="text-sm font-medium text-blue-600">
                        {userData.totalCost.toLocaleString("fr-FR")} USD
                      </span>
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
                  {expandedUsers[staff] && (
                    <>
                      {Object.entries(userData.projects).map(([projectKey, project]: [string, ProjectData], projectIndex) => (
                        <tr
                          key={`${staff}-${projectKey}`}
                          className="group hover:bg-gray-50/50 bg-gray-50/30"
                        >
                          <td className="py-4 px-4 pl-12">
                            <span className="text-sm font-medium text-gray-900">
                              {project.name}
                            </span>
                          </td>
                          <td colSpan={2} className="py-4 px-4">
                            <div className="space-y-1">
                              {Object.values(project.activities).map((activity) => (
                                <div key={activity.name} className="text-sm text-gray-600">
                                  {activity.name} ({activity.hours}h)
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <span className="text-sm font-medium text-gray-900">
                              {project.totalHours}h
                            </span>
                          </td>
                          <td colSpan={2}></td>
                          <td className="py-4 px-4 text-right">
                            <span className="text-sm font-medium text-blue-600">
                              {project.projectCost.toLocaleString("fr-FR")} USD
                            </span>
                          </td>
                          <td></td>
                        </tr>
                      ))}
                    </>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
