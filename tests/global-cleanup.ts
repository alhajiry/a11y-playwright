import fs from 'fs';
import path from 'path';

// Function to clean up existing reports
function cleanupExistingReports() {
  const reportDir = path.join(process.cwd(), 'a11y-reports');
  
  if (fs.existsSync(reportDir)) {
    console.log('Cleaning up existing accessibility reports...');
    
    // Remove all HTML reports
    const htmlFiles = fs.readdirSync(reportDir).filter(file => file.endsWith('.html'));
    htmlFiles.forEach(file => {
      fs.unlinkSync(path.join(reportDir, file));
    });
    
    // Remove screenshot directory and its contents
    const screenshotsDir = path.join(reportDir, 'screenshots');
    if (fs.existsSync(screenshotsDir)) {
      deleteDirectory(screenshotsDir);
    }
    
    console.log(`Cleaned up ${htmlFiles.length} report files and screenshots.`);
  }
}

// Helper function to recursively delete a directory
function deleteDirectory(dirPath: string) {
  if (fs.existsSync(dirPath)) {
    fs.readdirSync(dirPath).forEach(file => {
      const curPath = path.join(dirPath, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        // Recursive call for directories
        deleteDirectory(curPath);
      } else {
        // Delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(dirPath);
  }
}

// Global setup function that runs once before all tests
async function globalSetup() {
  // Clean up existing reports
  cleanupExistingReports();
}

export default globalSetup;