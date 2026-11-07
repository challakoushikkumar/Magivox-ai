importScripts("vendor/mammoth.browser.min.js");
self.onmessage = async event => {
  try {
    const result = await mammoth.extractRawText({ arrayBuffer: event.data });
    self.postMessage({ text: result.value });
  } catch { self.postMessage({ error: "Could not read this DOCX. Export it as a PDF or paste its text." }); }
};
