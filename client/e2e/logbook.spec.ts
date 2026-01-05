import { test, expect } from '@playwright/test';

test.describe('Logbook (Journal de Bord) Flow', () => {
    test('should submit and validate a proof', async ({ page }) => {
        const proofTitle = `Test Proof ${Date.now()}`;

        // 1. Candidate Login & Submit Proof
        await page.goto('/login');
        await page.fill('input[type="email"]', 'candidat@test.com');
        await page.fill('input[type="password"]', 'password123');
        await page.click('button[type="submit"]');

        // Go to Portfolio
        await page.click('button:has-text("Portfolio")');

        // Fill the submission form
        await page.fill('input[placeholder="Ex: Rédaction sur l\'écologie"]', proofTitle);
        await page.selectOption('select', 'ESSAY');
        await page.fill('input[placeholder="https://..."]', 'https://example.com/my-proof');
        await page.fill('textarea', 'Ceci est une preuve de mon travail acharné.');

        // Submit
        await page.click('button:has-text("Soumettre pour validation")');

        // Verify success message
        await expect(page.locator('.text-emerald-600')).toContainText('Preuve soumise avec succès');

        // Logout
        await page.click('button[title="Se déconnecter"]');

        // 2. Coach Login & Validate Proof
        await page.goto('/login');
        await page.fill('input[type="email"]', 'admin@test.com');
        await page.fill('input[type="password"]', 'password123');
        await page.click('button[type="submit"]');

        // Redirection to /admin for CoachRole
        await expect(page).toHaveURL(/\/admin/);

        // Go to Validations tab
        // The label is dynamic: `Validations (${proofs.length})`
        // We search for a button containing "Validations"
        await page.click('button:has-text("Validations")');

        // Find our proof in the list
        const proofItem = page.locator(`h4:has-text("${proofTitle}")`);
        await expect(proofItem).toBeVisible();

        // Click Validate
        // We need to find the validation button for THIS specific proof
        // According to OrgAdminDashboard structure (not fully seen but assumed)
        // Actually let's find the button "Valider" in the parent container of the proof title
        const parentContainer = page.locator('div.bg-white.dark\\:bg-slate-900.p-6').filter({ hasText: proofTitle });
        await parentContainer.locator('button:has-text("Valider")').click();

        // Verify it disappears or success message
        await expect(page.locator('.bg-emerald-50')).toBeVisible();
        await expect(proofItem).not.toBeVisible();
    });
});
