import { test, expect } from '@playwright/test';

test.describe('Critical User Flows', () => {
  const adminEmail = 'admin@interview.com';
  const adminPassword = 'admin123';

  test.describe('Authentication', () => {
    test('should login with valid credentials', async ({ page }) => {
      await page.goto('/login');
      await page.fill('input[type="email"]', adminEmail);
      await page.fill('input[type="password"]', adminPassword);
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/dashboard/);
    });

    test('should reject invalid credentials', async ({ page }) => {
      await page.goto('/login');
      await page.fill('input[type="email"]', 'wrong@test.com');
      await page.fill('input[type="password"]', 'wrongpass');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Invalid')).toBeVisible();
    });

    test('should redirect unauthenticated users to login', async ({ page }) => {
      await page.goto('/dashboard');
      await expect(page).toHaveURL(/login/);
    });
  });

  test.describe('Dashboard', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/login');
      await page.fill('input[type="email"]', adminEmail);
      await page.fill('input[type="password"]', adminPassword);
      await page.click('button[type="submit"]');
      await page.waitForURL(/dashboard/);
    });

    test('should display dashboard stats', async ({ page }) => {
      await expect(page.locator('h1, h2').first()).toBeVisible();
    });

    test('should navigate to interviews page', async ({ page }) => {
      await page.click('text=Interviews');
      await expect(page).toHaveURL(/interviews/);
    });
  });

  test.describe('Interview Management', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/login');
      await page.fill('input[type="email"]', adminEmail);
      await page.fill('input[type="password"]', adminPassword);
      await page.click('button[type="submit"]');
      await page.waitForURL(/dashboard/);
    });

    test('should load interviews page', async ({ page }) => {
      await page.goto('/interviews');
      await expect(page).toHaveURL(/interviews/);
    });

    test('should navigate to job positions', async ({ page }) => {
      await page.goto('/jobs');
      await expect(page).toHaveURL(/jobs/);
    });
  });
});
