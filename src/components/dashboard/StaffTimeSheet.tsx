/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useCallback } from "react";
import {
  ChartBarIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  DocumentArrowDownIcon,
} from "@heroicons/react/24/outline";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface StaffTimeSheetProps {
  staffTimesheetData: any[];
}

interface StaffTimeSheetDetail {
  id: number;
  staff: string;
  staffGrade: string;
  staffType: string;
  project: string;
  projectNumber: string;
  activity: string;
  year: number;
  semester: string;
  hours: number;
  userProformaCost: number;
  semesterCost: number;
  hourlyCost: number;
  entryCalculatedCost: number;
  comment: string;
  createdAt: string;
}

interface TimePeriod {
  id: number;
  year: number;
  semester: "S1" | "S2";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const StaffTimeSheet: React.FC<StaffTimeSheetProps> = ({ staffTimesheetData }) => {
  // États pour les périodes disponibles
  const [availablePeriods, setAvailablePeriods] = useState<TimePeriod[]>([]);
  const [isLoadingPeriods, setIsLoadingPeriods] = useState(true);

  // États pour les données filtrées
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Période active (automatique)
  const [activePeriod, setActivePeriod] = useState<TimePeriod | null>(null);

  // Utiliser la période active au lieu de la sélection manuelle
  const selectedYear = activePeriod?.year || new Date().getFullYear();
  const selectedSemester = activePeriod?.semester || (new Date().getMonth() < 6 ? "S1" : "S2");
  
  const [detailedData, setDetailedData] = useState<StaffTimeSheetDetail[]>([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // États pour la pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Pagination des données
  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  // Fonction pour récupérer les périodes disponibles
  const fetchAvailablePeriods = useCallback(async () => {
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
          setAvailablePeriods(result.data);
        }
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des périodes:", error);
    } finally {
      setIsLoadingPeriods(false);
    }
  }, []);

  // Fonction pour récupérer les données filtrées par période
  const fetchFilteredData = useCallback(async () => {
    if (!activePeriod) return; // Ne pas appeler si pas de période active
    
    setIsLoadingData(true);
    try {
      const token = localStorage.getItem("token");
      // Utiliser la période active automatiquement (pas de paramètres)
      const response = await fetch(`/api/admin/staff-timesheet`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setFilteredData(result.data);
        }
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des données filtrées:", error);
    } finally {
      setIsLoadingData(false);
    }
  }, [activePeriod]);

  // Récupérer les périodes disponibles au chargement du composant
  useEffect(() => {
    fetchAvailablePeriods();
  }, [fetchAvailablePeriods]);

  // Mettre à jour la période active quand les périodes changent (une seule fois)
  useEffect(() => {
    if (availablePeriods.length > 0 && !activePeriod) {
      const active = availablePeriods.find(period => period.isActive);
      if (active) {
        setActivePeriod(active);
        console.log(`Période active détectée: ${active.year} - ${active.semester}`);
      }
    }
  }, [availablePeriods, activePeriod]);

  // Récupérer les données filtrées quand la période active change (une seule fois)
  useEffect(() => {
    if (activePeriod) {
      fetchFilteredData();
    }
  }, [activePeriod, fetchFilteredData]);

  // Réinitialiser la page quand la période change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedYear, selectedSemester]);

  // Fonction pour récupérer les données détaillées
  const fetchDetailedData = async () => {
    setIsLoadingDetails(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/admin/staff-timesheet-details", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setDetailedData(result.data);
        }
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des données détaillées:", error);
    } finally {
      setIsLoadingDetails(false);
    }
  };



