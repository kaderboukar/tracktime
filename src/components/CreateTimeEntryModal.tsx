import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import {
  XMarkIcon,
  ClockIcon,
  FolderIcon,
  CogIcon,
  ChatBubbleLeftRightIcon,
  CalendarIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface CreateTimeEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: FormData;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  onChange: (field: keyof FormData, value: number | string) => void;
  projects: Project[];
  activities: Activity[];
  remainingHours: number;
  editMode: boolean;
  parentActivity: number | null;
  childActivities: Activity[];
  onParentActivityChange: (activityId: number) => void;
}

interface FormData {
  id?: number;
  userId: number;
  projectId: number;
  activityId: number;
  hours: number;
  semester: "S1" | "S2";
  year: number;
  comment?: string;
}

interface Project {
  id: number;
  name: string;
  projectNumber: string;
}

interface Activity {
  id: number;
  name: string;
  parentId: number | null;
  children?: Activity[];
}

export default function CreateTimeEntryModal({
  isOpen,
  onClose,
  formData,
  onSubmit,
  onChange,
  projects,
  activities,
  remainingHours,
  editMode,
  parentActivity,
  childActivities,
  onParentActivityChange
}: CreateTimeEntryModalProps) {

  // Validation des heures
  const isHoursValid = formData.hours > 0 && formData.hours <= remainingHours;

  // Validation des activités : soit une sous-activité est sélectionnée, soit l'activité parente n'a pas d'enfants
  const hasValidActivity = () => {
    if (!parentActivity) return false;

    // Si des sous-activités existent, une doit être sélectionnée
    if (childActivities.length > 0) {
      return formData.activityId > 0;
    }

    // Si pas de sous-activités, l'activité parente est valide
    return true;
  };

  const canSubmit = formData.projectId && hasValidActivity() && isHoursValid;

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform rounded-2xl bg-white/95 backdrop-blur-xl px-6 pt-6 pb-6 text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-2xl border border-white/50">
                {/* En-tête avec bouton de fermeture */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                      <ClockIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <Dialog.Title as="h3" className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        {editMode ? "Modifier une entrée" : "Nouvelle entrée de temps"}
                      </Dialog.Title>
                      <p className="text-sm text-gray-500 mt-1">
                        Enregistrez vos heures de travail sur les projets disponibles
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="p-2 rounded-xl bg-gray-100 text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-all duration-200"
                    onClick={onClose}
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                {/* Alerte heures restantes */}
                {remainingHours < 50 && (
                  <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-xl flex items-center space-x-3">
                    <ExclamationTriangleIcon className="w-5 h-5 text-orange-500 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-orange-800">
                        Attention : Il vous reste seulement {remainingHours}h disponibles ce semestre
                      </p>
                    </div>
                  </div>
                )}

                <form onSubmit={onSubmit} className="space-y-6">
                  {/* Section Projet */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                    <div className="flex items-center space-x-2 mb-4">
                      <FolderIcon className="w-5 h-5 text-blue-600" />
                      <h4 className="text-lg font-semibold text-blue-900">Sélection du projet</h4>
                    </div>

                    <div>
                      <label htmlFor="projectId" className="block text-sm font-medium text-blue-800 mb-2">
                        Projet disponible *
                      </label>
                      <select
                        id="projectId"
                        name="projectId"
                        value={formData.projectId}
                        onChange={(e) => onChange('projectId', parseInt(e.target.value))}
                        required
                        className="block w-full rounded-xl border-blue-200 bg-white/80 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm py-3 px-4 transition-all duration-200"
                      >
                        <option value="">Choisissez un projet...</option>
                        {projects.length === 0 ? (
                          <option disabled>Aucun projet disponible</option>
                        ) : (
                          projects.map((project) => (
                            <option key={project.id} value={project.id}>
                              {project.projectNumber} - {project.name}
                            </option>
                          ))
                        )}
                      </select>
                      {projects.length === 0 && (
                        <p className="mt-2 text-sm text-orange-600 flex items-center space-x-1">
                          <ExclamationTriangleIcon className="w-4 h-4" />
                          <span>Aucun projet disponible. Tous les projets vous sont déjà assignés.</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Section Activités */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
                    <div className="flex items-center space-x-2 mb-4">
                      <CogIcon className="w-5 h-5 text-green-600" />
                      <h4 className="text-lg font-semibold text-green-900">Activités</h4>
                    </div>

                    <div className="space-y-4">
                      {/* Activité parente */}
                      <div>
                        <label htmlFor="parentActivity" className="block text-sm font-medium text-green-800 mb-2">
                          Activité principale *
                        </label>
                        <select
                          id="parentActivity"
                          name="parentActivity"
                          value={parentActivity || ''}
                          onChange={(e) => onParentActivityChange(parseInt(e.target.value))}
                          required
                          className="block w-full rounded-xl border-green-200 bg-white/80 shadow-sm focus:border-green-500 focus:ring-green-500 text-sm py-3 px-4 transition-all duration-200"
                        >
                          <option value="">Choisissez une activité principale...</option>
                          {activities.filter(activity => !activity.parentId).map((activity) => (
                            <option key={activity.id} value={activity.id}>
                              {activity.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Sous-activité */}
                      {parentActivity && (
                        <div className="animate-fadeIn">
                          <label htmlFor="activityId" className="block text-sm font-medium text-green-800 mb-2">
                            Sous-activité *
                          </label>
                          {childActivities.length > 0 ? (
                            <select
                              id="activityId"
                              name="activityId"
                              value={formData.activityId}
                              onChange={(e) => onChange('activityId', parseInt(e.target.value))}
                              required
                              className="block w-full rounded-xl border-green-200 bg-white/80 shadow-sm focus:border-green-500 focus:ring-green-500 text-sm py-3 px-4 transition-all duration-200"
                            >
                              <option value="">Choisissez une sous-activité...</option>
                              {childActivities.map((activity) => (
                                <option key={activity.id} value={activity.id}>
                                  {activity.name}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <div className="p-3 bg-green-50 border border-green-200 rounded-xl">
                              <p className="text-sm text-green-800 flex items-center space-x-2">
                                <span>✓</span>
                                <span>Cette activité principale sera utilisée directement (pas de sous-activités disponibles).</span>
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Section Heures */}
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
                    <div className="flex items-center space-x-2 mb-4">
                      <ClockIcon className="w-5 h-5 text-purple-600" />
                      <h4 className="text-lg font-semibold text-purple-900">Temps de travail</h4>
                    </div>

                    <div>
                      <label htmlFor="hours" className="block text-sm font-medium text-purple-800 mb-2">
                        Heures travaillées *
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          name="hours"
                          id="hours"
                          value={formData.hours || ''}
                          onChange={(e) => onChange('hours', parseFloat(e.target.value) || 0)}
                          required
                          min="0.5"
                          max={remainingHours}
                          step="0.5"
                          className={`block w-full rounded-xl border-purple-200 bg-white/80 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-sm py-3 px-4 pr-12 transition-all duration-200 ${
                            !isHoursValid && formData.hours > 0 ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                          }`}
                          placeholder="Ex: 8.5"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                          <span className="text-purple-500 text-sm font-medium">h</span>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <p className="text-sm text-purple-600">
                          Disponible : <span className="font-semibold">{remainingHours}h</span>
                        </p>
                        {!isHoursValid && formData.hours > 0 && (
                          <p className="text-sm text-red-600 flex items-center space-x-1">
                            <ExclamationTriangleIcon className="w-4 h-4" />
                            <span>Heures invalides</span>
                          </p>
                        )}
                      </div>

                      {/* Barre de progression */}
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-purple-600 mb-1">
                          <span>0h</span>
                          <span>{remainingHours}h</span>
                        </div>
                        <div className="w-full bg-purple-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${
                              isHoursValid ? 'bg-purple-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min((formData.hours / remainingHours) * 100, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section Période et Commentaire */}
                  <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl p-6 border border-orange-100">
                    <div className="flex items-center space-x-2 mb-4">
                      <CalendarIcon className="w-5 h-5 text-orange-600" />
                      <h4 className="text-lg font-semibold text-orange-900">Période et détails</h4>
                    </div>

                    <div className="space-y-4">
                      {/* Semestre et Année */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="semester" className="block text-sm font-medium text-orange-800 mb-2">
                            Semestre *
                          </label>
                          <select
                            id="semester"
                            name="semester"
                            value={formData.semester}
                            onChange={(e) => onChange('semester', e.target.value as "S1" | "S2")}
                            required
                            className="block w-full rounded-xl border-orange-200 bg-white/80 shadow-sm focus:border-orange-500 focus:ring-orange-500 text-sm py-3 px-4 transition-all duration-200"
                          >
                            <option value="S1">Semestre 1 (S1)</option>
                            <option value="S2">Semestre 2 (S2)</option>
                          </select>
                        </div>

                        <div>
                          <label htmlFor="year" className="block text-sm font-medium text-orange-800 mb-2">
                            Année *
                          </label>
                          <input
                            type="number"
                            name="year"
                            id="year"
                            value={formData.year}
                            onChange={(e) => onChange('year', parseInt(e.target.value))}
                            required
                            min={new Date().getFullYear() - 1}
                            max={new Date().getFullYear() + 1}
                            className="block w-full rounded-xl border-orange-200 bg-white/80 shadow-sm focus:border-orange-500 focus:ring-orange-500 text-sm py-3 px-4 transition-all duration-200"
                          />
                        </div>
                      </div>

                      {/* Commentaire */}
                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <ChatBubbleLeftRightIcon className="w-4 h-4 text-orange-600" />
                          <label htmlFor="comment" className="block text-sm font-medium text-orange-800">
                            Commentaire (optionnel)
                          </label>
                        </div>
                        <textarea
                          id="comment"
                          name="comment"
                          rows={3}
                          value={formData.comment || ''}
                          onChange={(e) => onChange('comment', e.target.value)}
                          className="block w-full rounded-xl border-orange-200 bg-white/80 shadow-sm focus:border-orange-500 focus:ring-orange-500 text-sm py-3 px-4 transition-all duration-200 resize-none"
                          placeholder="Décrivez brièvement le travail effectué..."
                        />
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium
                               hover:bg-gray-200 transition-all duration-200 transform hover:-translate-y-0.5
                               focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={!canSubmit}
                      className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all duration-200 transform
                                focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                        canSubmit
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 hover:-translate-y-0.5 focus:ring-blue-500 shadow-lg hover:shadow-xl'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {editMode ? "✓ Mettre à jour" : "✓ Créer l'entrée"}
                    </button>
                  </div>
                </form>

                {/* Effet de brillance */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent
                              opacity-0 hover:opacity-100 -translate-x-full hover:translate-x-full
                              transition-all duration-1000 ease-out rounded-2xl pointer-events-none"/>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}