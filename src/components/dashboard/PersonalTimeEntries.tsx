"use client";

import { useState, useEffect, useCallback } from "react";
import { EyeIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import ViewTimeEntryModal from "@/components/ViewTimeEntryModal";
import CreateTimeEntryModal from "@/components/CreateTimeEntryModal";
import ConfirmationModal from "@/components/ConfirmationModal";

interface TimeEntry {
  id: number;
  userId: number;
  projectId: number;
  activityId: number;
  hours: number;
  semester: "S1" | "S2";
  year: number;
  status: "PENDING" | "APPROVED" | "REJECTED" | "REVISED";
  comment?: string;
  createdAt: string;
  updatedAt: string;
  user: {
    name: string;
    indice: string;
    grade?: string;
    proformaCost?: number;
  };
  project: {
    name: string;
    projectNumber: string;
  };
  activity: {
    name: string;
  };
  validationHistory?: Array<{
    status: "PENDING" | "APPROVED" | "REJECTED" | "REVISED";
    comment?: string;
    createdAt: string;
    validator: {
      name: string;
      indice: string;
    };
  }>;
}

interface PersonalTimeEntriesProps {
  userId: number;
}

const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case "APPROVED":
      return "bg-green-50 text-green-700 border-green-200";
    case "REJECTED":
      return "bg-red-50 text-red-700 border-red-200";
    case "REVISED":
      return "bg-orange-50 text-orange-700 border-orange-200";
    default:
      return "bg-blue-50 text-blue-700 border-blue-200";
  }
};

const getStatusTranslation = (status: string) => {
  switch (status) {
    case "APPROVED":
      return "Approuvé";
    case "REJECTED":
      return "Rejeté";
    case "REVISED":
      return "En révision";
    default:
      return "En attente";
  }
};

