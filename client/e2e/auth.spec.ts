import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
    test('should login as a candidate and see the dashboard', async ({ page }) => {
        // Navigate to logic
        await page.goto('/login');

        // Fill the form
        // Note: We use fixed credentials from the seed for testing
        await page.fill('input[type="email"]', 'candidat@test.com');
        await page.fill('input[type="password"]', 'password123');

        // Click submit
        await page.click('button[type="submit"]');

        // Should be redirected to home/dashboard
        await expect(page).toHaveURL('/');

        // Check if welcome message exists
        await expect(page.locator('h1')).toContainText('Bonjour');
    });

    test('should show error on invalid credentials', async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[type="email"]', 'wrong@email.com');
        await page.fill('input[type="password"]', 'wrongpass');
        await page.click('button[type="submit"]');

        // Check for error message
        // According to LoginPage.tsx line 54
        await expect(page.locator('.bg-red-50')).toContainText('Email ou mot de passe incorrect');
    });
});
