import { useState, useEffect } from 'react';
import { CalendarIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface TimePeriod {
  id: number;
  year: number;
  semester: "S1" | "S2";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface TimePeriodManagerProps {
  userRole: string;
}

export default function TimePeriodManager({ userRole }: TimePeriodManagerProps) {
  const [activePeriod, setActivePeriod] = useState<TimePeriod | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    year: new Date().getFullYear(),
    semester: new Date().getMonth() < 6 ? "S1" : "S2" as "S1" | "S2",
    isActive: false
  });

  useEffect(() => {
    fetchActivePeriod();
  }, []);

  // Vérifier que l'utilisateur a les permissions
  if (userRole !== "ADMIN" && userRole !== "PMSU") {
    return null;
  }

  const fetchActivePeriod = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/time-periods", {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setActivePeriod(result.data);
        }
      }
    } catch (error) {
      console.error("Erreur lors de la récupération de la période active:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/time-periods", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        setFormData({
          year: new Date().getFullYear(),
          semester: new Date().getMonth() < 6 ? "S1" : "S2" as "S1" | "S2",
          isActive: false
        });
        fetchActivePeriod();
        alert("Période créée avec succès !");
      } else {
        alert(result.message || "Erreur lors de la création de la période");
      }
    } catch (error) {
      console.error("Erreur lors de la création de la période:", error);
      alert("Erreur lors de la création de la période");
    } finally {
      setIsCreating(false);
    }
  };

  // const handleActivatePeriod = async (periodId: number) => {
  //   try {
  //     const token = localStorage.getItem("token");
  //     const response = await fetch("/api/time-periods", {
  //       method: "PUT",
  //       headers: {
  //         "Content-Type": "application/json",
  //         Authorization: `Bearer ${token}`,
  //       },
  //       body: JSON.stringify({
  //         id: periodId,
  //         isActive: true
  //       }),
  //     });

  //     const result = await response.json();

  //     if (result.success) {
  //       fetchActivePeriod();
  //       alert("Période activée avec succès !");
  //     } else {
  //       alert(result.message || "Erreur lors de l'activation de la période");
  //     }
  //   } catch (error) {
  //     console.error("Erreur lors de l'activation de la période:", error);
  //     alert("Erreur lors de l'activation de la période");
  //   }
  // };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center">
          <CalendarIcon className="h-6 w-6 mr-2 text-blue-600" />
          Gestion des Périodes de Saisie
        </h2>
        <div className="text-sm text-gray-500">
          {userRole === "ADMIN" ? "Administrateur" : "PMSU"}
        </div>
      </div>

      {/* Période Active */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Période Active</h3>
        {activePeriod ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CheckIcon className="h-5 w-5 text-green-600 mr-2" />
                <span className="text-green-800 font-medium">
                  {activePeriod.year} - {activePeriod.semester}
                </span>
              </div>
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                ACTIVE
              </span>
            </div>
            <p className="text-green-700 text-sm mt-2">
              Les utilisateurs STAFF peuvent saisir des entrées pour cette période.
            </p>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <XMarkIcon className="h-5 w-5 text-yellow-600 mr-2" />
              <span className="text-yellow-800 font-medium">
                Aucune période active
              </span>
            </div>
            <p className="text-yellow-700 text-sm mt-2">
                              Les utilisateurs STAFF ne peuvent pas saisir d&apos;entrées de temps.
            </p>
          </div>
        )}
      </div>

      {/* Formulaire de Création */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Créer une Nouvelle Période</h3>
        <form onSubmit={handleCreatePeriod} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">
                Année
              </label>
              <input
                type="number"
                id="year"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                min={2000}
                max={2100}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="semester" className="block text-sm font-medium text-gray-700 mb-1">
                Semestre
              </label>
              <select
                id="semester"
                value={formData.semester}
                onChange={(e) => setFormData({ ...formData, semester: e.target.value as "S1" | "S2" })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="S1">S1 (Janvier - Juin)</option>
                <option value="S2">S2 (Juillet - Décembre)</option>
              </select>
            </div>

            <div className="flex items-end">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Activer immédiatement</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isCreating}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? "Création..." : "Créer la Période"}
            </button>
          </div>
        </form>
      </div>

      {/* Informations */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Informations</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Une seule période peut être active à la fois</li>
          <li>• Les utilisateurs STAFF ne peuvent saisir que pendant la période active</li>
          <li>• Les administrateurs peuvent toujours saisir des entrées</li>
          <li>• S1 : Janvier à Juin | S2 : Juillet à Décembre</li>
        </ul>
      </div>
    </div>
  );
}
