"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { projectSchema } from "@/lib/validation";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  FolderIcon,
} from "@heroicons/react/24/outline";
import ConfirmationModal from "@/components/ConfirmationModal";

type FormData = z.infer<typeof projectSchema> & { id?: number };
type Errors = Partial<Record<keyof FormData, string>>;
type Project = {
  id: number;
  name: string;
  projectNumber: string;
  projectType: string;
  staffAccess: "ALL" | "OPERATION" | "PROGRAMME" | "SUPPORT";
  users: {
    id: number;
    name: string;
    indice: string;
  }[];
};

export default function ProjectsPage() {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    projectNumber: "",
    projectType: "",
    staffAccess: "ALL",
  });
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [message, setMessage] = useState<string>("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [deleteProjectId, setDeleteProjectId] = useState<number | null>(null);

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/projects", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setProjects(data);
    } catch (error) {
      console.error("Erreur lors de la récupération des projets:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    // Empty implementation as it's not used
    return Promise.resolve();
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    Promise.all([fetchProjects(), fetchUsers()]).catch(console.error);
  }, [router]);

  // Ajouter cet useEffect pour gérer la disparition du message
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage("");
      }, 10000); // 10 secondes
      fetchProjects().catch(console.error);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const schema = editProject ? projectSchema.partial() : projectSchema;
    const result = schema.safeParse(formData);

    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      setErrors(
        Object.fromEntries(
          Object.entries(fieldErrors).map(([key, value]) => [key, value?.[0]])
        ) as Errors
      );
      return;
    }

    const token = localStorage.getItem("token");
    const url = editProject ? "/api/projects" : "/api/projects";
    const method = editProject ? "PUT" : "POST";
    const body = editProject
      ? { ...result.data, id: editProject.id }
      : result.data;

    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();

    if (res.ok) {
      setMessage(editProject ? "Projet mis à jour" : "Projet créé avec succès");
      setErrors({});
      setFormData({
        name: "",
        projectNumber: "",
        projectType: "",
        staffAccess: "ALL",
      });
      setEditProject(null);
      setIsProjectModalOpen(false);
      fetchProjects();
    } else {
      setMessage(data.message);
    }
  };

  const handleEdit = (project: Project) => {
    setEditProject(project);
    setFormData({
      name: project.name,
      projectNumber: project.projectNumber,
      projectType: project.projectType,
      staffAccess: project.staffAccess,
    });
    setIsProjectModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    setDeleteProjectId(id);
  };

  const confirmDelete = async () => {
    if (!deleteProjectId) return;

    const token = localStorage.getItem("token");
    const res = await fetch("/api/projects", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ id: deleteProjectId }),
    });
    const data = await res.json();

    if (res.ok) {
      setMessage("Projet supprimé avec succès");
      fetchProjects();
    } else {
      setMessage(data.message);
    }
    setDeleteProjectId(null);
  };

  const openCreateModal = () => {
    setEditProject(null);
    setFormData({
      name: "",
      projectNumber: "",
      projectType: "",
      staffAccess: "ALL",
    });
    setErrors({});
    setMessage("");
    setIsProjectModalOpen(true);
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProjects = projects.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(projects.length / itemsPerPage);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
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
          {/* Header */}
          <div className="relative overflow-hidden bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 p-6 mb-8">
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                  <FolderIcon className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Gestion des Projets
                </h1>
              </div>
              <button
                onClick={openCreateModal}
                className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl
                         hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg
                         transform hover:-translate-y-0.5"
              >
                <PlusIcon className="w-5 h-5 mr-2" />
                Nouveau Projet
              </button>
            </div>
          </div>

          {/* Modifier le composant de message pour ajouter une animation de fondu */}
          {message && (
            <div
              className={`mb-6 p-4 rounded-xl message-container
                ${
                  message.includes("succès") ||
                  message.includes("mis à jour") ||
                  message.includes("supprimé")
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

          {/* Table Container */}
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    {["Nom", "Numéro", "Accès Staff", "Actions"].map(
                      (header) => (
                        <th key={header} className="px-6 py-4 text-left">
                          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {header}
                          </span>
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {currentProjects.map((project) => (
                    <tr
                      key={project.id}
                      className="group hover:bg-gray-50/50 transition-colors duration-200"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div
                            className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg 
                                      group-hover:scale-110 transition-transform duration-300"
                          >
                            <FolderIcon className="w-4 h-4 text-white" />
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            {project.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">
                          {project.projectNumber}
                        </span>
                      </td>
                      
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">
                          {project.staffAccess}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <button
                            title="Modifier le projet"
                            onClick={() => handleEdit(project)}
                            className="p-1 text-blue-600 hover:text-blue-700 transition-colors"
                          >
                            <PencilIcon className="w-5 h-5" />
                          </button>

                          <button
                            title="Supprimer le projet"
                            onClick={() => handleDelete(project.id)}
                            className="p-1 text-red-600 hover:text-red-700 transition-colors"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="px-6 py-4 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Affichage de {indexOfFirstItem + 1} à{" "}
                  {Math.min(indexOfLastItem, projects.length)} sur{" "}
                  {projects.length} projets
                </p>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200
                            ${
                              currentPage === 1
                                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
                            }`}
                  >
                    Précédent
                  </button>
                  {[...Array(totalPages)].map((_, index) => (
                    <button
                      key={index + 1}
                      onClick={() => handlePageChange(index + 1)}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200
                              ${
                                currentPage === index + 1
                                  ? "bg-blue-600 text-white"
                                  : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
                              }`}
                    >
                      {index + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200
                            ${
                              currentPage === totalPages
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

          {/* Project Modal */}
          {isProjectModalOpen && (
            <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex justify-center items-center z-50 transition-all duration-300">
              <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-md p-8 transform transition-all duration-300 ease-out scale-100 opacity-100 border border-white/20">
                <div className="mb-8">
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    {editProject ? "Modifier le projet" : "Nouveau projet"}
                  </h2>
                  <p className="text-gray-500 mt-2 text-sm">
                    {editProject
                      ? "Modifiez les informations du projet"
                      : "Remplissez les informations pour créer un nouveau projet"}
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">
                      Nom du projet
                    </label>
                    <input
                      type="text"
                      placeholder="Entrez le nom du projet"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                    />
                    {errors.name && (
                      <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">
                      Numéro du projet
                    </label>
                    <input
                      type="text"
                      placeholder="Entrez le numéro du projet"
                      value={formData.projectNumber}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          projectNumber: e.target.value,
                        })
                      }
                      className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                    />
                    {errors.projectNumber && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.projectNumber}
                      </p>
                    )}
                  </div>

                  {/* <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">
                      Type de projet
                    </label>
                    <input
                      type="text"
                      placeholder="Entrez le type de projet"
                      value={formData.projectType}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          projectType: e.target.value,
                        })
                      }
                      className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                    />
                    {errors.projectType && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.projectType}
                      </p>
                    )}
                  </div> */}

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">
                      Accès au staff
                    </label>
                    <select
                      title="Sélectionner un type d'accès"
                      value={formData.staffAccess}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          staffAccess: e.target.value as
                            | "ALL"
                            | "OPERATION"
                            | "PROGRAMME"
                            | "SUPPORT",
                        })
                      }
                      className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                    >
                      <option value="">Sélectionner un type d&apos;accès</option>
                      <option value="ALL">Tous</option>
                      <option value="OPERATION">Opération</option>
                      <option value="PROGRAMME">Programme</option>
                      <option value="SUPPORT">Support</option>
                    </select>
                    {errors.staffAccess && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.staffAccess}
                      </p>
                    )}
                  </div>

                  <div className="flex justify-end space-x-3 mt-8 pt-4 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setIsProjectModalOpen(false)}
                      className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300/40"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl
                             hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg
                             transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    >
                      {editProject ? "Mettre à jour" : "Créer"}
                    </button>
                  </div>
                </form>

                {message && (
                  <div
                    className={`mt-4 p-3 rounded-xl ${
                      message.includes("réussi")
                        ? "bg-green-50 text-green-600 border border-green-100"
                        : "bg-red-50 text-red-600 border border-red-100"
                    }`}
                  >
                    <p className="text-sm text-center">{message}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <ConfirmationModal
            isOpen={deleteProjectId !== null}
            onClose={() => setDeleteProjectId(null)}
            onConfirm={confirmDelete}
            title="Confirmer la suppression"
            message="Êtes-vous sûr de vouloir supprimer ce projet ? Cette action est irréversible."
          />
        </div>
      </div>
    </ProtectedRoute>
  );
}
