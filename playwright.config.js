import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'browser-tests',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  use: { reducedMotion: 'reduce' },
  projects: ['chromium', 'firefox', 'webkit'].map((browserName) => ({
    name: browserName,
    use: { browserName },
  })),
});
