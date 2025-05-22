// app/time-entries/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Toaster, toast } from 'sonner';
import { ClockIcon, PencilIcon, TrashIcon, EyeIcon, PlusIcon } from '@heroicons/react/24/outline';
import { MAX_HOURS_PER_SEMESTER } from '@/lib/constants';
import Navbar from "@/components/Navbar";
import ViewTimeEntryModal from "@/components/ViewTimeEntryModal";
import ConfirmationModal from "@/components/ConfirmationModal";
import CreateTimeEntryModal from "@/components/CreateTimeEntryModal";
import RoleBasedProtectedRoute from "@/components/RoleBasedProtectedRoute";

const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case 'APPROVED':
      return 'bg-green-50 text-green-700 border-green-200';
    case 'REJECTED':
      return 'bg-red-50 text-red-700 border-red-200';
    case 'REVISED':
      return 'bg-orange-50 text-orange-700 border-orange-200';
    default:
      return 'bg-blue-50 text-blue-700 border-blue-200';
  }
};

const getStatusTranslation = (status: string) => {
  switch (status) {
    case 'APPROVED':
      return 'Approuvé';
    case 'REJECTED':
      return 'Rejeté';
    case 'REVISED':
      return 'En révision';
    default:
      return 'En attente';
  }
};

interface FormData {
  id?: number;
  userId: number;
  projectId: number;
  activityId: number;
  hours: number;
  semester: "S1" | "S2";
  year: number;
  comment?: string;
}

interface TimeEntry {
  id: number;
  userId: number;
  projectId: number;
  activityId: number;
  hours: number;
  semester: "S1" | "S2";
  year: number;
  startDate?: string;
  endDate?: string;
  status?: 'APPROVED' | 'REJECTED' | 'REVISED' | 'PENDING';
  comment?: string;
  user: { name: string; indice: string };
  project: { name: string; projectNumber: string };
  activity: { name: string };
  validationHistory?: ValidationHistory[];
}

interface ValidationHistory {
  status: 'APPROVED' | 'REJECTED' | 'REVISED' | 'PENDING';
  comment?: string;
  createdAt: string;
  validator: {
    name: string;
    indice: string;
  };
}

interface TimeEntryWithDetails extends TimeEntry {
  user: {
    name: string;
    indice: string;
    grade?: string;
    proformaCost?: number;
  };
}

interface Project {
  id: number;
  name: string;
  projectNumber: string;
}

interface Activity {
  id: number;
  name: string;
  parentId: number | null;
  children?: Activity[];
}

interface YearSemester {
  year: number;
  semester: "S1" | "S2";
}

