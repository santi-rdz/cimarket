# List Endpoint Query Features (Pagination, Sort, Fields, Search)

Every `GET /api/v1/<resource>` list endpoint supports the same query parameters:
`page`, `limit`, `sort`, `fields`, and `search`. This document describes where each
piece lives and how to wire it up for a new resource, using the `User` resource
(`packages/validation/src/user/`, `apps/api/src/services/user.service.ts`) as the
reference implementation.

## Why field allow-lists exist

`sort`, `fields`, and `search` all end up as Prisma `orderBy` / `select` / `where`
keys built from client-supplied strings. Prisma will happily accept any string that
matches a column name — including relations, unindexed columns, or columns that
should never be exposed for sorting (e.g. `password`-like secrets). To avoid passing
unvalidated client input straight into a Prisma query, every resource defines its own
allow-lists of field names, and the shared query helpers only ever accept fields from
those lists.

## Where things live

```
packages/validation/src/
  fields.ts              # generic, resource-agnostic helpers (shared by every resource)
  <resource>/
    constants.ts          # this resource's field allow-lists (SORTABLE_/SELECTABLE_/SEARCHABLE_*)
    schema.ts              # zod schemas, including the query schema that uses the allow-lists
    index.ts                # re-exports schema.ts + constants.ts

apps/api/src/
  lib/queryFeatures.ts     # buildFindManyArgs / buildSearchWhere — turns a validated
                           # query object into Prisma FindManyArgs / WhereInput
  services/<resource>.service.ts  # calls buildFindManyArgs/buildSearchWhere with this
                                   # resource's parsed query and allow-lists
```

Nothing about `queryFeatures.ts` is resource-specific — it is generic over the field
name unions supplied by each resource's `constants.ts`. Only `constants.ts` and
`schema.ts` change per resource.

## Step 1 — Define field allow-lists (`<resource>/constants.ts`)

```ts
// packages/validation/src/user/constants.ts
export const SORTABLE_USER_FIELDS = ["name", "email", "role", "createdAt", "updatedAt"] as const;
export const SELECTABLE_USER_FIELDS = [
  ...SORTABLE_USER_FIELDS,
  "id",
  "avatarKey",
  "coverKey",
  "isActive",
] as const;

export const SEARCHABLE_USER_FIELDS = ["name", "email"] as const;
```

- `as const` is required — `sortQueryParam`/`fieldsQueryParam` need a literal tuple
  type (`readonly [string, ...string[]]`) to build a `z.enum` from it.
