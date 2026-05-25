import { test, expect } from "@playwright/test";

/**
 * Phase 2 vertical-slice happy path.
 *
 * Drives the full flow that 2.2–2.5 built:
 *   1. Creator opens /dashboard
 *   2. Clicks "+ New form" → redirects to edit page
 *   3. Clicks "Publish" → form flips to published, share link appears
 *   4. Respondent navigates to the public /f/<slug>
 *   5. Clicks "Submit" → redirects to /thanks
 *
 * The DB isn't reset between runs — the dev user (`user_dev_phase2`)
 * accumulates forms. To keep the test resilient, every assertion is about
 * THE form just created (looked up by its returned slug), never about
 * "how many forms exist" or "no other forms".
 *
 * Pre-req for CI / fresh checkouts:  `pnpm db:seed-dev` has been run so the
 * default theme + dev user exist. The Playwright workflow runs the seed
 * before this test.
 */

test("creator creates a form, publishes it, then a respondent submits", async ({ page }) => {
  // 1. Dashboard
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "My Forms" })).toBeVisible();

  // 2. + New form  (dashboard immediately calls forms.create and redirects)
  await page.getByRole("button", { name: /new form/i }).click();

  // 3. Land on edit page — wait for URL pattern and the auto-titled form
  await page.waitForURL(/\/dashboard\/forms\/[0-9a-f-]+\/edit$/);
  await expect(page.getByRole("heading", { name: "Untitled form" })).toBeVisible();

  // The status row should read "draft" before publish
  await expect(page.getByText(/status:.*draft/i)).toBeVisible();

  // 4. Publish
  await page.getByRole("button", { name: /^publish$/i }).click();
  await expect(page.getByText(/✓ Published/i)).toBeVisible({ timeout: 10_000 });

  // 5. Grab the public URL from the read-only share input
  const shareInput = page.locator("input[readonly]");
  const publicUrl = await shareInput.inputValue();
  expect(publicUrl).toMatch(/^https?:\/\/[^/]+\/f\/untitled-form-[a-z0-9]{6}$/);

  // 6. Respondent visits the public form
  await page.goto(publicUrl);
  await expect(page.getByRole("heading", { name: "Untitled form" })).toBeVisible();

  // 7. Submit
  await page.getByRole("button", { name: /^submit$/i }).click();

  // 8. Thanks page
  await page.waitForURL(/\/thanks$/);
  await expect(page.getByText(/thanks for your response/i)).toBeVisible();
});
