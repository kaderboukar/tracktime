import React from "react";

type Props = {
  stats: {
    totalUsers: number;
    totalProjects: number;
    totalHours: number;
  };
};

export const AdminStats: React.FC<Props> = ({ stats }) => {
  console.log('AdminStats rendu avec:', stats);
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <StatCard title="Utilisateurs" value={stats.totalUsers} icon="👥" />
      <StatCard title="Projets" value={stats.totalProjects} icon="📊" />
      <StatCard
        title="Heures totales"
        value={stats.totalHours}
        icon="⏰"
        suffix="h"
      />
    </div>
  );
};

const StatCard = ({
  title,
  value,
  icon,
  suffix = "",
}: {
  title: string;
  value: number;
  icon: string;
  suffix?: string;
}) => (
  <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/50">
    <div className="flex items-center space-x-4">
      <div className="text-3xl">{icon}</div>
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-2xl font-bold text-gray-900">
          {value.toLocaleString()}
          {suffix}
        </p>
      </div>
    </div>
  </div>
);
