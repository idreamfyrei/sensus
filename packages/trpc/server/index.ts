import { router } from "./trpc";

import { healthRouter } from "./routes/health/health.route";
import { formsRouter } from "./routes/forms/forms.route";
import { fieldsRouter } from "./routes/fields/fields.route";
import { publicFormRouter } from "./routes/public-form/public-form.route";
import { accountRouter } from "./routes/account/account.route";
import { themesRouter } from "./routes/themes/themes.route";

export const serverRouter = router({
  health: healthRouter,
  forms: formsRouter,
  fields: fieldsRouter,
  publicForm: publicFormRouter,
  account: accountRouter,
  themes: themesRouter,
});

export { createContext } from "./context";
export type ServerRouter = typeof serverRouter;
