import { z } from "zod";
import { publicProcedure, router } from "../../trpc";
import { ThemesController } from "./themes.controller";

const controller = new ThemesController();

export const themesRouter = router({
  list: publicProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/themes",
        tags: ["Themes"],
        summary: "List the 10 design-token themes a creator can choose from",
      },
    })
    .output(z.any())
    .query(({ ctx }) => controller.list(ctx)),
});
