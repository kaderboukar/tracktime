// components/dashboard/RecentEntries.tsx
import { TimeEntry } from "./types";
import { ClockIcon, DocumentTextIcon } from "@heroicons/react/24/outline";

export function RecentEntries({ entries }: { entries: TimeEntry[] }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Dernières entrées de temps
          </h2>
          <span className="px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 rounded-full">
            {entries.length} entrées
          </span>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <ClockIcon className="w-12 h-12 text-gray-300 mb-4" />
          <p className="text-gray-500">Aucune entrée récente</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                {["Projet", "Activité","Période","Heures"].map((header) => (
                  <th key={header} className="pb-3 px-4 text-left">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {header}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {entries.map((entry) => (
                <tr
                  key={entry.id}
                  className="group hover:bg-gray-50/50 transition-colors duration-200"
                >
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg 
                                    group-hover:scale-110 transition-transform duration-300">
                        <DocumentTextIcon className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{entry.project.name}</p>
                        <p className="text-xs text-gray-500">{entry.project.projectNumber}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900 font-medium">
                      {entry.activity.name}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900 font-medium">
                      {entry.semester}/{entry.year}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                   bg-blue-50 text-blue-700">
                      {entry.hours}h
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
