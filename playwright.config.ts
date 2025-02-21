import { PlaywrightTestConfig } from "@playwright/test";
const config: PlaywrightTestConfig = {
  webServer: {
    command: "npm run dev",
    port: 3000,
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI,
  },
  use: {
    launchOptions: {
      slowMo: 100, // Add slight delay to help with auth flows
    },
  },
  env: {
    DISCORD_AUTH_URL: "http://localhost:3000/auth/discord",
    DISCORD_EMAIL: process.env.DISCORD_EMAIL,
    DISCORD_PASSWORD: process.env.DISCORD_PASSWORD,
  },
};

export default config;
