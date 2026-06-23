import fs from "fs";
import path from "path";

// Shared log colors exported for the application
export const RESET = "\x1b[0m";
export const GREEN = "\x1b[32m";
export const RED = "\x1b[31m";
export const BOLD = "\x1b[1m";

export const DIR = "./status-data";

// Ensure status directory exists
if (!fs.existsSync(DIR)) {
  fs.mkdirSync(DIR, { recursive: true });
}

export function setStatusUp(contextName) {
  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Status UP - Purchase ${contextName}</title>
</head>
<body>
  <h1>🟢 Purchase Flow Success</h1>
  <p>Context: <strong>${contextName}</strong></p>
  <p>Status: <strong>purchase flow is up</strong></p>
  <p>Last checked: ${new Date().toISOString()}</p>
</body>
</html>`;

  fs.writeFileSync(path.join(DIR, `${contextName}.html`), htmlContent.trim());
  console.log(
    `${GREEN}🟢 Status HTML (UP) saved for Upptime: status-data/${contextName}.html${RESET}`,
  );
}

export function setStatusDown(contextName) {
  // Generate GitHub Actions direct run link if available in env
  const runId = process.env.GITHUB_RUN_ID;
  const repository = process.env.GITHUB_REPOSITORY;
  const serverUrl = process.env.GITHUB_SERVER_URL || "https://github.com";

  let reportSection = "";
  if (runId && repository) {
    const artifactUrl = `${serverUrl}/${repository}/actions/runs/${runId}#artifacts`;
    reportSection = `
  <hr />
  <h3>📊 Playwright Trace Report Available</h3>
  <p>A detailed interactive trace report has been generated for this failure.</p>
  <p><strong><a href="${artifactUrl}" target="_blank" style="color: #c5221f; font-weight: bold;">Download Playwright Trace Report from GitHub Artifacts</a></strong></p>
  <p>To view it: Download the zip file, open <strong><a href="https://trace.playwright.dev/" target="_blank">trace.playwright.dev</a></strong> in your browser, and drag & drop the zip archive there.</p>`;
  }

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Status DOWN - Purchase ${contextName}</title>
</head>
<body>
  <h1>🔴 Purchase Flow Failure Detected</h1>
  <p>Context: <strong>${contextName}</strong></p>
  <p>Status: <strong>purchase flow is down</strong></p>
  <p>Timestamp: ${new Date().toISOString()}</p>${reportSection}
</body>
</html>`;

  fs.writeFileSync(path.join(DIR, `${contextName}.html`), htmlContent.trim());
  console.log(
    `${RED}🔴 Status HTML (DOWN) saved for Upptime: status-data/${contextName}.html${RESET}`,
  );
}
