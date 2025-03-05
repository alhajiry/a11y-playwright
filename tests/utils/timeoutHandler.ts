import { test as base } from '@playwright/test';

export const test = base.extend({
  page: async ({ page }, use) => {
    // Set a timeout for navigation operations
    page.context().setDefaultNavigationTimeout(30000);
    
    // Add a custom timeout handler
    const originalGoto = page.goto.bind(page);
    page.goto = async (url, options) => {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`Navigation to ${url} timed out after 30s`)), 30000);
      });
      
      return Promise.race([
        originalGoto(url, options),
        timeoutPromise
      ]);
    };
    
    await use(page);
  }
});