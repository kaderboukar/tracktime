"use client";

import React, { useState, useEffect } from 'react';
import { 
  BellIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  UserGroupIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';

interface AlertStats {
  alertType: string;
  _count: {
    id: number;
  };
}

interface AlertStatus {
  activePeriod: {
    year: number;
    semester: string;
    activatedAt: string;
  };
  daysSinceActivation: number;
  alertStats: AlertStats[];
  staffWithoutEntries: number;
  totalStaff: number;
  complianceRate: number;
  nextAlertDay: number | null;
}

export default function TimeEntryAlerts() {
  const [alertStatus, setAlertStatus] = useState<AlertStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [sendingAlerts, setSendingAlerts] = useState(false);

  useEffect(() => {
    fetchAlertStatus();
  }, []);

  const fetchAlertStatus = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/admin/time-entry-alerts/check", {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setAlertStatus(result.data);
        } else {
          toast.error(result.message);
        }
      } else {
        toast.error("Erreur lors de la récupération du statut des alertes");
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  const sendAlerts = async () => {
    setSendingAlerts(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/admin/time-entry-alerts/check", {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          toast.success(result.message);
          await fetchAlertStatus();
        } else {
          toast.error(result.message);
        }
      } else {
        toast.error("Erreur lors de l'envoi des alertes");
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur de connexion");
    } finally {
      setSendingAlerts(false);
    }
  };

  const getAlertTypeLabel = (alertType: string) => {
    switch (alertType) {
      case 'FIRST_REMINDER': return 'Premier Rappel (Jour 3)';
      case 'SECOND_REMINDER': return 'Deuxième Rappel (Jour 7)';
      case 'THIRD_REMINDER': return 'Troisième Rappel (Jour 14)';
      case 'FINAL_REMINDER': return 'Dernier Rappel (Jour 21)';
      default: return alertType;
    }
  };

  const getAlertTypeColor = (alertType: string) => {
    switch (alertType) {
      case 'FIRST_REMINDER': return 'bg-blue-100 text-blue-800';
      case 'SECOND_REMINDER': return 'bg-yellow-100 text-yellow-800';
      case 'THIRD_REMINDER': return 'bg-orange-100 text-orange-800';
      case 'FINAL_REMINDER': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCurrentAlertLevel = () => {
    if (!alertStatus) return null;
    
    const { daysSinceActivation } = alertStatus;
    if (daysSinceActivation >= 21) return 'FINAL_REMINDER';
    if (daysSinceActivation >= 14) return 'THIRD_REMINDER';
    if (daysSinceActivation >= 7) return 'SECOND_REMINDER';
    if (daysSinceActivation >= 3) return 'FIRST_REMINDER';
    return null;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!alertStatus) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="text-center text-gray-500">
          <BellIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>Aucune période active trouvée</p>
        </div>
      </div>
    );
  }

  const currentAlertLevel = getCurrentAlertLevel();

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg">
            <BellIcon className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
            Alertes Entrées de Temps
          </h2>
        </div>
        
        <button
          onClick={sendAlerts}
          disabled={sendingAlerts || !currentAlertLevel}
          className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
            ${sendingAlerts || !currentAlertLevel
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-gradient-to-r from-orange-500 to-red-600 text-white hover:from-orange-600 hover:to-red-700 shadow-lg hover:shadow-xl"
            }`}
        >
          <EnvelopeIcon className="w-4 h-4 mr-2" />
          {sendingAlerts ? 'Envoi...' : 'Envoyer Alertes'}
        </button>
      </div>

      {/* Informations de la période */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Période Active */}
          <div className="text-center">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg inline-block mb-3">
              <ClockIcon className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {alertStatus.activePeriod.year} - {alertStatus.activePeriod.semester}
            </h3>
            <p className="text-sm text-gray-600">Période Active</p>
            <p className="text-xs text-gray-500 mt-1">
              Activée le {new Date(alertStatus.activePeriod.activatedAt).toLocaleDateString('fr-FR')}
            </p>
          </div>

          {/* Jours depuis activation */}
          <div className="text-center">
            <div className="p-3 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-lg inline-block mb-3">
              <ExclamationTriangleIcon className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {alertStatus.daysSinceActivation}
            </h3>
            <p className="text-sm text-gray-600">Jours depuis activation</p>
            {alertStatus.nextAlertDay && (
              <p className="text-xs text-blue-600 mt-1">
                Prochaine alerte: Jour {alertStatus.nextAlertDay}
              </p>
            )}
          </div>

          {/* STAFF sans entrées */}
          <div className="text-center">
            <div className="p-3 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg inline-block mb-3">
              <UserGroupIcon className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {alertStatus.staffWithoutEntries}
            </h3>
            <p className="text-sm text-gray-600">STAFF sans entrées</p>
            <p className="text-xs text-gray-500 mt-1">
              sur {alertStatus.totalStaff} total
            </p>
          </div>

          {/* Taux de conformité */}
          <div className="text-center">
            <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg inline-block mb-3">
              <CheckCircleIcon className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {alertStatus.complianceRate}%
            </h3>
            <p className="text-sm text-gray-600">Taux de conformité</p>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${alertStatus.complianceRate}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Niveau d'alerte actuel */}
      {currentAlertLevel && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Niveau d&apos;Alerte Actuel</h3>
          <div className="flex items-center space-x-3">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getAlertTypeColor(currentAlertLevel)}`}>
              {getAlertTypeLabel(currentAlertLevel)}
            </span>
            <span className="text-sm text-gray-600">
              {currentAlertLevel === 'FINAL_REMINDER' && '🚨 Escalade Management'}
              {currentAlertLevel === 'THIRD_REMINDER' && '⚠️ Copie Management'}
              {currentAlertLevel === 'SECOND_REMINDER' && '📧 Copie Management'}
              {currentAlertLevel === 'FIRST_REMINDER' && '📝 Rappel simple'}
            </span>
          </div>
        </div>
      )}

      {/* Statistiques des alertes envoyées */}
      {alertStatus.alertStats.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Alertes Envoyées</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {alertStatus.alertStats.map((stat) => (
              <div key={stat.alertType} className="text-center p-4 border border-gray-200 rounded-lg">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getAlertTypeColor(stat.alertType)} mb-2`}>
                  {getAlertTypeLabel(stat.alertType)}
                </span>
                <div className="text-2xl font-bold text-gray-900">
                  {stat._count.id}
                </div>
                <p className="text-sm text-gray-600">alertes envoyées</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <ExclamationTriangleIcon className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
          <div>
            <h3 className="text-lg font-semibold text-blue-900 mb-3">Comment ça fonctionne</h3>
            <div className="space-y-2 text-sm text-blue-800">
              <p>• <strong>Jour 3 :</strong> Premier rappel (email STAFF uniquement)</p>
              <p>• <strong>Jour 7 :</strong> Deuxième rappel (STAFF + copie management)</p>
              <p>• <strong>Jour 14 :</strong> Troisième rappel (STAFF + copie management)</p>
              <p>• <strong>Jour 21 :</strong> Dernier rappel (STAFF + escalade management)</p>
              <p>• <strong>Arrêt automatique :</strong> Dès la première saisie d&apos;entrée de temps</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
