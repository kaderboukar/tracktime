// components/dashboard/types.ts
export type ProjectAssignment = {
  projectId: number;
  project: { name: string; projectNumber: string };
  assignmentType: "SECONDARY" | "REMUNERATED";
  allocationPercentage: number | null;
  userId: number;
};

export type TimeEntry = {
  id: number;
  hours: number;
  semester: "S1" | "S2";
  year: number;
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
};

export type Stats = {
  totalUsers: number;
  totalProjects: number;
  totalHours: number;
};
