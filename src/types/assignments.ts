export type FormData = {
  userId: number;
  projectId: number;
  allocationPercentage: number;
};

export type ProjectAssignment = {
  projectId: number;
  allocationPercentage: number;
};

export type User = {
  id: number;
  name: string;
  indice: string;
  projects: {
    project: { id: number; name: string; projectNumber: string };
    allocationPercentage: number;
    userId_projectId: string;
  }[];
};

export type Project = { 
  id: number; 
  name: string; 
  projectNumber: string;
};
