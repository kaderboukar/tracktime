// components/dashboard/types.ts
export type ProjectAssignment = {
  projectId: number;
  project: { name: string; projectNumber: string };
  assignmentType: "SECONDARY" | "REMUNERATED";
  allocationPercentage: number | null;
};

export type TimeEntry = {
  id: number;
  project: { name: string; projectNumber: string };
  activity: { name: string };
  semester: 'S1' | 'S2';
  year: number;
  hours: number;
  user: {
    proformaCost: number;
  };
};

export type Stats = {
  totalUsers: number;
  totalProjects: number;
  totalHours: number;
};
