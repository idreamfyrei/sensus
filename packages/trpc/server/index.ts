import { router } from "./trpc";

import { healthRouter } from "./routes/health/health.route";
import { formsRouter } from "./routes/forms/forms.route";
import { publicFormRouter } from "./routes/public-form/public-form.route";

export const serverRouter = router({
  health: healthRouter,
  forms: formsRouter,
  publicForm: publicFormRouter,
});

export { createContext } from "./context";
export type ServerRouter = typeof serverRouter;
