import { test, expect } from '@playwright/test';

test.describe('Help Menu', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('opens and closes without blocking other UI', async ({ page }) => {
    // Open help menu
    await page.locator('button[title="Help (?)(?)"]').click();
    await expect(page.locator('text=Keyboard Shortcuts')).toBeVisible();

    // Clicking outside should close the menu (not block clicks)
    await page.locator('text=Create Thread').click();
    await expect(page.locator('text=Keyboard Shortcuts')).not.toBeVisible();
  });

  test('Escape key closes help menu', async ({ page }) => {
    await page.locator('button[title="Help (?)(?)"]').click();
    await expect(page.locator('text=Keyboard Shortcuts')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.locator('text=Keyboard Shortcuts')).not.toBeVisible();
  });

  test('opening settings closes help menu automatically', async ({ page }) => {
    await page.locator('button[title="Help (?)(?)"]').click();
    await expect(page.locator('text=Keyboard Shortcuts')).toBeVisible();

    // Click avatar to open settings — should close help menu
    await page.locator('button', { hasText: /^U$/ }).click();
    await expect(page.locator('text=Keyboard Shortcuts')).not.toBeVisible();
    await expect(page.locator('text=AI Model Configuration')).toBeVisible();
  });
});
