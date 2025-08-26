import React, { useState } from 'react';
import { XMarkIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';

interface GenerateTimesheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (year: number, semester: string) => void;
  userName: string;
}

export default function GenerateTimesheetModal({
  isOpen,
  onClose,
  onGenerate,
  userName
}: GenerateTimesheetModalProps) {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedSemester, setSelectedSemester] = useState<'S1' | 'S2'>(
    new Date().getMonth() < 6 ? 'S1' : 'S2'
  );


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate(selectedYear, selectedSemester);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <DocumentArrowDownIcon className="w-6 h-6 text-white" />
              <h2 className="text-xl font-bold text-white">
                Générer Feuille de Temps
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors duration-200"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <p className="text-gray-600 mb-2">
              Générer la feuille de temps pour :
            </p>
            <p className="font-semibold text-gray-900">{userName}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Année */}
            <div>
              <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-2">
                Année
              </label>
              <select
                id="year"
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            {/* Semestre */}
            <div>
              <label htmlFor="semester" className="block text-sm font-medium text-gray-700 mb-2">
                Semestre
              </label>
              <select
                id="semester"
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value as 'S1' | 'S2')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="S1">Semestre 1 (Janvier - Juin)</option>
                <option value="S2">Semestre 2 (Juillet - Décembre)</option>
              </select>
            </div>

            {/* Informations */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-xs font-bold">i</span>
                  </div>
                </div>
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Important :</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Toutes les entrées de temps doivent être approuvées</li>
                    <li>Un email sera envoyé automatiquement au STAFF</li>
                    <li>Le PDF sera généré avec les données du semestre sélectionné</li>
                  </ul>
                </div>
              </div>
            </div>



            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg
                         hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-md hover:shadow-lg
                         transform hover:-translate-y-0.5"
              >
                <DocumentArrowDownIcon className="w-4 h-4 inline mr-2" />
                Générer et Envoyer
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
