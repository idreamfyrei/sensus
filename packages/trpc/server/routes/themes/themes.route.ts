import { publicProcedure, router } from "../../trpc";
import { ThemesController } from "./themes.controller";

const controller = new ThemesController();

export const themesRouter = router({
  list: publicProcedure.query(({ ctx }) => controller.list(ctx)),
});
