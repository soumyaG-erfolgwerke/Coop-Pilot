import { NextResponse } from "next/server";
import http from "node:http";
import { resolveSession, sessionErrorResponse } from "@/lib/auth/session";

const MAX_REQUEST_BYTES = 2 * 1024 * 1024;
const MAX_PAGES = 60;
const RENDER_TIMEOUT_MS = 25_000;

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

function renderWithIsolatedService(payload) {
  const socketPath = process.env.PDF_RENDERER_SOCKET || "/home/monujesh/.local/run/cooppilot-pdf-renderer.sock";
  const body = Buffer.from(JSON.stringify(payload));
  return withTimeout(new Promise((resolve, reject) => {
    const rendererRequest = http.request({ socketPath, path: "/render", method: "POST", headers: { "Content-Type": "application/json", "Content-Length": body.length } }, (rendererResponse) => {
      const chunks = [];
      rendererResponse.on("data", (chunk) => chunks.push(chunk));
      rendererResponse.on("end", () => {
        if (rendererResponse.statusCode !== 200) {
          const error = new Error(rendererResponse.statusCode === 429 ? "PDF renderer is busy" : "PDF renderer failed");
          error.status = rendererResponse.statusCode;
          reject(error);
          return;
        }
        resolve(Buffer.concat(chunks));
      });
    });
    rendererRequest.setTimeout(RENDER_TIMEOUT_MS, () => rendererRequest.destroy(new Error("PDF renderer timed out")));
    rendererRequest.on("error", reject);
    rendererRequest.end(body);
  }), RENDER_TIMEOUT_MS + 5_000, "PDF renderer timed out");
}

