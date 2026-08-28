export const ROLES = ["ADMIN", "USER", "SUPERADMIN"] as const;

export const SORTABLE_USER_FIELDS = ["name", "email", "role", "createdAt", "updatedAt"] as const;
export const SELECTABLE_USER_FIELDS = [
  ...SORTABLE_USER_FIELDS,
  "id",
  "avatarKey",
  "coverKey",
  "isActive",
] as const;

export const SEARCHABLE_USER_FIELDS = ["name", "email"] as const;
