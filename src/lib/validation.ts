// lib/validation.ts
import { z } from "zod";

const proformaCostSchema = z.object({
  year: z.number()
    .min(new Date().getFullYear(), `L'année doit être supérieure ou égale à ${new Date().getFullYear()}`)
    .max(2100, "L'année doit être inférieure à 2100"),
  cost: z.number().positive("Le coût doit être positif")
});

export const registerSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z
    .string()
    .min(6, "Le mot de passe doit contenir au moins 6 caractères"),
  name: z.string().min(1, "Le nom est requis"),
  indice: z.string().min(1, "L'indice est requis"),
  grade: z.string().min(1, "Le grade est requis"),
  proformaCosts: z.array(proformaCostSchema)
    .min(1, "Au moins un coût proforma est requis")
    .refine(
      (costs) => {
        const years = costs.map((cost) => cost.year);
        return years.length === new Set(years).size;
      },
      {
        message: "Les années doivent être uniques",
      }
    ),
  type: z.enum(["OPERATION", "PROGRAMME", "SUPPORT"], {
    errorMap: () => ({
      message: "Type d'utilisateur invalide",
    }),
  }),
  role: z.enum(["ADMIN", "PMSU", "MANAGEMENT", "STAFF"], {
    errorMap: () => ({
      message: "Rôle invalide",
    }),
  }).default("STAFF"),
  isActive: z.boolean().default(true),
  signature: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "Mot de passe requis"),
});

export const projectSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  projectNumber: z.string().min(1, "Le numéro de projet est requis"),
  projectType: z.string().min(1, "Le type de projet est requis"),
  staffAccess: z.enum(["ALL", "OPERATION", "PROGRAMME", "SUPPORT"], {
    required_error: "L'accès au staff est requis",
    invalid_type_error: "Type d'accès invalide",
  }),
});

export const assignmentSchema = z
  .object({
    userId: z.number().int().positive("ID utilisateur invalide"),
    projectId: z.number().int().positive("ID projet invalide"),
    assignmentType: z.enum(["SECONDARY", "REMUNERATED"], {
      errorMap: () => ({
        message: "Type d’assignation doit être SECONDARY ou REMUNERATED",
      }),
    }),
    percentage: z
      .number()
      .min(0)
      .max(100, "Le pourcentage doit être entre 0 et 100")
      .optional(),
  })
  .refine(
    (data) =>
      data.assignmentType === "REMUNERATED"
        ? data.percentage !== undefined
        : data.percentage === undefined,
    {
      message:
        "Le pourcentage est requis pour REMUNERATED et interdit pour SECONDARY",
      path: ["percentage"],
    }
  );

export const timeEntrySchema = z.object({
  id: z.number().optional(),
  userId: z.number().positive("ID utilisateur invalide"),
  projectId: z.number().positive("ID projet invalide"),
  activityId: z.number().positive("ID activité invalide"),
  hours: z.number().positive("Les heures doivent être positives").max(24, "Maximum 24 heures par jour"),
  semester: z.enum(["S1", "S2"]),
  year: z.number().int().min(2000).max(2100),
  comment: z.string().optional(),
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "REVISED"]).default("PENDING")
});

export const timeEntryUpdateSchema = z.object({
  id: z.number(),
  userId: z.number(),
  projectId: z.number(),
  activityId: z.number(),
  startDate: z.string(),
  endDate: z.string(),
  hours: z.number(),
});

export type TimeEntryInput = z.infer<typeof timeEntrySchema>;
export type TimeEntryUpdateInput = z.infer<typeof timeEntryUpdateSchema>;

export const activitySchema = z.object({
  name: z.string().min(1, "Le nom de l’activité est requis"),
  parentId: z.number().int().positive("ID parent invalide").optional(),
});

export const timeEntryValidationSchema = z.object({
  id: z.number().positive("ID invalide"),
  status: z.enum(["APPROVED", "REJECTED", "REVISED"], {
    required_error: "Le statut est requis",
    invalid_type_error: "Statut invalide",
  }),
  comment: z.string().optional(),
  validatorId: z.number().optional(),
});
