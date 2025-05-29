import { ClockIcon } from "@heroicons/react/24/outline";

type WorkedHoursProps = {
  totalHours: number;
};

export function WorkedHours({ totalHours }: WorkedHoursProps) {
  const maxHours = 480; // 6 mois * 160 heures par mois
  const percentage = Math.min((totalHours / maxHours) * 100, 100);
  
  const currentDate = new Date();
  const currentSemester = currentDate.getMonth() < 6 ? 'S1' : 'S2';
  const currentYear = currentDate.getFullYear();

  const getProgressColor = (percent: number) => {
    if (percent >= 90) return "from-red-500 to-red-600";
    if (percent >= 70) return "from-yellow-500 to-yellow-600";
    return "from-blue-500 to-indigo-600";
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
            <ClockIcon className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Heures travaillées
          </h2>
        </div>
        <span className="px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 rounded-full">
          {currentSemester} {currentYear}
        </span>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-3xl font-bold text-gray-900">
              {totalHours.toFixed(1)}
              <span className="text-lg text-gray-500 ml-1"></span>
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Heures totales ce semestre
            </p>
          </div>
          <div className="bg-gray-50 px-3 py-1 rounded-full">
            <span className={`text-sm font-medium ${
              percentage >= 90 ? 'text-red-600' : 
              percentage >= 70 ? 'text-yellow-600' : 
              'text-blue-600'
            }`}>
              {percentage.toFixed(1)}%
            </span>
          </div>
        </div>

        <div className="relative h-4">
          <div className="absolute inset-0 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${getProgressColor(percentage)} 
                         transition-all duration-1000 ease-in-out rounded-full
                         relative group`}
              style={{ width: `${percentage}%` }}
            >
              {/* Effet de brillance */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent
                            opacity-0 group-hover:opacity-100 -translate-x-full group-hover:translate-x-full
                            transition-all duration-1000 ease-out"/>
            </div>
          </div>
        </div>

        {/* <div className="grid grid-cols-3 gap-4 pt-4">
          {[
            { 
              id: 'remaining',
              label: "Heures restantes", 
              value: `${Math.max(0, maxHours - totalHours).toFixed(1)}h` 
            },
            { 
              id: 'completed',
              label: "Heures complétées",
              value: `${totalHours.toFixed(1)}h`
            },
            { 
              id: 'max',
              label: "Temps Max", 
              value: `${maxHours}h` 
            }
          ].map((stat) => (
            <div key={stat.id} className="text-center">
              <p className="text-sm font-medium text-gray-500">{stat.label}</p>
              <p className="text-lg font-semibold text-gray-900 mt-1">{stat.value}</p>
            </div>
          ))}
        </div> */}
      </div>
    </div>
  );
}