- `SORTABLE` = fields that can appear in `?sort=`.
- `SELECTABLE` = fields that can appear in `?fields=` (usually a superset of
  sortable, since you may want to select fields you'd never sort by).
- `SEARCHABLE` = fields that free-text `?search=` is matched against
  (`contains`, case-insensitive) — keep this small and text-only.

## Step 2 — Wire the allow-lists into the query schema (`<resource>/schema.ts`)

```ts
// packages/validation/src/user/schema.ts
import { baseQuery, sortQueryParam, fieldsQueryParam, booleanQueryParam } from "../fields";
import { ROLES, SORTABLE_USER_FIELDS, SELECTABLE_USER_FIELDS } from "./constants";

export const userQuerySchema = z.object({
  ...baseQuery.shape,
  sort: sortQueryParam(SORTABLE_USER_FIELDS, { field: "createdAt", direction: "desc" }),
  fields: fieldsQueryParam(SELECTABLE_USER_FIELDS),
  role: z.enum(ROLES).optional(),
  isActive: booleanQueryParam,
});

export type UserQuery = z.infer<typeof userQuerySchema>;
```

`baseQuery` (in `fields.ts`) already provides `page`, `limit`, and a raw `search`
string — spread its shape and only add resource-specific filters (`role`,
`isActive`, etc.) plus the resource's `sort`/`fields` overrides.

The generic helpers this depends on, all in `packages/validation/src/fields.ts`:

- `sortQueryParam(allowedFields, defaultSort)` — parses `?sort=-createdAt,name` into
  `[{ field: "createdAt", direction: "desc" }, { field: "name", direction: "asc" }]`,
  rejecting any field not in `allowedFields` via `z.enum`.
- `fieldsQueryParam(allowedFields)` — parses `?fields=name,email` into
  `["name", "email"]`, same validation.
- `booleanQueryParam` — parses `"true"`/`"false"` query strings into an actual
  `boolean | undefined`.
- `baseQuery` — the shared `page`/`limit`/`search` base every resource query schema
  spreads in.

## Step 3 — Build the Prisma args in the service (`<resource>.service.ts`)

```ts
// apps/api/src/services/user.service.ts
import { buildFindManyArgs, buildSearchWhere } from "@/lib/queryFeatures";
import { SEARCHABLE_USER_FIELDS, type UserQuery } from "@cm/validation";

export const getAll = async (prisma: PrismaClient, query: UserQuery) => {
  const { role, isActive, search, ...pagination } = query;

  const where: Prisma.UserWhereInput = {
    ...(role !== undefined && { role }),
    ...(isActive !== undefined && { isActive }),
    ...buildSearchWhere(search, SEARCHABLE_USER_FIELDS),
    isDeleted: false,
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({ where, ...buildFindManyArgs(pagination) }),
    prisma.user.count({ where }),
  ]);

  return { users, total };
};
```

Notes:

- Destructure resource-specific filters (`role`, `isActive`, `search`) out of
  `query` first; whatever remains (`page`, `limit`, `sort`, `fields`) is exactly the
  shape `buildFindManyArgs` expects — pass it through directly as `...pagination`.
- `buildSearchWhere(search, fields)` must be spread **inside** the same `where`
  object as the other filters (not as a sibling key next to `where`), so its `OR`
  clause is ANDed together with `role`/`isActive`/`isDeleted` instead of replacing
  them.
- Always run `count({ where })` with the _same_ `where` (minus `skip`/`take`) to get
  the total for the pagination envelope — see `buildFindManyArgs`'s return shape
  below.
- Soft-deletable resources must always filter `isDeleted: false` here; it is not
  something `buildFindManyArgs`/`buildSearchWhere` add for you.

## The generic helpers (`apps/api/src/lib/queryFeatures.ts`)

```ts
export function buildFindManyArgs<
  SortField extends string,
  SelectField extends string = SortField,
>(query: { page: number; limit: number; sort: SortEntry<SortField>[]; fields?: SelectField[] }) {
  return {
    skip: (query.page - 1) * query.limit,
    take: query.limit,
    orderBy: query.sort.map(({ field, direction }) => ({ [field]: direction })),
    ...(query.fields && { select: Object.fromEntries(query.fields.map((f) => [f, true])) }),
  };
}

export function buildSearchWhere<Field extends string>(
  search: string | undefined,
  fields: readonly Field[],
): { OR?: Partial<Record<Field, { contains: string; mode: "insensitive" }>>[] } {
  if (!search) return {};
  return { OR: fields.map((field) => ({ [field]: { contains: search, mode: "insensitive" } })) };
}
```

- Both functions are generic over the field-name union (`SortField`, `SelectField`,
  `Field`), not `string`. This is what lets their output structurally satisfy
  `Prisma.<Model>FindManyArgs`/`Prisma.<Model>WhereInput` without an `as` cast at the
  call site — TypeScript can only narrow `orderBy`/`select`/`OR` to the model's real
  keys if the generic parameter is already a literal union of that model's field
  names, which is exactly what `SORTABLE_*_FIELDS`/`SELECTABLE_*_FIELDS`/
  `SEARCHABLE_*_FIELDS` provide.
- `buildSearchWhere` returns `{}` (no `OR` key at all) when `search` is empty, so
  spreading it into `where` when there's no search term is a no-op.
- These two functions never talk to Prisma directly and never import
  `@prisma/client` — they only shape plain objects. That's what keeps them reusable
  across every resource.

## Checklist for a new resource

1. Add `SORTABLE_<X>_FIELDS`, `SELECTABLE_<X>_FIELDS`, `SEARCHABLE_<X>_FIELDS` to
   `packages/validation/src/<resource>/constants.ts`.
2. Build `<resource>QuerySchema` in `<resource>/schema.ts` by spreading
   `baseQuery.shape` and adding `sortQueryParam(...)`, `fieldsQueryParam(...)`, and
   any resource-specific filters.
3. In the service's `getAll`, destructure resource-specific filters out of the
   parsed query, build `where` (including `buildSearchWhere(...)` and
   `isDeleted: false` if applicable), and call
   `findMany({ where, ...buildFindManyArgs(pagination) })` alongside
   `count({ where })`.
4. Do not import `queryFeatures.ts` helpers anywhere except services — routes only
   validate and pass the parsed query through.
