import { test as base } from '@playwright/test';
import { generateA11yReport } from './utils/a11yReportGenerator';

// Extend the base test with custom fixtures
export const test = base.extend({
  page: async ({ page, browserName }, use) => {
    // Store the original results for later use
    let a11yResults: any = null;
    let currentTestInfo: any = null;
    
    // Add a method to store a11y results
    page.storeA11yResults = (results: any, testInfo: any) => {
      a11yResults = results;
      currentTestInfo = testInfo;
    };
    
    await use(page);
    
    // After the test, check if there were a11y violations and generate a report if needed
    if (a11yResults && a11yResults.violations && a11yResults.violations.length > 0) {
      const baseUrl = process.env.BASE_URL || 'https://example.com';
      const pageName = currentTestInfo.title.replace(/\s+/g, '-');
      await generateA11yReport(pageName, a11yResults.violations, page, baseUrl, browserName);
    }
  },
});

export { expect } from '@playwright/test';