import { test, expect } from "@playwright/test";

const DEV_EMAIL = "dev@sensus.local";
const DEV_PASSWORD = "DevPassword123!";

test("creator signs in, creates a form, publishes it, then a respondent submits", async ({
  page,
  browser,
}) => {
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(DEV_EMAIL);
  await page.getByLabel("Password").fill(DEV_PASSWORD);
  await page.getByRole("button", { name: /^sign in$/i }).click();
  await page.waitForURL("/dashboard");

  await expect(page.getByRole("heading", { name: "My Forms" })).toBeVisible();

  await page.getByRole("button", { name: /new form/i }).click();
  await page.waitForURL(/\/dashboard\/forms\/[0-9a-f-]+\/edit$/);
  await expect(page.getByRole("heading", { name: "Untitled form" })).toBeVisible();
  await expect(page.getByText(/status:.*draft/i)).toBeVisible();

  await page.getByRole("button", { name: /^publish$/i }).click();
  await expect(page.getByText(/✓ Published/i)).toBeVisible({ timeout: 10_000 });

  const shareInput = page.locator("input[readonly]");
  const publicUrl = await shareInput.inputValue();
  expect(publicUrl).toMatch(/^https?:\/\/[^/]+\/f\/untitled-form-[a-z0-9]{6}$/);

  const anon = await browser.newContext();
  const anonPage = await anon.newPage();
  await anonPage.goto(publicUrl);
  await expect(anonPage.getByRole("heading", { name: "Untitled form" })).toBeVisible();

  await anonPage.getByRole("button", { name: /^submit$/i }).click();
  await anonPage.waitForURL(/\/thanks$/);
  await expect(anonPage.getByText(/thanks for your response/i)).toBeVisible();

  await anon.close();
});
