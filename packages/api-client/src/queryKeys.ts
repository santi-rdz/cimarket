// All queyKeys used in TanStack/Query all centralized as functions in this file
export const queryKeys = {
  auth: {
    me: () => ['auth', 'me'] as const,
  },
  users: {
    all: () => ['users'] as const,
    profile: (id: string) => ['users', id] as const,
  },
};
