import { test, expect } from '@playwright/test';

test.describe('App Load', () => {
  test('loads the workbench without console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('/');
    await expect(page.locator('text=BMAD')).toBeVisible();
    await expect(page.locator('text=Stream Workbench')).toBeVisible();

    // Should show empty state when no thread selected
    await expect(page.locator('text=Select a thread to begin')).toBeVisible();

    // No unexpected console errors
    const unexpected = errors.filter(
      (e) => !e.includes('Failed to fetch') && !e.includes('net::ERR_CONNECTION_REFUSED')
    );
    expect(unexpected).toHaveLength(0);
  });

  test('shows disabled intent bar when no thread is active', async ({ page }) => {
    await page.goto('/');

    const textarea = page.locator('[data-testid="intent-bar"] textarea');
    await expect(textarea).toBeVisible();
    await expect(textarea).toBeDisabled();
    await expect(textarea).toHaveAttribute(
      'placeholder',
      'Select a thread to start typing...'
    );
  });

  test('theme toggle buttons are visible and clickable', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('text=Light')).toBeVisible();
    await expect(page.locator('text=Dark')).toBeVisible();
    await expect(page.locator('text=Auto')).toBeVisible();

    await page.locator('text=Dark').click();
    // Dark mode class should be applied to html element
    await expect(page.locator('html')).toHaveClass(/dark/);

    await page.locator('text=Light').click();
    await expect(page.locator('html')).not.toHaveClass(/dark/);
  });
});
