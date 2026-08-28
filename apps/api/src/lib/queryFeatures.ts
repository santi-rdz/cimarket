import type { SortEntry } from "@cm/validation";

type PaginationQuery<SortField extends string, SelectField extends string = SortField> = {
  page: number;
  limit: number;
  sort: SortEntry<SortField>[];
  fields?: SelectField[] | undefined;
};

export function buildFindManyArgs<SortField extends string, SelectField extends string = SortField>(
  query: PaginationQuery<SortField, SelectField>,
) {
  return {
    skip: (query.page - 1) * query.limit,
    take: query.limit,
    orderBy: query.sort.map(
      ({ field, direction }) =>
        ({ [field]: direction }) as Partial<Record<SortField, "asc" | "desc">>,
    ),
    ...(query.fields && {
      select: Object.fromEntries(query.fields.map((field) => [field, true])) as Partial<
        Record<SelectField, true>
      >,
    }),
  };
}

type SearchWhere<Field extends string> = {
  OR?: Partial<Record<Field, { contains: string; mode: "insensitive" }>>[];
};

export function buildSearchWhere<Field extends string>(
  search: string | undefined,
  fields: readonly Field[],
): SearchWhere<Field> {
  if (!search) return {};
  return {
    OR: fields.map(
      (field) =>
        ({ [field]: { contains: search, mode: "insensitive" } }) as Partial<
          Record<Field, { contains: string; mode: "insensitive" }>
        >,
    ),
  };
}
