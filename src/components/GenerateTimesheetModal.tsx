import React, { useState } from 'react';
import { XMarkIcon, DocumentArrowDownIcon, CalendarIcon } from '@heroicons/react/24/outline';

interface GenerateTimesheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (year: number, semester: string) => void;
  userName: string;
  activePeriod?: { year: number; semester: "S1" | "S2" } | null;
  availablePeriods?: Array<{ year: number; semester: "S1" | "S2"; isActive: boolean }>;
}

export default function GenerateTimesheetModal({
  isOpen,
  onClose,
  onGenerate,
  userName,
  activePeriod,
  availablePeriods = []
}: GenerateTimesheetModalProps) {
  const [selectedYear, setSelectedYear] = useState(activePeriod?.year || new Date().getFullYear());
  const [selectedSemester, setSelectedSemester] = useState<'S1' | 'S2'>(activePeriod?.semester || 'S1');
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      await onGenerate(selectedYear, selectedSemester);
      onClose();
    } catch (error) {
      console.error('Erreur lors de la génération:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Utiliser les périodes disponibles ou créer une liste par défaut
  const getAvailablePeriods = () => {
    if (availablePeriods && availablePeriods.length > 0) {
      return availablePeriods.map(period => ({
        year: period.year,
        semester: period.semester,
        label: `${period.year} - ${period.semester}${period.isActive ? ' (Actif)' : ''}`
      }));
    }
    
    // Fallback si aucune période n'est disponible
    const currentYear = new Date().getFullYear();
    return [
      { year: currentYear, semester: 'S1' as const, label: `${currentYear} - S1` },
      { year: currentYear, semester: 'S2' as const, label: `${currentYear} - S2` },
      { year: currentYear - 1, semester: 'S1' as const, label: `${currentYear - 1} - S1` },
      { year: currentYear - 1, semester: 'S2' as const, label: `${currentYear - 1} - S2` }
    ];
  };

  const availablePeriodsList = getAvailablePeriods();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4">
        {/* En-tête */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
              <DocumentArrowDownIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                Générer Feuille de Temps
              </h3>
              <p className="text-sm text-gray-600">
                Pour {userName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Contenu */}
        <div className="p-6 space-y-6">
          {/* Période Active et Sélection Alternative */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <CalendarIcon className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-gray-700">
                Période active : {activePeriod ? `${activePeriod.year} - ${activePeriod.semester}` : 'Non définie'}
              </span>
            </div>
            
            {/* Sélecteur de période alternative */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">ou analyser :</span>
                <select
                  value={`${selectedYear}-${selectedSemester}`}
                  onChange={(e) => {
                    const [year, semester] = e.target.value.split('-');
                    setSelectedYear(parseInt(year));
                    setSelectedSemester(semester as 'S1' | 'S2');
                  }}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  {availablePeriodsList.map((period) => (
                    <option key={`${period.year}-${period.semester}`} value={`${period.year}-${period.semester}`}>
                      {period.label}
                    </option>
                  ))}
                </select>
                
                {/* Indicateur de période sélectionnée */}
                <span className={`text-sm px-2 py-1 rounded-full ${
                  selectedYear === activePeriod?.year && selectedSemester === activePeriod?.semester
                    ? 'bg-green-100 text-green-800 border border-green-200'
                    : 'bg-blue-100 text-blue-800 border border-blue-200'
                }`}>
                  {selectedYear === activePeriod?.year && selectedSemester === activePeriod?.semester
                    ? 'Période active'
                    : 'Période historique'
                  }
                </span>
              </div>
            </div>
          </div>

          {/* Informations */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              </div>
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-1">Ce qui sera généré :</p>
                <ul className="space-y-1 text-xs">
                  <li>• Feuille de temps détaillée pour {userName}</li>
                  <li>• Période : {selectedSemester} {selectedYear}</li>
                  <li>• Toutes les entrées de temps de cette période</li>
                  <li>• Calculs de coûts automatiques</li>
                  <li>• Export au format Excel ou PDF</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex items-center px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg
                     hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed 
                     transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
          >
            <DocumentArrowDownIcon className="w-4 h-4 mr-2" />
            {isGenerating ? 'Génération...' : 'Générer'}
          </button>
        </div>
      </div>
    </div>
  );
}
