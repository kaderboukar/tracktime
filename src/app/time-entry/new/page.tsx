"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Toaster, toast } from 'sonner';
import { 
  ArrowLeftIcon, 
  ClockIcon, 
  FolderIcon, 
  CogIcon, 
  CalendarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import Navbar from "@/components/Navbar";
import RoleBasedProtectedRoute from "@/components/RoleBasedProtectedRoute";

interface Project {
  id: number;
  name: string;
  projectNumber: string;
  staffAccess: string;
}

interface Activity {
  id: number;
  name: string;
  parentId: number | null;
  children?: Activity[];
}

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

export default function NewTimeEntryPage() {
  const router = useRouter();
  const [user, setUser] = useState<{id: number; name: string; role: string} | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // États du formulaire
  const [formData, setFormData] = useState<FormData>({
    userId: 0,
    projectId: 0,
    activityId: 0,
    hours: 0,
    semester: new Date().getMonth() < 6 ? "S1" : "S2",
    year: new Date().getFullYear(),
    comment: ""
  });

  // États pour les données
  const [projects, setProjects] = useState<Project[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [parentActivity, setParentActivity] = useState<number | null>(null);
  const [childActivities, setChildActivities] = useState<Activity[]>([]);
  const [remainingHours, setRemainingHours] = useState<number>(480);

  // États pour la recherche de projets
  const [projectSearchTerm, setProjectSearchTerm] = useState("");
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);

  // États pour la validation
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  
  // États pour le formulaire à étapes
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  // État pour la période active
  const [activePeriod, setActivePeriod] = useState<{ year: number; semester: "S1" | "S2" } | null>(null);
  const [activePeriodLoading, setActivePeriodLoading] = useState(true);

  // Effacer les erreurs quand on arrive à l'étape 3
  useEffect(() => {
    if (currentStep === 3) {
      setErrors({});
    }
  }, [currentStep]);

  const fetchUserData = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const res = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.success) {
        setUser(data.data);
      } else {
        router.push("/login");
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des données utilisateur:", error);
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({ ...prev, userId: user.id }));
      fetchAvailableProjects(user.id);
      fetchActivities();
      fetchActivePeriod();
    }
  }, [user]);

  // Debug: Log quand activePeriod change
  useEffect(() => {
    console.log('activePeriod a changé:', activePeriod);
  }, [activePeriod]);

  useEffect(() => {
    // Filtrer les projets basé sur la recherche
    if (projectSearchTerm.trim() === "") {
      setFilteredProjects(projects);
    } else {
      const filtered = projects.filter(project =>
        project.name.toLowerCase().includes(projectSearchTerm.toLowerCase()) ||
        project.projectNumber.toLowerCase().includes(projectSearchTerm.toLowerCase())
      );
      setFilteredProjects(filtered);
    }
  }, [projectSearchTerm, projects]);

  const fetchAvailableProjects = async (userId: number) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/projects/users/${userId}/secondary`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        // Filtrer les projets invalides et s'assurer qu'ils ont un nom
        const validProjects = data.data.filter((project: Project) => 
          project && 
          project.id && 
          typeof project.name === 'string' && 
          project.name.trim() !== '' &&
          typeof project.projectNumber === 'string' && 
          project.projectNumber.trim() !== ''
        );
        setProjects(validProjects);
        setFilteredProjects(validProjects);
      } else {
        setProjects([]);
        setFilteredProjects([]);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des projets:", error);
      setProjects([]);
      setFilteredProjects([]);
    }
  };

  const fetchActivities = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/activities", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (Array.isArray(data)) {
        // Filtrer les activités invalides et s'assurer qu'elles ont un nom
        const validActivities = data.filter(activity => 
          activity && 
          activity.id && 
          typeof activity.name === 'string' && 
          activity.name.trim() !== ''
        );
        setActivities(validActivities);
      } else {
        setActivities([]);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des activités:", error);
      setActivities([]);
    }
  };

  const fetchRemainingHours = async (userId: number) => {
    try {
      const token = localStorage.getItem("token");
      
      // Utiliser la période active si disponible, sinon utiliser les valeurs par défaut
      const currentYear = activePeriod?.year || new Date().getFullYear();
      const currentSemester = activePeriod?.semester || (new Date().getMonth() < 6 ? "S1" : "S2");
      
      const response = await fetch(`/api/time-entries/remaining?userId=${userId}&year=${currentYear}&semester=${currentSemester}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setRemainingHours(data.remainingHours);
      }
    } catch (error) {
      console.error("Erreur lors du calcul des heures restantes:", error);
    }
  };

  // Mettre à jour les heures restantes quand la période active change
  useEffect(() => {
    if (user && activePeriod && !activePeriodLoading) {
      fetchRemainingHours(user.id);
    }
  }, [user, activePeriod, activePeriodLoading, fetchRemainingHours]);

  const fetchActivePeriod = async () => {
    console.log('fetchActivePeriod appelée');
    setActivePeriodLoading(true);
    try {
      const token = localStorage.getItem("token");
      console.log('Token récupéré:', token ? 'Oui' : 'Non');
      const response = await fetch("/api/time-periods?activeOnly=true", {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          console.log('Période active récupérée:', result.data);
          setActivePeriod({
            year: result.data.year,
            semester: result.data.semester
          });
          
          // Mettre à jour automatiquement le formulaire avec la période active
          console.log('Mise à jour formData avec:', result.data.year, result.data.semester);
          setFormData(prev => ({
            ...prev,
            year: result.data.year,
            semester: result.data.semester
          }));
        } else {
          setActivePeriod(null);
        }
      } else {
        setActivePeriod(null);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération de la période active:", error);
      setActivePeriod(null);
    } finally {
      setActivePeriodLoading(false);
    }
  };

  const handleParentActivityChange = async (activityId: number) => {
    setParentActivity(activityId);
    setFormData(prev => ({ ...prev, activityId: 0 })); // Reset child activity

    // Récupérer les sous-activités avec vérification de sécurité
    const children = activities.filter(activity => 
      activity && 
      activity.id && 
      activity.parentId === activityId
    );
    setChildActivities(children);
  };

  const nextStep = () => {
    // Navigation libre entre les étapes - pas de validation
    setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    // Effacer complètement toutes les erreurs
    setErrors({});
  };

  const prevStep = () => {
    // Navigation libre entre les étapes - pas de validation
    setCurrentStep(prev => Math.max(prev - 1, 1));
    setErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('handleSubmit - activePeriod:', activePeriod);
    console.log('handleSubmit - formData:', formData);
    
    // Validation finale avant soumission
    const finalErrors: {[key: string]: string} = {};

    // Validation du projet
    if (!formData.projectId) {
      finalErrors.projectId = "Veuillez sélectionner un projet";
    }

    // Validation des activités
    if (!parentActivity) {
      finalErrors.activity = "Veuillez sélectionner une activité principale";
    } else if (childActivities.length > 0 && !formData.activityId) {
      finalErrors.activity = "Veuillez sélectionner une sous-activité";
    }

    // Validation des heures - seulement si l'utilisateur a saisi quelque chose
    if (formData.hours === 0) {
      finalErrors.hours = "Veuillez saisir le nombre d'heures travaillées";
    } else if (formData.hours < 0) {
      finalErrors.hours = "Le nombre d'heures doit être positif";
    } else if (formData.hours > remainingHours) {
      finalErrors.hours = `Vous ne pouvez pas saisir plus de ${remainingHours}h ce semestre`;
    }

    // Validation de l'année
    if (formData.year < new Date().getFullYear()) {
      finalErrors.year = "Vous ne pouvez pas sélectionner une année antérieure";
    }

    // Validation de la période active pour STAFF
    console.log('Validation période - activePeriod:', activePeriod);
    console.log('Validation période - formData.year:', formData.year, 'formData.semester:', formData.semester);
    
    if (!activePeriod) {
      console.log('Erreur: activePeriod est null');
      finalErrors.period = "Aucune période de saisie active. Veuillez contacter l'administration.";
    } else if (formData.year !== activePeriod.year || formData.semester !== activePeriod.semester) {
      console.log('Erreur: période ne correspond pas');
      finalErrors.period = `Vous ne pouvez saisir des entrées que pour la période active : ${activePeriod.year} - ${activePeriod.semester}`;
    } else {
      console.log('Validation période OK');
    }

    // Si il y a des erreurs, les afficher et arrêter (sans toast)
    if (Object.keys(finalErrors).length > 0) {
      setErrors(finalErrors);
      return;
    }

    setSubmitting(true);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/time-entries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Entrée de temps créée avec succès !");
        router.push("/");
      } else {
        toast.error(data.message || "Erreur lors de la création");
      }
    } catch (error) {
      console.error("Erreur lors de la soumission:", error);
      toast.error("Erreur lors de la création de l'entrée de temps");
    } finally {
      setSubmitting(false);
    }
  };



  if (loading) {
    return (
      <RoleBasedProtectedRoute allowedRoles={["STAFF"]}>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
          <Navbar />
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </RoleBasedProtectedRoute>
    );
  }

  // Afficher un loader pendant le chargement de la période active
  if (activePeriodLoading) {
    return (
      <RoleBasedProtectedRoute allowedRoles={["STAFF"]}>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
          <Navbar />
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Chargement de la période active...</h3>
              <p className="text-gray-600">
                Vérification de la période de saisie en cours.
              </p>
            </div>
          </div>
        </div>
      </RoleBasedProtectedRoute>
    );
  }

  // Vérifier si une période active existe (seulement après le chargement)
  if (!activePeriod) {
    return (
      <RoleBasedProtectedRoute allowedRoles={["STAFF"]}>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
          <Navbar />
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="mx-auto h-24 w-24 text-yellow-500 mb-4">
                <ExclamationTriangleIcon className="w-full h-full" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucune période de saisie active</h3>
              <p className="text-gray-600 mb-6">
                Aucune période de saisie n&apos;est actuellement configurée par l&apos;administration.
              </p>
              <button
                onClick={() => router.push("/")}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors duration-200"
              >
                Retour au Dashboard
              </button>
            </div>
          </div>
        </div>
      </RoleBasedProtectedRoute>
    );
  }

  return (
    <RoleBasedProtectedRoute allowedRoles={["STAFF"]}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <Navbar />
        <Toaster position="top-right" />
        
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header avec navigation */}
          <div className="mb-8">
            <button
              onClick={() => router.push("/")}
              className="flex items-center text-blue-600 hover:text-blue-800 transition-colors duration-200 mb-4"
            >
              <ArrowLeftIcon className="w-5 h-5 mr-2" />
              Retour au Dashboard
            </button>
            
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/50">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                  <ClockIcon className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Nouvelle Entrée de Temps
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Enregistrez vos heures de travail sur les projets disponibles
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Layout principal avec sidebar et formulaire */}
          <div className="flex gap-8">
            {/* Barre latérale - Guide */}
            <div className="w-80 flex-shrink-0">
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/50 sticky top-8">
                <div className="flex items-start space-x-4 mb-6">
                  <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl">
                    <InformationCircleIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Guide de saisie</h3>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                      Étapes à suivre
                    </h4>
                    <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700 ml-2">
                      <li>Sélectionnez un projet disponible</li>
                      <li>Choisissez l&apos;activité principale</li>
                      <li>Sélectionnez la sous-activité si nécessaire</li>
                      <li>Indiquez la période et les heures</li>
                      <li>Ajoutez un commentaire optionnel</li>
                    </ol>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                      Contraintes importantes
                    </h4>
                    <ul className="list-disc list-inside space-y-2 text-sm text-gray-700 ml-2">
                      <li>Maximum <span className="font-semibold text-blue-600">{remainingHours}h</span> restantes ce semestre</li>
                      <li>Année actuelle ou future uniquement</li>
                      <li>Projets assignés exclus de la sélection</li>
                      <li>Toutes les entrées sont soumises à validation</li>
                      <li>Vous ne pouvez pas modifier après soumission</li>
                      {activePeriod && (
                        <li className="font-semibold text-blue-600">
                          Période active : {activePeriod.year} - {activePeriod.semester}
                        </li>
                      )}
                    </ul>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm font-medium text-blue-900">Conseil</span>
                    </div>
                    <p className="text-xs text-blue-800">
                      Seuls les projets non assignés sont disponibles. Assurez-vous de bien sélectionner l&apos;activité et la sous-activité appropriées pour un suivi précis de votre temps.
                    </p>
                  </div>
                </div>
              </div>
            </div>

                        {/* Formulaire principal */}
            <div className="flex-1">
              <form onSubmit={handleSubmit}>
                {/* Indicateur de progression */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">Étape {currentStep} sur {totalSteps}</h2>
                    <div className="flex space-x-2">
                      {Array.from({ length: totalSteps }, (_, i) => (
                        <div
                          key={i}
                          className={`w-3 h-3 rounded-full transition-all duration-300 ${
                            i + 1 === currentStep
                              ? 'bg-blue-600'
                              : i + 1 < currentStep
                              ? 'bg-green-500'
                              : 'bg-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Étape 1: Sélection du Projet */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div className="text-center mb-8">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full mb-4">
                        <FolderIcon className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">Sélection du Projet</h3>
                      <p className="text-gray-600">Choisissez un projet parmi ceux disponibles</p>
                      

                      
                      {/* Message informatif sur la période programmée */}
                      {activePeriod && (
                        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                          <div className="flex items-center justify-center space-x-2">
                            <CalendarIcon className="h-5 w-5 text-blue-600" />
                            <span className="text-blue-800 font-medium">
                              Période programmée : {activePeriod.year} - {activePeriod.semester}
                            </span>
                          </div>
                          <p className="text-blue-700 text-sm mt-1 text-center">
                            {activePeriod.semester === 'S1' ? 'Janvier - Juin' : 'Juillet - Décembre'}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="max-w-md mx-auto">
                      <label htmlFor="projectSearch" className="block text-sm font-medium text-gray-700 mb-2">
                        Rechercher un projet *
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          id="projectSearch"
                          placeholder="Tapez le nom ou le numéro du projet..."
                          value={projectSearchTerm}
                          onChange={(e) => {
                            setProjectSearchTerm(e.target.value);
                            setShowProjectDropdown(true);
                          }}
                          onFocus={() => setShowProjectDropdown(true)}
                          className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                            errors.projectId ? 'border-red-300' : 'border-gray-300'
                          }`}
                        />
                        <MagnifyingGlassIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      </div>



                      {showProjectDropdown && filteredProjects.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                          {filteredProjects.filter(project => project && project.id).map((project) => (
                            <button
                              key={project.id}
                              type="button"
                              onClick={() => {
                                setFormData(prev => ({ ...prev, projectId: project.id }));
                                setProjectSearchTerm(`${project.projectNumber || ''} - ${project.name || ''}`);
                                setShowProjectDropdown(false);
                                setErrors(prev => ({ ...prev, projectId: "" }));
                              }}
                              className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors duration-200 border-b border-gray-100 last:border-b-0"
                            >
                              <div className="font-medium text-gray-900">{project.projectNumber || 'N/A'}</div>
                              <div className="text-sm text-gray-600">{project.name || 'Nom non disponible'}</div>
                            </button>
                          ))}
                        </div>
                      )}

                      {errors.projectId && (
                        <p className="mt-2 text-sm text-red-600 flex items-center space-x-1">
                          <ExclamationTriangleIcon className="w-4 h-4" />
                          <span>{errors.projectId}</span>
                        </p>
                      )}

                      {formData.projectId > 0 && (
                        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl">
                          <div className="flex items-center space-x-3">
                            <CheckCircleIcon className="w-6 h-6 text-green-600" />
                            <div>
                              <span className="text-sm font-medium text-green-800">Projet sélectionné</span>
                              <p className="text-xs text-green-700 mt-1">{projectSearchTerm}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Étape 2: Activités */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div className="text-center mb-8">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full mb-4">
                        <CogIcon className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">Activité et Détails</h3>
                      <p className="text-gray-600">Sélectionnez l&apos;activité principale et la sous-activité si nécessaire</p>
                      
                      {/* Message informatif sur la période programmée */}
                      {activePeriod && (
                        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                          <div className="flex items-center justify-center space-x-2">
                            <CalendarIcon className="h-5 w-5 text-blue-600" />
                            <span className="text-blue-800 font-medium">
                              Période programmée : {activePeriod.year} - {activePeriod.semester}
                            </span>
                          </div>
                          <p className="text-blue-700 text-sm mt-1 text-center">
                            {activePeriod.semester === 'S1' ? 'Janvier - Juin' : 'Juillet - Décembre'}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="max-w-md mx-auto space-y-6">
                      {/* Activité principale */}
                      <div>
                        <label htmlFor="parentActivity" className="block text-sm font-medium text-gray-700 mb-2">
                          Activité principale *
                        </label>
                        <select
                          id="parentActivity"
                          value={parentActivity || ""}
                          onChange={(e) => handleParentActivityChange(parseInt(e.target.value))}
                          className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${
                            errors.activity ? 'border-red-300' : 'border-gray-300'
                          }`}
                        >
                          <option value="">Choisissez une activité principale...</option>
                          {activities
                            .filter(activity => activity && activity.id && !activity.parentId)
                            .map((activity) => (
                              <option key={activity.id} value={activity.id}>
                                {activity.name || 'Activité sans nom'}
                              </option>
                            ))}
                        </select>
                      </div>

                      {/* Sous-activité */}
                      {childActivities.length > 0 && (
                        <div>
                          <label htmlFor="childActivity" className="block text-sm font-medium text-gray-700 mb-2">
                            Sous-activité *
                          </label>
                          <select
                            id="childActivity"
                            value={formData.activityId > 0 ? formData.activityId : ""}
                            onChange={(e) => setFormData(prev => ({ ...prev, activityId: parseInt(e.target.value) }))}
                            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${
                              errors.activity ? 'border-red-300' : 'border-gray-300'
                            }`}
                          >
                            <option value="">Choisissez une sous-activité...</option>
                            {childActivities.filter(activity => activity && activity.id).map((activity) => (
                              <option key={activity.id} value={activity.id}>
                                {activity.name || 'Sous-activité sans nom'}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {errors.activity && (
                        <p className="mt-2 text-sm text-red-600 flex items-center space-x-1">
                          <ExclamationTriangleIcon className="w-4 h-4" />
                          <span>{errors.activity}</span>
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Étape 3: Période et Heures */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div className="text-center mb-8">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-full mb-4">
                        <CalendarIcon className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">Heures Travaillées</h3>
                      <p className="text-gray-600">Indiquez le nombre d&apos;heures travaillées</p>
                    </div>

                    <div className="max-w-2xl mx-auto space-y-6">


                      {activePeriod ? (
                        // Affichage simplifié quand il y a une période active
                        <div className="max-w-md mx-auto space-y-6">
                          {/* Message informatif sur la période */}
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-center justify-center space-x-2">
                              <CalendarIcon className="h-5 w-5 text-blue-600" />
                              <span className="text-blue-800 font-medium">
                                Période programmée : {activePeriod.year} - {activePeriod.semester}
                              </span>
                            </div>
                            <p className="text-blue-700 text-sm mt-1 text-center">
                              {activePeriod.semester === 'S1' ? 'Janvier - Juin' : 'Juillet - Décembre'}
                            </p>
                          </div>

                          {/* Heures seulement */}
                          <div>
                            <label htmlFor="hours" className="block text-sm font-medium text-gray-700 mb-2">
                              Heures travaillées *
                            </label>
                            <input
                              type="number"
                              id="hours"
                              min="0"
                              max={remainingHours}
                              step="0.5"
                              value={formData.hours === 0 ? "" : formData.hours}
                              onChange={(e) => {
                                const value = e.target.value;
                                setFormData(prev => ({ 
                                  ...prev, 
                                  hours: value === "" ? 0 : parseFloat(value) || 0 
                                }));
                              }}
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                              placeholder="Saisissez le nombre d'heures"
                            />
                            <p className="mt-1 text-xs text-gray-500">
                              Maximum {remainingHours}h restantes ce semestre
                            </p>
                          </div>
                        </div>
                      ) : (
                        // Affichage complet quand il n'y a pas de période active
                        <div className="grid md:grid-cols-3 gap-4">
                          {/* Année */}
                          <div>
                            <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-2">
                              Année *
                            </label>
                            <select
                              id="year"
                              value={formData.year}
                              onChange={(e) => setFormData(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 ${
                                errors.year ? 'border-red-300' : 'border-gray-300'
                              }`}
                            >
                              {Array.from({ length: 3 }, (_, i) => new Date().getFullYear() + i).map(year => (
                                <option key={year} value={year}>
                                  {year}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Semestre */}
                          <div>
                            <label htmlFor="semester" className="block text-sm font-medium text-gray-700 mb-2">
                              Semestre *
                            </label>
                            <select
                              id="semester"
                              value={formData.semester}
                              onChange={(e) => setFormData(prev => ({ ...prev, semester: e.target.value as "S1" | "S2" }))}
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                            >
                              <option value="S1">Semestre 1 (Janvier - Juin)</option>
                              <option value="S2">Semestre 2 (Juillet - Décembre)</option>
                            </select>
                          </div>

                          {/* Heures */}
                          <div>
                            <label htmlFor="hours" className="block text-sm font-medium text-gray-700 mb-2">
                              Heures travaillées *
                            </label>
                            <input
                              type="number"
                              id="hours"
                              min="0"
                              max={remainingHours}
                              step="0.5"
                              value={formData.hours === 0 ? "" : formData.hours}
                              onChange={(e) => {
                                const value = e.target.value;
                                setFormData(prev => ({ 
                                  ...prev, 
                                  hours: value === "" ? 0 : parseFloat(value) || 0 
                                }));
                              }}
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                              placeholder="Saisissez le nombre d'heures"
                            />
                            <p className="mt-1 text-xs text-gray-500">
                              Maximum {remainingHours}h restantes ce semestre
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Commentaire */}
                      <div>
                        <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
                          Commentaire (optionnel)
                        </label>
                        <textarea
                          id="comment"
                          rows={3}
                          value={formData.comment}
                          onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                          placeholder="Décrivez brièvement le travail effectué..."
                        />
                      </div>

                                            {/* Affichage des erreurs */}
                      {errors.period && (
                        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                          <div className="flex items-center space-x-2">
                            <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
                            <span className="text-red-800 font-medium">{errors.period}</span>
                          </div>
                        </div>
                      )}

                      {/* Les erreurs ne s'affichent que lors de la soumission finale */}
                    </div>
                  </div>
                )}

                {/* Navigation entre étapes */}
                <div className="flex items-center justify-between mt-12">
                  <button
                    type="button"
                    onClick={() => router.push("/")}
                    className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors duration-200"
                  >
                    Annuler
                  </button>
                  
                  <div className="flex space-x-4">
                    {currentStep > 1 && (
                      <button
                        type="button"
                        onClick={prevStep}
                        className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors duration-200"
                      >
                        Précédent
                      </button>
                    )}
                    
                    {currentStep < totalSteps ? (
                      <button
                        type="button"
                        onClick={nextStep}
                        className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl
                                 hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg
                                 transform hover:-translate-y-0.5"
                      >
                        Suivant
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={submitting}
                        className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl
                                 hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-md hover:shadow-lg
                                 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {submitting ? (
                          <div className="flex items-center space-x-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Enregistrement...</span>
                          </div>
                        ) : (
                          "Enregistrer l'entrée de temps"
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </RoleBasedProtectedRoute>
  );
}
