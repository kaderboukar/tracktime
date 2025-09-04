// app/time-entries/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Toaster, toast } from 'sonner';
import { ClockIcon, PencilIcon, TrashIcon, EyeIcon, ChevronDownIcon, ChevronRightIcon, UserIcon, CalendarIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';
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

interface GroupedTimeEntries {
  userId: number;
  userName: string;
  userIndice: string;
  totalHours: number;
  entries: TimeEntry[];
  isExpanded: boolean;
}

export default function TimeEntriesPage() {
  const initializeFormData = () => ({
    userId: 0,
    projectId: 0,
    activityId: 0,
    hours: 0,
    semester: activePeriod?.semester || (new Date().getMonth() < 6 ? "S1" : "S2") as "S1" | "S2",
    year: activePeriod?.year || new Date().getFullYear(),
  });

  // États essentiels
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>("");
  const [deleteTimeEntryId, setDeleteTimeEntryId] = useState<number | null>(null);
  const [selectedTimeEntry, setSelectedTimeEntry] = useState<TimeEntryWithDetails | null>(null);
  
  // États pour la gestion des signatures
  const [signatureLoading, setSignatureLoading] = useState<Set<string>>(new Set());
  const [sentSignatures, setSentSignatures] = useState<Set<string>>(new Set());
  const [completedSignatures, setCompletedSignatures] = useState<Set<string>>(new Set());
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [activePeriod, setActivePeriod] = useState<{ year: number; semester: "S1" | "S2" } | null>(null);
  // const [availablePeriods, setAvailablePeriods] = useState<Array<{ year: number; semester: "S1" | "S2"; isActive: boolean }>>([]);
  const router = useRouter();
  const [remainingHours, setRemainingHours] = useState<number>(480);
  const [currentYear] = useState(new Date().getFullYear());
  const [currentSemester] = useState<"S1" | "S2">(new Date().getMonth() < 6 ? "S1" : "S2");
  const [formData, setFormData] = useState<FormData>(initializeFormData());
  const [existingYearSemesters, setExistingYearSemesters] = useState<YearSemester[]>([]);
  const [parentActivity, setParentActivity] = useState<number | null>(null);
  const [childActivities, setChildActivities] = useState<Activity[]>([]);
  const [totalHoursUsed, setTotalHoursUsed] = useState<number>(0);
  const MAX_TOTAL_HOURS = 480;
  const [semesterHours, setSemesterHours] = useState<{ total: number; remaining: number }>({ total: 0, remaining: 480 });

  // Nouveaux états pour la refonte
  const [groupedEntries, setGroupedEntries] = useState<GroupedTimeEntries[]>([]);
  const [expandedUsers, setExpandedUsers] = useState<Set<number>>(new Set());
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

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

  const fetchTimeEntries = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("Token non trouvé dans fetchTimeEntries");
        return;
      }

      const res = await fetch("/api/time-entries", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        console.error("Erreur lors de la récupération des entrées:", res.status, res.statusText);
        if (res.status === 401) {
          localStorage.removeItem("token");
          showNotification("Session expirée, veuillez vous reconnecter", 'error');
          router.push("/login");
          return;
        }
        if (res.status === 403) {
          showNotification("Vous n'avez pas les permissions nécessaires pour accéder à cette page", 'error');
        }
        return;
      }

      const data = await res.json();

      if (data.success) {
        // Vérifier que data.data est un tableau valide
        if (Array.isArray(data.data)) {
          setTimeEntries(data.data);
        } else {
          console.error("Format de données invalide pour les entrées de temps:", data.data);
          setTimeEntries([]);
        }
      } else {
        console.error(
          "Erreur lors de la récupération des entrées:",
          data.message
        );
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des entrées:", error);
      showNotification("Erreur de connexion au serveur", 'error');
    }
  }, [router]);

  const fetchActivities = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("Token non trouvé");
        return;
      }

      const res = await fetch("/api/activities", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!res.ok) {
        console.error("Erreur lors de la récupération des activités:", res.status, res.statusText);
        if (res.status === 401) {
          localStorage.removeItem("token");
          showNotification("Session expirée, veuillez vous reconnecter", 'error');
          router.push("/login");
          return;
        }
        return;
      }

      const data = await res.json();

      if (Array.isArray(data)) {
        // Organiser les activités par parent/enfant
        const parentActivities = data.filter(
          (activity: Activity) => !activity.parentId
        ).map((parent: Activity) => {
          return {
            ...parent,
            children: data.filter(
              (child: Activity) => child.parentId === parent.id
            ),
          };
        });

        setActivities(parentActivities);
      } else {
        console.error("Format de données invalide pour les activités:", data);
        setActivities([]);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des activités:", error);
      showNotification("Erreur lors du chargement des activités", 'error');
    }
  }, [router]);

  useEffect(() => {
    const initializePage = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.log("Aucun token trouvé, redirection vers login");
          router.push("/login");
          return;
        }

        // Vérifier l'expiration du token
        try {
          const decoded = JSON.parse(atob(token.split(".")[1]));
          const exp = decoded.exp * 1000; // Convertir en millisecondes
          if (Date.now() >= exp) {
            console.log("Token expiré, redirection vers login");
            localStorage.removeItem("token");
            router.push("/login");
            return;
          }
        } catch (error) {
          console.error("Erreur de décodage du token:", error);
          localStorage.removeItem("token");
          router.push("/login");
          return;
        }

        const meResponse = await fetch("/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!meResponse.ok) {
          console.error("Erreur de réponse auth/me:", meResponse.status, meResponse.statusText);
          if (meResponse.status === 401) {
            localStorage.removeItem("token");
            showNotification("Session expirée, veuillez vous reconnecter", 'error');
          }
          router.push("/login");
          return;
        }

        const userData = await meResponse.json();

        if (!userData.success || !userData.data) {
          console.error("Erreur de réponse auth/me:", userData);
          router.push("/login");
          return;
        }

        const userId = userData.data.id;
        const userRole = userData.data.role;
        
        console.log("Utilisateur connecté:", { userId, userRole });
        
        // Vérifier que l'utilisateur a les permissions nécessaires
        if (userRole !== "ADMIN" && userRole !== "PMSU" && userRole !== "STAFF") {
          showNotification("Vous n'avez pas les permissions nécessaires pour accéder à cette page", 'error');
          router.push("/dashboard");
          return;
        }
        
        setFormData((prev) => ({ ...prev, userId }));
        setUserRole(userRole);

        // Charger les données dans l'ordre
        await Promise.all([
          fetchTimeEntries(),
          fetchSecondaryProjects(userId),
          fetchActivities(),
          fetchRemainingHours(userId, currentSemester, currentYear)
        ]);

      } catch (error) {
        console.error("Erreur lors de l'initialisation:", error);
        showNotification("Erreur lors du chargement des données", 'error');
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    initializePage();
  }, [router, currentSemester, currentYear, fetchTimeEntries, fetchActivities]);



  const fetchSecondaryProjects = async (userId: number) => {
    try {
      const token = localStorage.getItem("token");
      if (!token || !userId) {
        setProjects([]);
        setFilteredProjects([]);
        return;
      }

      const res = await fetch(`/api/projects/users/${userId}/secondary`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setProjects(data.data);
        setFilteredProjects(data.data);
      } else {
        console.error("Format de données invalide pour les projets");
        setProjects([]);
        setFilteredProjects([]);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des projets:", error);
      setProjects([]);
      setFilteredProjects([]);
    }
  };



  const fetchRemainingHours = async (userId: number, semester: string, year: number) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/time-entries/remaining?userId=${userId}&semester=${semester}&year=${year}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setRemainingHours(data.data.remainingHours);
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

  const calculateTotalHoursUsed = (entries: TimeEntry[]) => {
    return entries.reduce((total, entry) => total + entry.hours, 0);
  };

  useEffect(() => {
    const total = calculateTotalHoursUsed(timeEntries);
    setTotalHoursUsed(Math.min(total, MAX_TOTAL_HOURS));
  }, [timeEntries]);

  // Vérifier l'expiration des signatures toutes les 5 minutes
  useEffect(() => {
    const checkSignatureExpiration = () => {
      // Pour l'instant, on réinitialise les signatures envoyées toutes les 5 minutes
      // Dans une vraie implémentation, on vérifierait l'expiration réelle des tokens
      setSentSignatures(new Set());
    };

    const interval = setInterval(checkSignatureExpiration, 5 * 60 * 1000); // 5 minutes
    
    return () => clearInterval(interval);
  }, []);

  // Vérifier les signatures complétées toutes les 30 secondes
  useEffect(() => {
    const checkCompletedSignaturesPeriodically = async () => {
      try {
        const response = await fetch('/api/admin/signed-timesheets');
        if (response.ok) {
          const data = await response.json();
          const completedKeys = new Set<string>();
          
          data.signedTimesheets?.forEach((timesheet: { userId: number; year: number; semester: string }) => {
            const key = `${timesheet.userId}-${timesheet.year}-${timesheet.semester}`;
            completedKeys.add(key);
          });
          
          setCompletedSignatures(completedKeys);
        }
      } catch (error) {
        console.error('Erreur lors de la vérification périodique des signatures complétées:', error);
      }
    };

    const interval = setInterval(checkCompletedSignaturesPeriodically, 30 * 1000); // 30 secondes
    
    return () => clearInterval(interval);
  }, []);

  // Vérifier les signatures complétées au chargement de la page
  useEffect(() => {
    const checkCompletedSignatures = async () => {
      try {
        const response = await fetch('/api/admin/signed-timesheets');
        if (response.ok) {
          const data = await response.json();
          const completedKeys = new Set<string>();
          
          data.signedTimesheets?.forEach((timesheet: { userId: number; year: number; semester: string }) => {
            const key = `${timesheet.userId}-${timesheet.year}-${timesheet.semester}`;
            completedKeys.add(key);
          });
          
          setCompletedSignatures(completedKeys);
        }
      } catch (error) {
        console.error('Erreur lors de la vérification des signatures complétées:', error);
      }
    };

    checkCompletedSignatures();
  }, []);

  const getRemainingHours = () => {
    return Math.max(0, MAX_TOTAL_HOURS - totalHoursUsed);
  };

  const fetchSemesterHours = async (userId: number, semester: string, year: number) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/time-entries/semester-hours?userId=${userId}&semester=${semester}&year=${year}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setSemesterHours({
          total: data.totalHours,
          remaining: data.remainingHours
        });
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des heures du semestre:", error);
    }
  };

  useEffect(() => {
    if (formData.userId && formData.semester && formData.year) {
      fetchSemesterHours(formData.userId, formData.semester, formData.year);
    }
  }, [formData.userId, formData.semester, formData.year]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const validateHours = (hours: number) => {
    if (hours <= 0) {
      toast.error("Le nombre d'heures doit être supérieur à 0");
      return false;
    }

    // Vérifier la limite par semestre
    if (hours > semesterHours.remaining) {
      toast.error(`Vous avez déjà ${semesterHours.total} heures pour ce semestre. Il vous reste ${semesterHours.remaining} heures disponibles.`);
      return false;
    }

    // Vérifier la limite globale de 480 heures
    const remainingGlobalHours = getRemainingHours();
    if (hours > remainingGlobalHours) {
      toast.error(`Vous ne pouvez pas dépasser ${remainingGlobalHours} heures restantes sur le total de ${MAX_TOTAL_HOURS} heures.`);
      return false;
    }

    return true;
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleHoursChange = (value: number) => {
    if (value <= 0) {
      toast.error("Le nombre d'heures doit être supérieur à 0");
      return;
    }

    if (value > semesterHours.remaining) {
      toast.error(`Vous avez déjà ${semesterHours.total} heures pour ce semestre. Il vous reste ${semesterHours.remaining} heures disponibles.`);
      return;
    }

    const remainingGlobalHours = getRemainingHours();
    if (value > remainingGlobalHours) {
      toast.error(`Vous ne pouvez pas dépasser ${remainingGlobalHours} heures restantes sur le total de ${MAX_TOTAL_HOURS} heures.`);
      return;
    }

    setFormData({
      ...formData,
      hours: value,
    });
  };

  // Mise à jour de la validation du semestre
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

    // Vérifier que la période active est chargée
    if (!activePeriod) {
      showNotification("Période active non disponible. Veuillez réessayer.", 'error');
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Token non trouvé");
      }

      // Récupérer les projets pour l'utilisateur de l'entrée
      await fetchSecondaryProjects(timeEntry.userId);

      // Trouver l'activité parente et configurer les activités enfants
      const selectedActivity = activities.find(act =>
        act.id === timeEntry.activityId ||
        (act.children && act.children.some(child => child.id === timeEntry.activityId))
      );

      if (selectedActivity) {
        if (selectedActivity.id === timeEntry.activityId) {
          // L'activité sélectionnée est une activité parente
          setParentActivity(selectedActivity.id);
          setChildActivities(selectedActivity.children || []);
        } else {
          // L'activité sélectionnée est une activité enfant
          const parentActivity = activities.find(act =>
            act.children && act.children.some(child => child.id === timeEntry.activityId)
          );
          if (parentActivity) {
            setParentActivity(parentActivity.id);
            setChildActivities(parentActivity.children || []);
          }
        }
      }

      setSelectedTimeEntry(timeEntry as TimeEntryWithDetails);
      setFormData({
        id: timeEntry.id,
        userId: timeEntry.userId,
        projectId: timeEntry.projectId,
        activityId: timeEntry.activityId,
        hours: timeEntry.hours,
        semester: activePeriod?.semester || timeEntry.semester,
        year: activePeriod?.year || timeEntry.year,
        comment: timeEntry.comment
      });
      setEditMode(true);
      setIsCreateModalOpen(true); // Ouvrir le modal de création/édition

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
    const res = await fetch(`/api/time-entries?id=${deleteTimeEntryId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  const handleParentActivityChange = (activityId: number) => {
    setParentActivity(activityId);
    const selectedActivity = activities.find(act => act.id === activityId);
    if (selectedActivity && selectedActivity.children) {
      setChildActivities(selectedActivity.children);
    } else {
      setChildActivities([]);
    }
    // Réinitialiser l'activité sélectionnée
    setFormData(prev => ({
      ...prev,
      activityId: 0
    }));
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const openCreateModal = async () => {
    // Vérifier que la période active est chargée
    if (!activePeriod) {
      showNotification("Période active non disponible. Veuillez réessayer.", 'error');
      return;
    }

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
      await fetchSecondaryProjects(userId);

      setEditMode(false);
      setFormData({
        ...initializeFormData(),
        userId,
        semester: activePeriod?.semester || (new Date().getMonth() < 6 ? "S1" : "S2"),
        year: activePeriod?.year || new Date().getFullYear(),
      });
      setParentActivity(null);
      setChildActivities([]);
      setIsCreateModalOpen(true);

    } catch (error) {
      showNotification("Erreur lors de la récupération de l'utilisateur", 'error');
      console.error(error);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  // Fonction pour récupérer la période active et toutes les périodes disponibles
  const fetchActivePeriod = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/time-periods", {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          // Trouver la période active
          const active = result.data.find((period: { isActive: boolean }) => period.isActive);
          if (active) {
            setActivePeriod({
              year: active.year,
              semester: active.semester
            });
          }
          
          // Stocker toutes les périodes disponibles
          // setAvailablePeriods(result.data);
        }
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des périodes:", error);
    }
  };

  useEffect(() => {
    fetchActivePeriod();
  }, []);

  // Mettre à jour les heures restantes quand la période active change
  useEffect(() => {
    if (activePeriod && formData.userId) {
      fetchRemainingHours(formData.userId, activePeriod.semester, activePeriod.year);
    }
  }, [activePeriod, formData.userId]);

  // Fonction pour grouper les entrées par utilisateur
  const groupEntriesByUser = (entries: TimeEntry[]): GroupedTimeEntries[] => {
    // Vérifier que entries est un tableau valide
    if (!entries || !Array.isArray(entries)) {
      console.warn("groupEntriesByUser: entries n'est pas un tableau valide", entries);
      return [];
    }

    const grouped = entries.reduce((acc, entry) => {
      // Vérifier que l'entrée a les propriétés nécessaires
      if (!entry || !entry.userId || !entry.user || !entry.user.name || !entry.user.indice) {
        console.warn("groupEntriesByUser: entrée invalide", entry);
        return acc;
      }

      const existingGroup = acc.find(group => group.userId === entry.userId);
      
      if (existingGroup) {
        existingGroup.entries.push(entry);
        existingGroup.totalHours += entry.hours || 0;
      } else {
        acc.push({
          userId: entry.userId,
          userName: entry.user.name,
          userIndice: entry.user.indice,
          totalHours: entry.hours || 0,
          entries: [entry],
          isExpanded: false
        });
      }
      
      return acc;
    }, [] as GroupedTimeEntries[]);

    // Trier par nom d'utilisateur
    return grouped.sort((a, b) => a.userName.localeCompare(b.userName));
  };

  // Fonction pour filtrer les entrées
  const getFilteredEntries = useCallback(() => {
    let filtered = timeEntries;

    // Filtrer par statut
    if (filterStatus !== 'ALL') {
      filtered = filtered.filter(entry => entry.status === filterStatus);
    }

    // Filtrer par recherche
    if (searchTerm) {
      filtered = filtered.filter(entry => 
        entry.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.user.indice.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.activity.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [timeEntries, filterStatus, searchTerm]);

  // Mettre à jour les entrées groupées quand les données changent
  useEffect(() => {
    try {
      const filtered = getFilteredEntries();
      const grouped = groupEntriesByUser(filtered);
      
      // Préserver l'état d'expansion
      const updatedGrouped = grouped.map(group => ({
        ...group,
        isExpanded: expandedUsers.has(group.userId)
      }));
      
      setGroupedEntries(updatedGrouped);
    } catch (error) {
      console.error("Erreur lors du groupement des entrées:", error);
      setGroupedEntries([]);
    }
  }, [timeEntries, filterStatus, searchTerm, expandedUsers, getFilteredEntries]);

  // Fonction pour basculer l'expansion d'un utilisateur
  const toggleUserExpansion = (userId: number) => {
    const newExpandedUsers = new Set(expandedUsers);
    if (newExpandedUsers.has(userId)) {
      newExpandedUsers.delete(userId);
    } else {
      newExpandedUsers.add(userId);
    }
    setExpandedUsers(newExpandedUsers);
  };

  // Fonction pour obtenir le nombre d'entrées par statut pour un utilisateur
  const getStatusCounts = (entries: TimeEntry[]) => {
    return entries.reduce((acc, entry) => {
      const status = entry.status || 'PENDING';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  };

  if (loading) {
    return (
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

  // Fonction pour vérifier si toutes les entrées d'un utilisateur sont approuvées (non utilisée actuellement)
  // const areAllEntriesApproved = async (userId: number, semester: string, year: number) => {
  //   try {
  //     console.log(`🔍 Vérification pour userId: ${userId}, semester: ${semester}, year: ${year}`);
      
  //     const token = localStorage.getItem("token");
  //     if (!token) {
  //       console.error("Token non trouvé");
  //       return false;
  //     }
      
  //     // Appel direct à l'API pour vérifier le statut
  //     const res = await fetch(`/api/time-entries?userId=${userId}&semester=${semester}&year=${year}`, {
  //       headers: { Authorization: `Bearer ${token}` },
  //     });
      
  //     if (!res.ok) {
  //       console.error("Erreur lors de la vérification des entrées:", res.status);
  //       return false;
  //     }
      
  //     const data = await res.json();
      
  //     if (data.success && Array.isArray(data.data)) {
  //       const userEntries = data.data;
  //       console.log(`📋 Entrées trouvées pour cet utilisateur: ${userEntries.length}`);
        
  //       userEntries.forEach(entry => {
  //         console.log(`  - Entry ID: ${entry.id}, Status: ${entry.status || 'PENDING'}, UserId: ${entry.userId}, Semester: ${entry.semester}, Year: ${entry.year}`);
  //       });
        
  //       if (userEntries.length === 0) {
  //         console.log(`❌ Aucune entrée trouvée pour cet utilisateur`);
  //         return false;
  //       }
        
  //       const allApproved = userEntries.every(entry => entry.status === 'APPROVED');
  //       console.log(`✅ Toutes les entrées sont-elles approuvées? ${allApproved}`);
        
  //       return allApproved;
  //     } else {
  //       console.error("Format de données invalide:", data);
  //       return false;
  //     }
  //   } catch (error) {
  //     console.error("Erreur lors de la vérification:", error);
  //     return false;
  //   }
  // };

  // Fonction pour faire signer la feuille de temps (génère PDF + envoie email)
  const handleRequestSignature = async (userId: number, userName: string, semester: string, year: number) => {
    const signatureKey = `${userId}-${year}-${semester}`;
    
    try {
      console.log(`🚀 Démarrage de la demande de signature pour ${userName} (${semester} ${year})`);
      
      // Marquer comme en cours de chargement
      setSignatureLoading(prev => new Set(prev).add(signatureKey));
      
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Token d'authentification non trouvé");
      }
      
      // Utiliser directement l'API auto-generate qui fait tout : PDF + email
      console.log(`📧 Envoi de la demande via /api/timesheet/auto-generate...`);
      
      const response = await fetch("/api/timesheet/auto-generate", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId,
          year,
          semester,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Erreur API: ${response.status} - ${errorText}`);
        throw new Error(`Erreur serveur: ${response.status}`);
      }

      const data = await response.json();
      console.log(`📡 Réponse de l'API:`, data);
      
      if (data.success) {
        // Marquer comme envoyé avec succès
        setSentSignatures(prev => new Set(prev).add(signatureKey));
        
        showNotification(
          `✅ PDF généré et demande de signature envoyée avec succès pour ${userName}`,
          'success'
        );
        console.log(`🎉 Signature demandée avec succès pour ${userName}`);
        
        // Vérifier si la signature est déjà complétée (cas rare mais possible)
        setTimeout(async () => {
          try {
            const checkResponse = await fetch('/api/admin/signed-timesheets');
            if (checkResponse.ok) {
              const checkData = await checkResponse.json();
              const isAlreadyCompleted = checkData.signedTimesheets?.some((timesheet: { userId: number; year: number; semester: string }) => 
                `${timesheet.userId}-${timesheet.year}-${timesheet.semester}` === signatureKey
              );
              
              if (isAlreadyCompleted) {
                setCompletedSignatures(prev => new Set(prev).add(signatureKey));
                setSentSignatures(prev => {
                  const newSet = new Set(prev);
                  newSet.delete(signatureKey);
                  return newSet;
                });
              }
            }
          } catch (error) {
            console.error('Erreur lors de la vérification post-envoi:', error);
          }
        }, 1000);
      } else {
        console.error(`❌ Erreur dans la réponse:`, data.message);
        showNotification(data.message || "Erreur lors de l'envoi de la demande de signature", 'error');
      }
    } catch (error) {
      console.error("❌ Erreur lors de la demande de signature:", error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      showNotification(`Erreur lors de la demande de signature: ${errorMessage}`, 'error');
    } finally {
      // Retirer du chargement
      setSignatureLoading(prev => {
        const newSet = new Set(prev);
        newSet.delete(signatureKey);
        return newSet;
      });
    }
  };

  return (
    <RoleBasedProtectedRoute allowedRoles={["ADMIN", "PMSU", "STAFF"]}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50">
        <Toaster richColors closeButton position="top-right" />
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

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
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="Rechercher..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="ALL">Tous les statuts</option>
                  <option value="PENDING">En attente</option>
                  <option value="APPROVED">Approuvé</option>
                  <option value="REJECTED">Rejeté</option>
                  <option value="REVISED">En révision</option>
                </select>
              </div>
            </div>
          </div>

          {/* Statistiques globales */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white/70 backdrop-blur-xl rounded-xl shadow-lg border border-white/50 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <UserIcon className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Utilisateurs</p>
                  <p className="text-2xl font-bold text-gray-900">{groupedEntries.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white/70 backdrop-blur-xl rounded-xl shadow-lg border border-white/50 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <ClockIcon className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Heures</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {timeEntries.reduce((sum, entry) => sum + entry.hours, 0)}h
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white/70 backdrop-blur-xl rounded-xl shadow-lg border border-white/50 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <CalendarIcon className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">En attente</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {timeEntries.filter(entry => entry.status === 'PENDING').length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white/70 backdrop-blur-xl rounded-xl shadow-lg border border-white/50 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <ClockIcon className="w-6 h-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Approuvées</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {timeEntries.filter(entry => entry.status === 'APPROVED').length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Liste des utilisateurs avec leurs entrées */}
          <div className="space-y-6">
            {groupedEntries.map((userGroup) => {
              const statusCounts = getStatusCounts(userGroup.entries);
              const isExpanded = expandedUsers.has(userGroup.userId);
              
              return (
                <div key={userGroup.userId} className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 overflow-hidden">
                  {/* En-tête de l'utilisateur */}
                  <div 
                    className="p-6 cursor-pointer hover:bg-gray-50/50 transition-colors duration-200"
                    onClick={() => toggleUserExpansion(userGroup.userId)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0 h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="font-bold text-blue-600 text-lg">
                            {userGroup.userName.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{userGroup.userName}</h3>
                          <p className="text-sm text-gray-500">{userGroup.userIndice}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-6">
                        {/* Statistiques de l'utilisateur */}
                        <div className="flex items-center space-x-4 text-sm">
                          <div className="text-center">
                            <p className="font-medium text-gray-900">{userGroup.entries.length}</p>
                            <p className="text-gray-500">Entrées</p>
                          </div>
                          <div className="text-center">
                            <p className="font-medium text-gray-900">{userGroup.totalHours}h</p>
                            <p className="text-gray-500">Total</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            {Object.entries(statusCounts).map(([status, count]) => (
                              <span
                                key={status}
                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(status)}`}
                              >
                                {count}
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        {/* Bouton d'expansion */}
                        <div className="flex items-center space-x-2">
                          {/* Bouton Faire Signer pour ADMIN/PMSU - seulement si toutes les entrées sont approuvées */}
                          {["ADMIN", "PMSU"].includes(userRole) && (
                            <>
                              {/* Vérifier si toutes les entrées sont approuvées pour ce semestre */}
                              {(() => {
                                // Extraire semester et year des entrées de l'utilisateur
                                const userEntries = timeEntries.filter(entry => entry.userId === userGroup.userId);
                                
                                if (userEntries.length === 0) {
                                  console.log(`❌ Aucune entrée trouvée pour ${userGroup.userName}`);
                                  return (
                                    <button
                                      disabled
                                      className="flex items-center px-3 py-1.5 bg-gray-400 text-white rounded-lg cursor-not-allowed text-xs font-medium opacity-50"
                                      title="Aucune entrée trouvée"
                                    >
                                      <DocumentArrowDownIcon className="w-4 h-4 mr-1" />
                                      Aucune entrée
                                    </button>
                                  );
                                }
                                
                                // Prendre le premier semester/year trouvé (ou utiliser les plus récents)
                                const latestEntry = userEntries.reduce((latest, current) => {
                                  if (!latest) return current;
                                  if (current.year > latest.year) return current;
                                  if (current.year === latest.year && current.semester === 'S2' && latest.semester === 'S1') return current;
                                  return latest;
                                });
                                
                                const semester = latestEntry.semester;
                                const year = latestEntry.year;
                                
                                console.log(`🔍 Vérification pour ${userGroup.userName} (${userGroup.userId}, ${semester} ${year})`);
                                console.log(`📊 Total timeEntries disponibles: ${timeEntries.length}`);
                                
                                // Filtrer par semester et year
                                const userEntriesForPeriod = userEntries.filter(entry => 
                                  entry.semester === semester && 
                                  entry.year === year
                                );
                                
                                console.log(`📋 Entrées trouvées pour ${userGroup.userName} (${semester} ${year}): ${userEntriesForPeriod.length}`);
                                userEntriesForPeriod.forEach(entry => {
                                  console.log(`  - Entry ID: ${entry.id}, Status: ${entry.status || 'PENDING'}, UserId: ${entry.userId}, Semester: ${entry.semester}, Year: ${entry.year}`);
                                });
                                
                                const allApproved = userEntriesForPeriod.length > 0 && userEntriesForPeriod.every(entry => entry.status === 'APPROVED');
                                console.log(`✅ ${userGroup.userName} - Toutes approuvées? ${allApproved}`);
                                
                                const signatureKey = `${userGroup.userId}-${year}-${semester}`;
                                const isLoading = signatureLoading.has(signatureKey);
                                const isSent = sentSignatures.has(signatureKey);
                                const isCompleted = completedSignatures.has(signatureKey);
                                
                                return allApproved ? (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation(); // Empêcher l'expansion du groupe
                                      handleRequestSignature(userGroup.userId, userGroup.userName, semester, year);
                                    }}
                                    disabled={isLoading || isSent || isCompleted}
                                    className={`flex items-center px-3 py-1.5 rounded-lg transition-all duration-200 shadow-sm text-xs font-medium ${
                                      isLoading 
                                        ? 'bg-orange-500 text-white cursor-wait' 
                                        : isSent 
                                        ? 'bg-gray-500 text-white cursor-not-allowed opacity-75' 
                                        : isCompleted
                                        ? 'bg-green-500 text-white cursor-not-allowed opacity-75'
                                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 hover:shadow-md transform hover:-translate-y-0.5'
                                    }`}
                                    title={
                                      isLoading 
                                        ? 'Envoi en cours...' 
                                        : isSent 
                                        ? `Demande de signature envoyée pour ${userGroup.userName} (${semester} ${year})` 
                                        : isCompleted
                                        ? `Feuille de temps déjà signée pour ${userGroup.userName} (${semester} ${year})`
                                        : `Faire signer la feuille de temps pour ${userGroup.userName} (${semester} ${year})`
                                    }
                                  >
                                    <DocumentArrowDownIcon className="w-4 h-4 mr-1" />
                                    {isLoading ? 'En cours...' : isSent ? 'Envoyé' : isCompleted ? 'Signé' : 'Faire Signer'}
                                  </button>
                                ) : (
                                  <button
                                    disabled
                                    className="flex items-center px-3 py-1.5 bg-gray-400 text-white rounded-lg cursor-not-allowed text-xs font-medium opacity-50"
                                    title={`Toutes les entrées doivent être approuvées avant de pouvoir faire signer`}
                                  >
                                    <DocumentArrowDownIcon className="w-4 h-4 mr-1" />
                                    En attente d&apos;approbation
                                  </button>
                                );
                              })()}
                            </>
                          )}
                          {isExpanded ? (
                            <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Détails des entrées (expandable) */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 bg-gray-50/30">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                              <th className="px-6 py-3 text-left">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</span>
                    </th>
                              <th className="px-6 py-3 text-left">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Projet</span>
                    </th>
                              <th className="px-6 py-3 text-left">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Activité</span>
                    </th>
                              <th className="px-6 py-3 text-left">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Période</span>
                    </th>
                              <th className="px-6 py-3 text-left">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Heures</span>
                    </th>
                              <th className="px-6 py-3 text-left">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                            {userGroup.entries.map((entry) => (
                              <tr key={entry.id} className="hover:bg-gray-50/50 transition-colors duration-200">
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
                        {renderActionButtons(entry)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Message si aucune entrée */}
          {groupedEntries.length === 0 && (
            <div className="text-center py-12">
              <div className="mx-auto h-24 w-24 text-gray-300">
                <ClockIcon className="w-full h-full" />
                </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Aucune entrée de temps</h3>
              <p className="mt-2 text-gray-500">
                {searchTerm || filterStatus !== 'ALL' 
                  ? "Aucune entrée ne correspond à vos critères de recherche."
                  : "Aucune entrée de temps n'a été trouvée."
                }
              </p>
              </div>
          )}
        </div>

        {/* Modals */}
        <CreateTimeEntryModal
          isOpen={isCreateModalOpen}
          onClose={() => {
            setIsCreateModalOpen(false);
            setParentActivity(null);
            setChildActivities([]);
          }}
          formData={formData}
          onSubmit={handleSubmit}
          onChange={handleFormChange}
          projects={projects}
          activities={activities}
          remainingHours={remainingHours}
          editMode={editMode}
          parentActivity={parentActivity}
          childActivities={childActivities}
          onParentActivityChange={handleParentActivityChange}
          userRole={userRole}
          activePeriod={activePeriod}
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