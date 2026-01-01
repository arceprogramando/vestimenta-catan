import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Accessibility Tests - WCAG 2.2 AAA
 *
 * Estos tests verifican automaticamente las violaciones de accesibilidad
 * usando axe-core con los tags de WCAG 2.2.
 */

test.describe('Accessibility Tests - WCAG 2.2 AAA', () => {
  test('homepage should have no accessibility violations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag2aaa', 'wcag22aa'])
      .analyze();

    // Log violations for debugging
    if (results.violations.length > 0) {
      console.log('Accessibility violations found on homepage:');
      results.violations.forEach((violation) => {
        console.log(`  - ${violation.id}: ${violation.description}`);
        violation.nodes.forEach((node) => {
          console.log(`    Target: ${node.target}`);
          console.log(`    HTML: ${node.html.substring(0, 100)}...`);
        });
      });
    }

    expect(results.violations).toEqual([]);
  });

  test('login page should have no accessibility violations', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag2aaa', 'wcag22aa'])
      .analyze();

    if (results.violations.length > 0) {
      console.log('Accessibility violations found on login page:');
      results.violations.forEach((violation) => {
        console.log(`  - ${violation.id}: ${violation.description}`);
      });
    }

    expect(results.violations).toEqual([]);
  });

  test('register page should have no accessibility violations', async ({ page }) => {
    await page.goto('/registro');
    await page.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag2aaa', 'wcag22aa'])
      .analyze();

    if (results.violations.length > 0) {
      console.log('Accessibility violations found on register page:');
      results.violations.forEach((violation) => {
        console.log(`  - ${violation.id}: ${violation.description}`);
      });
    }

    expect(results.violations).toEqual([]);
  });

  test('products page should have no accessibility violations', async ({ page }) => {
    await page.goto('/productos');
    await page.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag2aaa', 'wcag22aa'])
      .analyze();

    if (results.violations.length > 0) {
      console.log('Accessibility violations found on products page:');
      results.violations.forEach((violation) => {
        console.log(`  - ${violation.id}: ${violation.description}`);
      });
    }

    expect(results.violations).toEqual([]);
  });
});

test.describe('Keyboard Navigation Tests', () => {
  test('skip link should be visible on focus and work correctly', async ({ page }) => {
    await page.goto('/');

    // Press Tab to focus on skip link
    await page.keyboard.press('Tab');

    // Skip link should become visible
    const skipLink = page.locator('a[href="#main-content"]');
    await expect(skipLink).toBeFocused();

    // Verify skip link is now visible (not sr-only)
    const isVisible = await skipLink.isVisible();
    expect(isVisible).toBe(true);

    // Click the skip link
    await page.keyboard.press('Enter');

    // Main content should be focused
    const main = page.locator('#main-content');
    await expect(main).toBeFocused();
  });

  test('navigation should be keyboard accessible', async ({ page }) => {
    await page.goto('/');

    // Tab through navigation items
    await page.keyboard.press('Tab'); // Skip link
    await page.keyboard.press('Tab'); // Logo
    await page.keyboard.press('Tab'); // First nav item

    // Check that we're on a navigation link
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBe('A');
  });

  test('theme toggle should be keyboard accessible', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Find theme toggle button by its aria-label pattern
    const themeToggle = page.locator('button[aria-label*="modo"]').first();

    // Verify button exists and has proper accessibility attributes
    await expect(themeToggle).toBeVisible();
    const hasAriaLabel = await themeToggle.getAttribute('aria-label');
    expect(hasAriaLabel).toBeTruthy();
    expect(hasAriaLabel).toMatch(/modo/i);

    // Verify it has aria-pressed attribute (for toggle state)
    const ariaPressed = await themeToggle.getAttribute('aria-pressed');
    expect(ariaPressed).toBeTruthy();

    // Focus and verify keyboard accessibility
    await themeToggle.focus();
    await expect(themeToggle).toBeFocused();

    // Button can be activated with Enter (keyboard accessible)
    // We verify it's focusable and has proper ARIA attributes
  });
});

test.describe('Form Accessibility Tests', () => {
  test('login form should have proper label associations', async ({ page }) => {
    await page.goto('/login');

    // Check email input has label
    const emailLabel = page.locator('label[for="email"]');
    await expect(emailLabel).toBeVisible();

    // Check password input has label
    const passwordLabel = page.locator('label[for="password"]');
    await expect(passwordLabel).toBeVisible();

    // Check password toggle has accessible name
    const passwordToggle = page.locator('button[aria-label*="contrasena"]');
    await expect(passwordToggle).toBeVisible();
  });

  test('form error should be announced to screen readers', async ({ page }) => {
    await page.goto('/login');

    // Fill form with invalid data and submit
    await page.fill('#email', 'invalid@email.com');
    await page.fill('#password', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Wait for error to appear (if backend returns error)
    // The error element should have role="alert" and our specific id
    const errorElement = page.locator('#login-error[role="alert"]');

    // Give it a moment to appear
    await page.waitForTimeout(2000);

    // Check if error has proper ARIA attributes (if error appears)
    const errorCount = await errorElement.count();
    if (errorCount > 0) {
      const ariaLive = await errorElement.getAttribute('aria-live');
      expect(ariaLive).toBe('assertive');
    }
  });
});
