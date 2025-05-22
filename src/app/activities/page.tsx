"use client";

import { useState, useEffect } from "react";
import { z } from "zod";
import { activitySchema } from "@/lib/validation";
import Navbar from "@/components/Navbar";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/outline";
import ConfirmationModal from "@/components/ConfirmationModal";
import RoleBasedProtectedRoute from "@/components/RoleBasedProtectedRoute";

type FormData = z.infer<typeof activitySchema> & { id?: number };
type Errors = Partial<Record<keyof FormData, string>>;
type Activity = {
  id: number;
  name: string;
  parentId: number | null;
  parent?: { id: number; name: string };
  subActivities: Activity[];
};

export default function ActivitiesPage() {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    parentId: undefined,
  });
  const [editActivity, setEditActivity] = useState<Activity | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [message, setMessage] = useState<string>("");
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [deleteActivityId, setDeleteActivityId] = useState<number | null>(null);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentActivities = activities.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(activities.length / itemsPerPage);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/activities", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setActivities(data);
    } catch (error) {
      console.error("Erreur lors de la récupération des fonctions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const schema = editActivity ? activitySchema.partial() : activitySchema;
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
    const url = editActivity ? "/api/activities" : "/api/activities";
    const method = editActivity ? "PUT" : "POST";
    const body = editActivity
      ? { ...result.data, id: editActivity.id }
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
      setMessage(editActivity ? "Fonction mise à jour" : "Fonction créée");
      setErrors({});
      setFormData({ name: "", parentId: undefined });
      setEditActivity(null);
      setIsModalOpen(false);
      fetchActivities();
    } else {
      setMessage(data.message);
    }
  };

  const handleEdit = (activity: Activity) => {
    setEditActivity(activity);
    setFormData({
      name: activity.name,
      parentId: activity.parentId || undefined,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    setDeleteActivityId(id);
  };

  const confirmDelete = async () => {
    if (!deleteActivityId) return;

    const token = localStorage.getItem("token");
    const res = await fetch("/api/activities", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ id: deleteActivityId }),
    });
    const data = await res.json();

    if (res.ok) {
      setMessage("Fonction supprimée avec succès");
      fetchActivities();
    } else {
      setMessage(data.message || "Une erreur est survenue");
    }
    setDeleteActivityId(null);
  };

  const openCreateModal = () => {
    setEditActivity(null);
    setFormData({ name: "", parentId: undefined });
    setErrors({});
    setMessage("");
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <RoleBasedProtectedRoute allowedRoles={["ADMIN", "PMSU"]}>
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
      </RoleBasedProtectedRoute>
    );
  }

  return (
    <RoleBasedProtectedRoute allowedRoles={["ADMIN", "PMSU"]}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="relative overflow-hidden bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 p-6 mb-8">
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                  <ClipboardDocumentListIcon className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Gestion des Fonctions
                </h1>
              </div>
              <button
                onClick={openCreateModal}
                className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl
                         hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg
                         transform hover:-translate-y-0.5"
              >
                <PlusIcon className="w-5 h-5 mr-2" />
                Nouvelle Fonction
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

          {/* Table Container */}
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    {[
                      "Nom",
                      "Fonction parente",
                      "Sous-Fonctions",
                      "Actions",
                    ].map((header) => (
                      <th key={header} className="px-6 py-4 text-left">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {header}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {currentActivities.map((activity) => (
                    <tr
                      key={activity.id}
                      className="group hover:bg-gray-50/50 transition-colors duration-200"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div
                            className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg 
                                        group-hover:scale-110 transition-transform duration-300"
                          >
                            <ClipboardDocumentListIcon className="w-4 h-4 text-white" />
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            {activity.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {activity.parent ? (
                          <span
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                       bg-blue-50 text-blue-700"
                          >
                            {activity.parent.name}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {activity.subActivities.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {activity.subActivities.map((sub) => (
                              <span
                                key={sub.id}
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                                        bg-indigo-50 text-indigo-700"
                              >
                                {sub.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => handleEdit(activity)}
                            className="p-1 text-blue-600 hover:text-blue-700 transition-colors"
                          >
                            <PencilIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(activity.id)}
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
            <div className="px-6 py-4 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Affichage de {indexOfFirstItem + 1} à{" "}
                  {Math.min(indexOfLastItem, activities.length)} sur {activities.length} fonctions
                </p>
                <div className="flex space-x-2">
                  <button
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
                  {[...Array(totalPages)].map((_, index) => (
                    <button
                      key={index + 1}
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
            <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex justify-center items-center z-50 transition-all duration-300">
              <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-md p-8 transform transition-all duration-300 ease-out scale-100 opacity-100 border border-white/20">
                <div className="mb-8">
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    {editActivity ? "Modifier la fonction" : "Nouvelle fonction"}
                  </h2>
                  <p className="text-gray-500 mt-2 text-sm">
                    {editActivity 
                      ? "Modifiez les informations de la fonction" 
                      : "Remplissez les informations pour créer une nouvelle fonction"}
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">
                      Nom de la fonction
                    </label>
                    <input
                      type="text"
                      placeholder="Entrez le nom de la fonction"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                    />
                    {errors.name && (
                      <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">
                      Fonction parente
                    </label>
                    <select
                      value={formData.parentId || ""}
                      onChange={(e) => setFormData({
                        ...formData,
                        parentId: parseInt(e.target.value) || undefined,
                      })}
                      className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                    >
                      <option value="">Aucune fonction parente</option>
                      {activities
                        .filter((a) => a.id !== (editActivity?.id || 0))
                        .map((activity) => (
                          <option key={activity.id} value={activity.id}>
                            {activity.name}
                          </option>
                        ))}
                    </select>
                    {errors.parentId && (
                      <p className="text-red-500 text-xs mt-1">{errors.parentId}</p>
                    )}
                  </div>

                  <div className="flex justify-end space-x-3 mt-8 pt-4 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
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
                      {editActivity ? "Mettre à jour" : "Créer"}
                    </button>
                  </div>
                </form>

                {message && (
                  <div className={`mt-4 p-3 rounded-xl ${
                    message.includes("réussi") 
                      ? "bg-green-50 text-green-600 border border-green-100" 
                      : "bg-red-50 text-red-600 border border-red-100"
                  }`}>
                    <p className="text-sm text-center">{message}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      <ConfirmationModal
        isOpen={deleteActivityId !== null}
        onClose={() => setDeleteActivityId(null)}
        onConfirm={confirmDelete}
        title="Confirmer la suppression"
        message="Êtes-vous sûr de vouloir supprimer cette fonction et ses sous-fonctions ? Cette action est irréversible."
      />
    </RoleBasedProtectedRoute>
  );
}