export default function TimeEntriesPage() {
  const initializeFormData = () => ({
    userId: 0,
    projectId: 0,
    activityId: 0,
    hours: 0,
    semester: new Date().getMonth() < 6 ? "S1" : "S2" as "S1" | "S2",
    year: new Date().getFullYear(),
  });

  // États essentiels
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [userRole, setUserRole] = useState<string>("");
  const [deleteTimeEntryId, setDeleteTimeEntryId] = useState<number | null>(null);
  const [selectedTimeEntry, setSelectedTimeEntry] = useState<TimeEntryWithDetails | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const router = useRouter();
  const [remainingHours, setRemainingHours] = useState<number>(MAX_HOURS_PER_SEMESTER);
  const [currentYear] = useState(new Date().getFullYear());
  const [currentSemester] = useState<"S1" | "S2">(new Date().getMonth() < 6 ? "S1" : "S2");
  const [formData, setFormData] = useState<FormData>(initializeFormData());
  const [existingYearSemesters, setExistingYearSemesters] = useState<YearSemester[]>([]);

  // Fonction pour vérifier si une combinaison année/semestre est déjà enregistrée
  const isYearSemesterRegistered = (year: number, semester: "S1" | "S2") => {
    return existingYearSemesters.some(ys => 
      ys.year === year && ys.semester === semester
    );
  };

  // Fonction pour vérifier si une combinaison année/semestre est valide
  const isValidYearSemester = (year: number, semester: "S1" | "S2") => {
    // Vérifier si l'année est future
    if (year > currentYear) return true;
    
    // Si c'est l'année en cours
    if (year === currentYear) {
      // Pour l'année en cours, autoriser seulement le semestre actuel et futur
      if (semester === "S1") return currentSemester === "S1";
      if (semester === "S2") return true; // S2 est toujours valide pour l'année en cours
    }
    
    return false;
  };

  // Fonction pour obtenir le message d'erreur approprié
  const getYearSemesterError = (year: number, semester: "S1" | "S2") => {
    if (year < currentYear) {
      return "Vous ne pouvez pas sélectionner une année antérieure à l'année en cours";
    }
    
    if (year === currentYear && semester === "S1" && currentSemester === "S2") {
      return "Le premier semestre de l'année en cours n'est plus disponible";
    }

    if (isYearSemesterRegistered(year, semester)) {
      return "La periode " + year + "-" + semester + " a deja ete enregistree";
    }

    return "";
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTimeEntries = timeEntries.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(timeEntries.length / itemsPerPage);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  useEffect(() => {
    const initializePage = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/login");
          return;
        }

        const meResponse = await fetch("/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const userData = await meResponse.json();

        if (!userData.success || !userData.data) {
          console.error("Erreur de réponse auth/me:", userData);
          router.push("/login");
          return;
        }

        const userId = userData.data.id;
        setFormData((prev) => ({ ...prev, userId }));
        setUserRole(userData.data.role);

        await fetchTimeEntries();
        await fetchSecondaryProjects(userId);
        await fetchActivities();
        await fetchRemainingHours(userId, currentSemester, currentYear);
      } catch (error) {
        console.error("Erreur lors de l'initialisation:", error);
        showNotification("Erreur lors du chargement des données", 'error');
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    initializePage();
  }, [router, currentSemester, currentYear]);

  const fetchTimeEntries = async () => {
    try {
      const token = localStorage.getItem("token");
      console.log("Fetching time entries...");
      const res = await fetch("/api/time-entries", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      console.log("Time entries received:", data);

      if (data.success) {
        setTimeEntries(data.data);
      } else {
        console.error(
          "Erreur lors de la récupération des entrées:",
          data.message
        );
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des entrées:", error);
    }
  };

  const fetchSecondaryProjects = async (userId: number) => {
    try {
      const token = localStorage.getItem("token");
      if (!token || !userId) return;

      const res = await fetch(`/api/projects/users/${userId}/secondary`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setProjects(data.data);
      } else {
        console.error("Format de données invalide pour les projets");
        setProjects([]);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des projets:", error);
      setProjects([]);
    }
  };

  const fetchActivities = async () => {
    const token = localStorage.getItem("token");
    const res = await fetch("/api/activities", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (res.ok) {
      // Organiser les activités en hiérarchie
      const parentActivities = data.filter(
        (act: Activity) => act.parentId === null
      );
      const childActs = data.filter((act: Activity) => act.parentId !== null);

      parentActivities.forEach((parent: Activity) => {
        parent.children = childActs.filter(
          (child: Activity) => child.parentId === parent.id
        );
      });

      setActivities(parentActivities);
    }
  };

  const fetchRemainingHours = async (userId: number, semester: string, year: number) => {
    try {
      const token = localStorage.getItem("token");
      const existingEntries = await fetch(`/api/time-entries/remaining?userId=${userId}&semester=${semester}&year=${year}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await existingEntries.json();
      if (data.success) {
        setRemainingHours(data.remainingHours);
      }
    } catch (error) {
      console.error("Erreur lors du calcul des heures restantes:", error);
    }
  };

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    if (type === 'success') {
      toast.success(message, {
        duration: 4000,
        position: 'top-right',
      });
    } else {
      toast.error(message, {
        duration: 4000,
        position: 'top-right',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token");
      const method = editMode ? "PUT" : "POST";

      const submitData = {
        ...formData,
        ...(editMode && selectedTimeEntry ? { id: selectedTimeEntry.id } : {}),
      };

      const res = await fetch("/api/time-entries", {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(submitData),
      });

      const data = await res.json();

      if (res.ok) {
        showNotification(
          editMode
            ? "Entrée de temps mise à jour avec succès"
            : "Entrée de temps créée avec succès",
          'success'
        );
        setFormData(initializeFormData());
        setEditMode(false);
        setIsCreateModalOpen(false);
        fetchTimeEntries();
        fetchRemainingHours(formData.userId, formData.semester, formData.year);
      } else {
        showNotification(data.message || "Une erreur est survenue", 'error');
      }
    } catch (error) {
      console.error("Erreur lors de la soumission:", error);
      showNotification("Erreur lors de la communication avec le serveur", 'error');
    }
  };

  const handleFormChange = (field: keyof FormData, value: number | string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  useEffect(() => {
    if (formData.userId && formData.semester && formData.year) {
      fetchRemainingHours(formData.userId, formData.semester, formData.year);
    }
  }, [formData.userId, formData.semester, formData.year]);

  // Modification des fonctions de validation pour utiliser Sonner
  const validateHours = (hours: number) => {
    if (hours <= 0) {
      toast.error("Le nombre d'heures doit être supérieur à 0");
      return false;
    }
    if (hours > remainingHours) {
      toast.error(`Vous ne pouvez pas dépasser ${remainingHours} heures disponibles pour ce semestre`);
      return false;
    }
    return true;
  };

  const handleHoursChange = (value: number) => {
    if (value > remainingHours) {
      toast.error(`Vous ne pouvez pas dépasser ${remainingHours} heures disponibles pour ce semestre`);
      return;
    }
    setFormData({
      ...formData,
      hours: value,
    });
  };

  // Mise à jour de la validation du semestre
  const handleSemesterChange = (newSemester: "S1" | "S2") => {
    const error = getYearSemesterError(formData.year, newSemester);
    if (error) {
      toast.error(error);
      return;
    }
    
    setFormData({
      ...formData,
      semester: newSemester,
    });
    fetchRemainingHours(formData.userId, newSemester, formData.year);
  };

  // Mise à jour de la validation de l'année
  const handleYearChange = (newYear: number) => {
    if (newYear < currentYear) {
      toast.error("Vous ne pouvez pas sélectionner une année antérieure à l'année en cours");
      return;
    }

    const error = getYearSemesterError(newYear, formData.semester);
    if (error) {
      toast.error(error);
      return;
    }

    setFormData({
      ...formData,
      year: newYear,
      semester: isValidYearSemester(newYear, formData.semester) 
        ? formData.semester 
        : (newYear === currentYear ? currentSemester : "S1") as "S1" | "S2",
    });
  };

  const handleEdit = async (timeEntry: TimeEntry) => {
    if (!["ADMIN", "PMSU"].includes(userRole)) {
      showNotification("Vous n'avez pas les permissions nécessaires pour modifier les entrées", 'error');
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Token non trouvé");
      }

      setSelectedTimeEntry(timeEntry as TimeEntryWithDetails);
      setFormData({
        id: timeEntry.id,
        userId: timeEntry.userId,
        projectId: timeEntry.projectId,
        activityId: timeEntry.activityId,
        hours: timeEntry.hours,
        semester: timeEntry.semester,
        year: timeEntry.year,
        comment: timeEntry.comment
      });
      setEditMode(true);
      setIsViewModalOpen(true);

    } catch (error) {
      console.error("Erreur lors de la modification:", error);
      showNotification("Erreur lors de la récupération des données", 'error');
    }
  };

  const handleDelete = (id: number) => {
    setDeleteTimeEntryId(id);
  };

  const confirmDelete = async () => {
    if (!deleteTimeEntryId) return;

    const token = localStorage.getItem("token");
    const res = await fetch("/api/time-entries", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ id: deleteTimeEntryId }),
    });
    const data = await res.json();

    if (res.ok) {
      showNotification("Entrée de temps supprimée avec succès", 'success');
      fetchTimeEntries();
    } else {
      showNotification(data.message || "Erreur lors de la suppression", 'error');
    }
    setDeleteTimeEntryId(null);
  };

  const fetchUserProjects = async (userId: number) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/projects/users/${userId}/secondary`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setProjects(data);
      } else {
        console.error(
          "Erreur lors de la récupération des projets de l'utilisateur:",
          data
        );
      }
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des projets de l'utilisateur:",
        error
      );
    }
  };

  const openCreateModal = async () => {
    const token = localStorage.getItem("token");
    try {
      const meResponse = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const userData = await meResponse.json();

      if (!userData.success || !userData.data) {
        throw new Error("Impossible de récupérer l'utilisateur");
      }

      const userId = userData.data.id;
      await fetchUserProjects(userId);

      setEditMode(false);
      setFormData({
        ...initializeFormData(),
        userId,
      });
      setIsCreateModalOpen(true);

    } catch (error) {
      showNotification("Erreur lors de la récupération de l'utilisateur", 'error');
      console.error(error);
    }
  };

  const handleParentActivityChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  )  => {
    const parentId = parseInt(e.target.value);
    setParentActivity(parentId);
    const parent = activities.find((a) => a.id === parentId);
    setChildActivities(parent?.children || []);
    setFormData({
      ...formData,
      activityId: 0, // Réinitialiser l'activité sélectionnée
    });
  };

  const filterProjects = (query: string) => {
    if (!Array.isArray(projects)) {
      setFilteredProjects([]);
      return;
    }
    
    const filtered = projects.filter(project => 
      project.name.toLowerCase().includes(query.toLowerCase()) ||
      project.projectNumber.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredProjects(filtered);
  };

  // Fonction pour récupérer les années et semestres existants
  const fetchExistingYearSemesters = async (userId: number) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/time-entries/years-semesters/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setExistingYearSemesters(data.data);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des années/semestres:", error);
    }
  };

  useEffect(() => {
    if (formData.userId) {
      fetchExistingYearSemesters(formData.userId);
    }
  }, [formData.userId]);

  if (loading) {
    return (
      <RoleBasedProtectedRoute allowedRoles={["ADMIN", "PMSU"]}>
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50">
          <div className="relative group">
            <div className="animate-spin rounded-full h-24 w-24 border-t-4 border-b-4 border-blue-600"></div>
            <div className="absolute top-0 left-0 animate-ping rounded-full h-24 w-24 border-t-4 border-b-4 border-indigo-400 opacity-20"></div>
            <div className="absolute top-2 left-2 animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-indigo-500"></div>
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
          </div>
          <div className="mt-8 text-center">
            <p className="text-lg font-medium text-gray-700 animate-pulse">
              Chargement en cours...
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Veuillez patienter un instant
            </p>
          </div>
        </div>
      </RoleBasedProtectedRoute>
    );
  }

  const renderActionButtons = (entry: TimeEntry) => {
    const canEdit = ["ADMIN", "PMSU"].includes(userRole);

    return (
      <div className="flex items-center space-x-2">
        <button
          onClick={() => {
            setSelectedTimeEntry(entry as TimeEntryWithDetails);
            setIsViewModalOpen(true);
          }}
          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
          title="Voir les détails"
        >
          <EyeIcon className="w-5 h-5" />
        </button>
        {canEdit && (
          <>
            <button
              onClick={() => handleEdit(entry)}
              className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors duration-200"
              title="Modifier l'entrée"
            >
              <PencilIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => handleDelete(entry.id)}
              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
              title="Supprimer l'entrée"
            >
              <TrashIcon className="w-5 h-5" />
            </button>
          </>
        )}
      </div>
    );
  };

  const renderValidationButtons = (entry: TimeEntry) => {
    if (!["ADMIN", "PMSU"].includes(userRole)) return null;
    if (entry.status === 'APPROVED') return null;

    return (
      <div className="flex items-center space-x-2 mt-2">
        <button
          onClick={() => handleValidation(entry.id, 'APPROVED')}
          className="px-2 py-1 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors duration-200"
        >
          Approuver
        </button>
        <button
          onClick={() => handleValidation(entry.id, 'REJECTED')}
          className="px-2 py-1 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors duration-200"
        >
          Rejeter
        </button>
        <button
          onClick={() => handleValidation(entry.id, 'REVISED')}
          className="px-2 py-1 text-xs font-medium text-orange-700 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors duration-200"
        >
          Demander révision
        </button>
      </div>
    );
  };

  const handleValidation = async (entryId: number, newStatus: 'APPROVED' | 'REJECTED' | 'REVISED') => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/time-entries`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: entryId,
          status: newStatus,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showNotification(
          `L'entrée de temps a été ${getStatusTranslation(newStatus).toLowerCase()} avec succès`,
          'success'
        );
        fetchTimeEntries();
      } else {
        showNotification(data.message || "Erreur lors de la validation", 'error');
      }
    } catch (error) {
      console.error("Erreur lors de la validation:", error);
      showNotification("Erreur lors de la validation", 'error');
    }
  };

  return (
    <RoleBasedProtectedRoute allowedRoles={["ADMIN", "PMSU"]}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50">
        <Toaster richColors closeButton position="top-right" />
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* En-tête avec statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total des entrées</p>
                  <p className="text-2xl font-bold text-gray-900">{timeEntries.length}</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-xl">
                  <ClockIcon className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total des heures</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {timeEntries.reduce((sum, entry) => sum + entry.hours, 0)} h
                  </p>
                </div>
                <div className="p-3 bg-green-50 rounded-xl">
                  <ClockIcon className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Restant disponible</p>
                  <p className="text-2xl font-bold text-gray-900">{remainingHours} h</p>
                </div>
                <div className="p-3 bg-indigo-50 rounded-xl">
                  <ClockIcon className="w-6 h-6 text-indigo-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Header principal */}
          <div className="relative overflow-hidden bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 p-6 mb-8">
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                  <ClockIcon className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Gestion des Entrées de Temps
                </h1>
              </div>
              <button
                onClick={openCreateModal}
                className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl
                         hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg
                         transform hover:-translate-y-0.5"
              >
                <PlusIcon className="w-5 h-5 mr-2" />
                Nouvelle Entrée
              </button>
            </div>
          </div>

          {/* Tableau des entrées */}
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="px-6 py-4 text-left">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Utilisateur</span>
                    </th>
                    <th className="px-6 py-4 text-left">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Projet</span>
                    </th>
                    <th className="px-6 py-4 text-left">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Activité</span>
                    </th>
                    <th className="px-6 py-4 text-left">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Période</span>
                    </th>
                    <th className="px-6 py-4 text-left">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Heures</span>
                    </th>
                    <th className="px-6 py-4 text-left">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</span>
                    </th>
                    <th className="px-6 py-4 text-left">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {currentTimeEntries.map((entry) => (
                    <tr key={entry.id} className="group hover:bg-gray-50/50 transition-colors duration-200">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="font-medium text-blue-600">
                              {entry.user.name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{entry.user.name}</p>
                            <p className="text-xs text-gray-500">{entry.user.indice}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{entry.project.name}</p>
                          <p className="text-xs text-gray-500">{entry.project.projectNumber}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                          {entry.activity.name}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <span className="text-sm font-medium text-gray-900">{entry.semester}</span>
                          <span className="text-sm text-gray-500 ml-1">{entry.year}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">
                          {entry.hours}h
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col space-y-2">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusBadgeClass(entry.status || 'PENDING')}`}>
                            {getStatusTranslation(entry.status || 'PENDING')}
                          </span>
                          {entry.comment && (
                            <span className="text-xs text-gray-500 max-w-xs truncate" title={entry.comment}>
                              {entry.comment}
                            </span>
                          )}
                          {renderValidationButtons(entry)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {renderActionButtons(entry)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50">
              <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
                <p className="text-sm text-gray-600">
                  Affichage de {indexOfFirstItem + 1} à {Math.min(indexOfLastItem, timeEntries.length)} sur {timeEntries.length} entrées
                </p>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200
                              ${currentPage === 1
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"}`}
                  >
                    Précédent
                  </button>
                  
                  {[...Array(totalPages)].map((_, index) => {
                    const pageNumber = index + 1;
                    const isCurrentPage = currentPage === pageNumber;
                    const isNearCurrent = Math.abs(currentPage - pageNumber) <= 1;
                    const isFirstOrLast = pageNumber === 1 || pageNumber === totalPages;
                    
                    if (isNearCurrent || isFirstOrLast) {
                      return (
                        <button
                          key={pageNumber}
                          onClick={() => handlePageChange(pageNumber)}
                          className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200
                                    ${isCurrentPage
                              ? "bg-blue-600 text-white"
                              : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"}`}
                        >
                          {pageNumber}
                        </button>
                      );
                    } else if (isNearCurrent && (index === 1 || index === totalPages - 2)) {
                      return <span key={`ellipsis-${index}`} className="px-2">...</span>;
                    }
                    return null;
                  })}

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200
                              ${currentPage === totalPages
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"}`}
                  >
                    Suivant
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modals */}
        <CreateTimeEntryModal 
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          formData={formData}
          onSubmit={handleSubmit}
          onChange={handleFormChange}
          projects={projects}
          activities={activities}
          remainingHours={remainingHours}
          editMode={editMode}
        />
        
        <ViewTimeEntryModal
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          timeEntry={selectedTimeEntry ? {
            ...selectedTimeEntry,
            status: selectedTimeEntry.status || 'PENDING'
          } : null}
        />

        <ConfirmationModal
          isOpen={deleteTimeEntryId !== null}
          onClose={() => setDeleteTimeEntryId(null)}
          onConfirm={confirmDelete}
          title="Confirmer la suppression"
          message="Êtes-vous sûr de vouloir supprimer cette entrée de temps ? Cette action est irréversible."
        />
      </div>
    </RoleBasedProtectedRoute>
  );
}

