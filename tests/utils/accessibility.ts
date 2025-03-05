import { Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

export async function checkAccessibility(page: Page, options?: {
  includedImpacts?: ('minor' | 'moderate' | 'serious' | 'critical')[],
  excludeRules?: string[],
  includeRules?: string[],
}) {
  const axeBuilder = new AxeBuilder({ page });
  
  if (options?.includedImpacts) {
    axeBuilder.withTags(options.includedImpacts);
  }
  
  if (options?.excludeRules) {
    axeBuilder.disableRules(options.excludeRules);
  }
  
  if (options?.includeRules) {
    axeBuilder.withRules(options.includeRules);
  }
  
  return axeBuilder.analyze();
}