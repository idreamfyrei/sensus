import type { Context } from "../../context";

export class ThemesController {
  async list(ctx: Context) {
    return ctx.services.themes.listPresets();
  }
}
