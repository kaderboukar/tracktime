/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prefer-const */
import React, { useState } from "react";
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
  timesheetData: any[];
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

export const TimeSheet: React.FC<TimeSheetProps> = ({ timesheetData }) => {
  // Obtenir les années disponibles depuis les données
  const availableYears = [...new Set(timesheetData.map(item => item.year))].sort((a, b) => b - a);
  const currentYear = new Date().getFullYear();

  const [selectedYear, setSelectedYear] = useState(availableYears[0] || currentYear);
  const [selectedSemester, setSelectedSemester] = useState<"S1" | "S2">(
    new Date().getMonth() < 6 ? "S1" : "S2"
  );
  const [expandedUsers, setExpandedUsers] = useState<Record<string, boolean>>({});

  // Filtrer les données selon la période sélectionnée
  const filteredData = timesheetData.filter(
    item => item.year === selectedYear && item.semester === selectedSemester
  );


  const exportToExcel = () => {
    // Convertir en format CSV
    let csvContent = "Staff,Coût Proforma (USD),Total Heures,Calcul des Coûts (USD),Année,Semestre\n";

    filteredData.forEach((item) => {
      csvContent += `${item.userName},${item.userProformaCost || 0},${item.totalHours},${item.totalCost || 0},${item.year},${item.semester}\n`;
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



  const toggleUser = (userId: string) => {
    setExpandedUsers(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const exportUserToPDF = (userData: any) => {
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
    doc.text(`Nom: ${userData.userName}`, 20, 70);
    doc.text(`Grade: ${userData.userGrade || 'N/A'}`, 20, 75);
    doc.text(`Période: ${selectedYear} - ${selectedSemester}`, 20, 80);

    // Préparer les données pour le tableau
    const tableData: string[][] = [];
    let totalHours = userData.totalHours;

    const formatAmount = (amount: number) => {
      return `${Math.round(amount).toLocaleString('fr-FR', { useGrouping: false })} USD`;
    };

    // Ajouter les projets (données simplifiées)
    userData.projects.forEach((project: string, index: number) => {
      const estimatedHours = Math.round(totalHours / userData.projectsCount);
      const estimatedCost = estimatedHours * 50; // 50 USD par heure

      tableData.push([
        project,
        "Diverses activités",
        `${estimatedHours}h`,
        formatAmount(estimatedCost)
      ]);
    });

    // Ajouter le tableau
    autoTable(doc, {
      startY: 95,
      head: [['Projet', 'Activité', 'Heures', 'Coût']],
      body: tableData,
      foot: [
        ['Total', '', `${totalHours}h`, formatAmount(totalHours * 50)]
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
    doc.save(`fiche_de_temps_${userData.userName}_${selectedYear}_${selectedSemester}.pdf`);
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

      {filteredData.length === 0 ? (
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
                    Coût Proforma
                  </span>
                </th>
                <th className="pb-3 px-4 text-right">
                  <span className="text-xs font-medium text-gray-500 uppercase">
                    Total Heures
                  </span>
                </th>
                <th className="pb-3 px-4 text-right">
                  <span className="text-xs font-medium text-gray-500 uppercase">
                    Calcul des Coûts
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
              {filteredData.map((userData) => (
                <tr key={userData.userId} className="hover:bg-gray-50/50">
                  <td className="py-4 px-4">
                    <span className="text-sm font-medium text-gray-900">
                      {userData.userName}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <span className="text-sm font-medium text-blue-600">
                      {userData.userProformaCost ? `${userData.userProformaCost.toLocaleString("fr-FR")} USD` : 'N/A'}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <span className="text-sm font-medium text-gray-900">
                      {userData.totalHours}h
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <span className="text-sm font-bold text-green-600">
                      {userData.totalCost ? `${userData.totalCost.toLocaleString("fr-FR")} USD` : 'N/A'}
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
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
