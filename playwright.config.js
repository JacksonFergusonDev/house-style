import { mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { defineConfig } from '@playwright/test';

// Firefox's shared app-data lookup can fail under macOS profile protections.
// Keep the test browser's preferences isolated from installed Firefox.
const firefoxPreferences =
  process.platform === 'darwin' ? join(tmpdir(), 'house-style-firefox') : undefined;
if (firefoxPreferences) {
  mkdirSync(firefoxPreferences, { recursive: true });
}

export default defineConfig({
  testDir: 'tests/browser',
  fullyParallel: true,
  forbidOnly: true,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: { reducedMotion: 'reduce', trace: 'retain-on-failure' },
  projects: ['chromium', 'firefox', 'webkit'].map((browserName) => ({
    name: browserName,
    use: {
      browserName,
      ...(browserName === 'firefox' && firefoxPreferences
        ? { launchOptions: { env: { ...process.env, CFFIXED_USER_HOME: firefoxPreferences } } }
        : {}),
    },
  })),
});
