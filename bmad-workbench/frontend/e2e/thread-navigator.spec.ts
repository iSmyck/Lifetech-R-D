import { test, expect } from '@playwright/test';

test.describe('Thread Navigator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('shows thread filters', async ({ page }) => {
    await expect(page.locator('text=Threads')).toBeVisible();
    await expect(page.locator('button:has-text("All")')).toBeVisible();
    await expect(page.locator('button:has-text("Active")')).toBeVisible();
    await expect(page.locator('button:has-text("Paused")')).toBeVisible();
    await expect(page.locator('button:has-text("Completed")')).toBeVisible();
  });

  test('search input is visible and has shortcut hint', async ({ page }) => {
    const search = page.locator('textbox');
    await expect(search).toBeVisible();
    await expect(search).toHaveAttribute('placeholder', /Search threads/);
  });

  test('New Thread button is visible and clickable', async ({ page }) => {
    const btn = page.locator('button:has-text("New Thread")');
    await expect(btn).toBeVisible();
    await expect(btn).toBeEnabled();
  });
});
