"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  DocumentTextIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  CalendarIcon,
  UserIcon,
  AcademicCapIcon
} from "@heroicons/react/24/outline";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import RoleBasedProtectedRoute from "@/components/RoleBasedProtectedRoute";

interface SignedTimesheet {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  userGrade: string;
  userRole: string;
  year: number;
  semester: string;
  originalPdfPath: string;
  hasSignedPdf: boolean;
  signatureDate: string | null;
  signatureStatus: "PENDING" | "SIGNED" | "EXPIRED" | "CANCELLED";
  signatureToken: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}


export default function SignedTimesheetsPage() {
  const [signedTimesheets, setSignedTimesheets] = useState<SignedTimesheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // États pour les filtres
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedSemester, setSelectedSemester] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedUser, setSelectedUser] = useState<string>("");

  // États pour la pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Récupérer les feuilles de temps signées
  const fetchSignedTimesheets = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      // Construire les paramètres de filtrage
      const params = new URLSearchParams();
      if (selectedYear) params.append("year", selectedYear);
      if (selectedSemester) params.append("semester", selectedSemester);
      if (selectedStatus) params.append("status", selectedStatus);
      if (selectedUser) params.append("userId", selectedUser);

      const response = await fetch(`/api/admin/signed-timesheets?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        setSignedTimesheets(result.data);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des feuilles de temps signées:", error);
      setError((error as Error).message);
      toast.error("Erreur lors de la récupération des données");
    } finally {
      setLoading(false);
    }
  }, [selectedYear, selectedSemester, selectedStatus, selectedUser]);

  // Télécharger le PDF signé
  const downloadSignedPdf = async (timesheetId: number, fileName: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/admin/signed-timesheets/${timesheetId}/download`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur lors du téléchargement: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("PDF téléchargé avec succès !");
    } catch (error) {
      console.error("Erreur lors du téléchargement:", error);
      toast.error("Erreur lors du téléchargement du PDF");
    }
  };

  const applyFilters = () => {
    setCurrentPage(1);
    fetchSignedTimesheets();
  };

  const resetFilters = () => {
    setSelectedYear("");
    setSelectedSemester("");
    setSelectedStatus("");
    setSelectedUser("");
    setCurrentPage(1);
  };

  useEffect(() => {
    fetchSignedTimesheets();
  }, [fetchSignedTimesheets]);

  const totalItems = signedTimesheets.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = signedTimesheets.slice(startIndex, endIndex);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "SIGNED":
        return <CheckCircleIcon className="w-5 h-5 text-green-600" />;
      case "PENDING":
        return <ClockIcon className="w-5 h-5 text-yellow-600" />;
      case "EXPIRED":
        return <XCircleIcon className="w-5 h-5 text-red-600" />;
      case "CANCELLED":
        return <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />;
      default:
        return <ClockIcon className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SIGNED":
        return "bg-green-100 text-green-800 border-green-200";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "EXPIRED":
        return "bg-red-100 text-red-800 border-red-200";
      case "CANCELLED":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "SIGNED":
        return "Signé";
      case "PENDING":
        return "En attente";
      case "EXPIRED":
        return "Expiré";
      case "CANCELLED":
        return "Annulé";
      default:
        return status;
    }
  };

  return (
    <RoleBasedProtectedRoute allowedRoles={["ADMIN", "PMSU"]}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* En-tête */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl">
                <DocumentTextIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  Feuilles de Temps Signées
                </h1>
                <p className="text-gray-600">Gestion et consultation des signatures électroniques</p>
              </div>
            </div>

          </div>

          {/* Filtres */}
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 p-6 mt-6">
            <div className="flex items-center space-x-3 mb-4">
              <FunnelIcon className="w-5 h-5 text-gray-500" />
              <h2 className="text-lg font-semibold text-gray-700">Filtres</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Filtre année */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Année
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Toutes les années</option>
                  <option value="2024">2024</option>
                  <option value="2023">2023</option>
                  <option value="2022">2022</option>
                </select>
              </div>

              {/* Filtre semestre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Semestre
                </label>
                <select
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Tous les semestres</option>
                  <option value="S1">S1 (Jan-Juin)</option>
                  <option value="S2">S2 (Juil-Déc)</option>
                </select>
              </div>

              {/* Filtre statut */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Statut
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Tous les statuts</option>
                  <option value="SIGNED">Signé</option>
                  <option value="PENDING">En attente</option>
                  <option value="EXPIRED">Expiré</option>
                  <option value="CANCELLED">Annulé</option>
                </select>
              </div>

              {/* Filtre utilisateur */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Utilisateur
                </label>
                <input
                  type="text"
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  placeholder="Rechercher par nom..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="flex items-center justify-end space-x-3 mt-4">
              <button
                onClick={resetFilters}
                className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
              >
                Réinitialiser
              </button>
              <button
                onClick={applyFilters}
                className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                Appliquer les filtres
              </button>
            </div>
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/70 backdrop-blur-xl rounded-xl shadow-lg border border-white/50 p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircleIcon className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Signées</p>
                  <p className="text-2xl font-bold text-green-600">
                    {signedTimesheets.filter(t => t.signatureStatus === "SIGNED").length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/70 backdrop-blur-xl rounded-xl shadow-lg border border-white/50 p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <ClockIcon className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">En attente</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {signedTimesheets.filter(t => t.signatureStatus === "PENDING").length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/70 backdrop-blur-xl rounded-xl shadow-lg border border-white/50 p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <XCircleIcon className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Expirées</p>
                  <p className="text-2xl font-bold text-red-600">
                    {signedTimesheets.filter(t => t.signatureStatus === "EXPIRED").length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/70 backdrop-blur-xl rounded-xl shadow-lg border border-white/50 p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <DocumentTextIcon className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {signedTimesheets.length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tableau des feuilles de temps signées */}
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 overflow-hidden mt-6">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Chargement des feuilles de temps signées...</p>
              </div>
            ) : error ? (
              <div className="p-8 text-center">
                <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-600">{error}</p>
                <button
                  onClick={fetchSignedTimesheets}
                  className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
                >
                  Réessayer
                </button>
              </div>
            ) : signedTimesheets.length === 0 ? (
              <div className="p-8 text-center">
                <DocumentTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Aucune feuille de temps signée trouvée</p>
                <p className="text-sm text-gray-400 mt-2">
                  Essayez de modifier vos filtres ou attendez que des signatures soient effectuées
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50/50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          STAFF
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Période
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Statut
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date de signature
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Expiration
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white/50 divide-y divide-gray-200/50">
                      {paginatedData.map((timesheet) => (
                        <tr key={timesheet.id} className="hover:bg-gray-50/50">
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                              <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                  <UserIcon className="w-4 h-4 text-green-600" />
                                </div>
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {timesheet.userName}
                                </div>
                                <div className="flex items-center space-x-2 text-xs text-gray-500">
                                  <AcademicCapIcon className="w-3 h-3" />
                                  <span>{timesheet.userGrade}</span>
                                  <span className="text-gray-400">•</span>
                                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                                    {timesheet.userRole}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2">
                              <CalendarIcon className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-900">
                                {timesheet.year} - {timesheet.semester}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(timesheet.signatureStatus)}
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(timesheet.signatureStatus)}`}>
                                {getStatusLabel(timesheet.signatureStatus)}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {timesheet.signatureDate ? (
                              formatDate(timesheet.signatureDate)
                            ) : (
                              <span className="text-gray-400">Non signé</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {formatDate(timesheet.expiresAt)}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2">
                              {timesheet.hasSignedPdf && timesheet.signatureStatus === "SIGNED" ? (
                                <button
                                  onClick={() => downloadSignedPdf(
                                    timesheet.id,
                                    `feuille_temps_signee_${timesheet.userName}_${timesheet.year}_${timesheet.semester}.pdf`
                                  )}
                                  className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-sm hover:shadow-md"
                                >
                                  <ArrowDownTrayIcon className="w-4 h-4 mr-1" />
                                  Télécharger
                                </button>
                              ) : (
                                <button
                                  disabled
                                  className="inline-flex items-center px-3 py-1.5 bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed"
                                >
                                  <EyeIcon className="w-4 h-4 mr-1" />
                                  Non disponible
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="bg-gray-50/50 px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-700">
                      <span>
                        Affichage de {startIndex + 1} à {Math.min(endIndex, totalItems)} sur {totalItems} feuilles de temps
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
                      <div className="flex items-center space-x-2">
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
        </div>
      </div>
    </RoleBasedProtectedRoute>
  );
}
