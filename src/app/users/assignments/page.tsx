// app/users/assignments/page.tsx
"use client";

import { Fragment, useState, useEffect } from "react";
import { Combobox, Transition } from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import { PlusIcon, PencilIcon, TrashIcon, UserGroupIcon, DocumentIcon } from "@heroicons/react/24/outline";

type FormData = {
  userId: number;
  projectId: number;
  allocationPercentage: number;
};

type ProjectAssignment = {
  projectId: number;
  allocationPercentage: number;
};

type Errors = Partial<Record<keyof FormData, string>>;
type User = {
  id: number;
  name: string;
  indice: string;
  projects: {
    project: { id: number; name: string; projectNumber: string };
    allocationPercentage: number;
    userId_projectId: string;  // ajout de la clé composite
  }[];
};
type Project = { id: number; name: string; projectNumber: string };

export default function UserAssignmentsPage() {
  const [formData, setFormData] = useState<FormData>({
    userId: 0,
    projectId: 0,
    allocationPercentage: 0,
  });
  const [pendingAssignments, setPendingAssignments] = useState<ProjectAssignment[]>([]);
  const [totalAllocation, setTotalAllocation] = useState(0);
  const [editAssignment, setEditAssignment] = useState<{
    userId: number;
    projectId: number;
  } | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [message, setMessage] = useState<string>("");
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [userQuery, setUserQuery] = useState("");
  const [projectQuery, setProjectQuery] = useState("");

  const filteredUsers = userQuery === ""
    ? users
    : users.filter((user) => 
        user.name.toLowerCase().includes(userQuery.toLowerCase()) ||
        user.indice.toLowerCase().includes(userQuery.toLowerCase())
      );

  const filteredProjects = projectQuery === ""
    ? projects
    : projects.filter((project) =>
        project.name.toLowerCase().includes(projectQuery.toLowerCase()) ||
        project.projectNumber.toLowerCase().includes(projectQuery.toLowerCase())
      );

  useEffect(() => {
    fetchUsers();
    fetchProjects();
  }, []);

  const fetchUsers = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("Pas de token trouvé");
      setMessage("Vous devez être connecté pour accéder à cette ressource");
      return;
    }

    try {
      const res = await fetch("/api/user", {
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      
      if (!res.ok) {
        throw new Error("Erreur lors de la récupération des utilisateurs");
      }

      const data = await res.json();
      
      const usersWithProjects = await Promise.all(
        data.map(async (user: { id: number; name: string; indice: string }) => {
          try {
            const projectsRes = await fetch(`/api/projects/users/${user.id}`, {
              headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
              }
            });

            if (!projectsRes.ok) {
              const errorData = await projectsRes.json();
              console.error(`Erreur pour l'utilisateur ${user.id}:`, errorData);
              return { ...user, projects: [] };
            }

            const projectsData = await projectsRes.json();
            return { ...user, projects: projectsData };
          } catch (error) {
            console.error(`Erreur pour l'utilisateur ${user.id}:`, error);
            return { ...user, projects: [] };
          }
        })
      );

      setUsers(usersWithProjects);
    } catch (error) {
      console.error("Erreur lors de la récupération des données:", error);
      setMessage("Erreur lors de la récupération des données des utilisateurs");
    }
  };

  const fetchProjects = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("Pas de token trouvé");
      return;
    }
    
    try {
      const res = await fetch("/api/projects", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        credentials: "include"
      });
      const data = await res.json();
      if (res.ok) setProjects(data);
    } catch (error) {
      console.error("Erreur lors de la récupération des projets:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation du pourcentage
    if (formData.allocationPercentage <= 0 || formData.allocationPercentage > 100) {
      setErrors({
        allocationPercentage: "Le pourcentage doit être entre 1 et 100"
      });
      return;
    }
  
    if (formData.userId === 0 || formData.projectId === 0) {
      setErrors({
        userId: formData.userId === 0 ? "Veuillez sélectionner un utilisateur" : undefined,
        projectId: formData.projectId === 0 ? "Veuillez sélectionner un projet" : undefined,
      });
      return;
    }
  
    // Calcul du total des allocations en cours
    const existingAssignments = users.find((u) => u.id === formData.userId)?.projects || [];
    const currentTotalFromDB = existingAssignments
      .filter((p) => !pendingAssignments.some(pa => pa.projectId === p.project.id))
      .reduce((sum, p) => sum + p.allocationPercentage, 0);
    
    const pendingTotal = pendingAssignments.reduce((sum, p) => sum + p.allocationPercentage, 0);
    const newTotal = currentTotalFromDB + pendingTotal + formData.allocationPercentage;
    
    if (newTotal > 100) {
      setErrors({ 
        allocationPercentage: `Le total des pourcentages (${newTotal}%) dépasse 100%` 
      });
      return;
    }

    // Ajouter à la liste des assignations en attente
    const newAssignment: ProjectAssignment = {
      projectId: formData.projectId,
      allocationPercentage: formData.allocationPercentage
    };
    
    setPendingAssignments([...pendingAssignments, newAssignment]);
    setTotalAllocation(newTotal);

    // Si on atteint 100%, soumettre toutes les assignations
    if (newTotal === 100) {
      await submitAssignments();
    } else {
      // Réinitialiser le formulaire pour un nouveau projet
      setFormData({
        ...formData,
        projectId: 0,
        allocationPercentage: 0
      });
      setErrors({});
    }
  };
  const submitAssignments = async () => {
    const token = localStorage.getItem("token");
    
    try {
      // Soumettre toutes les assignations en parallèle
      const assignmentPromises = pendingAssignments.map(assignment => {
        const assignmentData = {
          userId: formData.userId,
          projectId: assignment.projectId,
          allocationPercentage: assignment.allocationPercentage
        };
        
        return fetch(`/api/projects/${assignment.projectId}/users`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(assignmentData),
        });
      });

      const responses = await Promise.allSettled(assignmentPromises);
      
      // Vérifier s'il y a eu des erreurs
      const errors = responses.filter(
        (response): response is PromiseRejectedResult => response.status === 'rejected'
      );
      
      if (errors.length > 0 || responses.some(r => r.status === 'fulfilled' && !r.value.ok)) {
        throw new Error("Erreur lors de la création d'une ou plusieurs assignations");
      }

      setMessage("Assignations créées avec succès");
      setErrors({});
      setFormData({
        userId: 0,
        projectId: 0,
        allocationPercentage: 0,
      });
      setPendingAssignments([]);
      setTotalAllocation(0);
      setIsModalOpen(false);
      fetchUsers();
    } catch (error: unknown) {
      setMessage(`Erreur lors de la création des assignations: ${error instanceof Error ? error.message : 'Une erreur est survenue'}`);
    }
  };

  const handleEdit = (userId: number, projectId: number) => {
    const user = users.find((u) => u.id === userId);
    const project = user?.projects.find((p) => p.project.id === projectId);
    if (project) {
      setEditAssignment({ userId, projectId });
      setFormData({
        userId,
        projectId,
        allocationPercentage: project.allocationPercentage,
      });
      setIsModalOpen(true);
    }
  };

  const handleDelete = async (userId: number, projectId: number) => {
    const confirmed = window.confirm(
      "Voulez-vous vraiment supprimer cette assignation ?"
    );
    if (!confirmed) return;

    const token = localStorage.getItem("token");
    const res = await fetch(`/api/projects/${projectId}/users`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ userId }),
    });
    const data = await res.json();

    if (res.ok) {
      setMessage("Assignation supprimée");
      fetchUsers();
    } else {
      setMessage(data.message);
    }
  };

  const openCreateModal = () => {
    setEditAssignment(null);
    setFormData({
      userId: 0,
      projectId: 0,
      allocationPercentage: 0,
    });
    setErrors({});
    setMessage("");
    setIsModalOpen(true);
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUsers = users.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(users.length / itemsPerPage);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="relative overflow-hidden bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 p-6 mb-8">
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                  <UserGroupIcon className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Gestion des Assignations
                </h1>
              </div>
              <button
                onClick={openCreateModal}
                className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl
                         hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg
                         transform hover:-translate-y-0.5"
              >
                <PlusIcon className="w-5 h-5 mr-2" />
                Nouvelle Assignation
              </button>
            </div>
          </div>

          {message && (
            <div 
              className={`mb-6 p-4 rounded-xl message-container
                ${message.includes("créée") || message.includes("mise à jour") || message.includes("supprimée")
                  ? "bg-green-50 border border-green-200 text-green-600" 
                  : "bg-red-50 border border-red-200 text-red-600"
                }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm">{message}</p>
                <div className="w-20 h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-current message-progress" />
                </div>
              </div>
            </div>
          )}

          {/* Users List */}
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="px-6 py-4 text-left">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Utilisateur
                      </span>
                    </th>
                    <th className="px-6 py-4 text-left">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Projets assignés
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {currentUsers.map((user) => (
                    <tr key={user.id} className="group hover:bg-gray-50/50 transition-colors duration-200">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                            <UserGroupIcon className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{user.name}</p>
                            <p className="text-xs text-gray-500">{user.indice}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {user.projects.length > 0 ? (
                          <div className="space-y-2">
                            {user.projects.map((assignment) => (
                              <div
                                key={assignment.userId_projectId}
                                className="flex items-center justify-between p-2 rounded-lg bg-gray-50 group-hover:bg-white transition-colors duration-200"
                              >
                                <div className="flex items-center space-x-3">
                                  <DocumentIcon className="w-4 h-4 text-gray-400" />
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">
                                      {assignment.project.name}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {assignment.project.projectNumber}
                                    </p>
                                  </div>
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                                    {assignment.allocationPercentage}%
                                  </span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => handleEdit(user.id, assignment.project.id)}
                                    className="p-1 text-blue-600 hover:text-blue-700 transition-colors"
                                    title="Edit assignment"
                                  >
                                    <PencilIcon className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(user.id, assignment.project.id)}
                                    className="p-1 text-red-600 hover:text-red-700 transition-colors"
                                    title="Delete assignment"
                                  >
                                    <TrashIcon className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">Aucun projet assigné</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Affichage de {indexOfFirstItem + 1} à{" "}
                  {Math.min(indexOfLastItem, users.length)} sur {users.length} utilisateurs
                </p>
                <div className="flex space-x-2">
                  <button
                    key="prev"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200
                            ${currentPage === 1
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
                      }`}
                  >
                    Précédent
                  </button>
                  {Array.from({ length: totalPages }, (_, index) => (
                    <button
                      key={`page-${index + 1}`}
                      onClick={() => handlePageChange(index + 1)}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200
                              ${currentPage === index + 1
                          ? "bg-blue-600 text-white"
                          : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
                        }`}
                    >
                      {index + 1}
                    </button>
                  ))}
                  <button
                    key="next"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200
                            ${currentPage === totalPages
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
                      }`}
                  >
                    Suivant
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Modal */}
          {isModalOpen && (
            <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex justify-center items-center z-50 transition-all duration-300 p-4 overflow-y-auto">
              <div className="relative w-full max-w-md mx-auto bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl 
                          transform transition-all duration-300 ease-out scale-100 opacity-100 border border-white/20
                          sm:p-8 p-4">
                {/* Modal Content */}
                <div className="mb-6 sm:mb-8">
                  <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    {editAssignment ? "Modifier l'assignation" : "Nouvelle assignation"}
                  </h2>
                  <p className="text-gray-500 mt-2 text-sm">
                    {editAssignment 
                      ? "Modifiez les informations de l'assignation" 
                      : "Remplissez les informations pour créer une nouvelle assignation"}
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                  <div className="space-y-4">
                    {/* Liste des assignations en cours */}
                    {pendingAssignments.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium text-gray-700">Assignations en cours</h3>
                        <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                          {pendingAssignments.map((assignment, index) => {
                            const project = projects.find(p => p.id === assignment.projectId);
                            return (
                              <div key={index} className="flex justify-between items-center text-sm">
                                <span>{project?.name}</span>
                                <span className="font-medium">{assignment.allocationPercentage}%</span>
                              </div>
                            );
                          })}
                          <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between items-center">
                            <span className="font-medium">Total</span>
                            <span className="font-medium text-blue-600">{totalAllocation}%</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Champs du formulaire */}
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-700">Utilisateur</label>
                      <Combobox
                        value={users.find(u => u.id === formData.userId) || null}
                        onChange={(user) => {
                          setFormData({ ...formData, userId: user?.id || 0 });
                          setPendingAssignments([]);
                          setTotalAllocation(0);
                        }}
                        disabled={pendingAssignments.length > 0}
                      >
                        <div className="relative mt-1">
                          <div className="relative w-full cursor-default overflow-hidden rounded-xl bg-white text-left border border-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:ring-offset-2">
                            <Combobox.Input
                              className="w-full border-none py-2.5 pl-3 pr-10 text-sm leading-5 text-gray-900 focus:ring-0"
                              displayValue={(user: User) => user?.name || ""}
                              onChange={(event) => setUserQuery(event.target.value)}
                              placeholder="Rechercher un utilisateur..."
                            />
                            <Combobox.Button className="absolute inset-y-0 right-0 flex items-center px-2">
                              <ChevronUpDownIcon
                                className="h-5 w-5 text-gray-400"
                                aria-hidden="true"
                              />
                            </Combobox.Button>
                          </div>
                          <Transition
                            as={Fragment}
                            leave="transition ease-in duration-100"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                            afterLeave={() => setUserQuery("")}
                          >
                            <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                              {filteredUsers.length === 0 && userQuery !== "" ? (
                                <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                                  Aucun utilisateur trouvé.
                                </div>
                              ) : (
                                filteredUsers.map((user) => (
                                  <Combobox.Option
                                    key={user.id}
                                    className={({ active }) =>
                                      `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                        active ? 'bg-blue-600 text-white' : 'text-gray-900'
                                      }`
                                    }
                                    value={user}
                                  >
                                    {({ selected, active }) => (
                                      <>
                                        <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                          {user.name} ({user.indice})
                                        </span>
                                        {selected ? (
                                          <span
                                            className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                                              active ? 'text-white' : 'text-blue-600'
                                            }`}
                                          >
                                            <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                          </span>
                                        ) : null}
                                      </>
                                    )}
                                  </Combobox.Option>
                                ))
                              )}
                            </Combobox.Options>
                          </Transition>
                        </div>
                      </Combobox>
                      {errors.userId && (
                        <p className="text-red-500 text-sm mt-1">{errors.userId}</p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-700">Projet</label>
                      <Combobox
                        value={projects.find(p => p.id === formData.projectId) || null}
                        onChange={(project) => setFormData({ ...formData, projectId: project?.id || 0 })}
                      >
                        <div className="relative mt-1">
                          <div className="relative w-full cursor-default overflow-hidden rounded-xl bg-white text-left border border-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:ring-offset-2">
                            <Combobox.Input
                              className="w-full border-none py-2.5 pl-3 pr-10 text-sm leading-5 text-gray-900 focus:ring-0"
                              displayValue={(project: Project) => project?.name || ""}
                              onChange={(event) => setProjectQuery(event.target.value)}
                              placeholder="Rechercher un projet..."
                            />
                            <Combobox.Button className="absolute inset-y-0 right-0 flex items-center px-2">
                              <ChevronUpDownIcon
                                className="h-5 w-5 text-gray-400"
                                aria-hidden="true"
                              />
                            </Combobox.Button>
                          </div>
                          <Transition
                            as={Fragment}
                            leave="transition ease-in duration-100"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                            afterLeave={() => setProjectQuery("")}
                          >
                            <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                              {filteredProjects.length === 0 && projectQuery !== "" ? (
                                <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                                  Aucun projet trouvé.
                                </div>
                              ) : (
                                filteredProjects.map((project) => (
                                  <Combobox.Option
                                    key={project.id}
                                    className={({ active }) =>
                                      `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                        active ? 'bg-blue-600 text-white' : 'text-gray-900'
                                      }`
                                    }
                                    value={project}
                                  >
                                    {({ selected, active }) => (
                                      <>
                                        <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                          {project.name} ({project.projectNumber})
                                        </span>
                                        {selected ? (
                                          <span
                                            className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                                              active ? 'text-white' : 'text-blue-600'
                                            }`}
                                          >
                                            <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                          </span>
                                        ) : null}
                                      </>
                                    )}
                                  </Combobox.Option>
                                ))
                              )}
                            </Combobox.Options>
                          </Transition>
                        </div>
                      </Combobox>
                      {errors.projectId && (
                        <p className="text-red-500 text-sm mt-1">{errors.projectId}</p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-700">
                        Pourcentage d&#39;allocation
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        step="1"
                        required
                        placeholder="Pourcentage d'allocation (1-100)"
                        value={formData.allocationPercentage || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            allocationPercentage: Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)),
                          })
                        }
                        className="w-full p-2.5 sm:p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 
                                 focus:ring-blue-500/40 focus:border-blue-500 transition-all duration-200 
                                 bg-white/50 backdrop-blur-sm text-sm sm:text-base"
                      />
                      {errors.allocationPercentage && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.allocationPercentage}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        Le pourcentage doit être compris entre 1 et 100
                      </p>
                    </div>
                  </div>

                  {/* Buttons container */}
                  <div className="flex flex-col-reverse sm:flex-row justify-end space-y-4 sm:space-y-0 sm:space-x-3 
                              mt-6 sm:mt-8 pt-4 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => {
                        setIsModalOpen(false);
                        setPendingAssignments([]);
                        setTotalAllocation(0);
                      }}
                      className="w-full sm:w-auto px-4 sm:px-6 py-2.5 rounded-xl border border-gray-300 
                               text-gray-700 hover:bg-gray-50 transition-all duration-200 text-sm sm:text-base"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={!formData.userId || !formData.projectId || !formData.allocationPercentage}
                      className={`w-full sm:w-auto px-4 sm:px-6 py-2.5 rounded-xl transition-all duration-200 
                               text-sm sm:text-base ${
                                 totalAllocation === 100
                                   ? "bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800"
                                   : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700"
                               } ${
                                 (!formData.userId || !formData.projectId || !formData.allocationPercentage)
                                   ? "opacity-50 cursor-not-allowed"
                                   : "shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                               }`}
                    >
                      {totalAllocation === 100 ? "Terminer les assignations" : "Ajouter le projet"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
