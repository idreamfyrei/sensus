import { router } from "./trpc";

import { healthRouter } from "./routes/health/health.route";

export const serverRouter = router({
  health: healthRouter,
});

export { createContext } from "./context";
export type ServerRouter = typeof serverRouter;
