// app/dashboard/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import { AssignedProjects } from "@/components/dashboard/AssignedProjects";
import { WorkedHours } from "@/components/dashboard/WorkedHours";
// import { PersonalStats } from "@/components/dashboard/PersonalStats";
// import { PersonalTimeSheet } from "@/components/dashboard/PersonalTimeSheet";
// import { PersonalProgress } from "@/components/dashboard/PersonalProgress";
import { PersonalTimeEntries } from "@/components/dashboard/PersonalTimeEntries";
//import { AdminStats } from "@/components/dashboard/AdminStats";
import TimeEntryAlerts from "@/components/dashboard/TimeEntryAlerts";
import { PlusIcon, ChartBarIcon, CalendarIcon, CheckIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { ProjectsStats } from "@/components/dashboard/ProjectsStats";
import { StaffTimeSheet } from "@/components/dashboard/StaffTimeSheet";
import { ProjectAssignment } from "@/components/dashboard/types";
import TimePeriodModal from "@/components/TimePeriodModal";





interface AdminStats {
  totalProjects: number;
  activeUsers: number;
  totalHours: number;
  totalEntries: number;
}

interface StaffTimesheetData {
  userId: number;
  userName: string;
  userEmail: string;
  userGrade: string;
  userType: string;
  userRole: string;
  userProformaCost: number;
  year: number;
  semester: string;
  totalHours: number;
  totalCalculatedCost: number;
}

interface ProjectStatsData {
  projectId: number;
  projectName: string;
  projectNumber: string;
  year: number;
  semester: string;
  totalHours: number;
  entriesCount: number;
  usersCount: number;
  activitiesCount: number;
  users: string[];
  activities: string[];
  totalProformaCosts: number;
  semesterCosts: number;
  hourlyCosts: number;
  totalCalculatedCost: number;
}



type User = {
  id: number;
  name: string;
  indice: string;
  role: string;
  grade?: string;
  proformaCost?: number;
};
// type Stats = {
//   totalUsers: number;
//   totalProjects: number;
//   totalHours: number;
// };

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<ProjectAssignment[]>([]); // Projets assignés pour l'affichage
  // const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [totalSecondaryHours, setTotalSecondaryHours] = useState<number>(0);

  // Fonction pour calculer les heures en fonction de la période active
  const fetchHoursForPeriod = useCallback(async (year: number, semester: string) => {
    const token = localStorage.getItem("token");
    if (!token || !user) return;

    try {
      // SOLUTION : Utiliser l'API qui filtre par utilisateur pour éviter le cumul
      const response = await fetch(
        `/api/time-entries/semester-hours?userId=${user.id}&year=${year}&semester=${semester}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setTotalSecondaryHours(data.totalHours); // ← Heures de l'utilisateur uniquement
        } else {
          setTotalSecondaryHours(0);
        }
      } else {
        setTotalSecondaryHours(0);
      }
    } catch (error) {
      console.error("Erreur lors du calcul des heures pour la période:", error);
      setTotalSecondaryHours(0);
    }
  }, [user]);
  const [staffTimeSheetData, setStaffTimeSheetData] = useState<StaffTimesheetData[]>([]);
  const [projectStatsData, setProjectStatsData] = useState<ProjectStatsData[]>([]);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [activePeriod, setActivePeriod] = useState<{ year: number; semester: "S1" | "S2" } | null>(null);
  const [isTimePeriodModalOpen, setIsTimePeriodModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const router = useRouter();

  useEffect(() => {
    fetchData();
    fetchActivePeriod();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mettre à jour les heures quand la période active change
  useEffect(() => {
    if (activePeriod && user?.role === "STAFF") {
      fetchHoursForPeriod(activePeriod.year, activePeriod.semester);
    }
  }, [activePeriod, user, fetchHoursForPeriod]);

  useEffect(() => {
    if (user) {
      if (user.role === "ADMIN" || user.role === "PMSU") {
        fetchAdminData(); // Charger les données administratives
      }
      // Note: Les projets assignés pour STAFF sont chargés dans fetchData()
    }
  }, [user]);





  const fetchAdminData = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      // Récupérer les statistiques administratives
      const [statsResponse, projectStatsResponse, staffTimesheetResponse] =
        await Promise.all([
          fetch("/api/admin/stats", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("/api/admin/project-stats", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("/api/admin/staff-timesheet", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

      // Traiter les statistiques générales
      const statsData = await statsResponse.json();
      if (statsData.success) {
        setAdminStats(statsData.data);
      }

      // Traiter les statistiques par projet
      const projectStatsData = await projectStatsResponse.json();
      if (projectStatsData.success) {
        setProjectStatsData(projectStatsData.data);
      }

      // Traiter la feuille de temps STAFF
      const staffTimesheetData = await staffTimesheetResponse.json();
      if (staffTimesheetData.success) {
        setStaffTimeSheetData(staffTimesheetData.data);
      }
    } catch (error) {
      console.error(
        "Erreur lors du chargement des données administratives:",
        error
      );
    }
  };





  const fetchActivePeriod = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await fetch("/api/time-periods?activeOnly=true", {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          const newPeriod = {
            year: result.data.year,
            semester: result.data.semester
          };
          setActivePeriod(newPeriod);
          
          // Les heures seront mises à jour automatiquement par le useEffect
          // Pas besoin d'appeler fetchHoursForPeriod ici
        } else {
          setActivePeriod(null);
        }
      } else {
        setActivePeriod(null);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération de la période active:", error);
      setActivePeriod(null);
    }
  };

  const fetchData = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      // Récupérer les infos de l'utilisateur connecté
      const userRes = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const userResponse = await userRes.json();

      if (!userResponse.success) {
        console.error("Erreur utilisateur:", userResponse.message);
        router.push("/login");
        return;
      }

      setUser(userResponse.data);

      // Récupérer les projets assignés
      try {
        const assignmentsRes = await fetch("/api/staff/assigned-projects", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const assignmentsResponse = await assignmentsRes.json();

        if (
          assignmentsResponse.success &&
          Array.isArray(assignmentsResponse.data)
        ) {
          setProjects(assignmentsResponse.data);
        } else {
          setProjects([]);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des projets assignés:", error);
        setProjects([]);
      }

      // Les heures seront calculées après le chargement de la période active

      // Supprimer ou commenter la partie qui utilise /api/time-entries
      // const timeEntriesRes = await fetch("/api/time-entries?include=user"...
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };
  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50">
          <div className="relative group">
            {/* Cercle principal */}
            <div className="animate-spin rounded-full h-24 w-24 border-t-4 border-b-4 border-blue-600"></div>

            {/* Cercle secondaire */}
            <div className="absolute top-0 left-0 animate-ping rounded-full h-24 w-24 border-t-4 border-b-4 border-indigo-400 opacity-20"></div>

            {/* Cercle intérieur */}
            <div className="absolute top-2 left-2 animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-indigo-500"></div>

            {/* Effet de brillance */}
            <div
              className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/30 to-transparent
                          opacity-0 group-hover:opacity-100 transition-opacity duration-700"
            ></div>
          </div>

          {/* Texte de chargement avec effet de pulse */}
          <div className="mt-8 text-center">
            <p className="text-lg font-medium text-gray-700 animate-pulse">
              Chargement en cours...
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Veuillez patienter un instant
            </p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* En-tête avec effet glassmorphism */}
          <div className="relative overflow-hidden bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 p-6 mb-8">
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Tableau de bord
                </h1>
                {user && (
                  <p className="mt-2 text-gray-600">
                    Bienvenue,{" "}
                    <span className="font-medium text-gray-900">
                      {user.name}
                    </span>
                  </p>
                )}
              </div>

              <div className="flex items-center space-x-4">
                {/* Bouton "Statistiques par Projet" pour ADMIN, PMSU, MANAGEMENT */}
                {(user?.role === "ADMIN" || user?.role === "PMSU" || user?.role === "MANAGEMENT") && (
                  <button
                    onClick={() => router.push('/project-statistics')}
                    className="flex items-center px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl
                             hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-md hover:shadow-lg
                             transform hover:-translate-y-0.5"
                  >
                    <ChartBarIcon className="w-5 h-5 mr-2" />
                    Statistiques par Projet
                  </button>
                )}

                {/* Bouton "Ajouter une entrée" pour STAFF */}
                {user?.role === "STAFF" && (
                  <button
                    onClick={() => router.push('/time-entry/new')}
                    className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl
                             hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg
                             transform hover:-translate-y-0.5"
                  >
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Ajouter une entrée
                  </button>
                )}

                <div className="hidden sm:block">
                  <div className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 px-6 py-3 rounded-xl backdrop-blur-md">
                    <p className="text-sm font-medium text-blue-700">
                      {new Date().toLocaleDateString("fr-FR", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Effet de brillance */}
            <div
              className="absolute inset-0 bg-gradient-to-r from-blue-400/0 via-white/20 to-blue-400/0
                          opacity-0 group-hover:opacity-100 transition-opacity duration-700
                          -skew-x-12 -translate-x-full animate-shimmer"
            ></div>
          </div>

          <div className="grid gap-8">
            {/* Statistiques administratives pour ADMIN et PMSU */}
            {(user?.role === "ADMIN" || user?.role === "PMSU") &&
              adminStats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                  <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/50">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl">
                        <span className="text-2xl">🏢</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Total Projets
                        </p>
                        <p className="text-2xl font-bold text-gray-900">
                          {adminStats.totalProjects}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/50">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                        <span className="text-2xl">👥</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Utilisateurs Actifs
                        </p>
                        <p className="text-2xl font-bold text-gray-900">
                          {adminStats.activeUsers}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/50">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl">
                        <span className="text-2xl">⏱️</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Total Heures
                        </p>
                        <p className="text-2xl font-bold text-gray-900">
                          {adminStats.totalHours}h
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/50">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl">
                        <span className="text-2xl">📈</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Entrées Totales
                        </p>
                        <p className="text-2xl font-bold text-gray-900">
                          {adminStats.totalEntries}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            {/* Section Générer Feuille de Temps pour ADMIN et PMSU */}
            {(user?.role === "ADMIN" || user?.role === "PMSU") && (
              <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/50 mb-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl">
                      <span className="text-2xl">📋</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        Générer Feuille de Temps
                      </h3>
                      <p className="text-sm text-gray-600">
                        Exportez les feuilles de temps pour analyse et reporting
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Export Feuille de Temps STAFF */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 hover:shadow-md transition-all duration-200">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="p-2 bg-green-500 rounded-lg">
                        <span className="text-white text-lg">👥</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-green-800">Feuille STAFF</h4>
                        <p className="text-xs text-green-600">Export Excel/PDF</p>
                      </div>
                    </div>
                    <p className="text-sm text-green-700 mb-3">
                      Feuille de temps détaillée pour tous les utilisateurs STAFF avec calculs de coûts
                    </p>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          // Rediriger vers la page de génération des feuilles de temps
                          window.location.href = '/generate-timesheet';
                        }}
                        className="flex-1 bg-green-600 text-white text-sm px-3 py-2 rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Générer
                      </button>
                    </div>
                  </div>

                  {/* Export Statistiques par Projet */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 hover:shadow-md transition-all duration-200">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="p-2 bg-blue-500 rounded-lg">
                        <span className="text-white text-lg">📊</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-blue-800">Stats Projets</h4>
                        <p className="text-xs text-blue-600">Export Excel/PDF</p>
                      </div>
                    </div>
                    <p className="text-sm text-blue-700 mb-3">
                      Statistiques détaillées par projet avec analyses de coûts et performances
                    </p>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          // Rediriger vers la page de génération des feuilles de temps
                          window.location.href = '/generate-timesheet';
                        }}
                        className="flex-1 bg-blue-600 text-white text-sm px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Générer
                      </button>
                    </div>
                  </div>

                  {/* Export Feuille de Temps Globale */}
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-4 hover:shadow-md transition-all duration-200">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="p-2 bg-purple-500 rounded-lg">
                        <span className="text-white text-lg">🌍</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-purple-800">Feuille Globale</h4>
                        <p className="text-xs text-purple-600">Export Excel/PDF</p>
                      </div>
                    </div>
                    <p className="text-sm text-purple-700 mb-3">
                      Feuille de temps globale pour tous les utilisateurs avec analyses complètes
                    </p>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          // Rediriger vers la page de génération des feuilles de temps
                          window.location.href = '/generate-timesheet';
                        }}
                        className="flex-1 bg-purple-600 text-white text-sm px-3 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        Générer
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Section Consultation des Feuilles de Temps Signées pour ADMIN et PMSU */}
            {(user?.role === "ADMIN" || user?.role === "PMSU") && (
              <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/50 mb-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl">
                      <span className="text-2xl">✍️</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        Feuilles de Temps Signées
                      </h3>
                      <p className="text-sm text-gray-600">
                        Consultez et téléchargez les feuilles de temps signées électroniquement
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Consultation des Feuilles Signées */}
                  <div className="bg-gradient-to-br from-orange-50 to-red-50 border border-orange-200 rounded-xl p-4 hover:shadow-md transition-all duration-200">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="p-2 bg-orange-500 rounded-lg">
                        <span className="text-white text-lg">📋</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-orange-800">Consultation</h4>
                        <p className="text-xs text-orange-600">Voir & Télécharger</p>
                      </div>
                    </div>
                    <p className="text-sm text-orange-700 mb-3">
                      Consultez toutes les feuilles de temps signées avec filtres et statistiques
                    </p>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          // Rediriger vers la page des feuilles de temps signées
                          window.location.href = '/admin/signed-timesheets';
                        }}
                        className="flex-1 bg-orange-600 text-white text-sm px-3 py-2 rounded-lg hover:bg-orange-700 transition-colors"
                      >
                        Consulter
                      </button>
                    </div>
                  </div>

                  {/* Statistiques des Signatures */}
                  <div className="bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-200 rounded-xl p-4 hover:shadow-md transition-all duration-200">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="p-2 bg-teal-500 rounded-lg">
                        <span className="text-white text-lg">📈</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-teal-800">Statistiques</h4>
                        <p className="text-xs text-teal-600">Suivi en temps réel</p>
                      </div>
                    </div>
                    <p className="text-sm text-teal-700 mb-3">
                      Suivez l&apos;état des signatures : signées, en attente, expirées
                    </p>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          // Rediriger vers la page des feuilles de temps signées
                          window.location.href = '/admin/signed-timesheets';
                        }}
                        className="flex-1 bg-teal-600 text-white text-sm px-3 py-2 rounded-lg hover:bg-teal-700 transition-colors"
                      >
                        Voir Stats
                      </button>
                    </div>
                  </div>

                  {/* Gestion des Signatures */}
                  <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-4 hover:shadow-md transition-all duration-200">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="p-2 bg-indigo-500 rounded-lg">
                        <span className="text-white text-lg">⚙️</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-indigo-800">Gestion</h4>
                        <p className="text-xs text-indigo-600">Administration</p>
                      </div>
                    </div>
                    <p className="text-sm text-indigo-700 mb-3">
                      Gérez et administrez le processus de signature électronique
                    </p>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          // Rediriger vers la page des feuilles de temps signées
                          window.location.href = '/admin/signed-timesheets';
                        }}
                        className="flex-1 bg-indigo-600 text-white text-sm px-3 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        Gérer
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Statistiques personnelles pour STAFF */}
            {user?.role === "STAFF" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
                <div className="bg-white/70 backdrop-blur-xl rounded-lg p-3 shadow-sm border border-white/50">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                      <span className="text-lg">👤</span>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-600">
                        Grade
                      </p>
                      <p className="text-lg font-bold text-gray-900">
                        {user.grade || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/70 backdrop-blur-xl rounded-lg p-3 shadow-sm border border-white/50">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                      <span className="text-lg">📊</span>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-600">
                        Projets
                      </p>
                      <p className="text-lg font-bold text-gray-900">
                        {projects.length}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/70 backdrop-blur-xl rounded-lg p-3 shadow-sm border border-white/50">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
                      <span className="text-lg">💰</span>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-600">
                        Proforma
                      </p>
                      <p className="text-sm font-bold text-gray-900">
                        {user.proformaCost
                          ? `${user.proformaCost.toLocaleString("fr-FR")} USD`
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Grille principale - Uniquement pour STAFF */}
            {user?.role === "STAFF" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

                <div
                  className="bg-white/70 backdrop-blur-xl p-3 rounded-lg shadow-sm border border-white/50
                              hover:shadow-md transition-all duration-200"
                >
                  <AssignedProjects projects={projects} activePeriod={activePeriod} />
                </div>

                <div
                  className="bg-white/70 backdrop-blur-xl p-3 rounded-lg shadow-sm border border-white/50
                              hover:shadow-md transition-all duration-200"
                >
                  <WorkedHours totalHours={totalSecondaryHours} activePeriod={activePeriod} />
                </div>
              </div>
            )}

            {/* Composants administratifs pour ADMIN et PMSU */}
            {(user?.role === "ADMIN" || user?.role === "PMSU") && (
              <>
                <div
                  className="group bg-white/70 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-white/50
                            hover:shadow-xl transition-all duration-300"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Gestion des Périodes de Saisie</h3>
                    <button
                      onClick={() => setIsTimePeriodModalOpen(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
                    >
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      Gérer les Périodes
                    </button>
                  </div>
                  
                  {activePeriod ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <CheckIcon className="h-5 w-5 text-green-600 mr-2" />
                          <div>
                            <p className="text-sm text-green-800">
                              Période active : <span className="font-semibold">{activePeriod.year} - {activePeriod.semester}</span>
                            </p>
                            <p className="text-xs text-green-600">
                              Les utilisateurs STAFF peuvent saisir leurs heures
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-green-600">
                            {activePeriod.semester === 'S1' ? 'Janvier - Juin' : 'Juillet - Décembre'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <XMarkIcon className="h-5 w-5 text-yellow-600 mr-2" />
                        <div>
                          <p className="text-sm text-yellow-800">
                            Aucune période active
                          </p>
                          <p className="text-xs text-yellow-600">
                            Créez une période active pour permettre la saisie
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Modal pour la gestion des périodes */}
                <TimePeriodModal
                  isOpen={isTimePeriodModalOpen}
                  onClose={() => setIsTimePeriodModalOpen(false)}
                  userRole={user?.role || 'STAFF'}
                  onPeriodChange={fetchActivePeriod}
                />

                <div
                  className="group bg-white/70 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-white/50
                            hover:shadow-xl transition-all duration-300"
                >
                  <ProjectsStats
                    projectStats={projectStatsData}
                    maxHoursPerSemester={960}
                  />
                </div>

                <div
                  className="group bg-white/70 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-white/50
                              hover:shadow-xl transition-all duration-300"
                >
                  <StaffTimeSheet staffTimesheetData={staffTimeSheetData} />
                </div>

                <div
                  className="group bg-white/70 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-white/50
                              hover:shadow-xl transition-all duration-300"
                >
                  <TimeEntryAlerts />
                </div>
              </>
            )}

            {/* Composants spécifiques aux utilisateurs STAFF */}
            {user?.role === "STAFF" && (
              <>
                {/* <div
                  className="group bg-white/70 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-white/50
                            hover:shadow-xl transition-all duration-300"
                >
                  <PersonalStats timeEntries={timeEntries} user={user} />
                </div>

                <div
                  className="group bg-white/70 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-white/50
                            hover:shadow-xl transition-all duration-300"
                >
                  <PersonalTimeSheet timeEntries={timeEntries} user={user} />
                </div>

                <div
                  className="group bg-white/70 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-white/50
                            hover:shadow-xl transition-all duration-300"
                >
                  <PersonalProgress timeEntries={timeEntries} />
                </div> */}

                <div
                  className="group bg-white/70 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-white/50
                            hover:shadow-xl transition-all duration-300"
                >
                  <PersonalTimeEntries userId={user.id} />
                </div>
              </>
            )}

            {/* <div
              className="group bg-white/70 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-white/50
                          hover:shadow-xl transition-all duration-300"
            >
             <RecentEntries entries={timeEntries} />
            </div> */}
          </div>
        </div>
      </div>


    </ProtectedRoute>
  );
}
