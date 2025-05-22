"use client";

import { useState, useEffect, useRef } from "react";
import { z } from "zod";
import { registerSchema } from "@/lib/validation";
import RoleBasedProtectedRoute from "@/components/RoleBasedProtectedRoute";
import Navbar from "@/components/Navbar";
import { toast } from 'sonner';
import Papa from 'papaparse';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  UserGroupIcon,
  ExclamationTriangleIcon,
  ArrowUpTrayIcon,
} from "@heroicons/react/24/outline";

type UserProformaCost = {
  year: number;
  cost: number;
};

type FormData = z.infer<typeof registerSchema> & {
  id?: number;
  proformaCosts: UserProformaCost[];
  signature: string;
  isActive: boolean;
};

type Errors = Partial<Record<keyof FormData, string>>;

type User = {
  id: number;
  email: string;
  name: string;
  indice: string;
  grade: string;
  proformaCosts: UserProformaCost[];
  role: string;
  type: string;
  isActive: boolean;
  signature: string;
};

type CSVRow = {
  email: string;
  password: string;
  name: string;
  indice: string;
  grade: string;
  type: string;
  role: string;
  [key: string]: string; // Pour les années et coûts dynamiques
};

export default function UsersPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
    name: "",
    indice: "",
    grade: "",
    proformaCosts: [{ year: new Date().getFullYear(), cost: 0 }],
    type: "OPERATION",
    role: "STAFF",
    isActive: true,
    signature: "",
  });
  const [editUser, setEditUser] = useState<User | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [users, setUsers] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/user", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setUsers(data);
    } catch (error) {
      console.error("Erreur lors de la récupération des utilisateurs:", error);
      toast.error("Erreur lors de la récupération des utilisateurs");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editUser && !formData.password) {
      toast.error("Le mot de passe est requis pour un nouvel utilisateur");
      setErrors({
        password: "Le mot de passe est requis pour un nouvel utilisateur",
      });
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const url = editUser ? `/api/user/${editUser.id}` : "/api/user";
      const method = editUser ? "PUT" : "POST";

      const requestData = {
        ...formData,
        ...(editUser && !formData.password && { password: undefined }),
      };

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestData),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Une erreur est survenue");
        return;
      }

      toast.success(
        editUser
          ? "Utilisateur mis à jour avec succès"
          : "Utilisateur créé avec succès"
      );
      setErrors({});
      setFormData({
        email: "",
        password: "",
        name: "",
        indice: "",
        grade: "",
        proformaCosts: [{ year: new Date().getFullYear(), cost: 0 }],
        type: "OPERATION",
        role: "STAFF",
        isActive: true,
        signature: "",
      });
      setEditUser(null);
      setIsModalOpen(false);
      await fetchUsers();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Erreur de connexion au serveur"
      );
      console.error("Erreur:", error);
    }
  };

  if (loading) {
    return (
      <RoleBasedProtectedRoute allowedRoles={["ADMIN"]}>
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

  const handleEdit = (user: User) => {
    setEditUser(user);
    setFormData({
      email: user.email,
      password: "",
      name: user.name,
      indice: user.indice,
      grade: user.grade,
      proformaCosts: user.proformaCosts,
      type: user.type as "OPERATION" | "PROGRAMME" | "SUPPORT",
      role: user.role as "ADMIN" | "PMSU" | "MANAGEMENT" | "STAFF",
      isActive: user.isActive,
      signature: user.signature,
    });
    setIsModalOpen(true);
  };

  const handleUserClick = (user: User) => {
    setSelectedUser(user);
  };

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
    setDeleteConfirmOpen(true);
  };

  const handleEditFromDetails = (user: User) => {
    setSelectedUser(null);
    handleEdit(user);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/user/${userToDelete.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        toast.success("Utilisateur supprimé avec succès");
        await fetchUsers();
      } else {
        const data = await res.json();
        toast.error(data.message);
      }
    } catch {
      toast.error("Erreur lors de la suppression");
    } finally {
      setDeleteConfirmOpen(false);
      setUserToDelete(null);
    }
  };

  const openCreateModal = () => {
    setEditUser(null);
    setFormData({
      email: "",
      password: "123456789",
      name: "",
      indice: "",
      grade: "",
      proformaCosts: [{ year: new Date().getFullYear(), cost: 0 }],
      type: "OPERATION",
      role: "STAFF",
      isActive: true,
      signature: "",
    });
    setErrors({});
    setIsModalOpen(true);
  };

  const handleImportCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== "text/csv") {
      toast.error("Veuillez sélectionner un fichier CSV");
      return;
    }

    Papa.parse<CSVRow>(file, {
      complete: async (results) => {
        try {
          const users = results.data.map((row) => {
            const proformaCosts: UserProformaCost[] = [];
            Object.entries(row).forEach(([key, value]) => {
              if (key.startsWith('year') && value) {
                const yearIndex = key.replace('year', '');
                const costValue = row[`cost${yearIndex}`];
                if (costValue) {
                  proformaCosts.push({
                    year: parseInt(value),
                    cost: parseFloat(costValue)
                  });
                }
              }
            });

            return {
              email: row.email,
              password: row.password,
              name: row.name,
              indice: row.indice,
              grade: row.grade,
              type: row.type.toUpperCase() as "OPERATION" | "PROGRAMME" | "SUPPORT",
              role: row.role.toUpperCase() as "ADMIN" | "PMSU" | "MANAGEMENT" | "STAFF",
              proformaCosts
            };
          }).filter(user => user.email && user.name);

          const token = localStorage.getItem("token");
          const res = await fetch("/api/user/import", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ users }),
          });

          const data = await res.json();

          if (!res.ok) {
            throw new Error(data.message);
          }

          toast.success(data.message);
          
          if (data.errors && data.errors.length > 0) {
            data.errors.forEach((error: { row: number; message: string }) => {
              toast.error(`Ligne ${error.row}: ${error.message}`);
            });
          }

          await fetchUsers();
        } catch (error) {
          toast.error(
            error instanceof Error
              ? error.message
              : "Erreur lors de l'importation"
          );
        }
      },
      header: true,
      skipEmptyLines: true,
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUsers = users.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(users.length / itemsPerPage);

  const handleAddProformaCost = () => {
    const currentYear = new Date().getFullYear();
    const existingYears = formData.proformaCosts.map(cost => cost.year);
    
    let nextYear = currentYear;
    while (existingYears.includes(nextYear)) {
      nextYear++;
    }

    setFormData(prev => ({
      ...prev,
      proformaCosts: [...prev.proformaCosts, { year: nextYear, cost: 0 }]
    }));
  };

  const handleRemoveProformaCost = (index: number) => {
    if (formData.proformaCosts.length <= 1) {
      toast.error("Au moins un coût proforma est requis");
      return;
    }
    setFormData(prev => ({
      ...prev,
      proformaCosts: prev.proformaCosts.filter((_, i) => i !== index),
    }));
  };

  const handleProformaCostChange = (index: number, field: keyof UserProformaCost, value: number) => {
    if (field === 'year') {
      const currentYear = new Date().getFullYear();
      if (value < currentYear) {
        toast.error(`L&apos;année ne peut pas être inférieure à ${currentYear}`);
        return;
      }
      const existingYear = formData.proformaCosts.find((cost, i) => i !== index && cost.year === value);
      if (existingYear) {
        toast.error(`L&apos;année ${value} est déjà enregistrée`);
        return;
      }
    }

    setFormData(prev => ({
      ...prev,
      proformaCosts: prev.proformaCosts.map((cost, i) => 
        i === index ? { ...cost, [field]: value } : cost
      )
    }));
  };

  return (
    <RoleBasedProtectedRoute allowedRoles={["ADMIN"]}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header avec boutons */}
          <div className="relative overflow-hidden bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 p-6 mb-8">
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                  <UserGroupIcon className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Gestion des Utilisateurs
                </h1>
              </div>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImportCSV}
                    accept=".csv"
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl
                             hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-md hover:shadow-lg
                             transform hover:-translate-y-0.5"
                  >
                    <ArrowUpTrayIcon className="w-5 h-5 mr-2" />
                    Importer CSV
                  </button>
                </div>
                <button
                  onClick={openCreateModal}
                  className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl
                           hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg
                           transform hover:-translate-y-0.5"
                >
                  <PlusIcon className="w-5 h-5 mr-2" />
                  Ajouter un utilisateur
                </button>
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    {["Email", "Nom", "Indice", "Grade", "Unité", "Rôle", "Statut", "Actions",].map((header) => (
                      <th key={header} className="px-6 py-4 text-left">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {header}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {currentUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="group hover:bg-gray-50/50 transition-colors duration-200 cursor-pointer"
                      onClick={() => handleUserClick(user)}
                    >
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-900">{user.email}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-gray-900">
                          {user.name}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">
                          {user.indice}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">
                          {user.grade}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                          {user.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.isActive
                              ? "bg-green-50 text-green-700"
                              : "bg-red-50 text-red-700"
                          }`}
                        >
                          {user.isActive ? "Actif" : "Inactif"}
                        </span>
                      </td>
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(user);
                            }}
                            title="Editer Utilisateur"
                            className="p-1 text-blue-600 hover:text-blue-700 transition-colors"
                          >
                            <PencilIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClick(user);
                            }}
                            title="Supprimer utilisateur"
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

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Affichage de {indexOfFirstItem + 1} à{" "}
                  {Math.min(indexOfLastItem, users.length)} sur {users.length}{" "}
                  utilisateurs
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

          {/* Modal de création/édition */}
          {isModalOpen && (
            <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
              <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl transform transition-all duration-300 ease-out">
                <div className="p-6 border-b border-gray-100">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      {editUser ? "Modifier un utilisateur" : "Ajouter un utilisateur"}
                    </h2>
                    <button
                      onClick={() => setIsModalOpen(false)}
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <svg
                        className="w-5 h-5 text-gray-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        className="w-full p-3 border border-gray-200 rounded-xl"
                        placeholder="email@example.com"
                      />
                      {errors.email && (
                        <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nom complet
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        className="w-full p-3 border border-gray-200 rounded-xl"
                        placeholder="Nom de l'utilisateur"
                      />
                      {errors.name && (
                        <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Indice
                      </label>
                      <input
                        type="text"
                        value={formData.indice}
                        onChange={(e) =>
                          setFormData({ ...formData, indice: e.target.value })
                        }
                        className="w-full p-3 border border-gray-200 rounded-xl"
                        placeholder="Indice"
                      />
                      {errors.indice && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.indice}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Grade
                      </label>
                      <input
                        type="text"
                        value={formData.grade}
                        onChange={(e) =>
                          setFormData({ ...formData, grade: e.target.value })
                        }
                        className="w-full p-3 border border-gray-200 rounded-xl"
                        placeholder="Grade"
                      />
                      {errors.grade && (
                        <p className="text-red-500 text-xs mt-1">{errors.grade}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Type
                      </label>
                      <select
                        value={formData.type}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            type: e.target.value as
                              | "OPERATION"
                              | "PROGRAMME"
                              | "SUPPORT",
                          })
                        }
                        className="w-full p-3 border border-gray-200 rounded-xl"
                      >
                        <option value="OPERATION">Opération</option>
                        <option value="PROGRAMME">Programme</option>
                        <option value="SUPPORT">Support</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Rôle
                      </label>
                      <select
                        value={formData.role}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            role: e.target.value as
                              | "ADMIN"
                              | "PMSU"
                              | "MANAGEMENT"
                              | "STAFF",
                          })
                        }
                        className="w-full p-3 border border-gray-200 rounded-xl"
                      >
                        <option value="STAFF">Staff</option>
                        <option value="ADMIN">Admin</option>
                        <option value="PMSU">PMSU</option>
                        <option value="MANAGEMENT">Management</option>
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Coûts Proforma par année
                        </label>
                        <button
                          type="button"
                          onClick={handleAddProformaCost}
                          className="px-2 py-1 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
                        >
                          + Ajouter une année
                        </button>
                      </div>

                      {formData.proformaCosts.map((cost, index) => (
                        <div key={index} className="flex items-center gap-4 mt-2">
                          <div className="flex-1">
                            <input
                              type="number"
                              value={cost.year}
                              onChange={(e) =>
                                handleProformaCostChange(
                                  index,
                                  "year",
                                  parseInt(e.target.value)
                                )
                              }
                              className="w-full p-3 border border-gray-200 rounded-xl"
                              placeholder="Année"
                              min={new Date().getFullYear()}
                            />
                          </div>
                          <div className="flex-1">
                            <input
                              type="number"
                              value={cost.cost}
                              onChange={(e) =>
                                handleProformaCostChange(
                                  index,
                                  "cost",
                                  parseFloat(e.target.value)
                                )
                              }
                              className="w-full p-3 border border-gray-200 rounded-xl"
                              placeholder="Coût"
                              step="0.01"
                              min="0"
                            />
                          </div>
                          {index > 0 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveProformaCost(index)}
                              className="p-2 text-red-500 hover:text-red-700"
                            >
                              <TrashIcon className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="md:col-span-2">
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={formData.isActive}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              isActive: e.target.checked,
                            })
                          }
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                        />
                        <span className="text-sm font-medium text-gray-700">
                          Utilisateur actif
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
                    >
                      {editUser ? "Mettre à jour" : "Créer"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal de suppression */}
          {deleteConfirmOpen && userToDelete && (
            <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full mx-4">
                <div className="text-center">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                    <ExclamationTriangleIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Confirmer la suppression
                  </h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Êtes-vous sûr de vouloir supprimer l&apos;utilisateur{" "}
                    <span className="font-medium text-gray-900">
                      {userToDelete.name}
                    </span>
                    ?
                  </p>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteConfirmOpen(false);
                      setUserToDelete(null);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteConfirm}
                    className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal de détails utilisateur */}
          {selectedUser && (
            <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
              <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl">
                <div className="p-6 border-b border-gray-100">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      Détails de l&apos;utilisateur
                    </h2>
                    <button
                      onClick={() => setSelectedUser(null)}
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <svg
                        className="w-5 h-5 text-gray-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Informations principales */}
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">
                          Email
                        </h3>
                        <p className="mt-1 text-base text-gray-900">
                          {selectedUser.email}
                        </p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">
                          Nom complet
                        </h3>
                        <p className="mt-1 text-base text-gray-900">
                          {selectedUser.name}
                        </p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">
                          Indice
                        </h3>
                        <p className="mt-1 text-base text-gray-900">
                          {selectedUser.indice}
                        </p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">
                          Grade
                        </h3>
                        <p className="mt-1 text-base text-gray-900">
                          {selectedUser.grade}
                        </p>
                      </div>
                    </div>

                    {/* Statut et rôles */}
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">
                          Type
                        </h3>
                        <span className="mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-blue-50 text-blue-700">
                          {selectedUser.type}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">
                          Rôle
                        </h3>
                        <span className="mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-blue-50 text-blue-700">
                          {selectedUser.role}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">
                          Statut
                        </h3>
                        <span
                          className={`mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${
                            selectedUser.isActive
                              ? "bg-green-50 text-green-700"
                              : "bg-red-50 text-red-700"
                          }`}
                        >
                          {selectedUser.isActive ? "Actif" : "Inactif"}
                        </span>
                      </div>
                    </div>

                    {/* Coûts Proforma */}
                    <div className="md:col-span-2">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">
                        Historique des coûts Proforma
                      </h3>
                      <div className="bg-gray-50 rounded-xl p-4">
                        <div className="grid grid-cols-3 gap-4">
                          {selectedUser.proformaCosts.map((cost, index) => (
                            <div
                              key={index}
                              className="bg-white rounded-lg p-4 shadow-sm"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-lg font-medium text-blue-600">
                                  {cost.year}
                                </span>
                                <span className="text-sm font-medium bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                                  {new Intl.NumberFormat("fr-FR", {
                                    style: "currency",
                                    currency: "USD",
                                  }).format(cost.cost)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Signature */}
                    {selectedUser.signature && (
                      <div className="md:col-span-2">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                          Signature
                        </h3>
                        <div className="bg-gray-50 rounded-xl p-4">
                          <img
                            src={selectedUser.signature}
                            alt="Signature de l'utilisateur"
                            className="h-24 object-contain"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-6 border-t border-gray-100">
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => handleEditFromDetails(selectedUser)}
                      className="px-4 py-2 bg-blue-50 text-blue-600 font-medium rounded-xl hover:bg-blue-100"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => setSelectedUser(null)}
                      className="px-4 py-2 bg-gray-50 text-gray-600 font-medium rounded-xl hover:bg-gray-100"
                    >
                      Fermer
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </RoleBasedProtectedRoute>
  );
}
