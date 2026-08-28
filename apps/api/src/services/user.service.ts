import { NotFoundError } from "@/lib/AppError";
import type { PrismaClient } from "@/lib/prisma";
import { buildFindManyArgs, buildSearchWhere } from "@/lib/queryFeatures";
import { SEARCHABLE_USER_FIELDS, type UserOutput, type UserQuery } from "@cm/validation";
import { Prisma } from "../generated/prisma/client.js";

export const getAll = async (prisma: PrismaClient, query: UserQuery) => {
  const { role, isActive, search, ...pagination } = query;

  const where: Prisma.UserWhereInput = {
    ...(role !== undefined && { role }),
    ...(isActive !== undefined && { isActive }),
    ...buildSearchWhere(search, SEARCHABLE_USER_FIELDS),
    isDeleted: false,
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      ...buildFindManyArgs(pagination),
    }),
    prisma.user.count({ where }),
  ]);

  return { users, total };
};
export const getById = async (prisma: PrismaClient, id: string) => {
  const user = await prisma.user.findUnique({
    where: { id, isDeleted: false },
  });
  if (!user) throw new NotFoundError("Usuario");
  return user;
};
export const create = async (prisma: PrismaClient, data: UserOutput) => {
  return prisma.user.create({
    data,
  });
};
export const update = async (prisma: PrismaClient, id: string, data: Partial<UserOutput>) => {
  return prisma.user.update({
    where: { id, isDeleted: false },
    data,
  });
};
export const remove = async (prisma: PrismaClient, id: string) => {
  return prisma.user.update({
    where: { id },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
      email: `deleted+${id}@deleted.internal`,
      googleId: `deleted:${id}`,
    },
  });
};
