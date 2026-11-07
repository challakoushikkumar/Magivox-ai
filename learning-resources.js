import { printNotes, escapeHTML as e } from "./studio-utils.js";

export const RESOURCES = [
  ["Excel", "resources/Excel_A_to_Z_MAGIVOX.pdf", "Formulas, lookups, cleaning, PivotTables, Power Query, dashboards"],
  ["SQL", "resources/SQL_A_to_Z_MAGIVOX.pdf", "SELECT to joins, CTEs, windows and interview practice"],
  ["Power BI", "resources/Power_BI_A_to_Z_MAGIVOX.pdf", "Power Query, modelling, DAX, visuals, RLS and service"],
  ["Tableau", "resources/Tableau_A_to_Z_MAGIVOX.pdf", "Charts, filters, calculations, LOD, dashboards and actions"],
  ["Python", "resources/Python_A_to_Z_MAGIVOX.pdf", "Core Python, OOP, files, data tools and interview"],
  ["R Language", "resources/R_Language_A_to_Z_MAGIVOX.pdf", "R objects, data frames, cleaning, statistics and visualisation"],
  ["Java", "resources/Java_A_to_Z_MAGIVOX.pdf", "Core Java, OOP, collections, exceptions, JDBC and interview"],
  ["Data Structures", "resources/Data_Structures_A_to_Z_MAGIVOX.pdf", "Complexity, arrays, linked structures, trees, graphs and DP"],
  ["GIS Mapping", "resources/GIS_Mapping_A_to_Z_MAGIVOX.pdf", "Spatial data, CRS, QGIS, analysis and map design"],
  ["HTML", "resources/HTML_A_to_Z_MAGIVOX.pdf", "Semantic HTML, forms, accessibility, metadata and projects"],
  ["CSS", "resources/CSS_A_to_Z_MAGIVOX.pdf", "Cascade, box model, Flexbox, Grid and responsive design"],
  ["JavaScript", "resources/JavaScript_A_to_Z_MAGIVOX.pdf", "Core JS, DOM, async, APIs, modules and debugging"],
  ["Data Entry", "resources/Data_Entry_A_to_Z_MAGIVOX.pdf", "Typing accuracy, formats, validation, quality and security"],
  ["Aptitude & Reasoning", "resources/Aptitude_Reasoning_A_to_Z_MAGIVOX.pdf", "BODMAS, percentages, ratio, work, speed and logic"],
  ["Interview Preparation", "resources/Interview_Preparation_MAGIVOX.pdf", "Self-introduction, HR, technical, STAR and voice practice"],
  ["ATS Resume & Job Search", "resources/ATS_Resume_Job_Search_MAGIVOX.pdf", "ATS-friendly resume, JD matching, tracker and follow-up"]
];
export function resourceHTML() {
  return `<section class="tool-panel resource-panel"><div class="tool-section-heading"><div><p class="eyebrow">DOWNLOADABLE LEARNING LIBRARY</p><h3>16 subject guides + practice workbook</h3></div><p>Open or download a guide, study one module, then take its MAGIVOX topic test.</p></div><div class="resource-grid">${RESOURCES.map(([name,url,note])=>`<article class="resource-card"><div class="resource-icon">PDF</div><div><strong>${e(name)}</strong><p>${e(note)}</p></div><div class="tool-actions"><a class="tool-button-secondary" href="${e(url)}" target="_blank" rel="noopener">Open PDF</a><a class="text-action" href="${e(url)}" download>Download</a></div></article>`).join("")}</div><div class="tool-actions"><a class="tool-button" href="resources/MAGIVOX-Excel-PowerBI-Practice.xlsx" download>Download Excel / Power BI practice workbook</a><button id="printPracticeNotes" class="tool-button-secondary" type="button">Print practice instructions</button></div><p id="practiceNotesStatus" role="status"></p></section>`;
}
const NOTES = `MAGIVOX PRACTICE LAB\n\n1. Choose one course and one topic.\n2. Read the detailed lesson and work through its example.\n3. Submit at least one practice answer before marking the lesson complete.\n4. Take the randomized 5-question topic test and review every wrong answer.\n5. Pass every topic test with at least 70%.\n6. Complete every lesson and practice to unlock the 50-question final exam.\n7. Pass the final with at least 70% to become certificate eligible.\n8. Use the AI Teacher for doubts, examples and revision.\n\nExcel/Power BI workbook: 40 synthetic orders and a 4-product lookup table. It is training data, not live company data.`;
export function bindResources(container) {
  container.querySelector("#printPracticeNotes")?.addEventListener("click", () => { try { printNotes("MAGIVOX practice lab", NOTES); } catch (err) { container.querySelector("#practiceNotesStatus").textContent = err.message; } });
}
