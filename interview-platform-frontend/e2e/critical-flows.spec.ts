import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const API_URL = process.env.API_URL || 'http://localhost:8080';
const ADMIN_EMAIL = 'admin@interview.local';
const ADMIN_PASSWORD = 'ChangeMe123!';

test.describe('Critical User Flows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
  });

  test('Login flow - valid credentials', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[name="email"], input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 15000 });
    await expect(page).toHaveURL(/dashboard/);
  });

  test('Login flow - invalid credentials shows error', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[name="email"], input[type="email"]', 'wrong@email.com');
    await page.fill('input[type="password"]', 'wrongpass');
    await page.click('button[type="submit"]');
    await expect(page.locator('[role="alert"], .error, .text-red')).toBeVisible({ timeout: 5000 });
  });

  test('Dashboard loads with stats', async ({ page }) => {
    // Login first
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[name="email"], input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    
    // Verify dashboard elements
    await expect(page.locator('h1, h2').first()).toBeVisible();
    await expect(page.locator('[class*="card"], [class*="stat"]').first()).toBeVisible();
  });

  test('Navigate to interviews page', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[name="email"], input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    
    await page.click('a[href*="interview"], [data-testid="interviews-link"]');
    await page.waitForURL('**/interviews');
    await expect(page).toHaveURL(/interviews/);
  });

  test('API health check responds', async ({ request }) => {
    const response = await request.get(`${API_URL}/actuator/health`);
    expect(response.status()).toBe(200);
  });

  test('Protected API requires auth', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/v1/users`);
    expect(response.status()).toBe(401);
  });

  test('Login API returns token', async ({ request }) => {
    const response = await request.post(`${API_URL}/api/v1/auth/login`, {
      data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD }
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.accessToken || body.token).toBeTruthy();
  });

  test('Interviews API returns list', async ({ request }) => {
    const loginResp = await request.post(`${API_URL}/api/v1/auth/login`, {
      data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD }
    });
    const { accessToken, token } = await loginResp.json();
    const jwt = accessToken || token;

    const response = await request.get(`${API_URL}/api/v1/interviews?page=0&size=5`, {
      headers: { Authorization: `Bearer ${jwt}` }
    });
    expect(response.status()).toBe(200);
  });

  test('AI suggestions endpoint works', async ({ request }) => {
    const loginResp = await request.post(`${API_URL}/api/v1/auth/login`, {
      data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD }
    });
    const { accessToken, token } = await loginResp.json();
    const jwt = accessToken || token;

    const response = await request.post(`${API_URL}/api/v1/ai/suggest-questions`, {
      headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
      data: { jobTitle: 'Engineer', difficulty: 'MEDIUM', category: 'TECHNICAL', count: 2 }
    });
    expect([200, 201]).toContain(response.status());
  });

  test('Scheduling page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[name="email"], input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    await page.goto(`${BASE_URL}/scheduling`);
    await expect(page).toHaveURL(/scheduling/);
  });
});
