import { test, expect } from "@playwright/test";

test.setTimeout(120000);

const baseURL = process.env.BASE_URL || "http://localhost:3000";

test("welcome page", async ({ page }) => {
  await page.goto(baseURL + "");
  await page.waitForLoadState("networkidle");

  try {
    await page.waitForSelector("text=Welcome to GG Replay Parser", {
      state: "visible",
      timeout: 60000,
    });
  } catch (error) {
    console.error("Failed to find welcome message:", await page.content());
    throw error;
  }

  // Verify login button exists
  await expect(page.locator("text=Login with Discord")).toBeVisible();
});

test("authentication redirect", async ({ page }) => {
  await page.goto(baseURL + "");
  await page.click('button[type="submit"]');
  await page.waitForLoadState("networkidle");
  await page.waitForNavigation();

  try {
    const loginButton = await page.waitForSelector("text=Login with Discord", {
      state: "visible",
      timeout: 60000,
    });

    // Click login and ensure it navigates to Discord
    await loginButton.click();
    await page.waitForLoadState("networkidle");
    await expect(page.url()).toContain("discord.com");
  } catch (error) {
    console.error("Failed to test authentication flow:", await page.content());
    throw error;
  }
});
