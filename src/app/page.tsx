// app/dashboard/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import { AssignedProjects } from "@/components/dashboard/AssignedProjects";
import { WorkedHours } from "@/components/dashboard/WorkedHours";
import { PersonalStats } from "@/components/dashboard/PersonalStats";
import { PersonalTimeSheet } from "@/components/dashboard/PersonalTimeSheet";
import { PersonalProgress } from "@/components/dashboard/PersonalProgress";
import { PersonalTimeEntries } from "@/components/dashboard/PersonalTimeEntries";
//import { AdminStats } from "@/components/dashboard/AdminStats";
import { PlusIcon } from "@heroicons/react/24/outline";
import { ProjectsStats } from "@/components/dashboard/ProjectsStats";
import { StaffTimeSheet } from "@/components/dashboard/StaffTimeSheet";
import { TimeEntry, ProjectAssignment } from "@/components/dashboard/types";
import CreateTimeEntryModal from "@/components/CreateTimeEntryModal";

interface Project {
  id: number;
  name: string;
  projectNumber: string;
  staffAccess: string;
}



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
  const [allProjects, setAllProjects] = useState<Project[]>([]); // Tous les projets pour le modal
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [totalSecondaryHours, setTotalSecondaryHours] = useState<number>(0);
  const [staffTimeSheetData, setStaffTimeSheetData] = useState<StaffTimesheetData[]>([]);
  const [projectStatsData, setProjectStatsData] = useState<ProjectStatsData[]>([]);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isTimeModalOpen, setIsTimeModalOpen] = useState(false);

  // États pour le modal de création d'entrée de temps
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [activities, setActivities] = useState<any[]>([]);
  const [parentActivity, setParentActivity] = useState<number | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [childActivities, setChildActivities] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    id: undefined,
    userId: 0,
    projectId: 0,
    activityId: 0,
    hours: 0,
    semester: new Date().getMonth() < 6 ? ("S1" as const) : ("S2" as const),
    year: new Date().getFullYear(),
    comment: "",
  });

  const router = useRouter();

  useEffect(() => {
    fetchData();
    fetchActivities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({ ...prev, userId: user.id }));
      if (user.role === "STAFF") {
        fetchAvailableProjects(user.id); // Charger les projets disponibles pour STAFF
      } else if (user.role === "ADMIN" || user.role === "PMSU") {
        fetchAdminData(); // Charger les données administratives
      }
    }
  }, [user]);

  const fetchActivities = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await fetch("/api/activities", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (Array.isArray(data)) {
        setActivities(data);
      } else {
        console.error("Format de données invalide pour les activités");
      }
    } catch (error) {
      console.error("Erreur lors du chargement des activités:", error);
    }
  };

  const fetchAvailableProjects = async (userId: number) => {
    const token = localStorage.getItem("token");
    if (!token || !userId) return;

    try {
      // Utiliser l'API qui récupère tous les projets SAUF ceux assignés à l'utilisateur
      const response = await fetch(`/api/projects/users/${userId}/secondary`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        setAllProjects(data.data);
      } else {
        console.error(
          "Format de données invalide pour les projets disponibles"
        );
        setAllProjects([]);
      }
    } catch (error) {
      console.error(
        "Erreur lors du chargement des projets disponibles:",
        error
      );
      setAllProjects([]);
    }
  };

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

  const handleParentActivityChange = (activityId: number) => {
    setParentActivity(activityId);
    const children = activities.filter(
      (activity) => activity.parentId === activityId
    );
    setChildActivities(children);
    setFormData((prev) => ({ ...prev, activityId: 0 }));
  };

  const handleFormChange = (
    field: keyof typeof formData,
    value: number | string
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      // Préparer les données à envoyer
      const submitData = {
        ...formData,
        // Si pas de sous-activités sélectionnées, utiliser l'activité parente
        activityId: formData.activityId || parentActivity,
      };

      const response = await fetch("/api/time-entries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(submitData),
      });

      const data = await response.json();
      if (data.success) {
        setIsTimeModalOpen(false);
        fetchData(); // Recharger les données
        // Reset form
        setFormData({
          id: undefined,
          userId: user?.id || 0,
          projectId: 0,
          activityId: 0,
          hours: 0,
          semester: new Date().getMonth() < 6 ? "S1" : "S2",
          year: new Date().getFullYear(),
          comment: "",
        });
        setParentActivity(null);
        setChildActivities([]);
      } else {
        console.error("Erreur lors de la création:", data.message);
        alert("Erreur lors de la création de l'entrée: " + data.message);
      }
    } catch (error) {
      console.error("Erreur lors de la soumission:", error);
      alert("Erreur lors de la soumission");
    }
  };

  // Calculer les heures restantes
  const remainingHours = 480 - totalSecondaryHours;

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
      const timeEntriesAll = await fetch("/api/time-entries", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const timeEntriesR = await timeEntriesAll.json();
      if (timeEntriesR.success) {

        // Calculer les heures totales sur les projets secondaires pour le semestre actuel
        const now = new Date();
        const currentSemester = now.getMonth() < 6 ? "S1" : "S2";
        const currentYear = now.getFullYear();

        // Récupérer les entrées pour l'année et le semestre actuels
        const filteredEntries = await fetch(
          `/api/time-entries?year=${currentYear}&semester=${currentSemester}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const filteredResponse = await filteredEntries.json();

        if (filteredResponse.success) {
          // setTimeSheetData supprimé car plus utilisé
        }

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
      }

      // Récupérer les entrées de temps All
      const timeEntries = await fetch("/api/time-entries", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const timeEntriesResponse = await timeEntries.json();
      if (timeEntriesResponse.success) {
        setTimeEntries(timeEntriesResponse.data);

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
                {/* Bouton "Ajouter une entrée" uniquement pour STAFF */}
                {user?.role === "STAFF" && (
                  <button
                    onClick={() => setIsTimeModalOpen(true)}
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

            {/* Statistiques personnelles pour STAFF */}
            {user?.role === "STAFF" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/50">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                      <span className="text-2xl">👤</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Mon Grade
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {user.grade || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/50">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl">
                      <span className="text-2xl">📊</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Projets Actifs
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {projects.length}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/50">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl">
                      <span className="text-2xl">💰</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Coût Proforma
                      </p>
                      <p className="text-lg font-bold text-gray-900">
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
            )}

            {/* Composants administratifs pour ADMIN et PMSU */}
            {(user?.role === "ADMIN" || user?.role === "PMSU") && (
              <>
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
              </>
            )}

            {/* Composants spécifiques aux utilisateurs STAFF */}
            {user?.role === "STAFF" && (
              <>
                <div
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
                </div>

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

      {/* Time Entry Modal - Uniquement pour STAFF */}
      {user?.role === "STAFF" && (
        <CreateTimeEntryModal
          isOpen={isTimeModalOpen}
          onClose={() => setIsTimeModalOpen(false)}
          formData={formData}
          onSubmit={handleSubmit}
          onChange={handleFormChange}
          projects={allProjects.map((p) => ({
            id: p.id,
            name: p.name,
            projectNumber: p.projectNumber,
          }))}
          activities={activities}
          remainingHours={remainingHours}
          editMode={false}
          parentActivity={parentActivity}
          childActivities={childActivities}
          onParentActivityChange={handleParentActivityChange}
        />
      )}
    </ProtectedRoute>
  );
}
