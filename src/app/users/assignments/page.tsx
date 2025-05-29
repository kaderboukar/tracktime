// app/users/assignments/page.tsx
"use client";

import { Fragment, useState, useEffect } from "react";
import { Combobox, Transition } from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import { TrashIcon, ArrowDownTrayIcon, ArrowUpTrayIcon, PencilIcon } from "@heroicons/react/24/outline";

interface FormData {
  userId: number;
  projectId: number;
  allocationPercentage: number;
}

interface UserProject {
  project: { id: number; name: string; projectNumber: string };
  allocationPercentage: number;
  userId_projectId: string;
}

interface User {
  id: number;
  name: string;
  indice: string;
  projects: UserProject[];
}

interface Project {
  id: number;
  name: string;
  projectNumber: string;
}

interface ValidationResponse {
  success: boolean;
  message: string;
  data?: {
    totalAllocation: number;
    remainingAllocation: number;
    existingAssignment?: {
      project: {
        name: string;
        projectNumber: string;
      };
      allocationPercentage: number;
    };
  };
}

export default function UserAssignmentsPage() {
  const [formData, setFormData] = useState<FormData>({
    userId: 0,
    projectId: 0,
    allocationPercentage: 0,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' }>({ text: '', type: 'success' });
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [userQuery, setUserQuery] = useState("");
  const [projectQuery, setProjectQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [validationInfo, setValidationInfo] = useState<ValidationResponse["data"]>();
  const [isEditing, setIsEditing] = useState(false);

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
      setMessage({ text: "Vous devez être connecté pour accéder à cette ressource", type: 'error' });
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
        data.map(async (user: { id: number; name: string; indice: string }, index: number) => {
          try {
            const projectsRes = await fetch(`/api/projects/users/${user.id}`, {
              headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
              }
            });

            if (!projectsRes.ok) {
              console.error(`Erreur pour l'utilisateur ${user.id}`);
              return { ...user, projects: [], key: `user-${user.id}-${index}` };
            }

            const projectsData = await projectsRes.json();
            return { ...user, projects: projectsData.data.assignments, key: `user-${user.id}-${index}` };
          } catch (error) {
            console.error(`Erreur pour l'utilisateur ${user.id}:`, error);
            return { ...user, projects: [], key: `user-${user.id}-${index}` };
          }
        })
      );

      setUsers(usersWithProjects);
    } catch (error) {
      console.error("Erreur:", error);
      setMessage({ text: "Erreur lors de la récupération des utilisateurs", type: 'error' });
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
      console.error("Erreur:", error);
      setMessage({ text: "Erreur lors de la récupération des projets", type: 'error' });
    }
  };

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    setFormData(prev => ({ ...prev, userId: user.id }));

    // Calculer le total des assignations actuelles
    const totalAllocation = user.projects.reduce(
      (sum, p) => sum + p.allocationPercentage,
      0
    );

    setValidationInfo({
      totalAllocation,
      remainingAllocation: 100 - totalAllocation
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!formData.userId || !formData.projectId || !formData.allocationPercentage) {
      setErrors({
        userId: !formData.userId ? "Veuillez sélectionner un utilisateur" : undefined,
        projectId: !formData.projectId ? "Veuillez sélectionner un projet" : undefined,
        allocationPercentage: !formData.allocationPercentage ? "Veuillez spécifier un pourcentage" : undefined,
      });
      return;
    }

    if (formData.allocationPercentage <= 0 || formData.allocationPercentage > 100) {
      setErrors({
        allocationPercentage: "Le pourcentage doit être entre 1 et 100"
      });
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setMessage({ text: "Vous devez être connecté pour effectuer cette action", type: 'error' });
      return;
    }

    try {
      const res = await fetch(`/api/projects/${formData.projectId}/users`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          userId: formData.userId,
          allocationPercentage: formData.allocationPercentage
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({ text: data.message, type: 'error' });
        return;
      }

      // Mettre à jour l'interface utilisateur
      setMessage({ text: "Assignation créée avec succès", type: 'success' });
      setValidationInfo({
        totalAllocation: data.data.totalAllocation,
        remainingAllocation: 100 - data.data.totalAllocation
      });

      // Rafraîchir les données
      await fetchUsers();

      // Réinitialiser le formulaire
      setFormData({
        userId: selectedUser?.id || 0,
        projectId: 0,
        allocationPercentage: 0
      });

    } catch (error) {
      console.error("Erreur:", error);
      setMessage({ text: "Erreur lors de la création de l'assignation", type: 'error' });
    }
  };

  const handleEdit = (userId: number, projectId: number, allocationPercentage: number) => {
    setIsEditing(true);
    setFormData({
      userId,
      projectId,
      allocationPercentage
    });

    // Sélectionner l'utilisateur correspondant
    const user = users.find(u => u.id === userId);
    if (user) {
      setSelectedUser(user);
      handleUserSelect(user);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setFormData({
      userId: selectedUser?.id || 0,
      projectId: 0,
      allocationPercentage: 0
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!formData.userId || !formData.projectId || !formData.allocationPercentage) {
      setErrors({
        userId: !formData.userId ? "Veuillez sélectionner un utilisateur" : undefined,
        projectId: !formData.projectId ? "Veuillez sélectionner un projet" : undefined,
        allocationPercentage: !formData.allocationPercentage ? "Veuillez spécifier un pourcentage" : undefined,
      });
      return;
    }

    if (formData.allocationPercentage <= 0 || formData.allocationPercentage > 100) {
      setErrors({
        allocationPercentage: "Le pourcentage doit être entre 1 et 100"
      });
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setMessage({ text: "Vous devez être connecté pour effectuer cette action", type: 'error' });
      return;
    }

    try {
      const res = await fetch(`/api/projects/${formData.projectId}/users`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          userId: formData.userId,
          allocationPercentage: formData.allocationPercentage
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({ text: data.message, type: 'error' });
        return;
      }

      setMessage({ text: "Assignation mise à jour avec succès", type: 'success' });
      await fetchUsers();
      handleCancelEdit();

    } catch (error) {
      console.error("Erreur:", error);
      setMessage({ text: "Erreur lors de la mise à jour de l'assignation", type: 'error' });
    }
  };

  const handleDelete = async (userId: number, projectId: number) => {
    const token = localStorage.getItem("token");
    if (!token) {
      setMessage({ text: "Vous devez être connecté pour effectuer cette action", type: 'error' });
      return;
    }

    if (!confirm("Êtes-vous sûr de vouloir supprimer cette assignation ?")) {
      return;
    }

    try {
      const res = await fetch(`/api/projects/${projectId}/users`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ userId })
      });

      if (!res.ok) {
        const data = await res.json();
        setMessage({ text: data.message || "Erreur lors de la suppression", type: 'error' });
        return;
      }

      setMessage({ text: "Assignation supprimée avec succès", type: 'success' });
      await fetchUsers();

    } catch (error) {
      console.error("Erreur:", error);
      setMessage({ text: "Erreur lors de la suppression de l'assignation", type: 'error' });
    }
  };

  const handleDownloadTemplate = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setMessage({ text: "Vous devez être connecté pour télécharger le template", type: 'error' });
      return;
    }

    try {
      const response = await fetch("/api/projects/assignments/template", {
        headers: {
          "Authorization": `Bearer ${token}`,
        }
      });

      if (!response.ok) {
        throw new Error("Erreur lors du téléchargement du template");
      }

      // Créer un blob à partir de la réponse
      const blob = await response.blob();

      // Créer un lien de téléchargement
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = "modele_assignations.xlsx";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (error) {
      console.error("Erreur:", error);
      setMessage({ text: "Erreur lors du téléchargement du template", type: 'error' });
    }
  };

  const handleImportAssignments = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const token = localStorage.getItem("token");
    if (!token) {
      setMessage({ text: "Vous devez être connecté pour importer des assignations", type: 'error' });
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch("/api/projects/assignments/import", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Erreur lors de l'import");
      }

      setMessage({
        text: `Import terminé : ${data.results.success} assignations importées avec succès${data.results.errors.length > 0 ? `, ${data.results.errors.length} erreurs` : ''}`,
        type: data.results.errors.length > 0 ? 'error' : 'success'
      });

      // Rafraîchir les données
      await fetchUsers();

    } catch (error) {
      console.error("Erreur:", error);
      setMessage({ text: (error as Error).message || "Erreur lors de l'import", type: 'error' });
    }

    // Réinitialiser l'input file
    event.target.value = '';
  };

  // Pagination
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold">
                {isEditing ? "Modifier l'Assignation" : "Assignation des Projets aux Utilisateurs"}
              </h2>
              <div className="flex space-x-4">
                <label className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 cursor-pointer">
                  <ArrowUpTrayIcon className="h-5 w-5 mr-2" />
                  Importer
                  <input
                    type="file"
                    accept=".xlsx"
                    className="hidden"
                    onChange={handleImportAssignments}
                  />
                </label>
                <button
                  onClick={handleDownloadTemplate}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                >
                  <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                  Télécharger le template
                </button>
              </div>
            </div>

            {message.text && (
              <div className={`p-4 mb-4 rounded ${
                message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {message.text}
              </div>
            )}

            <form onSubmit={isEditing ? handleUpdate : handleSubmit} className="space-y-4">
              {/* Sélection de l'utilisateur */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Utilisateur</label>
                <Combobox value={selectedUser} onChange={handleUserSelect}>
                  <div className="relative mt-1">
                    <div className="relative w-full cursor-default overflow-hidden rounded-lg bg-white text-left border focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-teal-300 sm:text-sm">
                      <Combobox.Input
                        className="w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 focus:ring-0"
                        displayValue={(user: User) => user?.name || ''}
                        onChange={(event) => setUserQuery(event.target.value)}
                        placeholder="Sélectionner un utilisateur"
                      />
                      <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
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
                      afterLeave={() => setUserQuery('')}
                    >
                      <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                        {filteredUsers.length === 0 && userQuery !== '' ? (
                          <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                            Aucun utilisateur trouvé.
                          </div>
                        ) : (
                          filteredUsers.map((user) => (
                            <Combobox.Option
                              key={`user-option-${user.id}`}
                              className={({ active }) =>
                                `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                  active ? 'bg-teal-600 text-white' : 'text-gray-900'
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
                                        active ? 'text-white' : 'text-teal-600'
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
                {errors.userId && <p className="mt-1 text-sm text-red-600">{errors.userId}</p>}
              </div>

              {/* Sélection du projet */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Projet</label>
                <Combobox
                  value={projects.find(p => p.id === formData.projectId) || null}
                  onChange={(project: Project) => setFormData(prev => ({ ...prev, projectId: project.id }))}
                >
                  <div className="relative mt-1">
                    <div className="relative w-full cursor-default overflow-hidden rounded-lg bg-white text-left border focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-teal-300 sm:text-sm">
                      <Combobox.Input
                        className="w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 focus:ring-0"
                        displayValue={(project: Project) => project?.name || ''}
                        onChange={(event) => setProjectQuery(event.target.value)}
                        placeholder="Sélectionner un projet"
                      />
                      <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
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
                      afterLeave={() => setProjectQuery('')}
                    >
                      <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                        {filteredProjects.length === 0 && projectQuery !== '' ? (
                          <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                            Aucun projet trouvé.
                          </div>
                        ) : (
                          filteredProjects.map((project) => (
                            <Combobox.Option
                              key={`project-option-${project.id}`}
                              className={({ active }) =>
                                `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                  active ? 'bg-teal-600 text-white' : 'text-gray-900'
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
                                        active ? 'text-white' : 'text-teal-600'
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
                {errors.projectId && <p className="mt-1 text-sm text-red-600">{errors.projectId}</p>}
              </div>

              {/* Pourcentage d'allocation */}
              <div>
                <label className="block text-sm font-medium text-gray-700">                  Pourcentage d&apos;allocation
                </label>
                <input                  type="number"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm"
                  value={formData.allocationPercentage || ""}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    allocationPercentage: Number(e.target.value)
                  }))}
                  min="1"
                  max="100"
                />
                {errors.allocationPercentage && (
                  <p className="mt-1 text-sm text-red-600">{errors.allocationPercentage}</p>
                )}
                {validationInfo && (
                  <div className="mt-2 text-sm">
                    <p className="text-gray-600">
                      Total actuel: {validationInfo.totalAllocation}%
                    </p>
                    <p className={`${validationInfo.remainingAllocation > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      Reste disponible: {validationInfo.remainingAllocation}%
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3">
                {isEditing ? (
                  <>
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Mettre à jour
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({ userId: selectedUser?.id || 0, projectId: 0, allocationPercentage: 0 });
                        setErrors({});
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Réinitialiser
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                    >
                      Assigner
                    </button>
                  </>
                )}
              </div>
            </form>
          </div>

          {/* Liste des utilisateurs et leurs assignations */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-4 border-b">
              <h3 className="text-lg font-medium">Liste des Assignations</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Utilisateur
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Projets assignés
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedUsers.map((user) => {
                    const totalAllocation = user.projects.reduce(
                      (sum, p) => sum + p.allocationPercentage,
                      0
                    );

                    return (
                      <tr key={`user-row-${user.id}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {user.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {user.indice}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-2">
                            {user.projects.map((assignment, index) => (
                              <div
                                key={`assignment-${user.id}-${assignment.project.id}-${index}`}
                                className="flex items-center justify-between text-sm"
                              >
                                <span className="font-medium text-gray-900">
                                  {assignment.project.name}
                                </span>
                                <div className="flex items-center space-x-2">
                                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                    totalAllocation === 100
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {assignment.allocationPercentage}%
                                  </span>
                                  <button
                                    onClick={() => handleEdit(user.id, assignment.project.id, assignment.allocationPercentage)}
                                    className="text-blue-600 hover:text-blue-900"
                                    title="Modifier l'assignation"
                                  >
                                    <PencilIcon className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(user.id, assignment.project.id)}
                                    className="text-red-600 hover:text-red-900"
                                    title="Supprimer l'assignation"
                                  >
                                    <TrashIcon className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            totalAllocation === 100
                              ? 'bg-green-100 text-green-800'
                              : totalAllocation > 100
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {totalAllocation}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between items-center">
                  <button
                    onClick={() => setCurrentPage(page => Math.max(page - 1, 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-500"
                  >
                    Précédent
                  </button>
                  <span className="text-sm text-gray-700">
                    Page {currentPage} sur {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(page => Math.min(page + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-500"
                  >
                    Suivant
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
