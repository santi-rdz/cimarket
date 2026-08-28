import { z } from "zod";

const numericField = (integer: boolean, m?: string) => {
  const base = z.coerce.number({ error: m ?? "Debe ser un nombre valido" });
  return integer ? base.int("Debe ser un número entero") : base;
};

export const num = (m?: string) => numericField(false, m);
export const int = (m?: string) => numericField(true, m);
export const str = (m?: string) => z.string(m ? { error: m } : undefined).trim();

export const cuidField = z.cuid2();
export const emailField = str("El email es requerido")
  .toLowerCase()
  .pipe(z.email("Ingresa un email valido"));
export const keyField = str("Ingresa una key valida").max(1024);

export const booleanQueryParam = z
  .enum(["true", "false"], { error: "Debe ser true o false" })
  .optional()
  .transform((value) => (value === undefined ? undefined : value === "true"));

export type SortDirection = "asc" | "desc";
export type SortEntry<Field extends string> = { field: Field; direction: SortDirection };

// Parses `?sort=-createdAt,name` into [{field:'createdAt',direction:'desc'}, {field:'name',direction:'asc'}],
// validating each field name against the model's own allow-list.
export function sortQueryParam<T extends readonly [string, ...string[]]>(
  allowedFields: T,
  defaultSort: SortEntry<T[number]>,
) {
  return str()
    .optional()
    .transform((value) => {
      if (!value) return [defaultSort];
      return value.split(",").map((raw) => {
        const desc = raw.startsWith("-");
        return { field: desc ? raw.slice(1) : raw, direction: desc ? "desc" : "asc" };
      });
    })
    .pipe(
      z.array(
        z.object({
          field: z.enum(allowedFields, { error: "Campo de ordenamiento inválido" }),
          direction: z.enum(["asc", "desc"]),
        }),
      ),
    );
}

// Parses `?fields=name,email` into ['name','email'], validating each against
// the model's own allow-list.
export function fieldsQueryParam<T extends readonly [string, ...string[]]>(allowedFields: T) {
  return str()
    .optional()
    .transform((value) => (value ? value.split(",") : undefined))
    .pipe(z.array(z.enum(allowedFields, { error: "Campo inválido" })).optional());
}

export const baseQuery = z.object({
  sort: str().optional(),
  search: str().optional(),
  page: int().min(1).default(1),
  limit: int().min(1).max(100).default(10),
});

export const paramsSchema = z.object({ id: cuidField });
