// Public settings only. Never place an API key, Gemini key, OpenAI key or service-account key here.
export const APP_CONFIG = Object.freeze({
    // MAGIVOX now uses Firebase AI Logic directly from the browser with the
    // Gemini Developer API. This works on the Firebase Spark plan and does not
    // require a Cloud Function or a secret API key in this web app.
    firebaseAILogicEnabled: true,
    firebaseAIModel: "gemini-3.7-flash",
    // High-volume conversational turns use the lighter supported model.
    firebaseAIConversationModel: "gemini-3.5-flash-lite",

    // Legacy server AI route is intentionally disabled on the Spark plan.
    // Kept as a field so older utilities/tests remain compatible.
    apiBaseUrl: "",

    // Live jobs still require an approved external job-data provider/backend.
    // Leave disabled until that separate integration is configured.
    jobsBaseUrl: "",

    // Official provider logo URL/asset can be added later when live jobs are connected.
    jobProviderLogoUrl: "",
    // Optional public support mailbox; otherwise Contact Support uses Firestore tickets.
    supportEmail: "",
    maxRecordingSeconds: 120,
    maxAudioBytes: 6 * 1024 * 1024,
    maxResumeBytes: 3 * 1024 * 1024
});
