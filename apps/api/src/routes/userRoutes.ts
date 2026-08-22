import { Hono } from "hono";
import {
  paramsSchema,
  userPartialSchema,
  userQuerySchema,
  userSchema,
  type UserOutput,
} from "@cm/validation";
import type { AppEnv } from "@/types/hono";
import { validate } from "@/lib/validate";
import * as userService from "@services/user.service";

const userRouter = new Hono<AppEnv>()
  .get("/", validate("query", userQuerySchema), async (c) => {
    const query = c.req.valid("query");
    const { users, total } = await userService.getAll(c.var.prisma, query);
    const { page, limit } = query;
    return c.json({
      status: "success",
      data: { users },
      count: users.length,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
  })
  .post("/", validate("json", userSchema), async (c) => {
    const data = c.req.valid("json");
    const user = await userService.create(c.var.prisma, data);
    return c.json(user);
  })
  .get("/:id", validate("param", paramsSchema), async (c) => {
    const { id } = c.req.valid("param");
    const user = await userService.getById(c.var.prisma, id);
    return c.json(user);
  })
  .patch(
    "/:id",
    validate("param", paramsSchema),
    validate("json", userPartialSchema),
    async (c) => {
      const { id } = c.req.valid("param");
      const data = c.req.valid("json");
      const user = await userService.update(c.var.prisma, id, data as Partial<UserOutput>);
      return c.json(user);
    },
  )
  .delete("/:id", validate("param", paramsSchema), async (c) => {
    const { id } = c.req.valid("param");
    const user = await userService.remove(c.var.prisma, id);
    return c.json(user);
  });

export default userRouter;
