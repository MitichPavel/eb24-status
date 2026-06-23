import fs from "fs";
import path from "path";

// Shared log colors exported for other modules
export const RESET = "\x1b[0m";
export const GREEN = "\x1b[32m";
export const RED = "\x1b[31m";
export const BOLD = "\x1b[1m";

export const DIR = "./status-data";
if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });

let logStream;
let logFilePath;

export function initLogger(targetContext) {
  logFilePath = path.join(DIR, `${targetContext}-execution.log`);
  if (fs.existsSync(logFilePath)) fs.unlinkSync(logFilePath);

  logStream = fs.createWriteStream(logFilePath, { flags: "a" });

  const originalWriteOut = process.stdout.write;
  process.stdout.write = function (chunk) {
    logStream.write(chunk);
    return originalWriteOut.apply(process.stdout, arguments);
  };

  const originalWriteErr = process.stderr.write;
  process.stderr.write = function (chunk) {
    logStream.write(chunk);
    return originalWriteErr.apply(process.stderr, arguments);
  };
}

export function setStatusUp(contextName) {
  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Status UP - Purchase ${contextName}</title>
</head>
<body style="font-family: Arial, sans-serif; padding: 20px; background: #e6f4ea; color: #137333;">
  <h1>🟢 Purchase Flow Success</h1>
  <p>Context: <strong>${contextName}</strong></p>
  <p>Status: <strong>purchase flow is up</strong></p>
  <p>Last checked: ${new Date().toISOString()}</p>
</body>
</html>`;

  fs.writeFileSync(path.join(DIR, `${contextName}.html`), htmlContent.trim());
  console.log(
    `${GREEN}🟢 Status HTML (UP) saved for Upptime: ${contextName}${RESET}`,
  );

  const oldScreenshotPath = path.join(DIR, `${contextName}-screenshot.png`);
  if (fs.existsSync(oldScreenshotPath)) fs.unlinkSync(oldScreenshotPath);

  logStream.end();
  if (fs.existsSync(logFilePath)) fs.unlinkSync(logFilePath);
}

export function setStatusDown(contextName, errorMessage, hasScreenshot = true) {
  const screenshotTag = hasScreenshot
    ? `<h3>Failure Screenshot:</h3><img src="./${contextName}-screenshot.png" style="max-width: 100%; border: 2px solid #c5221f;" />`
    : "";

  let capturedLogs = "No console logs captured.";
  if (fs.existsSync(logFilePath)) {
    const rawLogs = fs.readFileSync(logFilePath, "utf8");
    capturedLogs = rawLogs.replace(
      /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
      "",
    );
  }

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Status DOWN - Purchase ${contextName}</title>
</head>
<body style="font-family: Arial, sans-serif; padding: 20px; background: #fce8e6; color: #c5221f;">
  <h1>🔴 Purchase Flow Failure Detected</h1>
  <p>Context: <strong>${contextName}</strong></p>
  <p>Status: <strong>purchase flow is down</strong></p>
  <p>Timestamp: ${new Date().toISOString()}</p>
  <hr />
  <h3>🚨 Error Message:</h3>
  <pre style="background: #fff; padding: 15px; color: #b71c1c; font-weight: bold;">${errorMessage}</pre>
  <h3>📋 Full Console & System Logs:</h3>
  <pre style="background: #212121; padding: 15px; color: #eeff41; font-family: monospace;">${capturedLogs}</pre>
  ${screenshotTag}
</body>
</html>`;

  fs.writeFileSync(path.join(DIR, `${contextName}.html`), htmlContent.trim());

  logStream.end();
  if (fs.existsSync(logFilePath)) fs.unlinkSync(logFilePath);
}
