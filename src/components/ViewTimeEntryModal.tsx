import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { ClockIcon, BriefcaseIcon, UserIcon } from '@heroicons/react/24/outline';

type TimeEntry = {
  id: number;
  hours: number;
  semester: string;
  year: number;
  comment?: string;
  status: string;
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
    status: string;
    comment?: string;
    createdAt: string;
    validator: {
      name: string;
      indice: string;
    };
  }>;
};

type ViewTimeEntryModalProps = {
  isOpen: boolean;
  onClose: () => void;
  timeEntry: TimeEntry | null;
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getStatusTranslation = (status: string) => {
  switch (status) {
    case 'APPROVED':
      return 'Approuvé';
    case 'REJECTED':
      return 'Rejeté';
    case 'REVISED':
      return 'En révision';
    default:
      return 'En attente';
  }
};

const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case 'APPROVED':
      return 'bg-green-50 text-green-700 ring-green-600/20';
    case 'REJECTED':
      return 'bg-red-50 text-red-700 ring-red-600/20';
    case 'REVISED':
      return 'bg-orange-50 text-orange-700 ring-orange-600/20';
    default:
      return 'bg-blue-50 text-blue-700 ring-blue-600/20';
  }
};

export default function ViewTimeEntryModal({ isOpen, onClose, timeEntry }: ViewTimeEntryModalProps) {
  if (!timeEntry) return null;

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
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full justify-center p-4 text-center items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform rounded-2xl bg-white/95 backdrop-blur-xl px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6 border border-white/20">
                <div>
                  {/* En-tête */}
                  <div className="border-b border-gray-100 pb-5">
                    <Dialog.Title as="h3" className="text-xl font-semibold leading-6 text-gray-900">
                      Détails de l&apos;entrée de temps
                    </Dialog.Title>
                  </div>

                  {/* Contenu principal */}
                  <div className="mt-6 space-y-8">
                    {/* Informations utilisateur */}
                    <div className="rounded-xl bg-gray-50/50 p-4 border border-gray-100">
                      <div className="flex items-center space-x-4">
                        <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                          <UserIcon className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">{timeEntry.user.name}</h4>
                          <p className="text-sm text-gray-500">{timeEntry.user.indice}</p>
                          {timeEntry.user.grade && (
                            <p className="text-sm text-gray-500">Grade: {timeEntry.user.grade}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Informations projet et activité */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="rounded-xl bg-gray-50/50 p-4 border border-gray-100">
                        <div className="flex items-start space-x-4">
                          <div className="h-8 w-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                            <BriefcaseIcon className="h-4 w-4 text-indigo-600" />
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-900">Projet</h4>
                            <p className="text-sm text-gray-500">{timeEntry.project.name}</p>
                            <p className="text-xs text-gray-400">#{timeEntry.project.projectNumber}</p>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-xl bg-gray-50/50 p-4 border border-gray-100">
                        <div className="flex items-start space-x-4">
                          <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center">
                            <ClockIcon className="h-4 w-4 text-green-600" />
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-900">Activité</h4>
                            <p className="text-sm text-gray-500">{timeEntry.activity.name}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Détails temps et statut */}
                    <div className="rounded-xl bg-gray-50/50 p-4 border border-gray-100">
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div>
                          <h4 className="text-xs font-medium uppercase text-gray-500">Période</h4>
                          <p className="mt-1 text-sm text-gray-900">
                            {timeEntry.semester} {timeEntry.year}
                          </p>
                        </div>
                        <div>
                          <h4 className="text-xs font-medium uppercase text-gray-500">Heures</h4>
                          <p className="mt-1 text-sm text-gray-900">{timeEntry.hours}h</p>
                        </div>
                        <div>
                          <h4 className="text-xs font-medium uppercase text-gray-500">Statut</h4>
                          <span className={`mt-1 inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${getStatusBadgeClass(timeEntry.status)}`}>
                            {getStatusTranslation(timeEntry.status)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Historique des validations */}
                    {timeEntry.validationHistory && timeEntry.validationHistory.length > 0 && (
                      <div className="rounded-xl bg-gray-50/50 p-4 border border-gray-100">
                        <h4 className="text-sm font-medium text-gray-900 mb-4">Historique des validations</h4>
                        <div className="space-y-4">
                          {timeEntry.validationHistory.map((validation, index) => (
                            <div key={index} className="flex items-start space-x-3 text-sm">
                              <div className={`mt-0.5 h-2 w-2 rounded-full ${getStatusBadgeClass(validation.status)}`} />
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">
                                  {getStatusTranslation(validation.status)}
                                  <span className="font-normal text-gray-500 ml-2">
                                    par {validation.validator.name}
                                  </span>
                                </p>
                                {validation.comment && (
                                  <p className="mt-1 text-gray-500">{validation.comment}</p>
                                )}
                                <p className="mt-1 text-xs text-gray-400">
                                  {formatDate(validation.createdAt)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-8 border-t border-gray-100 pt-5">
                  <div className="flex justify-end">
                    <button
                      type="button"
                      className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                      onClick={onClose}
                    >
                      Fermer
                    </button>
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
