import { APP_CONFIG } from "./app-config.js";

function readDocx(bytes) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL("./docx-worker.js", import.meta.url));
    const finish = () => { clearTimeout(timeout); worker.terminate(); };
    const timeout = setTimeout(() => { finish(); reject(new Error("Reading this document took too long. Paste its text instead.")); }, 12000);
    worker.onmessage = ({ data }) => { finish(); data.error ? reject(new Error(data.error)) : resolve(data.text); };
    worker.onerror = () => { finish(); reject(new Error("Document reader could not load. Refresh or paste resume text.")); };
    worker.postMessage(bytes.buffer, [bytes.buffer]);
  });
}

export async function readResume(file) {
  if (!file || file.size > APP_CONFIG.maxResumeBytes) throw new Error("Choose a resume smaller than 3 MB.");
  const extension = file.name.split(".").pop().toLowerCase();
  const bytes = new Uint8Array(await file.arrayBuffer());
  let result = "";
  if (extension === "txt") result = new TextDecoder().decode(bytes);
  else if (extension === "pdf") {
    if (new TextDecoder().decode(bytes.slice(0, 5)) !== "%PDF-") throw new Error("This file is not a readable PDF.");
    const pdfjs = await import("./vendor/pdf.mjs");
    pdfjs.GlobalWorkerOptions.workerSrc = new URL("./vendor/pdf.worker.mjs", import.meta.url).href;
    const task = pdfjs.getDocument({ data: bytes, isEvalSupported: false, useSystemFonts: true });
    let pdf;
    const timeout = setTimeout(() => task.destroy(), 12000);
    try {
      pdf = await task.promise;
      if (pdf.numPages > 10) throw new Error("Please use a resume of 10 pages or fewer.");
      for (let n = 1; n <= pdf.numPages; n++) {
        const page = await pdf.getPage(n);
        const content = await page.getTextContent();
        result += content.items.map(item => (item.str || "") + (item.hasEOL ? "\n" : " ")).join("") + "\n\n";
        if (result.length > 22000) throw new Error("The extracted resume is too long. Paste only the relevant sections.");
      }
    } finally { clearTimeout(timeout); await task.destroy(); }
  } else if (extension === "docx") {
    if (bytes[0] !== 0x50 || bytes[1] !== 0x4b) throw new Error("This file is not a DOCX document.");
    // Check central-directory sizes before asking a ZIP reader to decompress.
    let total = 0, entries = 0;
    const view = new DataView(bytes.buffer);
    for (let i = 0; i <= bytes.length - 46; i++) {
      if (view.getUint32(i, true) === 0x02014b50) {
        total += view.getUint32(i + 24, true); entries++;
        if (total > 15 * 1024 * 1024 || entries > 250) throw new Error("This document is too complex. Export a simple PDF or paste its text.");
      }
    }
    if (!entries) throw new Error("The DOCX document could not be read.");
    result = await readDocx(bytes);
  } else throw new Error("Upload a PDF, DOCX or TXT resume.");
  if (result.trim().length < 80) throw new Error("Very little text was found. Scanned/image PDFs need OCR; paste selectable text instead.");
  if (result.length > 22000) throw new Error("Resume text is over 22,000 characters. Paste only relevant sections.");
  return result.trim();
}
