export const RESUME_FIELDS = ['fullName','phone','email','location','targetRole','objective','summary','education','college','degree','graduationYear','skills','projects','internship','experience','certifications','achievements','languages','linkedin','github'];
export const OPTIONAL_SECTIONS = ['objective','summary','projects','internship','experience','certifications','achievements','languages'];
export const DEFAULT_SECTION_ORDER = ['summary','objective','skills','experience','internship','projects','education','certifications','achievements','languages'];
export const RESUME_TEMPLATES = [
  { id:'classic', name:'Classic Professional', note:'Conservative single-column ATS layout' },
  { id:'modern', name:'Modern Professional', note:'Clean typography with a subtle accent' },
  { id:'fresher', name:'Fresher', note:'Education, skills and projects first' },
  { id:'technical', name:'Technical', note:'Technical skills and evidence first' },
  { id:'data-analyst', name:'Data Analyst', note:'Analytics tools and projects prioritised' }
];
const STOP = new Set('and the with for from this that your you are was were have has had will would should could role work working team years year using used skills skill required preferred responsibilities responsibilities good excellent strong knowledge candidate ability into our their they who but not'.split(' '));
const ACTIONS = /\b(?:analysed|analyzed|automated|built|cleaned|created|developed|designed|implemented|improved|managed|prepared|resolved|tested|used|visualized|visualised)\b/i;
const VAGUE = /\b(?:hardworking|dynamic professional|team player|responsible for|good communication|quick learner)\b/i;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export function textLines(value) { return String(value || '').split(/\n+/).map(item => item.trim().replace(/^[-•*]\s*/, '')).filter(Boolean); }
export function resumeWords(value) { return String(value || '').toLowerCase().match(/[a-z][a-z0-9+#.-]{1,}/g) || []; }
export function normalizeResumeData(value = {}) {
  const migrated={...value,fullName:value.fullName||value.name||'',location:value.location||value.city||''};
  const data = Object.fromEntries(RESUME_FIELDS.map(key => [key, String(migrated[key] || '').trim().slice(0, key === 'projects' || key === 'experience' ? 5000 : 2500)]));
  data.careerMode = value.careerMode === 'experienced' ? 'experienced' : 'fresher';
  data.template = RESUME_TEMPLATES.some(item => item.id === value.template) ? value.template : 'classic';
  data.title = String(value.title || `${data.targetRole || data.fullName || 'My'} Resume`).trim().slice(0, 100);
  data.jd = String(value.jd || '').trim().slice(0, 10000);
  data.sectionOrder = Array.isArray(value.sectionOrder) ? [...new Set(value.sectionOrder.filter(key => DEFAULT_SECTION_ORDER.includes(key)))] : [...DEFAULT_SECTION_ORDER];
  for (const key of DEFAULT_SECTION_ORDER) if (!data.sectionOrder.includes(key)) data.sectionOrder.push(key);
  data.hiddenSections = Array.isArray(value.hiddenSections) ? value.hiddenSections.filter(key => OPTIONAL_SECTIONS.includes(key)) : [];
  data.id = String(value.id || '').slice(0, 80); data.createdAt = String(value.createdAt || '').slice(0, 40);
  return data;
}
export function tailorResumeToJob(input, jobDescription = '') {
  const data=normalizeResumeData(input),jd=String(jobDescription||data.jd).toLowerCase(),skills=String(data.skills||'').split(/[,\n|]+/).map(item=>item.trim()).filter(Boolean);
  data.skills=skills.map((skill,index)=>({skill,index,relevant:jd.includes(skill.toLowerCase())})).sort((a,b)=>Number(b.relevant)-Number(a.relevant)||a.index-b.index).map(item=>item.skill).join(', ');
  const priority=['summary','objective','skills','projects','experience','internship'];data.sectionOrder=[...priority.filter(key=>data.sectionOrder.includes(key)),...data.sectionOrder.filter(key=>!priority.includes(key))];return data;
}
export function resumePlainText(input) {
  const d = normalizeResumeData(input); const parts = [`${d.fullName}`, [d.phone,d.email,d.location,d.linkedin,d.github].filter(Boolean).join(' | ')];
  const sections = { objective:d.objective, summary:d.summary, skills:d.skills, experience:d.experience, internship:d.internship, projects:d.projects, education:[d.degree,d.college,d.education,d.graduationYear].filter(Boolean).join(' | '), certifications:d.certifications, achievements:d.achievements, languages:d.languages };
  for (const key of d.sectionOrder) if (!d.hiddenSections.includes(key) && sections[key]) parts.push(key.toUpperCase(), sections[key]);
  return parts.filter(Boolean).join('\n');
}
function percentage(value, max) { return Math.min(100, Math.round(value / max * 100)); }
function grammarSignals(text) {
  const lines = textLines(text), issues = [];
  if (lines.some(line => /^[a-z]/.test(line))) issues.push('Start resume sentences and bullets with a capital letter.');
  if (lines.some(line => /\bi\b/.test(line))) issues.push('Write the pronoun “I” with a capital letter.');
  if (lines.some(line => /\s{2,}/.test(line))) issues.push('Remove repeated spaces.');
  if (lines.some(line => line.length > 220)) issues.push('Shorten long bullets so recruiters can scan them.');
  return issues;
}
function uniqueTerms(text) { return [...new Set(resumeWords(text).filter(word => word.length > 2 && !STOP.has(word)))]; }
export function analyzeJobMatch(input, jobDescription = '') {
  const d = normalizeResumeData(input), resume = resumePlainText(d), jd = String(jobDescription || d.jd || '').trim();
  const important = uniqueTerms(jd), present = new Set(uniqueTerms(resume));
  const matchingSkills = important.filter(term => present.has(term));
  const missingSkills = important.filter(term => !present.has(term));
  const overallMatch = important.length ? Math.round(matchingSkills.length / important.length * 100) : null;
  const experienceWords = /\b(?:experience|years?|internship|worked|employment)\b/i.test(jd);
  const educationWords = /\b(?:degree|bachelor|master|b\.?tech|education|graduate)\b/i.test(jd);
  const sectionsNeedingImprovement = [];
  if (missingSkills.length) sectionsNeedingImprovement.push('Skills and project evidence');
  if (experienceWords && !d.experience && !d.internship) sectionsNeedingImprovement.push('Experience or internship evidence');
  if (educationWords && !(d.degree || d.education)) sectionsNeedingImprovement.push('Education');
  return { overallMatch, matchingSkills:matchingSkills.slice(0,30), missingSkills:missingSkills.slice(0,30), importantKeywords:important.slice(0,35), experienceMatch:experienceWords ? Boolean(d.experience || d.internship) : null, educationMatch:educationWords ? Boolean(d.degree || d.education) : null, sectionsNeedingImprovement, interviewTopics:missingSkills.slice(0,8) };
}
export function analyzeResume(input, jobDescription = '') {
  const d = normalizeResumeData(input), text = resumePlainText(d), bullets = [...textLines(d.projects),...textLines(d.experience),...textLines(d.internship)], grammarIssues = grammarSignals(text), tips=[];
  const contactChecks = [d.fullName.length > 2, EMAIL.test(d.email), d.phone.replace(/\D/g,'').length >= 10, d.location.length > 1];
  const contentChecks = [d.targetRole, d.summary || d.objective, d.education || d.degree, d.skills, d.projects || d.experience || d.internship].filter(Boolean).length;
  const scoreRequirements = [
    { id:'contact', label:'Contact details', complete:contactChecks.every(Boolean), help:'Add your name, valid email, phone number and location.' },
    { id:'role', label:'Target role', complete:d.targetRole.length > 2, help:'Choose the job role this resume targets.' },
    { id:'introduction', label:'Professional introduction', complete:(d.summary || d.objective).length >= 40, help:'Write a focused summary or career objective of at least 40 characters.' },
    { id:'education', label:'Education', complete:Boolean(d.degree || d.education) && Boolean(d.college || d.education), help:'Add your degree and college or equivalent education details.' },
    { id:'skills', label:'Relevant skills', complete:uniqueTerms(d.skills).length >= 3, help:'List at least three skills you can confidently explain.' },
    { id:'evidence', label:d.careerMode === 'experienced' ? 'Experience or project evidence' : 'Project evidence', complete:d.careerMode === 'experienced' ? Boolean(d.experience || d.internship || d.projects) : Boolean(d.projects), help:d.careerMode === 'experienced' ? 'Add truthful experience, internship or project evidence.' : 'Add at least one real academic or personal project.' }
  ];
  const completedRequirements = scoreRequirements.filter(item => item.complete).length;
  const isScoreReady = completedRequirements === scoreRequirements.length;
  const formatting = Math.round((percentage(contactChecks.filter(Boolean).length,4) + (bullets.length >= 2 ? 100 : 55) + (text.length >= 350 && text.length <= 8000 ? 100 : 60)) / 3);
  const grammar = Math.max(35, 100 - grammarIssues.length * 18);
  const skills = Math.min(100, 30 + uniqueTerms(d.skills).length * 8);
  const projects = d.projects ? Math.min(100, 45 + textLines(d.projects).length * 12 + (ACTIONS.test(d.projects) ? 15 : 0)) : (d.careerMode === 'experienced' && d.experience ? 65 : 25);
  const contentQuality = Math.min(100, 20 + contentChecks * 12 + (bullets.some(line => ACTIONS.test(line)) ? 12 : 0) + (!VAGUE.test(text) ? 8 : 0));
  const match = analyzeJobMatch(d, jobDescription || d.jd); const keywordStrength = match.overallMatch === null ? Math.min(100, 35 + uniqueTerms(`${d.skills} ${d.projects} ${d.experience}`).length * 3) : match.overallMatch;
  const completeness = contentChecks / 5 * 100;
  const readiness = Math.round(formatting*.18 + grammar*.14 + skills*.16 + projects*.16 + contentQuality*.22 + completeness*.14);
  const atsScore = Math.round(formatting*.2 + grammar*.15 + skills*.2 + projects*.15 + contentQuality*.2 + keywordStrength*.1);
  if (!d.summary && !d.objective) tips.push('Add a truthful professional summary or career objective for the target role.');
  if (!d.projects && d.careerMode === 'fresher') tips.push('Add at least one real academic or personal project.');
  if (!d.experience && d.careerMode === 'experienced') tips.push('Add your real work experience with action-led bullets.');
  if (uniqueTerms(d.skills).length < 5) tips.push('List relevant skills you can confidently explain.');
  if (bullets.length < 2) tips.push('Use concise bullets for projects, internships or experience.');
  if (bullets.length && !bullets.some(line => ACTIONS.test(line))) tips.push('Begin evidence bullets with truthful action verbs such as Built, Analysed or Developed.');
  if (VAGUE.test(text)) tips.push('Replace vague claims with specific tasks and tools you actually used.');
  tips.push(...grammarIssues); if (match.missingSkills.length && match.overallMatch !== null) tips.push('Review missing JD keywords and add only skills you genuinely have.');
  return { atsScore, readiness, isScoreReady, completedRequirements, totalRequirements:scoreRequirements.length, scoreRequirements, status:isScoreReady ? (atsScore >= 75 && readiness >= 75 ? 'READY TO APPLY' : 'NEEDS IMPROVEMENT') : 'COMPLETE YOUR RESUME', metrics:{ contentQuality, formatting, grammar, skills, projects, keywordStrength }, reasons:[...new Set(tips)].slice(0,10), jobMatch:match };
}
export function duplicateWording(input) {
  const starts = [...textLines(input.projects),...textLines(input.experience),...textLines(input.internship)].map(line => line.toLowerCase().split(/\s+/).slice(0,3).join(' '));
  return [...new Set(starts.filter((value,index) => value && starts.indexOf(value) !== index))];
}
export function analyzeResumeDocument(value, jobDescription = '') {
  const source=String(value||'').trim(),lines=source.split(/\n+/).map(line=>line.trim()).filter(Boolean),email=source.match(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/i)?.[0]||'',phone=source.match(/(?:\+?\d[\d ()-]{8,}\d)/)?.[0]||'';
  const catalogue=['Excel','SQL','Power BI','Tableau','Python','Java','JavaScript','HTML','CSS','GIS','Git','React','Node.js','Data Analytics'];
  const skillsDetected=catalogue.filter(term=>new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g,'\\$&').replace(/\\ /g,'\\s+')}\\b`,'i').test(source));
  const hasProjects=/\bprojects?\b/i.test(source),hasExperience=/\b(?:experience|employment|internship)\b/i.test(source),hasEducation=/\b(?:education|degree|bachelor|master|b\.?tech|college|university)\b/i.test(source);
  const mapped={fullName:lines[0]||'',email,phone,location:'Document text',summary:source.slice(0,600),skills:skillsDetected.join(', '),projects:hasProjects?source.slice(0,2500):'',experience:hasExperience?source.slice(0,2500):'',education:hasEducation?'Education section detected':'',careerMode:hasExperience?'experienced':'fresher',jd:jobDescription};
  const report=analyzeResume(mapped,jobDescription);
  const missingSections=[];if(!email||!phone)missingSections.push('Complete contact details');if(!hasEducation)missingSections.push('Education');if(!hasProjects&&!hasExperience)missingSections.push('Projects or experience evidence');if(!skillsDetected.length)missingSections.push('Skills');
  return {...report,skillsDetected,projectsDetected:hasProjects,experienceDetected:hasExperience,educationDetected:hasEducation,missingSections,formattingIssues:['Visual layout cannot be verified from extracted text. Check margins, fonts and spacing in the original file.'],weakSections:report.reasons.slice(0,6)};
}
