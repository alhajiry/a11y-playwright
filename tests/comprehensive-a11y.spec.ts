import { test, expect } from './global-setup';
import { checkAccessibility } from './utils/accessibility';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get base URL from environment variables or use a default
const BASE_URL = process.env.BASE_URL || 'https://example.com';

test.describe('Comprehensive accessibility tests', () => {
  test('Homepage should be accessible', async ({ page }, testInfo) => {
    await page.goto(`${BASE_URL}`);
    const results = await checkAccessibility(page);
    
    // Store results for automatic report generation
    page.storeA11yResults(results, testInfo);
    
    // If you want to see detailed violations in the test output
    if (results.violations.length > 0) {
      console.log('Accessibility violations:', JSON.stringify(results.violations, null, 2));
    }
    
    expect(results.violations).toEqual([]);
  });

//   test('Login page should be accessible', async ({ page }, testInfo) => {
//     await page.goto(`${BASE_URL}`);
//     const results = await checkAccessibility(page);
    
//     // Store results for automatic report generation
//     page.storeA11yResults(results, testInfo);
    
//     expect(results.violations).toEqual([]);
//   });

//   // Test for specific accessibility rules
//   test('Should have proper image alt texts', async ({ page }, testInfo) => {
//     await page.goto(`${BASE_URL}`);
//     const results = await checkAccessibility(page, {
//       includeRules: ['image-alt']
//     });
    
//     // Store results for automatic report generation
//     page.storeA11yResults(results, testInfo);
    
//     expect(results.violations).toEqual([]);
//   });

//   // Test for specific accessibility impacts
//   test('Should not have critical accessibility issues', async ({ page }, testInfo) => {
//     await page.goto(`${BASE_URL}`);
//     const results = await checkAccessibility(page, {
//       includedImpacts: ['critical', 'serious']
//     });
    
//     // Store results for automatic report generation
//     page.storeA11yResults(results, testInfo);
    
//     expect(results.violations).toEqual([]);
//   });
});