  const exportToExcel = async () => {
    try {
      console.log('Début de l\'export Excel...');
      console.log('Année sélectionnée:', selectedYear);
      console.log('Semestre sélectionné:', selectedSemester);

      // Vérifier qu'il y a des données pour la période sélectionnée
      if (filteredData.length === 0) {
        alert(`Aucune donnée trouvée pour ${selectedSemester} ${selectedYear}. Vérifiez qu'il y a des entrées de temps approuvées pour cette période.`);
        return;
      }

      // Utiliser les données filtrées déjà chargées pour l'export
      // Note: Pour l'export Excel, nous utilisons les données déjà filtrées par période
      // Si vous avez besoin des données détaillées complètes, vous pouvez les récupérer ici
      
      // Pour l'instant, utilisons les données filtrées disponibles
      const exportData = filteredData.map((item: any, index: number) => ({
        'N°': index + 1,
        'Staff': item.userName,
        'Projet': item.projects.join(', '),
        'Activité & sous-activité': item.activities.join(', '),
        'Année': item.year,
        'Semestre': item.semester,
        'Heures': item.totalHours,
        'Coût Proforma (USD)': Math.round(item.userProformaCost),
        'Coût Calculé (USD)': Math.round(item.totalCalculatedCost)
      }));

      // Import dynamique de XLSX
      const XLSX = await import('xlsx');

      console.log('Données d\'export préparées:', exportData.length);

      // Créer le workbook et la worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);

      // Ajuster la largeur des colonnes
      const colWidths = [
        { wch: 5 },   // N°
        { wch: 20 },  // Staff
        { wch: 25 },  // Projet
        { wch: 30 },  // Activité & sous-activité
        { wch: 8 },   // Année
        { wch: 10 },  // Semestre
        { wch: 8 },   // Heures
        { wch: 18 },  // Coût Proforma
        { wch: 15 }   // Coût Calculé
      ];
      ws['!cols'] = colWidths;

      // Ajouter la worksheet au workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Feuille de temps STAFF');

      // Générer le nom du fichier
      const fileName = `Feuille_temps_STAFF_${selectedYear}_${selectedSemester}_${new Date().toISOString().split('T')[0]}.xlsx`;

      console.log('Téléchargement du fichier:', fileName);

      // Télécharger le fichier
      XLSX.writeFile(wb, fileName);

      console.log('Export Excel terminé avec succès');

    } catch (error) {
      console.error('Erreur lors de l\'export Excel:', error);
      alert(`Erreur lors de l\'export Excel: ${(error as Error).message}. Veuillez réessayer.`);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const exportUserToPDF = async (userData: any) => {
    // Fonction utilitaire pour formater les montants sans problème d'affichage
    const formatAmount = (amount: number): string => {
      return `${Math.round(amount)} USD`;
    };

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    // Ajouter le logo du PNUD
    doc.addImage("/logoundp.png", "PNG", 250, 18, 25, 35);

    // En-tête avec titre stylisé
    doc.setFontSize(20);
    doc.setTextColor(66, 139, 202); // Bleu
    doc.text("FICHE DE TEMPS - STAFF", 148, 50, { align: "center" });

    // Informations de l'employé
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0); // Noir
    doc.setFontSize(10);
    doc.text(`Nom: ${userData.userName}`, 20, 70);
    doc.text(`Grade: ${userData.userGrade || 'N/A'}`, 20, 75);
    doc.text(`Période: ${selectedYear} - ${selectedSemester}`, 20, 80);
    doc.text(`Coût Proforma Annuel: ${formatAmount(userData.userProformaCost)}`, 20, 85);

    // Récupérer les données détaillées pour cet utilisateur
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/admin/staff-timesheet-details", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success || !result.data) {
        throw new Error('Aucune donnée reçue de l\'API');
      }

      // Filtrer les données pour cet utilisateur et cette période
      const userDetailedData = result.data.filter(
        (item: any) =>
          item.staff === userData.userName &&
          item.year === selectedYear &&
          item.semester === selectedSemester
      );

      // Préparer les données pour le tableau
      const tableData: string[][] = [];

      if (userDetailedData.length > 0) {
        // Utiliser les vraies données détaillées
        userDetailedData.forEach((item: any) => {
          tableData.push([
            item.project,
            item.activity,
            `${item.hours}h`,
            formatAmount(item.entryCalculatedCost)
          ]);
        });
      } else {
        // Fallback vers l'ancienne méthode si pas de données détaillées
        userData.projects.forEach((project: string) => {
          const estimatedHours = Math.round(userData.totalHours / userData.projectsCount);
          const estimatedCost = userData.hourlyCost * estimatedHours;

          tableData.push([
            project,
            "Diverses activités",
            `${estimatedHours}h`,
            formatAmount(estimatedCost)
          ]);
        });
      }

      // Ajouter le tableau
      autoTable(doc, {
        startY: 100,
        head: [['Projet', 'Activité', 'Heures', 'Coût Calculé']],
        body: tableData,
        foot: [
          ['Total', '', `${userData.totalHours}h`, formatAmount(userData.totalCalculatedCost)]
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
          0: { cellWidth: 75 },
          1: { cellWidth: 90 },
          2: { cellWidth: 35 },
          3: { cellWidth: 50 },
        },
        margin: { left: 20, right: 20 },
      });

      // Date et signature
      const tableEndY = (doc as any).lastAutoTable.finalY || 180;
      const pageHeight = (doc as any).internal.pageSize.height;
      const signatureY = Math.max(tableEndY + 20, pageHeight - 30);

      doc.setFontSize(10);
      const currentDate = new Date();
      const formattedDate = currentDate.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      doc.text(`Date: ${formattedDate}`, 20, signatureY);
      doc.text("Signature:", 200, signatureY);
      doc.line(200, signatureY + 5, 277, signatureY + 5);

      // Sauvegarder le PDF
      doc.save(`fiche_staff_${userData.userName}_${selectedYear}_${selectedSemester}.pdf`);

    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      alert('Erreur lors de la génération du PDF. Utilisation des données de base.');

      // Fallback vers l'ancienne méthode en cas d'erreur
      const tableData: string[][] = [];
      userData.projects.forEach((project: string) => {
        const estimatedHours = Math.round(userData.totalHours / userData.projectsCount);
        const estimatedCost = userData.hourlyCost * estimatedHours;

        tableData.push([
          project,
          "Diverses activités",
          `${estimatedHours}h`,
          formatAmount(estimatedCost)
        ]);
      });

      // Ajouter le tableau de fallback
      autoTable(doc, {
        startY: 100,
        head: [['Projet', 'Activité', 'Heures', 'Coût Calculé']],
        body: tableData,
        foot: [
          ['Total', '', `${userData.totalHours}h`, formatAmount(userData.totalCalculatedCost)]
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
          0: { cellWidth: 75 },
          1: { cellWidth: 90 },
          2: { cellWidth: 35 },
          3: { cellWidth: 50 },
        },
        margin: { left: 20, right: 20 },
      });

      // Date et signature
      const tableEndY = (doc as any).lastAutoTable.finalY || 180;
      const pageHeight = (doc as any).internal.pageSize.height;
      const signatureY = Math.max(tableEndY + 20, pageHeight - 30);

      doc.setFontSize(10);
      const currentDate = new Date();
      const formattedDate = currentDate.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      doc.text(`Date: ${formattedDate}`, 20, signatureY);
      doc.text("Signature:", 200, signatureY);
      doc.line(200, signatureY + 5, 277, signatureY + 5);

      // Sauvegarder le PDF
      doc.save(`fiche_staff_${userData.userName}_${selectedYear}_${selectedSemester}.pdf`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
            <ChartBarIcon className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            Feuille de Temps - STAFF
          </h2>
        </div>

        {/* Affichage de la période active et bouton d'export */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <FunnelIcon className="w-5 h-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">
              Période active : {activePeriod ? `${activePeriod.year} - ${activePeriod.semester}` : 'Chargement...'}
            </span>
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

      {isLoadingData ? (
        <div className="text-center py-8 bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Chargement des données pour {selectedSemester} {selectedYear}...</p>
        </div>
      ) : filteredData.length === 0 ? (
        <div className="text-center py-8 bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50">
          <p className="text-gray-500">Aucune donnée STAFF disponible pour cette période</p>
          <p className="text-sm text-gray-400 mt-2">
            Année: {selectedYear}, Semestre: {selectedSemester}
          </p>
          {availablePeriods.length > 0 && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700 font-medium mb-2">Périodes disponibles dans le système :</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {availablePeriods.map((period) => (
                  <span
                    key={`${period.year}-${period.semester}`}
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      period.isActive
                        ? 'bg-green-100 text-green-800 border border-green-200'
                        : 'bg-gray-100 text-gray-600 border border-gray-200'
                    }`}
                  >
                    {period.year} - {period.semester}
                    {period.isActive && (
                      <span className="ml-1 text-green-600">●</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
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
                      Coût Calculé
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
                {paginatedData.map((userData) => (
                  <tr key={userData.userId} className="hover:bg-gray-50/50">
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          STAFF
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {userData.userName}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className="text-sm font-medium text-gray-900">
                        {userData.userGrade || 'N/A'}
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
                        {userData.totalCost && !isNaN(userData.totalCost) 
                          ? `${Math.round(userData.totalCost).toLocaleString("fr-FR")} USD` 
                          : 'N/A'}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => exportUserToPDF(userData)}
                        className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg
                                 hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-sm hover:shadow-md
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 bg-white/50 backdrop-blur-xl rounded-lg border border-white/50 mt-4">
              <div className="flex items-center text-sm text-gray-700">
                <span>
                  Affichage de {startIndex + 1} à {Math.min(endIndex, totalItems)} sur {totalItems} employés
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
                          ? 'bg-green-600 text-white'
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
        </>
      )}
    </div>
  );
};

export default StaffTimeSheet;
