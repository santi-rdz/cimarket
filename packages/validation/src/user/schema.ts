import { z } from "zod";
import {
  emailField,
  keyField,
  str,
  baseQuery,
  booleanQueryParam,
  sortQueryParam,
  fieldsQueryParam,
} from "../fields";
import { ROLES, SORTABLE_USER_FIELDS, SELECTABLE_USER_FIELDS } from "./constants";

const roleEnum = z.enum(ROLES, { error: "Selecciona un rol" }).default("USER");

export type UserRole = z.infer<typeof roleEnum>;
export const userSchema = z.object({
  googleId: str("El googleId es requerido"),
  name: str("El nombre es requerido").max(255),
  email: emailField,
  role: roleEnum,
  avatarKey: keyField,
  coverKey: keyField.optional().transform((val) => val ?? null),
  isActive: z.boolean().default(true),
});

export const userQuerySchema = z.object({
  page: baseQuery.shape.page,
  limit: baseQuery.shape.limit,
  sort: sortQueryParam(SORTABLE_USER_FIELDS, { field: "createdAt", direction: "desc" }),
  fields: fieldsQueryParam(SELECTABLE_USER_FIELDS),
  role: z.enum(ROLES).optional(),
  isActive: booleanQueryParam,
});

export type UserQuery = z.infer<typeof userQuerySchema>;

export type UserInput = z.input<typeof userSchema>;
export type UserOutput = z.infer<typeof userSchema>;

export const userPartialSchema = userSchema.partial();
