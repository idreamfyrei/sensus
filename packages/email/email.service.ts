import { render } from "@react-email/render";
import { Resend } from "resend";
import * as React from "react";
import { NewResponseEmail } from "./templates/NewResponseEmail";
import { RespondentThankYouEmail } from "./templates/RespondentThankYouEmail";

type LoggerLike = {
  info: (message: string, meta?: Record<string, unknown>) => void;
  error: (message: string, meta?: Record<string, unknown>) => void;
};

type SendMode = "resend" | "mock";

export type EmailServiceOptions = {
  apiKey?: string;
  from?: string;
  logger: LoggerLike;
};

export class EmailService {
  private readonly resend: Resend | null;
  private readonly from: string | null;

  constructor(private readonly opts: EmailServiceOptions) {
    this.from = opts.from?.trim() ? opts.from : null;
    this.resend = opts.apiKey?.trim() ? new Resend(opts.apiKey) : null;
  }

  private get mode(): SendMode {
    return this.resend && this.from ? "resend" : "mock";
  }

  async sendNewResponse(input: {
    to: string;
    formTitle: string;
    formSlug: string;
    responseId: string;
    submittedAt: Date;
    answerCount: number;
  }): Promise<void> {
    const subject = `New response: ${input.formTitle}`;
    const html = await render(
      React.createElement(NewResponseEmail, {
        formTitle: input.formTitle,
        formSlug: input.formSlug,
        responseId: input.responseId,
        submittedAtIso: input.submittedAt.toISOString(),
        answerCount: input.answerCount,
      }),
    );
    await this.send({
      kind: "new_response",
      to: input.to,
      subject,
      html,
      meta: { formSlug: input.formSlug, responseId: input.responseId },
    });
  }

  async sendRespondentThankYou(input: {
    to: string;
    formTitle: string;
    formSlug: string;
  }): Promise<void> {
    const subject = `Thanks for your response to ${input.formTitle}`;
    const html = await render(
      React.createElement(RespondentThankYouEmail, {
        formTitle: input.formTitle,
        formSlug: input.formSlug,
      }),
    );
    await this.send({
      kind: "respondent_thank_you",
      to: input.to,
      subject,
      html,
      meta: { formSlug: input.formSlug },
    });
  }

  private async send(input: {
    kind: "new_response" | "respondent_thank_you";
    to: string;
    subject: string;
    html: string;
    meta: Record<string, unknown>;
  }): Promise<void> {
    if (this.mode === "mock") {
      this.opts.logger.info("email mock send", {
        kind: input.kind,
        to: input.to,
        subject: input.subject,
        ...input.meta,
      });
      return;
    }

    try {
      await this.resend!.emails.send({
        from: this.from!,
        to: input.to,
        subject: input.subject,
        html: input.html,
      });
      this.opts.logger.info("email sent", {
        kind: input.kind,
        to: input.to,
        ...input.meta,
      });
    } catch (error) {
      this.opts.logger.error("email send failed", {
        kind: input.kind,
        to: input.to,
        error: error instanceof Error ? error.message : String(error),
        ...input.meta,
      });
      throw error;
    }
  }
}
