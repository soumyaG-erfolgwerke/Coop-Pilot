import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import puppeteer from "puppeteer";

const socketPath = process.env.PDF_RENDERER_SOCKET || "/home/monujesh/.local/run/cooppilot-pdf-renderer.sock";
const chromePath = process.env.PDF_CHROME_BINARY;
const maxInputBytes = 2_250_000;
const maxOutputBytes = 25 * 1024 * 1024;
let rendering = false;

function withTimeout(promise, timeoutMs, message) {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(message)), timeoutMs);
      timer.unref?.();
    }),
  ]).finally(() => clearTimeout(timer));
}

async function render({ html, width, height }) {
  if (typeof html !== "string" || Buffer.byteLength(html, "utf8") > maxInputBytes) throw new Error("Invalid renderer input");
  if (typeof width !== "string" || typeof height !== "string") throw new Error("Invalid page dimensions");
  if (!chromePath) throw new Error("PDF_CHROME_BINARY is missing");

  let browser;
  try {
    browser = await withTimeout(puppeteer.launch({
      headless: true,
      executablePath: chromePath,
      timeout: 10_000,
      protocolTimeout: 20_000,
      args: [
        "--no-sandbox",
        "--disable-background-networking",
        "--disable-breakpad",
        "--disable-component-update",
        "--disable-default-apps",
        "--disable-dev-shm-usage",
        "--disable-domain-reliability",
        "--disable-extensions",
        "--disable-features=OptimizationHints,MediaRouter,Translate",
        "--disable-gpu",
        "--disable-sync",
        "--font-render-hinting=none",
        "--metrics-recording-only",
        "--no-default-browser-check",
        "--no-first-run",
      ],
    }), 12_000, "Renderer launch timed out");

    const page = await browser.newPage();
    await page.setJavaScriptEnabled(false);
    await page.setRequestInterception(true);
    page.on("request", (request) => {
      try {
        const url = request.url();
        const type = request.resourceType();
        if (url === "about:blank" || (type === "image" && (url.startsWith("data:image/") || url.startsWith("blob:")))) {
          request.continue();
          return;
        }
        if (type === "image" && (url.includes("localhost") || url.includes("127.0.0.1") || url.startsWith("/"))) {
          const relativePath = new URL(url, "http://localhost").pathname;
          const publicRoot = path.resolve(process.cwd(), "public");
          const localPath = path.resolve(publicRoot, `.${relativePath}`);
          if (localPath.startsWith(`${publicRoot}${path.sep}`) && fs.existsSync(localPath) && fs.lstatSync(localPath).isFile()) {
            const extension = path.extname(localPath).toLowerCase();
            const types = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".gif": "image/gif", ".webp": "image/webp", ".svg": "image/svg+xml" };
            if (types[extension]) {
              request.respond({ status: 200, contentType: types[extension], body: fs.readFileSync(localPath) });
              return;
            }
          }
        }
        request.abort("blockedbyclient");
      } catch {
        request.abort("blockedbyclient");
      }
    });
    await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 1 });
    await withTimeout(page.setContent(html, { waitUntil: "domcontentloaded", timeout: 15_000 }), 25_000, "Content rendering timed out");
    await withTimeout(page.evaluateHandle(() => document.fonts.ready), 3_000, "Font loading timed out");
    const pdf = await withTimeout(page.pdf({ width, height, printBackground: true, margin: { top: "0px", bottom: "0px", left: "0px", right: "0px" } }), 25_000, "PDF generation timed out");
    if (pdf.byteLength > maxOutputBytes) throw new Error("Generated PDF exceeds output limit");
    return Buffer.from(pdf);
  } finally {
    if (browser) await withTimeout(browser.close(), 5_000, "Renderer shutdown timed out").catch(() => browser.process()?.kill("SIGKILL"));
  }
}

if (fs.existsSync(socketPath)) fs.unlinkSync(socketPath);
const server = http.createServer(async (request, response) => {
  if (request.method !== "POST" || request.url !== "/render") {
    response.writeHead(404).end();
    return;
  }
  if (rendering) {
    response.writeHead(429, { "Content-Type": "application/json", "Retry-After": "5" }).end('{"error":"busy"}');
    return;
  }
  rendering = true;
  try {
    const chunks = [];
    let size = 0;
    for await (const chunk of request) {
      size += chunk.length;
      if (size > maxInputBytes) throw new Error("Renderer request too large");
      chunks.push(chunk);
    }
    const pdf = await render(JSON.parse(Buffer.concat(chunks).toString("utf8")));
    response.writeHead(200, { "Content-Type": "application/pdf", "Content-Length": pdf.length }).end(pdf);
  } catch (error) {
    console.error("Secure PDF renderer error:", error instanceof Error ? error.message : "unknown");
    response.writeHead(500, { "Content-Type": "application/json" }).end('{"error":"render failed"}');
  } finally {
    rendering = false;
  }
});
server.listen(socketPath, () => {
  fs.chmodSync(socketPath, 0o600);
  console.log(`Secure PDF renderer ready on ${socketPath}; host=${os.hostname()}`);
});
