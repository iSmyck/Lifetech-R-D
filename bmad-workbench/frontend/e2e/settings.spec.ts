import { test, expect } from '@playwright/test';

test.describe('Settings Modal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.locator('button', { hasText: /^U$/ }).click();
    await expect(page.locator('text=AI Model Configuration')).toBeVisible();
  });

  test('opens on avatar click and shows AI Model tab by default', async ({ page }) => {
    await expect(page.locator('text=Settings')).toBeVisible();
    await expect(page.locator('text=Profile')).toBeVisible();
    await expect(page.locator('text=AI Model')).toBeVisible();
    await expect(page.locator('text=Integrations')).toBeVisible();
    await expect(page.locator('[data-testid="provider-select"]')).toBeVisible();
  });

  test('provider select is clickable', async ({ page }) => {
    const select = page.locator('[data-testid="provider-select"]');
    await expect(select).toBeVisible();
    await expect(select).toBeEnabled();

    // Should show LM Studio as default provider
    await expect(select).toHaveValue('lm_studio');
  });

  test('closes on X button click', async ({ page }) => {
    await page.locator('[data-testid="close-settings"]').click();
    await expect(page.locator('text=AI Model Configuration')).not.toBeVisible();
  });

  test('closes on backdrop click', async ({ page }) => {
    // Click on the backdrop (outside the modal card)
    await page.locator('[data-testid="settings-modal"]').click({ position: { x: 10, y: 10 } });
    await expect(page.locator('text=AI Model Configuration')).not.toBeVisible();
  });

  test('Test Connection button is visible and clickable', async ({ page }) => {
    const testBtn = page.locator('[data-testid="test-connection-btn"]');
    await expect(testBtn).toBeVisible();
    await expect(testBtn).toBeEnabled();
  });

  test('Save Settings is disabled when model name is empty', async ({ page }) => {
    const saveBtn = page.locator('[data-testid="save-settings-btn"]');
    await expect(saveBtn).toBeDisabled();
  });
});