// POST /api/auditServices/generatePdf - Generate text-selectable PDF using Puppeteer
export async function POST(request) {
  try {
    await resolveSession();
    const declaredLength = Number(request.headers.get("content-length") || 0);
    if (declaredLength > MAX_REQUEST_BYTES) {
      return NextResponse.json({ success: false, error: "Content is too large" }, { status: 413 });
    }
    const rawBody = await request.text();
    if (Buffer.byteLength(rawBody, "utf8") > MAX_REQUEST_BYTES) {
      return NextResponse.json({ success: false, error: "Content is too large" }, { status: 413 });
    }
    let payload;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
    }
    const { pagesHtml, htmlContent, pageFormat } = payload;
    if (pagesHtml && (!Array.isArray(pagesHtml) || pagesHtml.length > MAX_PAGES || pagesHtml.some((page) => typeof page !== "string"))) {
      return NextResponse.json({ success: false, error: "Invalid page content" }, { status: 400 });
    }
    if (htmlContent && typeof htmlContent !== "string") {
      return NextResponse.json({ success: false, error: "Invalid content" }, { status: 400 });
    }

    if (!pagesHtml && !htmlContent) {
      return NextResponse.json(
        { success: false, error: "Content is required" },
        { status: 400 },
      );
    }

    const formatDimensions = {
      A4: { width: "210mm", height: "297mm", contentWidth: "170mm" },
      A3: { width: "297mm", height: "420mm", contentWidth: "257mm" },
      A5: { width: "148mm", height: "210mm", contentWidth: "108mm" },
      B4: { width: "250mm", height: "353mm", contentWidth: "210mm" },
      B5: { width: "176mm", height: "250mm", contentWidth: "136mm" },
      Letter: { width: "215.9mm", height: "279.4mm", contentWidth: "175.9mm" },
    };

    const formatKey = pageFormat || "A4";
    const dimensions = formatDimensions[formatKey] || formatDimensions.A4;

    // Build the complete HTML document wrapping pages
    let combinedHtml = "";

    if (pagesHtml && Array.isArray(pagesHtml)) {
      // Multiple pre-paginated pages (used in report editor)
      combinedHtml = pagesHtml
        .map(
          (page, idx) => `
          <div class="pdf-page-container" style="width: ${dimensions.width}; height: ${dimensions.height};">
            ${page}
          </div>
          ${idx < pagesHtml.length - 1 ? '<div class="page-break"></div>' : ""}
        `,
        )
        .join("");
    } else {
      // Single continuous HTML content (used in audit modal)
      combinedHtml = `
        <div class="pdf-content-container" style="max-width: ${dimensions.contentWidth}; margin: 0 auto; padding: 12mm;">
          ${htmlContent}
        </div>
      `;
    }

    const fullHtmlDocument = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,300..900;1,300..900&family=Outfit:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet">
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          * {
            text-rendering: geometricPrecision !important;
            -webkit-font-smoothing: antialiased !important;
            -moz-osx-font-smoothing: grayscale !important;
          }
          
          body {
            margin: 0;
            padding: 0;
            font-family: 'Outfit', 'Inter', system-ui, -apple-system, "Segoe UI", sans-serif;
            background-color: #ffffff;
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
          }
          
          .page-break {
            page-break-after: always;
            break-after: page;
          }
          
          .pdf-page-container {
            position: relative;
            box-sizing: border-box;
            background: white;
            overflow: hidden;
            padding: 12mm; /* standard preview page padding */
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
          }
          
          /* Copy styling rules from live editor styles to guarantee matching vector visuals */
          .pdf-checkmark-span {
            position: absolute !important;
            left: 0 !important;
            top: 3.5px !important;
            display: inline-block !important;
            width: 14px !important;
            height: 14px !important;
            border-radius: 3px !important;
            background-color: #4f46e5 !important;
            color: #ffffff !important;
            border: 1px solid #4f46e5 !important;
            font-size: 9px !important;
            font-weight: bold !important;
            text-align: center !important;
            line-height: 12px !important;
          }
          
          .pdf-checkbox-unchecked-span {
            position: absolute !important;
            left: 0 !important;
            top: 3.5px !important;
            display: inline-block !important;
            width: 14px !important;
            height: 14px !important;
            border-radius: 3px !important;
            background-color: #ffffff !important;
            border: 1px solid #d1d5db !important;
          }
          
          li.flex.items-start {
            display: block !important;
            position: relative !important;
            padding-left: 22px !important;
            list-style-type: none !important;
          }
          
          /* Formatting tags default styles for pdf rendering */
          ul {
            list-style-type: disc !important;
            padding-left: 20px !important;
            margin-top: 8px !important;
            margin-bottom: 12px !important;
          }
          
          ol {
            list-style-type: decimal !important;
            padding-left: 20px !important;
            margin-top: 8px !important;
            margin-bottom: 12px !important;
          }
          
          li {
            margin-bottom: 4px !important;
            font-size: 14px !important;
            color: #374151 !important;
          }
          
          blockquote {
            border-left: 4px solid #818cf8 !important;
            background-color: rgba(243, 244, 246, 0.7) !important;
            padding: 10px 16px !important;
            font-style: italic !important;
            margin: 16px 0 !important;
            color: #4b5563 !important;
            border-radius: 0 8px 8px 0 !important;
          }
          
          table {
            width: 100% !important;
            border-collapse: collapse !important;
            margin: 16px 0 !important;
            font-size: 12px !important;
            border: 1px solid #e5e7eb !important;
          }
          
          th, td {
            border: 1px solid #e5e7eb !important;
            padding: 8px 12px !important;
            text-align: left !important;
          }
          
          th {
            background-color: #f9fafb !important;
            font-weight: bold !important;
            color: #111827 !important;
          }
          
          td {
            color: #374151 !important;
          }
          
           h1 {
            font-size: 26px;
            font-weight: bold !important;
            margin-top: 24px !important;
            margin-bottom: 16px !important;
            color: #111827;
          }
          
          h2 {
            font-size: 20px;
            font-weight: bold !important;
            margin-top: 20px !important;
            margin-bottom: 12px !important;
            color: #111827;
          }
          
          h3 {
            font-size: 16px;
            font-weight: bold !important;
            margin-top: 16px !important;
            margin-bottom: 8px !important;
            color: #111827;
          }

          h4 {
            font-size: 14px;
            font-weight: bold !important;
            margin-top: 12px !important;
            margin-bottom: 6px !important;
            color: #111827;
          }

          h5 {
            font-size: 12px;
            font-weight: bold !important;
            margin-top: 12px !important;
            margin-bottom: 6px !important;
            color: #111827;
          }

          h6 {
            font-size: 11px;
            font-weight: bold !important;
            margin-top: 12px !important;
            margin-bottom: 6px !important;
            color: #111827;
          }

          a {
            color: #0000EE;
            text-decoration: underline;
          }

          em {
            font-style: italic !important;
            color: #374151 !important;
          }

          hr {
            border: none;
            height: 1px;
            background-color: #e5e7eb;
            margin: 24px 0;
          }
          
          p {
            margin-top: 0 !important;
            margin-bottom: 12px !important;
            line-height: 1.6 !important;
            font-size: 14px !important;
            color: #374151 !important;
            text-align: justify;
          }
          
          code {
            color: #e11d48 !important;
            background-color: #f1f5f9 !important;
            padding: 2px 4px !important;
            border-radius: 4px !important;
            font-family: monospace !important;
            font-size: 12px !important;
          }
          
          pre {
            background-color: #f9fafb !important;
            border: 1px solid #e5e7eb !important;
            padding: 16px !important;
            border-radius: 8px !important;
            overflow-x: auto !important;
            margin: 16px 0 !important;
          }
          
          pre code {
            color: #1f2937 !important;
            background-color: transparent !important;
            padding: 0 !important;
            border-radius: 0 !important;
          }
        </style>
      </head>
      <body>
        ${combinedHtml}
      </body>
      </html>
    `;

    const pdfBuffer = await renderWithIsolatedService({
      html: fullHtmlDocument,
      width: dimensions.width,
      height: dimensions.height,
    });

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Pruefungsbericht.pdf"`,
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) {
      return sessionErrorResponse(error);
    }
    if (error?.status === 429) {
      return NextResponse.json(
        { success: false, error: "PDF renderer is busy" },
        { status: 429, headers: { "Retry-After": "5" } },
      );
    }
    console.error("PDF generation server error:", error);
    return NextResponse.json(
      { success: false, error: "PDF generation failed" },
      { status: 500 },
    );
  }
}
