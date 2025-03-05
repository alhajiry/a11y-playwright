import fs from 'fs';
import path from 'path';
import { Page } from '@playwright/test';

// Helper function to escape HTML
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// WCAG reference mapping for common axe-core rules
const wcagReferences: Record<string, { criteria: string, url: string, description: string }[]> = {
  'color-contrast': [
    { 
      criteria: 'WCAG 1.4.3 Contrast (Minimum)', 
      url: 'https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html',
      description: 'The visual presentation of text and images of text has a contrast ratio of at least 4.5:1.'
    },
    { 
      criteria: 'WCAG 1.4.11 Non-text Contrast', 
      url: 'https://www.w3.org/WAI/WCAG21/Understanding/non-text-contrast.html',
      description: 'The visual presentation of UI components and graphical objects has a contrast ratio of at least 3:1.'
    }
  ],
  'image-alt': [
    { 
      criteria: 'WCAG 1.1.1 Non-text Content', 
      url: 'https://www.w3.org/WAI/WCAG21/Understanding/non-text-content.html',
      description: 'All non-text content that is presented to the user has a text alternative that serves the equivalent purpose.'
    }
  ],
  'label': [
    { 
      criteria: 'WCAG 1.3.1 Info and Relationships', 
      url: 'https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships.html',
      description: 'Information, structure, and relationships conveyed through presentation can be programmatically determined.'
    },
    { 
      criteria: 'WCAG 4.1.2 Name, Role, Value', 
      url: 'https://www.w3.org/WAI/WCAG21/Understanding/name-role-value.html',
      description: 'For all UI components, the name and role can be programmatically determined.'
    }
  ],
  'aria-required-attr': [
    { 
      criteria: 'WCAG 4.1.2 Name, Role, Value', 
      url: 'https://www.w3.org/WAI/WCAG21/Understanding/name-role-value.html',
      description: 'For all UI components, the name and role can be programmatically determined.'
    }
  ],
  'keyboard': [
    { 
      criteria: 'WCAG 2.1.1 Keyboard', 
      url: 'https://www.w3.org/WAI/WCAG21/Understanding/keyboard.html',
      description: 'All functionality of the content is operable through a keyboard interface.'
    }
  ],
  'heading-order': [
    { 
      criteria: 'WCAG 1.3.1 Info and Relationships', 
      url: 'https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships.html',
      description: 'Information, structure, and relationships conveyed through presentation can be programmatically determined.'
    },
    { 
      criteria: 'WCAG 2.4.6 Headings and Labels', 
      url: 'https://www.w3.org/WAI/WCAG21/Understanding/headings-and-labels.html',
      description: 'Headings and labels describe topic or purpose.'
    }
  ],
  // Additional WCAG mappings
  'aria-roles': [
    { 
      criteria: 'WCAG 4.1.2 Name, Role, Value', 
      url: 'https://www.w3.org/WAI/WCAG21/Understanding/name-role-value.html',
      description: 'For all UI components, the name and role can be programmatically determined.'
    }
  ],
  'aria-valid-attr': [
    { 
      criteria: 'WCAG 4.1.2 Name, Role, Value', 
      url: 'https://www.w3.org/WAI/WCAG21/Understanding/name-role-value.html',
      description: 'For all UI components, the name and role can be programmatically determined.'
    }
  ],
  'button-name': [
    { 
      criteria: 'WCAG 4.1.2 Name, Role, Value', 
      url: 'https://www.w3.org/WAI/WCAG21/Understanding/name-role-value.html',
      description: 'For all UI components, the name and role can be programmatically determined.'
    }
  ],
  'document-title': [
    { 
      criteria: 'WCAG 2.4.2 Page Titled', 
      url: 'https://www.w3.org/WAI/WCAG21/Understanding/page-titled.html',
      description: 'Web pages have titles that describe topic or purpose.'
    }
  ],
  'duplicate-id': [
    { 
      criteria: 'WCAG 4.1.1 Parsing', 
      url: 'https://www.w3.org/WAI/WCAG21/Understanding/parsing.html',
      description: 'In content implemented using markup languages, elements have complete start and end tags, elements are nested according to their specifications, elements do not contain duplicate attributes, and any IDs are unique.'
    }
  ],
  'form-field-multiple-labels': [
    { 
      criteria: 'WCAG 3.3.2 Labels or Instructions', 
      url: 'https://www.w3.org/WAI/WCAG21/Understanding/labels-or-instructions.html',
      description: 'Labels or instructions are provided when content requires user input.'
    }
  ],
  'frame-title': [
    { 
      criteria: 'WCAG 4.1.2 Name, Role, Value', 
      url: 'https://www.w3.org/WAI/WCAG21/Understanding/name-role-value.html',
      description: 'For all UI components, the name and role can be programmatically determined.'
    }
  ],
  'html-has-lang': [
    { 
      criteria: 'WCAG 3.1.1 Language of Page', 
      url: 'https://www.w3.org/WAI/WCAG21/Understanding/language-of-page.html',
      description: 'The default human language of each Web page can be programmatically determined.'
    }
  ],
  'html-lang-valid': [
    { 
      criteria: 'WCAG 3.1.1 Language of Page', 
      url: 'https://www.w3.org/WAI/WCAG21/Understanding/language-of-page.html',
      description: 'The default human language of each Web page can be programmatically determined.'
    }
  ],
  'input-button-name': [
    { 
      criteria: 'WCAG 4.1.2 Name, Role, Value', 
      url: 'https://www.w3.org/WAI/WCAG21/Understanding/name-role-value.html',
      description: 'For all UI components, the name and role can be programmatically determined.'
    }
  ],
  'link-name': [
    { 
      criteria: 'WCAG 4.1.2 Name, Role, Value', 
      url: 'https://www.w3.org/WAI/WCAG21/Understanding/name-role-value.html',
      description: 'For all UI components, the name and role can be programmatically determined.'
    },
    { 
      criteria: 'WCAG 2.4.4 Link Purpose (In Context)', 
      url: 'https://www.w3.org/WAI/WCAG21/Understanding/link-purpose-in-context.html',
      description: 'The purpose of each link can be determined from the link text alone or from the link text together with its programmatically determined link context.'
    }
  ],
  'list': [
    { 
      criteria: 'WCAG 1.3.1 Info and Relationships', 
      url: 'https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships.html',
      description: 'Information, structure, and relationships conveyed through presentation can be programmatically determined.'
    }
  ],
  'listitem': [
    { 
      criteria: 'WCAG 1.3.1 Info and Relationships', 
      url: 'https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships.html',
      description: 'Information, structure, and relationships conveyed through presentation can be programmatically determined.'
    }
  ],
  'meta-refresh': [
    { 
      criteria: 'WCAG 2.2.1 Timing Adjustable', 
      url: 'https://www.w3.org/WAI/WCAG21/Understanding/timing-adjustable.html',
      description: 'For each time limit that is set by the content, users can turn off, adjust, or extend the time limit.'
    },
    { 
      criteria: 'WCAG 3.2.5 Change on Request', 
      url: 'https://www.w3.org/WAI/WCAG21/Understanding/change-on-request.html',
      description: 'Changes of context are initiated only by user request or a mechanism is available to turn off such changes.'
    }
  ],
  'meta-viewport': [
    { 
      criteria: 'WCAG 1.4.4 Resize text', 
      url: 'https://www.w3.org/WAI/WCAG21/Understanding/resize-text.html',
      description: 'Except for captions and images of text, text can be resized without assistive technology up to 200 percent without loss of content or functionality.'
    }
  ],
  'nested-interactive': [
    { 
      criteria: 'WCAG 4.1.2 Name, Role, Value', 
      url: 'https://www.w3.org/WAI/WCAG21/Understanding/name-role-value.html',
      description: 'For all UI components, the name and role can be programmatically determined.'
    }
  ],
  'region': [
    { 
      criteria: 'WCAG 2.4.1 Bypass Blocks', 
      url: 'https://www.w3.org/WAI/WCAG21/Understanding/bypass-blocks.html',
      description: 'A mechanism is available to bypass blocks of content that are repeated on multiple Web pages.'
    }
  ],
  'skip-link': [
    { 
      criteria: 'WCAG 2.4.1 Bypass Blocks', 
      url: 'https://www.w3.org/WAI/WCAG21/Understanding/bypass-blocks.html',
      description: 'A mechanism is available to bypass blocks of content that are repeated on multiple Web pages.'
    }
  ],
  'tabindex': [
    { 
      criteria: 'WCAG 2.4.3 Focus Order', 
      url: 'https://www.w3.org/WAI/WCAG21/Understanding/focus-order.html',
      description: 'If a Web page can be navigated sequentially and the navigation sequences affect meaning or operation, focusable components receive focus in an order that preserves meaning and operability.'
    }
  ],
  'table-duplicate-name': [
    { 
      criteria: 'WCAG 1.3.1 Info and Relationships', 
      url: 'https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships.html',
      description: 'Information, structure, and relationships conveyed through presentation can be programmatically determined.'
    }
  ],
  'table-fake-caption': [
    { 
      criteria: 'WCAG 1.3.1 Info and Relationships', 
      url: 'https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships.html',
      description: 'Information, structure, and relationships conveyed through presentation can be programmatically determined.'
    }
  ],
  'td-has-header': [
    { 
      criteria: 'WCAG 1.3.1 Info and Relationships', 
      url: 'https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships.html',
      description: 'Information, structure, and relationships conveyed through presentation can be programmatically determined.'
    }
  ],
  'th-has-data-cells': [
    { 
      criteria: 'WCAG 1.3.1 Info and Relationships', 
      url: 'https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships.html',
      description: 'Information, structure, and relationships conveyed through presentation can be programmatically determined.'
    }
  ],
  'valid-lang': [
    { 
      criteria: 'WCAG 3.1.2 Language of Parts', 
      url: 'https://www.w3.org/WAI/WCAG21/Understanding/language-of-parts.html',
      description: 'The human language of each passage or phrase in the content can be programmatically determined.'
    }
  ],
  'video-caption': [
    { 
      criteria: 'WCAG 1.2.2 Captions (Prerecorded)', 
      url: 'https://www.w3.org/WAI/WCAG21/Understanding/captions-prerecorded.html',
      description: 'Captions are provided for all prerecorded audio content in synchronized media.'
    }
  ]
};

