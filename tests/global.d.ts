import { Page } from '@playwright/test';

declare module '@playwright/test' {
  interface Page {
    storeA11yResults(results: any, testInfo: any): void;
  }
}