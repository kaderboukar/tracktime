/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useCallback } from "react";
import {
  ChartBarIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  DocumentArrowDownIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import DigitalSignatureModal from "../DigitalSignatureModal";

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

  // États pour la signature électronique
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [selectedUserForSignature, setSelectedUserForSignature] = useState<any>(null);
  const [userSignatures, setUserSignatures] = useState<Record<string, string>>({});

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
      const exportData = filteredData.map((item: any, index: number) => ({
        'N°': index + 1,
        'Staff': item.userName,
        'Projet': item.projects.join(', '),
        'Activité & sous-activité': item.activities.join(', '),
        'Année': item.year,
        'Semestre': item.semester,
        'Heures': item.totalHours,
        'Coût Proforma (USD)': Math.round(item.userProformaCost),
        'Coût Calculé (USD)': item.totalCost && !isNaN(item.totalCost) ? Math.round(item.totalCost) : 0
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
      // Vérifier que le montant est valide
      if (isNaN(amount) || !isFinite(amount)) {
        return "0 USD";
      }
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

      // Calculer le total des coûts des activités (plus fiable)
      const totalActivitiesCost = userDetailedData.reduce((sum: number, item: any) => {
        const cost = isNaN(item.entryCalculatedCost) || !isFinite(item.entryCalculatedCost) ? 0 : item.entryCalculatedCost;
        return sum + cost;
      }, 0);

      // Ajouter le tableau
      autoTable(doc, {
        startY: 100,
        head: [['Projet', 'Activité', 'Heures', 'Coût Calculé']],
        body: tableData,
        foot: [
          ['TOTAL GÉNÉRAL', '', `${userData.totalHours}h`, formatAmount(totalActivitiesCost)]
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

      // Ajouter un résumé en bas du PDF
      const finalY = (doc as any).lastAutoTable.finalY + 10;
      
      doc.setFontSize(12);
      doc.setTextColor(66, 139, 202);
      doc.text("RÉSUMÉ", 20, finalY);
      
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(`Total des heures travaillées: ${userData.totalHours}h`, 20, finalY + 8);
      doc.text(`Coût proforma annuel: ${formatAmount(userData.userProformaCost)}`, 20, finalY + 16);
      doc.text(`Coût total calculé: ${formatAmount(totalActivitiesCost)}`, 20, finalY + 24);

      // Date et signature avec NOM DU STAFF
      const signatureY = finalY + 40;
      doc.setFontSize(10);
      const currentDate = new Date();
      const formattedDate = currentDate.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      doc.text(`Date: ${formattedDate}`, 20, signatureY);
      
      // Section signature avec nom du STAFF
      if (userSignatures[userData.userId]) {
        // STAFF a signé - afficher signature + nom
        doc.text("Signature:", 200, signatureY);
        doc.line(200, signatureY + 5, 277, signatureY + 5);
        
        try {
          // Ajouter la signature électronique
          doc.addImage(userSignatures[userData.userId], 'PNG', 200, signatureY + 10, 30, 15);
          
          // Afficher le nom du STAFF qui a signé
          doc.setFontSize(12);
          doc.setTextColor(66, 139, 202); // Bleu
          doc.text("✓ Signé électroniquement", 240, signatureY + 20);
          
          doc.setFontSize(10);
          doc.setTextColor(0, 0, 0); // Noir
          doc.text(`par: ${userData.userName}`, 240, signatureY + 30);
          doc.text(`le: ${formattedDate}`, 240, signatureY + 38);
          
          // Ajouter un cadre autour de la signature
          doc.setDrawColor(66, 139, 202);
          doc.setLineWidth(0.5);
          doc.rect(195, signatureY + 8, 85, 35);
          
        } catch (error) {
          console.error("Erreur lors de l'ajout de la signature:", error);
          // Fallback si erreur avec l'image
          doc.text("✓ Signé par: " + userData.userName, 200, signatureY + 20);
          doc.text("Date: " + formattedDate, 200, signatureY + 30);
        }
      } else {
        // STAFF n'a pas encore signé - afficher ligne de signature vide
        doc.text("Signature:", 200, signatureY);
        doc.line(200, signatureY + 5, 277, signatureY + 5);
        doc.text("(En attente de signature)", 200, signatureY + 20);
        doc.text("Nom du signataire: _________________", 200, signatureY + 30);
      }

      // Sauvegarder le PDF
      doc.save(`fiche_staff_${userData.userName}_${selectedYear}_${selectedSemester}.pdf`);
    } catch (error) {
      console.error("Erreur lors de la génération du PDF:", error);
      alert("Erreur lors de la génération du PDF. Vérifiez la console pour plus de détails.");
    }
  };

  // Fonction pour ouvrir le modal de signature
  const openSignatureModal = (userData: any) => {
    setSelectedUserForSignature(userData);
    setShowSignatureModal(true);
  };

  // Fonction pour gérer la signature
  const handleSignature = (signature: string) => {
    if (selectedUserForSignature) {
      setUserSignatures(prev => ({
        ...prev,
        [selectedUserForSignature.userId]: signature
      }));
      setShowSignatureModal(false);
      setSelectedUserForSignature(null);
    }
  };

  // Fonction pour fermer le modal de signature
  const closeSignatureModal = () => {
    setShowSignatureModal(false);
    setSelectedUserForSignature(null);
  };

  // Fonction pour vérifier si un utilisateur a signé
  const hasUserSigned = (userId: string) => {
    return !!userSignatures[userId];
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
          
          {/* Afficher les périodes disponibles */}
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
                      Heures
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
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => openSignatureModal(userData)}
                          className={`inline-flex items-center px-3 py-1.5 rounded-lg transition-all duration-200 ${
                            hasUserSigned(userData.userId)
                              ? 'bg-green-100 text-green-700 border border-green-200'
                              : 'bg-blue-100 text-blue-700 border border-blue-200 hover:bg-blue-200'
                          }`}
                        >
                          {hasUserSigned(userData.userId) ? (
                            <>
                              <CheckIcon className="w-4 h-4 mr-1" />
                              Signé
                            </>
                          ) : (
                            <>
                              <DocumentArrowDownIcon className="w-4 h-4 mr-1" />
                              Signer
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => exportUserToPDF(userData)}
                          className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg
                                   hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-md hover:shadow-md
                                   transform hover:-translate-y-0.5"
                        >
                          <DocumentArrowDownIcon className="w-4 h-4 mr-1" />
                          PDF
                        </button>
                      </div>
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

      {/* Modal de signature électronique */}
      {showSignatureModal && selectedUserForSignature && (
        <DigitalSignatureModal
          isOpen={showSignatureModal}
          onClose={closeSignatureModal}
          onSign={handleSignature}
          userName={selectedUserForSignature.userName}
          documentName={`Fiche de Temps STAFF - ${selectedUserForSignature.userName} (${selectedYear} - ${selectedSemester})`}
        />
      )}
    </div>
  );
};

export default StaffTimeSheet;
