import { APP_CONFIG } from "./app-config.js";
import { requestMAGIVOXAI, AI_UNAVAILABLE_MESSAGE, isAIQuotaError } from "./ai-core.js";
import { SPEECH_LANGUAGE } from './speech-normalizer.js';

export function mountRecorder(container, { user, signal, onTranscript, onSpeechDraft = () => {}, recognitionPhrases = () => [], transcriptionContext = () => ({}), shouldVerifyTranscript = () => false, language = () => "English", onStateChange = () => {}, onRecordingChange = () => {}, onRecordStart = () => {}, onControls = () => {}, automatic = false, hasConsent = () => false }) {
  container.innerHTML = `<div class="voice-panel">
    <div class="voice-heading"><strong>${automatic ? 'Live microphone' : 'Voice recorder'}</strong><span data-timer>0:00 / 2:00</span></div>
    <p>${automatic ? 'Listening stops after a short silence. Finish answer also sends your speech automatically.' : 'Record up to 2 minutes. Listen and delete or retry before sending.'}</p>
    <div class="tool-actions"><button type="button" class="tool-button-secondary" data-record>${automatic ? 'Mic on' : 'Record'}</button><button type="button" class="tool-button-secondary" data-stop disabled>${automatic ? 'Finish answer' : 'Stop'}</button><button type="button" class="tool-button-secondary" data-discard disabled>${automatic ? 'Retry recording' : 'Delete recording'}</button></div>
    <audio data-playback controls hidden aria-label="Your recording"></audio>
    <a data-download hidden ${automatic ? 'aria-hidden="true"' : ''}>Download recording</a>
    <label class="consent-line" ${automatic ? 'hidden' : ''}><input type="checkbox" data-consent> Send this recording to Google through Firebase AI Logic for transcription. It is not saved to my MAGIVOX profile.</label>
    <button type="button" class="tool-button-secondary" data-transcribe disabled ${automatic ? 'hidden' : ''}>Transcribe recording</button>
    <p class="inline-message" data-status role="status">Microphone is off.</p>
  </div>`;
  const el = selector => container.querySelector(selector);
  let recorder, stream, timer, blob, url, seconds = 0, bytes = 0, opening = false, disposed = false, busy = false;
  let enabled = true, startedAt = 0, durationSeconds = 0, revision = 0, submitAfterStop = false, analyserCleanup = () => {};
  let recognition = null, recognizedFinal = '', recognitionLanguage = SPEECH_LANGUAGE, finishRequested = false, submissionRequested = false, recognitionFallbackTimer;
  let recognitionConfidenceTotal = 0, recognitionConfidenceCount = 0;
  const notify = () => onStateChange({ opening, recording: recorder?.state === 'recording', transcribing: busy });
  const status = message => { el("[data-status]").textContent = message; };
  const tracksOff = () => { analyserCleanup(); analyserCleanup = () => {}; stream?.getTracks().forEach(t => t.stop()); stream = null; clearInterval(timer); };
  const cancelRecognition = () => { clearTimeout(recognitionFallbackTimer); if (recognition) { recognition.__magivoxCancelled = true; try { recognition.abort(); } catch {} recognition = null; } };
  const hasRecording = () => {
    el("[data-discard]").disabled = !enabled || !blob || busy || opening || recorder?.state === 'recording';
    el("[data-transcribe]").disabled = !enabled || !blob || busy || opening || recorder?.state === 'recording';
  };
  const discard = () => {
    revision++; onRecordingChange();
    blob = null; if (url) URL.revokeObjectURL(url); url = null;
    el("[data-playback]").pause(); el("[data-playback]").removeAttribute("src"); el("[data-playback]").hidden = true;
    el("[data-download]").hidden = true; el("[data-consent]").checked = false; hasRecording();
  };
  function stop(send = false) {
    if (send && automatic && recognition && !finishRequested) {
      finishRequested = true;
      try { recognition.stop(); }
      catch { recognition = null; finishRequested = false; }
      recognitionFallbackTimer = setTimeout(() => { recognition = null; finishRequested = false; stop(true); }, 900);
      return;
    }
    if (send && submissionRequested) return;
    if (send) submissionRequested = true;
    if (!send) cancelRecognition();
    submitAfterStop = Boolean(send && automatic);
    if (recorder?.state === 'recording') durationSeconds = Math.max(0, (performance.now() - startedAt) / 1000);
    if (recorder?.state === "recording") recorder.stop();
    tracksOff(); el("[data-stop]").disabled = true; notify();
  }
  const transcribe = async () => {
    if (!enabled || disposed || !blob || busy || opening || recorder?.state === 'recording') return;
    if (!(automatic ? hasConsent() : el("[data-consent]").checked)) { status("Tick the permission box before sending your recording."); return; }
    busy = true; const transcriptionRevision = revision; hasRecording(); el("[data-record]").disabled = true; status("Transcribing…"); notify();
    try {
      const base64 = await new Promise((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(r.result.split(",")[1]); r.onerror = reject; r.readAsDataURL(blob); });
      const browserTranscript = recognizedFinal.trim();
      const browserRecognition = { rawTranscript: browserTranscript, finalTranscript: browserTranscript, language: recognitionLanguage, confidence: recognitionConfidenceCount ? recognitionConfidenceTotal / recognitionConfidenceCount : null, source: 'browser-final' };
      if (automatic && browserTranscript && !shouldVerifyTranscript(browserTranscript, browserRecognition)) {
        if (!disposed && enabled && revision === transcriptionRevision) {
          const accepted = onTranscript(browserTranscript, { base64, mime: blob.type.split(';')[0], durationSeconds, assessment: null, recognition: browserRecognition });
          status(accepted === false ? "I may not have heard that correctly. Please say that again." : "Final browser transcript validated without using AI transcription.");
        }
        return;
      }
      let result;
      try { result = await requestMAGIVOXAI('transcription', { base64, mime:blob.type, language:language(), recognitionLanguage, browserTranscript, context:transcriptionContext(), consent:true }, user, signal); }
      catch (error) {
        if (!automatic || !recognizedFinal) throw error;
        const fallback = recognizedFinal.trim();
        if (!disposed && enabled && revision === transcriptionRevision) {
          const accepted = onTranscript(fallback, { base64, mime: blob.type.split(';')[0], durationSeconds, assessment: null, recognition: { rawTranscript: fallback, finalTranscript: fallback, language: recognitionLanguage, confidence: recognitionConfidenceCount ? recognitionConfidenceTotal / recognitionConfidenceCount : null, source: 'browser-fallback' } });
          status(accepted === false ? "I may not have heard that correctly. Please say that again." : "AI audio verification was unavailable. The validated browser transcript was used safely.");
        }
        return;
      }
      if (!disposed && enabled && revision === transcriptionRevision) {
        const finalTranscript = result.text.trim(), rawTranscript = browserTranscript || finalTranscript;
        const accepted = onTranscript(finalTranscript, { base64, mime: blob.type.split(';')[0], durationSeconds, assessment: result.audio || null, recognition: { rawTranscript, finalTranscript, language: recognitionLanguage, confidence: recognitionConfidenceCount ? recognitionConfidenceTotal / recognitionConfidenceCount : null, source: 'ai-audio' } });
        status(accepted === false ? "I may not have heard that correctly. Please say that again." : automatic ? "AI audio transcript validated. Waiting for the interviewer…" : "AI transcript ready. Check the words before continuing.");
      }
    } catch (error) { if (!disposed) { status(isAIQuotaError(error) ? AI_UNAVAILABLE_MESSAGE : recognizedFinal ? `${error.message} Your final transcript is kept; use Retry or Send typed answer.` : error.message); if (recognizedFinal) onSpeechDraft(recognizedFinal, true); } }
    finally { busy = false; if (!disposed) { hasRecording(); el("[data-record]").disabled = !enabled; } notify(); }
  };
  const watchSilence = activeStream => {
    const AudioEngine = window.AudioContext || window.webkitAudioContext;
    if (!automatic || !AudioEngine) return;
    const audioContext = new AudioEngine(), source = audioContext.createMediaStreamSource(activeStream), analyser = audioContext.createAnalyser();
    analyser.fftSize = 1024; source.connect(analyser);
    const samples = new Uint8Array(analyser.fftSize); let heardSpeech = false, quietSince = 0, frame = 0;
    const sample = now => {
      if (recorder?.state !== 'recording') return;
      analyser.getByteTimeDomainData(samples);
      let sum = 0; for (const value of samples) { const centered = (value - 128) / 128; sum += centered * centered; }
      const audible = Math.sqrt(sum / samples.length) > 0.025;
      if (audible) { heardSpeech = true; quietSince = 0; }
      else if (heardSpeech) { quietSince ||= now; if (now - quietSince >= 1400 && now - startedAt >= 900) { stop(true); return; } }
      frame = requestAnimationFrame(sample);
    };
    frame = requestAnimationFrame(sample);
    analyserCleanup = () => { cancelAnimationFrame(frame); source.disconnect(); audioContext.close().catch(() => {}); };
  };
  const startRecognition = () => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!automatic || !Recognition) return false;
    try {
      const active = new Recognition(); recognition = active; recognizedFinal = ''; recognitionConfidenceTotal = 0; recognitionConfidenceCount = 0; finishRequested = false;
      active.lang = SPEECH_LANGUAGE; recognitionLanguage = active.lang; active.continuous = false; active.interimResults = true; active.maxAlternatives = 3;
      const Phrase = window.SpeechRecognitionPhrase;
      if (Phrase && 'phrases' in active) {
        try { active.phrases = [...new Set(recognitionPhrases().map(value => String(value || '').trim()).filter(Boolean))].map(phrase => new Phrase(phrase, 3)); } catch {}
      }
      active.onresult = event => {
        let interim = '';
        for (let index = event.resultIndex; index < event.results.length; index++) {
          const alternative = event.results[index][0], words = alternative?.transcript || '';
          if (event.results[index].isFinal) { recognizedFinal += `${words} `; if (Number.isFinite(alternative?.confidence)) { recognitionConfidenceTotal += alternative.confidence; recognitionConfidenceCount++; } }
          else interim += `${words} `;
        }
        recognizedFinal = recognizedFinal.trimStart();
        onSpeechDraft(`${recognizedFinal}${interim}`.trim(), false);
      };
      active.onerror = event => { if (!active.__magivoxCancelled) status(event.error === 'no-speech' ? 'No final speech was detected. Finishing the recording safely…' : 'Speech recognition was interrupted. Keeping any captured words…'); };
      active.onend = () => {
        clearTimeout(recognitionFallbackTimer);
        if (active.__magivoxCancelled || disposed || recognition !== active) return;
        recognition = null; finishRequested = false; recognizedFinal = recognizedFinal.trim();
        stop(true);
      };
      active.start(); return true;
    } catch { recognition = null; return false; }
  };
  const start = async () => {
    if (!enabled || disposed || opening || busy || recorder?.state === "recording") return;
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) { status("Recording needs HTTPS or localhost and a browser with microphone support. You can type your answer instead."); return false; }
    opening = true; const openingRevision = revision; el("[data-record]").disabled = true; onRecordStart(); notify();
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (disposed || !enabled || revision !== openingRevision) { tracksOff(); return; }
      discard(); seconds = 0; bytes = 0; recognizedFinal = ''; finishRequested = false; submissionRequested = false; const captureRevision = revision;
      const chunks = [];
      const mimeType = ["audio/webm;codecs=opus", "audio/mp4", "audio/ogg;codecs=opus"].find(type => MediaRecorder.isTypeSupported(type));
      if (!mimeType) throw new Error("This browser cannot create a supported recording. Please use a current Chrome, Edge or Safari browser.");
      recorder = new MediaRecorder(stream, { mimeType, audioBitsPerSecond: 64000 });
      recorder.ondataavailable = event => {
        if (event.data.size) { bytes += event.data.size; chunks.push(event.data); }
        if (bytes > APP_CONFIG.maxAudioBytes) stop(true);
      };
      recorder.onerror = () => { stop(false); status("Recording was interrupted. Please try again."); };
      recorder.onstop = () => {
        tracksOff();
        if (disposed || captureRevision !== revision) return;
        blob = new Blob(chunks, { type: mimeType });
        el("[data-record]").disabled = !enabled; notify();
        if (blob.size > APP_CONFIG.maxAudioBytes || blob.size < 100) { discard(); status("Recording could not be used. Try a shorter recording."); return; }
        url = URL.createObjectURL(blob);
        el("[data-playback]").src = url; el("[data-playback]").hidden = false;
        const link = el("[data-download]"); link.href = url; link.download = `magivox-recording.${mimeType.includes("mp4") ? "mp4" : mimeType.includes("ogg") ? "ogg" : "webm"}`; link.textContent = "Download recording"; link.hidden = false;
        hasRecording(); status(automatic ? "Speech captured. Transcribing automatically…" : "Recording ready. Listen before sending. Microphone is off.");
        if (submitAfterStop) { submitAfterStop = false; void transcribe(); }
      };
      startedAt = performance.now(); recorder.start(500); el("[data-stop]").disabled = false; notify();
      const nativeRecognition = startRecognition(); if (!nativeRecognition) watchSilence(stream);
      status(automatic ? "Listening... speak naturally, then stop speaking." : "Recording… your microphone is on.");
      el("[data-timer]").textContent = "0:00 / 2:00";
      timer = setInterval(() => { seconds += 1; el("[data-timer]").textContent = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")} / 2:00`; if (seconds >= APP_CONFIG.maxRecordingSeconds) stop(true); }, 1000);
      return true;
    } catch (e) { tracksOff(); status(e.name === "NotAllowedError" ? "Microphone permission was denied. Allow it in your browser settings or type your answer." : e.message); el("[data-record]").disabled = false; return false; }
    finally { opening = false; if (!disposed) { el('[data-record]').disabled = !enabled || busy || recorder?.state === 'recording'; hasRecording(); } notify(); }
  };
  el("[data-record]").addEventListener("click", start);
  el("[data-stop]").addEventListener("click", () => stop(automatic));
  el("[data-discard]").addEventListener("click", () => { discard(); status(automatic ? "Previous capture cleared. Listening again…" : "Recording deleted. Microphone is off."); if (automatic) void start(); });
  el("[data-transcribe]").addEventListener("click", transcribe);
  const cleanup = () => { disposed = true; cancelRecognition(); stop(); if (url) URL.revokeObjectURL(url); };
  signal?.addEventListener("abort", cleanup, { once: true });
  window.addEventListener("pagehide", cleanup, { once: true });
  onControls({
    setEnabled(value) { const next = Boolean(value), shouldStop = enabled && !next; enabled = next; if (shouldStop) { revision++; stop(false); } if (!disposed) { el('[data-record]').disabled = !enabled || busy || opening || recorder?.state === 'recording'; hasRecording(); } },
    reset() { stop(false); discard(); if (!disposed) status('Recording cleared. Microphone is off.'); },
    start,
    stop: () => stop(false),
    stopAndTranscribe: () => stop(true)
  });
  return cleanup;
}

