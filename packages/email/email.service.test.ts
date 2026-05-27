import { describe, expect, it, vi } from "vitest";
import { EmailService } from "./email.service";

describe("EmailService mock mode", () => {
  it("logs payload for creator notification without Resend config", async () => {
    const logger = {
      info: vi.fn(),
      error: vi.fn(),
    };
    const service = new EmailService({ logger });

    await service.sendNewResponse({
      to: "creator@sensus.app",
      formTitle: "Pixel Jam",
      formSlug: "pixel-jam-26",
      responseId: "resp_123",
      submittedAt: new Date("2026-01-01T00:00:00.000Z"),
      answerCount: 4,
    });

    expect(logger.error).not.toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledWith(
      "email mock send",
      expect.objectContaining({
        kind: "new_response",
        to: "creator@sensus.app",
        formSlug: "pixel-jam-26",
        responseId: "resp_123",
      }),
    );
  });

  it("logs payload for respondent thank-you without Resend config", async () => {
    const logger = {
      info: vi.fn(),
      error: vi.fn(),
    };
    const service = new EmailService({ logger });

    await service.sendRespondentThankYou({
      to: "respondent@example.com",
      formTitle: "Anime Con Feedback",
      formSlug: "anime-con-feedback",
    });

    expect(logger.error).not.toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledWith(
      "email mock send",
      expect.objectContaining({
        kind: "respondent_thank_you",
        to: "respondent@example.com",
        formSlug: "anime-con-feedback",
      }),
    );
  });
});
