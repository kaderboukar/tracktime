import { ClockIcon } from "@heroicons/react/24/outline";

type WorkedHoursProps = {
  totalHours: number;
  activePeriod?: { year: number; semester: "S1" | "S2" } | null;
};

export function WorkedHours({ totalHours, activePeriod }: WorkedHoursProps) {
  const maxHours = 480;
  // S'assurer que le pourcentage ne dépasse pas 100% et gérer les cas extrêmes
  const percentage = Math.min(Math.max((totalHours / maxHours) * 100, 0), 100);
  
  // Utiliser la période active si disponible, sinon utiliser la période actuelle
  const currentDate = new Date();
  const currentSemester = activePeriod?.semester || (currentDate.getMonth() < 6 ? 'S1' : 'S2');
  const currentYear = activePeriod?.year || currentDate.getFullYear();
  
  // Formater l'affichage des heures
  const formattedHours = totalHours.toFixed(1);
  const remainingHours = Math.max(0, maxHours - totalHours);

  const getProgressColor = (percent: number) => {
    if (percent >= 100) return "bg-red-600"; // Rouge foncé pour 100%
    if (percent >= 90) return "bg-red-500";
    if (percent >= 70) return "bg-yellow-500";
    return "bg-blue-500";
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <ClockIcon className="w-4 h-4 text-blue-600" />
          <h2 className="text-base font-semibold text-gray-900">
            Heures travaillées
          </h2>
        </div>
        <span className="px-2 py-0.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-full">
          {currentSemester} {currentYear}
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
                  <div>
          <p className="text-xl font-bold text-gray-900">
            {formattedHours}h
          </p>
          <p className="text-xs text-gray-500">
            Total {currentSemester} {currentYear}
          </p>
        </div>
          <div className="text-right">
            <p className={`text-sm font-semibold ${
              percentage >= 100 ? 'text-red-700' : 
              percentage >= 90 ? 'text-red-600' : 
              percentage >= 70 ? 'text-yellow-600' : 
              'text-blue-600'
            }`}>
              {percentage.toFixed(1)}%
            </p>
            <p className="text-xs text-gray-500">
              {remainingHours.toFixed(1)}h restantes
              {totalHours >= maxHours && " (limite atteinte)"}
            </p>
          </div>
        </div>

        <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full ${getProgressColor(percentage)} transition-all duration-500 ease-in-out`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}
