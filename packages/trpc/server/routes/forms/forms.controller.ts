import type { Context } from "../../context";

/**
 * Creator-scoped form operations. Every method takes a Context that has
 * already passed through `authMiddleware`, so `ctx.userId` is guaranteed
 * to be a string here (not null).
 *
 * Stateless — no constructor dependencies. Services are pulled off
 * `ctx.services` per request, which means swapping a real FormService for
 * a mock in tests is just a different Context.
 */

// Narrow Context: after authMiddleware, userId is definitely a string.
type ProtectedContext = Context & { userId: string };

export type CreateFormInput = {
  title: string;
  description?: string | null;
  themeId: string;
};

export type PublishFormInput = {
  id: string;
  version: number;
};

export class FormsController {
  async create(ctx: ProtectedContext, input: CreateFormInput) {
    return ctx.services.forms.create({ userId: ctx.userId, input });
  }

  async list(ctx: ProtectedContext) {
    return ctx.services.forms.listByUser({ userId: ctx.userId });
  }

  async publish(ctx: ProtectedContext, input: PublishFormInput) {
    return ctx.services.forms.publish({
      id: input.id,
      userId: ctx.userId,
      version: input.version,
    });
  }
}
