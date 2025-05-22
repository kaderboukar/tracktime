// types/authorization.ts
import type { Role } from "@prisma/client";

export interface AuthResult {
  userId: number;
  role: Role;
}

export const ASSIGNMENT_MANAGERS: Role[] = ["ADMIN", "PMSU", "MANAGEMENT"];

export function isAuthorizedForAssignments(role: Role): boolean {
  return ASSIGNMENT_MANAGERS.includes(role);
}

export function isAuthorizedForAssignments(role: Role): boolean {
  return ASSIGNMENT_MANAGERS.includes(role as AuthorizedRoles);
}