// Function to get WCAG references for a rule
function getWcagReferences(ruleId: string) {
  return wcagReferences[ruleId] || [{ 
    criteria: 'Unknown WCAG Criteria', 
    url: 'https://www.w3.org/WAI/WCAG21/quickref/',
    description: 'Please refer to WCAG documentation for more information.'
  }];
}

// Function to generate HTML report from violations
export async function generateA11yReport(pageName: string, violations: any[], page: Page, baseUrl: string = '', browserName: string = 'unknown') {
  if (!violations.length) return null;
  
  const reportDir = path.join(process.cwd(), 'a11y-reports');
  const screenshotsDir = path.join(reportDir, 'screenshots', pageName);
  
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = path.join(reportDir, `${pageName}-${browserName}-${timestamp}.html`);
  
  let html = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Accessibility Report - ${pageName}</title>
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; color: #333; }
      h1 { color: #d9534f; border-bottom: 2px solid #d9534f; padding-bottom: 10px; }
      h2 { color: #333; margin-top: 30px; }
      .violation { background: #f9f9f9; border-left: 4px solid #d9534f; padding: 15px; margin-bottom: 20px; border-radius: 0 4px 4px 0; }
      .violation-header { display: flex; justify-content: space-between; }
      .impact { display: inline-block; padding: 3px 8px; border-radius: 3px; font-size: 14px; font-weight: bold; }
      .impact.critical { background: #d9534f; color: white; }
      .impact.serious { background: #f0ad4e; color: white; }
      .impact.moderate { background: #5bc0de; color: white; }
      .impact.minor { background: #5cb85c; color: white; }
      .nodes { margin-top: 15px; }
      .node { border: 1px solid #ddd; padding: 10px; margin-bottom: 10px; border-radius: 4px; }
      .html-snippet { background: #f5f5f5; padding: 10px; border-radius: 4px; font-family: monospace; overflow-x: auto; }
      .failure-summary { background: #fff8f8; border-left: 3px solid #d9534f; padding: 10px; margin: 10px 0; }
      .help-section { margin-top: 10px; }
      .help-link { color: #337ab7; text-decoration: none; }
      .help-link:hover { text-decoration: underline; }
      .target { font-family: monospace; background: #f5f5f5; padding: 2px 5px; border-radius: 3px; }
      .screenshot { margin: 15px 0; border: 1px solid #ddd; max-width: 100%; }
      .screenshot-container { margin-top: 15px; }
      .screenshot-title { font-weight: bold; margin-bottom: 5px; }
      .tabs { display: flex; margin-bottom: 10px; }
      .tab { padding: 8px 16px; cursor: pointer; background: #f1f1f1; border: 1px solid #ddd; border-bottom: none; }
      .tab.active { background: white; border-bottom: 1px solid white; }
      .tab-content { display: none; padding: 15px; border: 1px solid #ddd; }
      .tab-content.active { display: block; }
      .wcag-references { background: #f8f9fa; border-left: 3px solid #007bff; padding: 10px; margin: 10px 0; }
      .wcag-reference { margin-bottom: 8px; }
      .wcag-criteria { font-weight: bold; color: #007bff; }
      .wcag-description { margin-top: 5px; font-style: italic; }
    </style>
    <script>
      function switchTab(event, tabName) {
        const tabContents = document.getElementsByClassName('tab-content');
        for (let i = 0; i < tabContents.length; i++) {
          tabContents[i].className = tabContents[i].className.replace(' active', '');
        }
        
        const tabs = document.getElementsByClassName('tab');
        for (let i = 0; i < tabs.length; i++) {
          tabs[i].className = tabs[i].className.replace(' active', '');
        }
        
        document.getElementById(tabName).className += ' active';
        event.currentTarget.className += ' active';
      }
    </script>
  </head>
  <body>
    <h1>Accessibility Report - ${pageName}</h1>
    <p>Generated on: ${new Date().toLocaleString()}</p>
    <p>URL: ${baseUrl}${pageName === 'Homepage' ? '/' : '/' + pageName.toLowerCase()}</p>
    <h2>Violations Found: ${violations.length}</h2>
  `;
  
  // Take screenshots of each element with violations
  for (let i = 0; i < violations.length; i++) {
    const violation = violations[i];
    const impactClass = violation.impact || 'minor';
    const wcagRefs = getWcagReferences(violation.id);
    
    html += `
    <div class="violation">
      <div class="violation-header">
        <h3>${i + 1}. ${violation.id}</h3>
        <span class="impact ${impactClass}">${violation.impact}</span>
      </div>
      <p>${violation.description}</p>
      <div class="help-section">
        <p>${violation.help}</p>
        <a href="${violation.helpUrl}" target="_blank" class="help-link">Learn more</a>
      </div>
      
      <div class="wcag-references">
        <h4>WCAG References:</h4>
        ${wcagRefs.map(ref => `
          <div class="wcag-reference">
            <a href="${ref.url}" target="_blank" class="wcag-criteria">${ref.criteria}</a>
            <div class="wcag-description">${ref.description}</div>
          </div>
        `).join('')}
      </div>
      
      <div class="nodes">
    `;
    
    for (let j = 0; j < violation.nodes.length; j++) {
      const node = violation.nodes[j];
      const nodeId = `${violation.id}-node-${j}`;
      const screenshotFileName = `${nodeId}-${timestamp}.png`;
      const screenshotPath = path.join(screenshotsDir, screenshotFileName);
      const relativeScreenshotPath = `screenshots/${pageName}/${screenshotFileName}`;
      
      // Try to take a screenshot of the element
      let screenshotTaken = false;
      try {
        if (node.target && node.target.length > 0) {
          const targetSelector = node.target[0];
          await page.waitForSelector(targetSelector, { timeout: 5000 }).catch(() => {});
          const elementHandle = await page.$(targetSelector);
          if (elementHandle) {
            await elementHandle.screenshot({ path: screenshotPath });
            screenshotTaken = true;
          }
        }
      } catch (error) {
        console.log(`Failed to take screenshot: ${error}`);
      }
      
      html += `
        <div class="node">
          <div class="tabs">
            <button class="tab active" onclick="switchTab(event, '${nodeId}-code')">Code</button>
            <button class="tab" onclick="switchTab(event, '${nodeId}-failure')">Failure Summary</button>
            ${screenshotTaken ? `<button class="tab" onclick="switchTab(event, '${nodeId}-screenshot')">Screenshot</button>` : ''}
            <button class="tab" onclick="switchTab(event, '${nodeId}-wcag')">WCAG</button>
          </div>
          
          <div id="${nodeId}-code" class="tab-content active">
            <div class="html-snippet">${escapeHtml(node.html)}</div>
            <div>
              <strong>Target:</strong>
              ${node.target.map((t: string) => `<span class="target">${t}</span>`).join(', ')}
            </div>
          </div>
          
          <div id="${nodeId}-failure" class="tab-content">
            <div class="failure-summary">
              <pre>${node.failureSummary}</pre>
            </div>
          </div>
          
          ${screenshotTaken ? `
          <div id="${nodeId}-screenshot" class="tab-content">
            <div class="screenshot-container">
              <div class="screenshot-title">Element Screenshot:</div>
              <img src="${relativeScreenshotPath}" alt="Screenshot of element with accessibility issue" class="screenshot">
              <div class="wcag-reference">
                <p><strong>WCAG Violation:</strong> ${wcagRefs[0].criteria}</p>
              </div>
            </div>
          </div>
          ` : ''}
          
          <div id="${nodeId}-wcag" class="tab-content">
            <div class="wcag-references">
              ${wcagRefs.map(ref => `
                <div class="wcag-reference">
                  <a href="${ref.url}" target="_blank" class="wcag-criteria">${ref.criteria}</a>
                  <div class="wcag-description">${ref.description}</div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      `;
    }
    
    html += `
      </div>
    </div>
    `;
  }
  
  html += `
  </body>
  </html>
  `;
  
  fs.writeFileSync(reportPath, html);
  console.log(`Accessibility report generated: ${reportPath}`);
  
  return reportPath;
}