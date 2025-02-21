import { test, expect } from "@playwright/test";

test.setTimeout(60000);

test("welcome page loads with login button", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator("text=Welcome to GG Replay Parser")).toBeVisible();
  await expect(page.locator("text=Login with Discord")).toBeVisible();
});

test("discord authentication redirects properly", async ({ page }) => {
  await page.goto("/");
  await page.click("text=Login with Discord");

  await expect(page.url()).toContain("discord.com");
});
