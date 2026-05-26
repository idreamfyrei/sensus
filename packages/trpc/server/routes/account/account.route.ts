import { protectedProcedure, router } from "../../trpc";
import { AccountController } from "./account.controller";

const controller = new AccountController();

export const accountRouter = router({
  deleteSelf: protectedProcedure.mutation(({ ctx }) => controller.deleteSelf(ctx)),
});
