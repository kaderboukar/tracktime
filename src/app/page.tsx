// app/dashboard/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import { AssignedProjects } from "@/components/dashboard/AssignedProjects";
import { WorkedHours } from "@/components/dashboard/WorkedHours";
import { RecentEntries } from "@/components/dashboard/RecentEntries";
//import { AdminStats } from "@/components/dashboard/AdminStats";
import { PlusIcon } from "@heroicons/react/24/outline";
import { ProjectsStats } from "@/components/dashboard/ProjectsStats";
import { TimeSheet } from "@/components/dashboard/TimeSheet";

type User = { id: number; name: string; indice: string; role: string };
type ProjectAssignment = {
  projectId: number;
  project: { name: string; projectNumber: string };
  allocationPercentage: number | null;
};
type TimeEntry = {
  id: number;
  project: { name: string; projectNumber: string };
  activity: { name: string };
  hours: number;
  semester: string;
  year: number;
  projectId: number;
};
// type Stats = {
//   totalUsers: number;
//   totalProjects: number;
//   totalHours: number;
// };

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<ProjectAssignment[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [timeEntriesAll, setTimeEntriesAll] = useState<TimeEntry[]>([]);
  const [totalSecondaryHours, setTotalSecondaryHours] = useState<number>(0);
  const [timeSheetData, setTimeSheetData] = useState<TimeSheetEntry[]>([]);
  //const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isTimeModalOpen, setIsTimeModalOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      // Récupérer les infos de l’utilisateur connecté
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
      const assignmentsRes = await fetch("/api/assignments", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const assignmentsResponse = await assignmentsRes.json();

      if (
        assignmentsResponse.success &&
        Array.isArray(assignmentsResponse.data)
      ) {
        setProjects(assignmentsResponse.data);
      } else {
        console.error(
          "Erreur assignments:",
          assignmentsResponse.message || "Format de réponse invalide"
        );
        setProjects([]); // Définir un tableau vide en cas d'erreur
      }

      // Récupérer les entrées de temps All
      const timeEntriesAll = await fetch("/api/timeentriesAll", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const timeEntriesR = await timeEntriesAll.json();
      if (timeEntriesR.success) {
        setTimeEntriesAll(timeEntriesR.data);
        console.log("Entrées de temps All:", timeEntriesR.data);

        // Calculer les heures totales sur les projets secondaires pour le semestre actuel
        const now = new Date();
        const currentSemester = now.getMonth() < 6 ? "S1" : "S2";
        const currentYear = now.getFullYear();

        const totalHours = timeEntriesR.data.reduce(
          (sum: number, te: TimeEntry) => {
            const isCurrentPeriod =
              te.semester === currentSemester && te.year === currentYear;
            if (isCurrentPeriod) {
              return sum + te.hours;
            }
            return sum;
          },
          0
        );

        setTotalSecondaryHours(totalHours);

        // Transformer les données pour TimeSheet
        const timeSheetEntries = timeEntriesR.data.map(entry => ({
          staff: entry.user?.name || 'N/A',
          project: entry.project.name,
          activity: entry.activity.name,
          subActivity: entry.subActivity?.name || 'N/A',
          totalHours: entry.hours,
          grade: entry.user?.grade || 'N/A',
          annualProformaCost: entry.user?.annualCost || 0,
          semesterProformaCost: (entry.user?.annualCost || 0) / 2,
          projectPercentage: (entry.hours / 960) * 100, // 960 heures par semestre
          projectCost: ((entry.user?.annualCost || 0) / 2) * (entry.hours / 960)
        }));
        
        setTimeSheetData(timeSheetEntries);
      }

      // Récupérer les entrées de temps All
      const timeEntries = await fetch("/api/time-entries", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const timeEntriesResponse = await timeEntries.json();
      if (timeEntriesResponse.success) {
        setTimeEntries(timeEntriesResponse.data);
        console.log("Entrées de temps:", timeEntriesResponse.data);

        // Calculer les heures totales sur les projets secondaires pour le semestre actuel
        const now = new Date();
        const currentSemester = now.getMonth() < 6 ? "S1" : "S2";
        const currentYear = now.getFullYear();

        const totalHours = timeEntriesResponse.data.reduce(
          (sum: number, te: TimeEntry) => {
            const isCurrentPeriod =
              te.semester === currentSemester && te.year === currentYear;
            if (isCurrentPeriod) {
              return sum + te.hours;
            }
            return sum;
          },
          0
        );

        setTotalSecondaryHours(totalHours);
      }

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
                <button
                  onClick={() => setIsTimeModalOpen(true)}
                  className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl
                           hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg
                           transform hover:-translate-y-0.5"
                >
                  <PlusIcon className="w-5 h-5 mr-2" />
                  Ajouter une entrée
                </button>

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
            {/* Section Admin Stats
            {user?.role === "ADMIN" && stats && (
              <div className="mb-8">
                <AdminStats stats={stats} />
              </div>
            )} */}

            {/* Grille principale */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div
                className="group bg-white/70 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-white/50
                            hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <AssignedProjects projects={projects} />
              </div>

              <div
                className="group bg-white/70 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-white/50
                            hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <WorkedHours totalHours={totalSecondaryHours} />
              </div>
            </div>

            {/* Ajout du nouveau composant ProjectsStats */}
            {user?.role === "ADMIN" && (
              <div
                className="group bg-white/70 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-white/50
                          hover:shadow-xl transition-all duration-300"
              >
                <ProjectsStats
                  timeEntries={timeEntriesAll}
                  maxHoursPerSemester={960}
                />
              </div>
            )}

            {/* Ajout du nouveau composant TimeSheet */}
            {user?.role === "ADMIN" && (
              <div className="group bg-white/70 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-white/50
                            hover:shadow-xl transition-all duration-300">
                <TimeSheet timeEntries={timeSheetData} />
              </div>
            )}

            <div
              className="group bg-white/70 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-white/50
                          hover:shadow-xl transition-all duration-300"
            >
              <RecentEntries entries={timeEntries} />
            </div>
          </div>
        </div>
      </div>

      {/* Time Entry Modal */}
      {isTimeModalOpen && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 transform transition-all">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-6">
              Nouvelle entrée de temps
            </h2>
            {/* Insérer ici le même formulaire que dans la page time-entries */}
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setIsTimeModalOpen(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl
                         hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
              >
                Créer
              </button>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}