export function PersonalTimeEntries({ userId }: PersonalTimeEntriesProps) {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<TimeEntry | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<TimeEntry | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage] = useState(5);

  // États pour le modal d'édition
  const [editFormData, setEditFormData] = useState({
    id: 0,
    userId: 0,
    projectId: 0,
    activityId: 0,
    hours: 0,
    semester: "S1" as "S1" | "S2",
    year: new Date().getFullYear(),
    comment: "",
  });

  const [activities, setActivities] = useState<Array<{
    id: number;
    name: string;
    parentId: number | null;
  }>>([]);
  const [projects, setProjects] = useState<Array<{
    id: number;
    name: string;
    projectNumber: string;
  }>>([]);
  const [parentActivity, setParentActivity] = useState<number | null>(null);
  const [childActivities, setChildActivities] = useState<Array<{
    id: number;
    name: string;
    parentId: number | null;
  }>>([]);

  const fetchActivities = useCallback(async () => {
    try {
      const response = await fetch("/api/activities");
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setActivities(data.data);
        }
      }
    } catch (error) {
      console.error("Erreur lors du chargement des activités:", error);
    }
  }, []);

  const fetchProjects = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(`/api/projects/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setProjects(data.data);
        }
      }
    } catch (error) {
      console.error("Erreur lors du chargement des projets:", error);
    }
  }, [userId]);

  const fetchTimeEntries = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(`/api/time-entries?userId=${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setTimeEntries(data.data);
        }
      }
    } catch (error) {
      console.error("Erreur lors du chargement des entrées:", error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchTimeEntries();
    fetchActivities();
    fetchProjects();
  }, [fetchTimeEntries, fetchActivities, fetchProjects]);

  const handleView = (entry: TimeEntry) => {
    setSelectedEntry(entry);
    setIsViewModalOpen(true);
  };

  const handleEdit = (entry: TimeEntry) => {
    setEditFormData({
      id: entry.id,
      userId: entry.userId,
      projectId: entry.projectId,
      activityId: entry.activityId,
      hours: entry.hours,
      semester: entry.semester,
      year: entry.year,
      comment: entry.comment || "",
    });
    setIsEditModalOpen(true);
  };

  const handleDelete = (entry: TimeEntry) => {
    setEntryToDelete(entry);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!entryToDelete) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(`/api/time-entries`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: entryToDelete.id }),
      });

      if (response.ok) {
        await fetchTimeEntries();
        setIsDeleteModalOpen(false);
        setEntryToDelete(null);
      }
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(`/api/time-entries`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editFormData),
      });

      if (response.ok) {
        await fetchTimeEntries();
        setIsEditModalOpen(false);
      }
    } catch (error) {
      console.error("Erreur lors de la modification:", error);
    }
  };

  const handleFormChange = (
    field: keyof typeof editFormData,
    value: number | string
  ) => {
    setEditFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleParentActivityChange = (activityId: number) => {
    setParentActivity(activityId);
    const children = activities.filter(
      (activity) => activity.parentId === activityId
    );
    setChildActivities(children);
    setEditFormData((prev) => ({ ...prev, activityId: 0 }));
  };

  // Filtrer les entrées selon le statut
  const filteredEntries = timeEntries.filter((entry) => {
    if (filterStatus === "ALL") return true;
    return entry.status === filterStatus;
  });

  // Pagination
  const indexOfLastEntry = currentPage * entriesPerPage;
  const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
  const currentEntries = filteredEntries.slice(indexOfFirstEntry, indexOfLastEntry);
  const totalPages = Math.ceil(filteredEntries.length / entriesPerPage);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Mes Entrées de Temps
          </h3>
          <p className="text-sm text-gray-600">
            Suivi de vos entrées et de leur statut de validation
          </p>
        </div>

        {/* Filtre par statut */}
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">Statut:</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="ALL">Tous</option>
            <option value="PENDING">En attente</option>
            <option value="APPROVED">Approuvé</option>
            <option value="REJECTED">Rejeté</option>
            <option value="REVISED">En révision</option>
          </select>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">
            {timeEntries.filter(e => e.status === "PENDING").length}
          </div>
          <div className="text-xs text-blue-600">En attente</div>
        </div>
        <div className="bg-green-50 p-3 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {timeEntries.filter(e => e.status === "APPROVED").length}
          </div>
          <div className="text-xs text-green-600">Approuvées</div>
        </div>
        <div className="bg-red-50 p-3 rounded-lg">
          <div className="text-2xl font-bold text-red-600">
            {timeEntries.filter(e => e.status === "REJECTED").length}
          </div>
          <div className="text-xs text-red-600">Rejetées</div>
        </div>
        <div className="bg-orange-50 p-3 rounded-lg">
          <div className="text-2xl font-bold text-orange-600">
            {timeEntries.filter(e => e.status === "REVISED").length}
          </div>
          <div className="text-xs text-orange-600">En révision</div>
        </div>
      </div>

      {/* Liste des entrées */}
      {currentEntries.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 text-6xl mb-4">📝</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucune entrée trouvée
          </h3>
          <p className="text-gray-600">
            {filterStatus === "ALL" 
              ? "Vous n'avez pas encore créé d'entrées de temps."
              : `Aucune entrée avec le statut "${getStatusTranslation(filterStatus)}".`
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {currentEntries.map((entry) => (
            <div
              key={entry.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusBadgeClass(
                        entry.status
                      )}`}
                    >
                      {getStatusTranslation(entry.status)}
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {entry.project.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      {entry.project.projectNumber}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Activité:</span>
                      <div className="font-medium">{entry.activity.name}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Heures:</span>
                      <div className="font-medium">{entry.hours}h</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Période:</span>
                      <div className="font-medium">
                        {entry.semester} {entry.year}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500">Date:</span>
                      <div className="font-medium">
                        {new Date(entry.createdAt).toLocaleDateString("fr-FR")}
                      </div>
                    </div>
                  </div>

                  {entry.comment && (
                    <div className="mt-2">
                      <span className="text-gray-500 text-sm">Commentaire:</span>
                      <div className="text-sm text-gray-700 mt-1">
                        {entry.comment}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => handleView(entry)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Voir les détails"
                  >
                    <EyeIcon className="h-4 w-4" />
                  </button>
                  {entry.status === "PENDING" && (
                    <>
                      <button
                        onClick={() => handleEdit(entry)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Modifier"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(entry)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Supprimer"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Affichage de {indexOfFirstEntry + 1} à{" "}
            {Math.min(indexOfLastEntry, filteredEntries.length)} sur{" "}
            {filteredEntries.length} entrées
          </p>
          <div className="flex items-center space-x-2">
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
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isCurrentPage
                        ? "bg-blue-600 text-white"
                        : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
                    }`}
                  >
                    {pageNumber}
                  </button>
                );
              } else if (
                pageNumber === currentPage - 2 ||
                pageNumber === currentPage + 2
              ) {
                return (
                  <span
                    key={pageNumber}
                    className="px-2 py-1 text-gray-400"
                  >
                    ...
                  </span>
                );
              }
              return null;
            })}

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
      )}

      {/* Modals */}
      {selectedEntry && (
        <ViewTimeEntryModal
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          timeEntry={selectedEntry}
        />
      )}

      <CreateTimeEntryModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        formData={editFormData}
        onSubmit={handleEditSubmit}
        onChange={handleFormChange}
        projects={projects.map((p) => ({
          id: p.id,
          name: p.name,
          projectNumber: p.projectNumber,
        }))}
        activities={activities}
        remainingHours={480} // Valeur par défaut
        editMode={true}
        parentActivity={parentActivity}
        childActivities={childActivities}
        onParentActivityChange={handleParentActivityChange}
      />

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Supprimer l'entrée"
        message="Êtes-vous sûr de vouloir supprimer cette entrée de temps ? Cette action est irréversible."
      />
    </div>
  );
}
