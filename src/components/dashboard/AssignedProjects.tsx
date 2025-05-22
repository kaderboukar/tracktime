// components/dashboard/AssignedProjects.tsx
import { ProjectAssignment } from "./types";
import { FolderIcon, CurrencyDollarIcon, ClockIcon } from "@heroicons/react/24/outline";

export function AssignedProjects({ projects }: { projects: ProjectAssignment[] }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Mes projets assignés
        </h2>
        <span className="px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 rounded-full">
          {projects.length} projets
        </span>
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <FolderIcon className="w-12 h-12 text-gray-300 mb-4" />
          <p className="text-gray-500">Aucun projet assigné pour le moment</p>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map((project) => (
            <div
              key={project.projectId}
              className="group relative overflow-hidden p-4 rounded-xl border border-gray-100 hover:border-blue-100 
                       bg-gradient-to-r from-white to-gray-50/50 hover:from-blue-50/50 hover:to-indigo-50/50
                       transition-all duration-300 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg 
                                group-hover:scale-110 transition-transform duration-300">
                    <FolderIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                      {project.project.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {project.project.projectNumber}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                    <div className="flex items-center px-3 py-1 rounded-full bg-green-50 text-green-600">
                      <CurrencyDollarIcon className="w-4 h-4 mr-1" />
                      <span className="text-sm font-medium">{project.allocationPercentage}%</span>
                    </div>
                    <div className="flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-600">
                      <ClockIcon className="w-4 h-4 mr-1" />
                      <span className="text-sm font-medium">rémunérer</span>
                    </div>
                </div>
              </div>

              {/* Effet de brillance au survol */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent
                            opacity-0 group-hover:opacity-100 -translate-x-full group-hover:translate-x-full
                            transition-all duration-1000 ease-out"/>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
