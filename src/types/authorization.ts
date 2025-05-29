// types/authorization.ts
import type { Role } from "@prisma/client";

export interface AuthResult {
  userId: number;
  role: Role;
}

export const ASSIGNMENT_MANAGERS: Role[] = ["ADMIN", "PMSU"];

export function isAuthorizedForAssignments(role: Role): boolean {
  return ASSIGNMENT_MANAGERS.includes(role);
}
