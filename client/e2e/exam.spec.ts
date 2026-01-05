import { test, expect } from '@playwright/test';

test.describe('Exam Flow', () => {
    test('should complete a full exam session', async ({ page }) => {
        // 1. Login
        await page.goto('/login');
        await page.fill('input[type="email"]', 'candidat@test.com');
        await page.fill('input[type="password"]', 'password123');
        await page.click('button[type="submit"]');

        // 2. Find Assigned Session and Start
        // In CandidateDashboard, the "Démarrer" button appears for sessions with status 'ASSIGNED'
        const startButton = page.locator('button:has-text("Démarrer")').first();
        await expect(startButton).toBeVisible();
        await startButton.click();

        // 3. Exam Page
        await expect(page).toHaveURL(/.*exam\/session/);

        // 4. Answer questions (The seed creates sessions with 20 questions usually, but for automation we can loop)
        // We will answer a few questions or until finished
        let isFinished = false;
        while (!isFinished) {
            // Wait for question or result
            const questionTitle = page.locator('h2.text-2xl.font-bold');
            const resultsTitle = page.locator('h2:has-text("Résultats de la session")');

            // Check if finished
            if (await resultsTitle.isVisible()) {
                isFinished = true;
                break;
            }

            // Answer current question
            await expect(questionTitle).toBeVisible();

            // Select first option
            const firstOption = page.locator('button.w-full.text-left').first();
            await firstOption.click();

            // Submit
            const submitButton = page.locator('button:has-text("Valider la réponse")');
            await submitButton.click();

            // Small wait for next question
            await page.waitForTimeout(500);
        }

        // 5. Verify Results
        await expect(page.locator('h2:has-text("Résultats de la session")')).toBeVisible();
        await expect(page.locator('.text-6xl.font-black')).toBeVisible(); // The score

        // 6. Verify Certificate button is present
        await expect(page.locator('button:has-text("Télécharger mon certificat")')).toBeVisible();
    });
});
