import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';

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
  editMode
}: CreateTimeEntryModalProps) {
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
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
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
              <Dialog.Panel className="relative transform rounded-lg bg-white px-4 pt-5 pb-4 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    onClick={onClose}
                  >
                    <span className="sr-only">Fermer</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <div className="sm:flex sm:items-start">
                  <div className="mt-3 w-full text-center sm:mt-0 sm:text-left">
                    <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                      {editMode ? "Modifier une entrée de temps" : "Nouvelle entrée de temps"}
                    </Dialog.Title>

                    <form onSubmit={onSubmit} className="mt-6 space-y-6">
                      {/* Projet */}
                      <div>
                        <label htmlFor="projectId" className="block text-sm font-medium text-gray-700">
                          Projet
                        </label>
                        <select
                          id="projectId"
                          name="projectId"
                          value={formData.projectId}
                          onChange={(e) => onChange('projectId', parseInt(e.target.value))}
                          required
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        >
                          <option value="">Sélectionner un projet</option>
                          {projects.map((project) => (
                            <option key={project.id} value={project.id}>
                              {project.name} - {project.projectNumber}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Activité */}
                      <div>
                        <label htmlFor="activityId" className="block text-sm font-medium text-gray-700">
                          Activité
                        </label>
                        <select
                          id="activityId"
                          name="activityId"
                          value={formData.activityId}
                          onChange={(e) => onChange('activityId', parseInt(e.target.value))}
                          required
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        >
                          <option value="">Sélectionner une activité</option>
                          {activities.map((activity) => (
                            <option key={activity.id} value={activity.id}>
                              {activity.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Heures */}
                      <div>
                        <label htmlFor="hours" className="block text-sm font-medium text-gray-700">
                          Heures travaillées
                        </label>
                        <div className="mt-1 flex rounded-md shadow-sm">
                          <input
                            type="number"
                            name="hours"
                            id="hours"
                            value={formData.hours}
                            onChange={(e) => onChange('hours', parseFloat(e.target.value))}
                            required
                            min="0"
                            max={remainingHours}
                            step="0.5"
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          />
                        </div>
                        <p className="mt-1 text-sm text-gray-500">
                          Heures restantes disponibles : {remainingHours}h
                        </p>
                      </div>

                      {/* Semestre et Année */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="semester" className="block text-sm font-medium text-gray-700">
                            Semestre
                          </label>
                          <select
                            id="semester"
                            name="semester"
                            value={formData.semester}
                            onChange={(e) => onChange('semester', e.target.value as "S1" | "S2")}
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          >
                            <option value="S1">S1</option>
                            <option value="S2">S2</option>
                          </select>
                        </div>

                        <div>
                          <label htmlFor="year" className="block text-sm font-medium text-gray-700">
                            Année
                          </label>
                          <input
                            type="number"
                            name="year"
                            id="year"
                            value={formData.year}
                            onChange={(e) => onChange('year', parseInt(e.target.value))}
                            required
                            min={new Date().getFullYear()}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          />
                        </div>
                      </div>

                      {/* Commentaire */}
                      <div>
                        <label htmlFor="comment" className="block text-sm font-medium text-gray-700">
                          Commentaire (optionnel)
                        </label>
                        <textarea
                          id="comment"
                          name="comment"
                          rows={3}
                          value={formData.comment || ''}
                          onChange={(e) => onChange('comment', e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                      </div>

                      {/* Actions */}
                      <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                        <button
                          type="submit"
                          className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:col-start-2"
                        >
                          {editMode ? "Mettre à jour" : "Créer"}
                        </button>
                        <button
                          type="button"
                          className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:col-start-1 sm:mt-0"
                          onClick={onClose}
                        >
                          Annuler
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}