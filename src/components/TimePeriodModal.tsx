'use client';

import { useState, useEffect } from 'react';
import { CalendarIcon, CheckIcon, XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';

interface TimePeriod {
  id: number;
  year: number;
  semester: 'S1' | 'S2';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface TimePeriodModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: string;
  onPeriodChange?: () => void;
}

export default function TimePeriodModal({ isOpen, onClose, userRole, onPeriodChange }: TimePeriodModalProps) {
  
  const [activePeriod, setActivePeriod] = useState<TimePeriod | null>(null);
  const [allPeriods, setAllPeriods] = useState<TimePeriod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    year: new Date().getFullYear(),
    semester: 'S1' as 'S1' | 'S2',
    isActive: false
  });

  useEffect(() => {
    if (isOpen) {
      fetchAllPeriods();
    }
  }, [isOpen]);

  const fetchActivePeriod = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/time-periods?activeOnly=true', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const result = await response.json();
      
      if (result.success && result.data) {
        setActivePeriod(result.data);
      } else {
        setActivePeriod(null);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération de la période active:', error);
      toast.error('Erreur lors du chargement des données', {
        description: 'Impossible de récupérer la période active.'
      });
      setActivePeriod(null);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllPeriods = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/time-periods', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const result = await response.json();
      
      if (result.success && result.data) {
        setAllPeriods(result.data);
        // Mettre à jour aussi la période active
        const active = result.data.find((period: TimePeriod) => period.isActive);
        setActivePeriod(active || null);
      } else {
        setAllPeriods([]);
        setActivePeriod(null);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des périodes:', error);
      toast.error('Erreur lors du chargement des données', {
        description: 'Impossible de récupérer les périodes.'
      });
      setAllPeriods([]);
      setActivePeriod(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const toastId = toast.loading('Création de la période en cours...');
    
    try {
      setIsCreating(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/time-periods', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success('Période créée avec succès !', {
          description: `Période ${result.data.year} ${result.data.semester} créée.`,
          id: toastId
        });
        await fetchAllPeriods();
        setFormData({
          year: new Date().getFullYear(),
          semester: 'S1',
          isActive: false
        });
        onPeriodChange?.();
      } else {
        toast.error('Erreur lors de la création de la période', {
          description: result.message,
          id: toastId
        });
      }
    } catch (error) {
      console.error('Erreur lors de la création de la période:', error);
      toast.error('Erreur lors de la création de la période', {
        description: 'Une erreur inattendue s\'est produite.',
        id: toastId
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleActivatePeriod = async (periodId: number) => {
    const toastId = toast.loading('Activation de la période en cours...');
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/time-periods', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          id: periodId,
          isActive: true
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success('Période activée avec succès !', {
          description: 'La période est maintenant active pour la saisie.',
          id: toastId
        });
        await fetchAllPeriods();
        onPeriodChange?.();
      } else {
        toast.error('Erreur lors de l\'activation de la période', {
          description: result.message,
          id: toastId
        });
      }
    } catch (error) {
      console.error('Erreur lors de l\'activation de la période:', error);
      toast.error('Erreur lors de l\'activation de la période', {
        description: 'Une erreur inattendue s\'est produite.',
        id: toastId
      });
    }
  };

  const handleDeactivatePeriod = async (periodId: number) => {
    const toastId = toast.loading('Désactivation de la période en cours...');
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/time-periods', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          id: periodId,
          isActive: false
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success('Période désactivée avec succès !', {
          description: 'La période n\'est plus active.',
          id: toastId
        });
        await fetchAllPeriods();
        onPeriodChange?.();
      } else {
        toast.error('Erreur lors de la désactivation de la période', {
          description: result.message,
          id: toastId
        });
      }
    } catch (error) {
      console.error('Erreur lors de la désactivation de la période:', error);
      toast.error('Erreur lors de la désactivation de la période', {
        description: 'Une erreur inattendue s\'est produite.',
        id: toastId
      });
    }
  };

  if (userRole !== "ADMIN" && userRole !== "PMSU") {
    return null;
  }

  if (!isOpen) {
    return null;
  }
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <CalendarIcon className="h-6 w-6 mr-2 text-blue-600" />
            Gestion des Périodes de Saisie
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Toutes les Périodes */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-blue-900 flex items-center">
                  <CalendarIcon className="h-5 w-5 mr-2" />
                  Toutes les Périodes
                </h3>
                {activePeriod && (
                  <div className="text-sm text-blue-700 bg-blue-100 px-2 py-1 rounded-md">
                    Période active : {activePeriod.year} {activePeriod.semester}
                  </div>
                )}
              </div>
              
              {allPeriods.length > 0 ? (
                <div className="space-y-3">
                  {allPeriods.map((period) => (
                    <div key={period.id} className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4">
                            <div>
                              <p className="text-sm text-gray-600">Année</p>
                              <p className="text-lg font-semibold text-gray-900">{period.year}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Semestre</p>
                              <p className="text-lg font-semibold text-gray-900">{period.semester}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Statut</p>
                              {period.isActive ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  <CheckIcon className="h-4 w-4 mr-1" />
                                  Active
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  Inactive
                                </span>
                              )}
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            Créée le {new Date(period.createdAt).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          {period.isActive ? (
                            <button
                              onClick={() => handleDeactivatePeriod(period.id)}
                              className="px-3 py-1 text-xs font-medium text-red-700 bg-red-100 border border-red-300 rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                            >
                              Désactiver
                            </button>
                          ) : (
                            <button
                              onClick={() => handleActivatePeriod(period.id)}
                              className="px-3 py-1 text-xs font-medium text-green-700 bg-green-100 border border-green-300 rounded-md hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-green-500"
                            >
                              Activer
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-600">Aucune période créée</p>
                  <p className="text-sm text-gray-500">Créez une nouvelle période pour commencer</p>
                </div>
              )}
            </div>

            {/* Formulaire de Création */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <PlusIcon className="h-5 w-5 mr-2" />
                Créer une Nouvelle Période
              </h3>
              
              <form onSubmit={handleCreatePeriod} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Année
                    </label>
                    <input
                      type="number"
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min={2020}
                      max={2030}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Semestre
                    </label>
                    <select
                      value={formData.semester}
                      onChange={(e) => setFormData({ ...formData, semester: e.target.value as 'S1' | 'S2' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="S1">S1 (Janvier - Juin)</option>
                      <option value="S2">S2 (Juillet - Décembre)</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                    Activer cette période immédiatement
                  </label>
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCreating ? 'Création...' : 'Créer la Période'}
                  </button>
                </div>
              </form>
            </div>

            {/* Informations */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-yellow-900 mb-2">Informations</h3>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• Une seule période peut être active à la fois</li>
                <li>• Les utilisateurs STAFF ne peuvent saisir que pendant la période active</li>
                <li>• Seuls les ADMIN et PMSU peuvent gérer les périodes</li>
                <li>• Les périodes S1 couvrent janvier à juin, S2 juillet à décembre</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
