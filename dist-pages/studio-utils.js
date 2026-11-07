export function escapeHTML(value = "") {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}
export function downloadText(name, text, type = "text/plain;charset=utf-8") {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a"); a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function printNotes(title, content) {
  const w = window.open("", "_blank");
  if (!w) throw new Error("Allow a new window to open, then choose Print / save PDF again.");
  w.opener = null;
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${escapeHTML(title)}</title><style>body{font:16px/1.65 system-ui,sans-serif;color:#15253e;max-width:760px;margin:32px auto;padding:0 24px}h1{font-size:26px}pre{font:inherit;white-space:pre-wrap;overflow-wrap:anywhere}button{padding:10px 20px;font:inherit}@media print{button{display:none}body{margin:0;max-width:none}@page{margin:18mm}}</style></head><body><button id="print">Print / save PDF</button><h1>${escapeHTML(title)}</h1><pre>${escapeHTML(content)}</pre></body></html>`);
  w.document.close();
  w.document.getElementById("print").addEventListener("click", () => w.print());
}
export function speak(text, language) {
  if (!("speechSynthesis" in window)) throw new Error("Read aloud is not supported in this browser.");
  const lang = language.startsWith("Telugu") ? "te-IN" : language === "Hindi" ? "hi-IN" : "en-IN";
  if (language === "Telugu (English letters)") throw new Error("Choose Telugu script for read aloud. Roman Telugu is available as text.");
  const voices = speechSynthesis.getVoices();
  const voice = voices.find(v => v.lang.toLowerCase() === lang.toLowerCase()) || voices.find(v => v.lang.startsWith(lang.slice(0, 2)));
  if (!voice && lang !== "en-IN") throw new Error("This device has no voice for the chosen language. The text answer is available.");
  speechSynthesis.cancel();
  const words = text.match(/[\s\S]{1,220}(?:\s|$)|[\s\S]{1,220}/g) || [];
  for (const part of words) {
    const utterance = new SpeechSynthesisUtterance(part);
    utterance.lang = lang; if (voice) utterance.voice = voice;
    speechSynthesis.speak(utterance);
  }
}

function speechLanguage(language) {
  return language?.startsWith("Telugu") ? "te-IN" : language === "Hindi" ? "hi-IN" : "en-IN";
}

function preferredVoice(language) {
  const lang = speechLanguage(language);
  const voices = window.speechSynthesis?.getVoices?.() || [];
  const sameLanguage = voices.filter(voice => voice.lang?.toLowerCase().startsWith(lang.slice(0, 2).toLowerCase()));
  return sameLanguage.sort((a, b) => {
    const score = voice => (voice.lang?.toLowerCase() === lang.toLowerCase() ? 8 : 0)
      + (/natural|neural|google|microsoft|samantha|aria|sonia/i.test(voice.name) ? 4 : 0)
      + (!voice.localService ? 2 : 0) + (voice.default ? 1 : 0);
    return score(b) - score(a);
  })[0];
}

export function cancelSpeech() {
  window.speechSynthesis?.cancel();
}

export async function speakAsync(text, language = "English", { signal } = {}) {
  if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) throw new Error("AI voice is not supported in this browser.");
  if (language === "Telugu (English letters)") throw new Error("This voice requires Telugu script.");
  const parts = String(text || "").match(/[\s\S]{1,220}(?:\s|$)|[\s\S]{1,220}/g) || [];
  if (!parts.length) return;
  cancelSpeech();
  const voice = preferredVoice(language), lang = speechLanguage(language);
  for (const part of parts) {
    if (signal?.aborted) throw new DOMException("Speech cancelled", "AbortError");
    await new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(part.trim());
      utterance.lang = voice?.lang || lang;
      utterance.rate = 0.96;
      utterance.pitch = 1;
      if (voice) utterance.voice = voice;
      const abort = () => { cancelSpeech(); reject(new DOMException("Speech cancelled", "AbortError")); };
      utterance.onend = () => { signal?.removeEventListener("abort", abort); resolve(); };
      utterance.onerror = event => { signal?.removeEventListener("abort", abort); reject(new Error(event.error === "canceled" ? "AI voice was cancelled." : "AI voice could not play.")); };
      signal?.addEventListener("abort", abort, { once: true });
      window.speechSynthesis.speak(utterance);
    });
  }
}
