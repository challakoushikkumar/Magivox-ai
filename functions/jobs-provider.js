import { AppError, text } from "./core.js";

export function jobsInput(body) {
  const query = text(body.query, "Job title or skills", 100, 2);
  if (!Array.isArray(body.cities) || body.cities.length > 3 || body.cities.length < 1) throw new AppError(400, "invalid-input", "Choose one to three cities.");
  const cities = [...new Set(body.cities.map(city => text(city, "City", 60, 2)))];
  const page = body.page ?? 1;
  if (!Number.isInteger(page) || page < 1 || page > 5) throw new AppError(400, "invalid-input", "Invalid results page.");
  return { query, cities, page };
}
export function safeJobURL(value) {
  try { const u = new URL(value); return u.protocol === "https:" && !u.username && !u.password ? u.href : ""; } catch { return ""; }
}
export function createJobsProvider({ appId, appKey, fetchImpl = fetch }) {
  return async ({ query, cities, page }) => {
    if (!appId || !appKey) throw new AppError(503, "jobs-setup", "The live jobs connection is not available yet.");
    const groups = [];
    for (const city of cities) {
      const url = new URL(`https://api.adzuna.com/v1/api/jobs/in/search/${page}`);
      url.search = new URLSearchParams({ app_id: appId, app_key: appKey, what: query,
        where: city === "Anywhere in India" ? "India" : city, results_per_page: "10", sort_by: "date", "content-type": "application/json" }).toString();
      let response;
      try { response = await fetchImpl(url, { redirect: "error", signal: AbortSignal.timeout(15000) }); }
      catch { throw new AppError(504, "jobs-timeout", "Job search took too long. Please try again."); }
      if (!response.ok) throw new AppError(502, "jobs-unavailable", "The job provider is unavailable. Please try later.");
      let body;
      try { body = await response.json(); } catch { throw new AppError(502, "jobs-unavailable", "Could not read the job provider response."); }
      if (!Array.isArray(body.results)) throw new AppError(502, "jobs-unavailable", "Could not read the job provider response.");
      groups.push(...body.results.map(job => ({
        id: `adzuna-${String(job.id).slice(0, 100)}`, title: String(job.title || "").slice(0, 200),
        company: String(job.company?.display_name || "Company not listed").slice(0, 200),
        location: String(job.location?.display_name || city).slice(0, 200),
        description: String(job.description || "").slice(0, 1400),
        url: safeJobURL(job.redirect_url), date: String(job.created || "").slice(0, 40), source: "Adzuna"
      })).filter(job => job.id !== "adzuna-undefined" && job.title && job.url));
    }
    const jobs = [...new Map(groups.map(j => [j.id, j])).values()];
    return { jobs, page, retrievedAt: new Date().toISOString(), source: "Adzuna", mayHaveMore: groups.length >= cities.length * 10 };
  };
}
