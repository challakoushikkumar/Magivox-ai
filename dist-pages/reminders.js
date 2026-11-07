import { downloadText, escapeHTML as e } from "./studio-utils.js";
const escapeICS = s => String(s).replaceAll("\\", "\\\\").replaceAll("\r", "").replaceAll("\n", "\\n").replaceAll(",", "\\,").replaceAll(";", "\\;");
const stamp = date => new Date(date).toISOString().replaceAll("-", "").replaceAll(":", "").replace(/\.\d{3}Z$/, "Z");
function fold(line) {
  const result = []; let part = "", bytes = 0;
  for (const char of line) { const n = new TextEncoder().encode(char).length; if (bytes + n > 73) { result.push(part); part = " "; bytes = 1; } part += char; bytes += n; }
  result.push(part); return result.join("\r\n");
}
export function calendarEvent(reminder) {
  const date = new Date(reminder.when);
  if (!Number.isFinite(date.getTime()) || !reminder.id || !reminder.title) throw new Error("Invalid reminder.");
  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//MAGIVOX//Learning Reminders//EN", "CALSCALE:GREGORIAN", "BEGIN:VEVENT",
    `UID:${escapeICS(reminder.id)}@magivox`, `DTSTAMP:${stamp(new Date())}`, `DTSTART:${stamp(date)}`, `DTEND:${stamp(new Date(date.getTime()+30*60000))}`,
    `SUMMARY:${escapeICS(reminder.title)}`, "DESCRIPTION:Your MAGIVOX learning session.", "BEGIN:VALARM", "TRIGGER:-PT10M", "ACTION:DISPLAY", `DESCRIPTION:${escapeICS(reminder.title)}`, "END:VALARM", "END:VEVENT", "END:VCALENDAR", ""].map(fold).join("\r\n");
}
export function mountReminders(container, context) {
  container.innerHTML = `<section class="tool-panel studio"><h3>Learning reminders</h3><p>Save a study time, then download and import it into your calendar. The calendar controls notifications, including when this website is closed.</p><form id="reminderForm"><div class="studio-two-columns"><label>Study task<input name="title" class="tool-input" maxlength="120" placeholder="Practise Excel formulas" required></label><label>When (your device's local time)<input name="when" class="tool-input" type="datetime-local" required></label></div><button class="tool-button-secondary">Save reminder</button></form><p id="reminderStatus" class="inline-message" role="status"></p><div id="reminderList"></div></section>`;
  const status = t => { container.querySelector("#reminderStatus").textContent = t; };
  function draw() {
    container.querySelector("#reminderList").innerHTML = context.getReminders().map(r => `<div class="saved-job"><div><strong>${e(r.title)}</strong><p>${e(new Date(r.when).toLocaleString())}</p></div><button class="tool-button-secondary" data-calendar="${e(r.id)}">Download calendar file</button><button class="tool-button-secondary" data-delete-reminder="${e(r.id)}">Remove</button></div>`).join("") || "<p>No reminders saved yet.</p>";
    container.querySelectorAll("[data-calendar]").forEach(b => { b.onclick = () => { const r = context.getReminders().find(x => x.id === b.dataset.calendar); downloadText("magivox-reminder.ics", calendarEvent(r), "text/calendar;charset=utf-8"); status("Downloaded. Import this file into your calendar and check its notification settings. Website reminders do not play a background alarm."); }; });
    container.querySelectorAll("[data-delete-reminder]").forEach(b => { b.onclick = async () => { b.disabled = true; try { await context.removeReminder(b.dataset.deleteReminder); draw(); status("Removed from MAGIVOX. If imported, delete it separately from your calendar."); } catch (err) { status(err.message); b.disabled = false; } }; });
  }
  container.querySelector("#reminderForm").onsubmit = async event => {
    event.preventDefault(); const button = event.currentTarget.querySelector("button"); if (button.disabled) return;
    const data = new FormData(event.currentTarget), when = new Date(data.get("when"));
    if (!Number.isFinite(when.getTime()) || when.getTime() <= Date.now()) { status("Choose a future date and time."); return; }
    button.disabled = true;
    try { await context.saveReminder({ id:crypto.randomUUID(), title:data.get("title").trim(), when:when.toISOString() }); draw(); status("Reminder saved. Download its calendar file to set up notifications."); }
    catch (err) { status(err.message); }
    finally { button.disabled = false; }
  };
  draw();
}
