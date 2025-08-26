// components/dashboard/AssignedProjects.tsx
import { ProjectAssignment } from "./types";
import { FolderIcon, CurrencyDollarIcon } from "@heroicons/react/24/outline";

export function AssignedProjects({ projects }: { projects: ProjectAssignment[] }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-gray-900">
          Mes projets assignés
        </h2>
        <span className="px-2 py-0.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-full">
          {projects.length}
        </span>
      </div>

      {projects.length === 0 ? (
        <div className="flex items-center justify-center p-3 text-center">
          <FolderIcon className="w-6 h-6 text-gray-300 mr-2" />
          <p className="text-xs text-gray-500">Aucun projet assigné</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {projects.slice(0, 2).map((project) => (
            <div
              key={project.projectId}
              className="flex items-center justify-between p-2 rounded-md border border-gray-100 hover:border-blue-200 
                       bg-gray-50/50 hover:bg-blue-50/50 transition-all duration-150"
            >
              <div className="flex items-center space-x-2 min-w-0 flex-1">
                <FolderIcon className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {project.project.name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {project.project.projectNumber}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center px-2 py-1 rounded-full bg-green-50 text-green-600 flex-shrink-0">
                <CurrencyDollarIcon className="w-3 h-3 mr-1" />
                <span className="text-xs font-medium">{project.allocationPercentage}%</span>
              </div>
            </div>
          ))}
          
          {projects.length > 2 && (
            <div className="text-center pt-1">
              <span className="text-xs text-gray-400">
                +{projects.length - 2} autres
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
