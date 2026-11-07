import { app, auth } from "./firebase-auth.js";
import { mountTeacher, mountResume, mountInterview } from "./studio.js";
import { mountJobs } from "./jobs.js";
import { mountReminders } from "./reminders.js";
import { resourceHTML, bindResources } from "./learning-resources.js";
import { COURSES, getCourse, courseSearchText } from "./course-catalog.js";
import { mountAssessments } from "./assessment-engine.js";
import { mountResumeBuilder } from "./resume-builder.js";
import { mountProgress } from "./progress-portfolio.js";
import { mountAccountSecurity } from './account-security.js';
import { mountSupport } from './help-support.js';
import { normalizeCourseLearning, courseRecord, recordLessonOpen, recordPractice, canCompleteLesson, completeLesson, courseEligibility, topicLearningState, nextCourseAction, recordAssessment, createCertificateRecord, COURSE_POLICY } from './course-learning-engine.js';
import { publishCertificate } from './learning-store.js';
import { getTopicCurriculum } from './lesson-curriculum.js';
import { normalizeAptitudeState, recordAptitudeAttempt } from './aptitude-engine.js';
import { mountAptitude } from './aptitude-studio.js';
import { normalizePortfolio, normalizeProject } from './portfolio-engine.js';
import { mountCareerRoadmaps } from './career-roadmaps.js';
import { normalizeCareerState, roleId } from './career-roadmap-engine.js';
import { normalizeApplication } from './job-engine.js';
import { mountPlatformHub } from './platform-hub.js';
import { deriveNotifications, normalizePlatformState, notificationCount } from './platform-engine.js';

import {
    getFirestore,
    doc,
    getDoc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

const db = getFirestore(app);
const toolContent = document.getElementById("toolContent");
const toast = document.getElementById("appToast");

const TOOL_META = {
    support: { title: 'Help & Support', eyebrow: 'HERE TO HELP', hero: 'Find your next step with MAGIVOX.', description: 'Ask for help, browse FAQs, report an issue or suggest a feature.' },
    roadmaps: {
        title: "Career Roadmaps",
        eyebrow: "ROLE-BASED PLANNING",
        hero: "Turn your career goal into a clear action plan.",
        description: "Choose a role and follow a practical four-stage roadmap from fundamentals to job preparation."
    },
    skills: {
        title: "Learn Skills",
        eyebrow: "STRUCTURED LEARNING",
        hero: "Build one useful skill at a time.",
        description: "Explore beginner-friendly courses, complete lessons and keep your progress saved."
    },
    aptitude: {
        title: "Aptitude & Reasoning",
        eyebrow: "DYNAMIC PRACTICE",
        hero: "Train your speed, logic and accuracy.",
        description: "Practise fresh aptitude and reasoning questions, revise mistakes, complete daily challenges and take timed mock exams."
    },
    exams: {
        title: "Exams & Scores",
        eyebrow: "TOPIC + FINAL ASSESSMENTS",
        hero: "Prove each topic before moving forward.",
        description: "Take randomized 5-question topic tests and a locked 50-question course final with saved score history."
    },
    interview: {
        title: "Interview Practice",
        eyebrow: "MOCK INTERVIEW",
        hero: "Speak, practise and improve through real conversations.",
        description: "Self-introduction, role-specific mock interviews and English communication coaching with saved feedback."
    },
    resume: {
        title: "ATS Resume Studio",
        eyebrow: "BUILD + REVIEW + MATCH",
        hero: "Create an ATS-friendly resume in the style you like.",
        description: "Build from scratch, preview templates, run a JD match, export PDF/DOCX, or upload an existing resume for AI review."
    },
    jobs: {
        title: "Jobs & Applications",
        eyebrow: "DISCOVER + PREPARE + TRACK",
        hero: "Turn suitable opportunities into prepared applications.",
        description: "Search clearly sourced jobs, compare evidence-based matches, prepare for roles and track every application."
    },
    library: { title:'Search & Saved',eyebrow:'YOUR MAGIVOX LIBRARY',hero:'Find anything and keep what matters.',description:'Search learning and career content, save items, write notes, review flashcards and manage notifications.' },
    assistant: {
        title: "Ask MAGIVOX AI",
        eyebrow: "YOUR AI TEACHER",
        hero: "Ask, practise, and understand the next step.",
        description: "Learn with examples, voice questions and follow-up explanations."
    },
    progress: {
        title: "Progress & Portfolio",
        eyebrow: "XP + CERTIFICATES + PROJECTS",
        hero: "Turn practice into visible progress.",
        description: "Track XP, streaks, badges, final-exam certificates, study plans and real projects."
    },
    settings: {
        title: "Settings",
        eyebrow: "YOUR ACCOUNT",
        hero: "Keep your profile and learning data under control.",
        description: "Review your saved profile, preferences and progress options."
    }
};

const DEFAULT_APP_STATE = {
    selectedRoadmap: "",
    courseProgress: {},
    courseLearning: {},
    quizHistory: [],
    aptitudePractice: {},
    assessmentHistory: [],
    passedTopics: {},
    interviewSessions: [],
    resumeDraft: {},
    savedJobs: [],
    appliedJobs: [],
    jobRecords: [],
    reminders: [],
    activityCount: 0,
    weeklyKey: "",
    weeklyActivity: 0,
    notifications: true,
    lastResumeMatch: null,
    activityDates: [],
    projects: [],
    studyGoal: {},
    portfolio: {},
    careerRoadmap: {},
    platform: {}
};

let activeUser = null;
let profileData = {};
let appState = mergeState();
let activeTool = new URLSearchParams(window.location.search).get("tool") || "roadmaps";

if (!TOOL_META[activeTool]) {
    activeTool = "roadmaps";
}

function mergeState(saved = {}) {
    return {
        ...DEFAULT_APP_STATE,
        ...saved,
        courseProgress: { ...(saved.courseProgress || {}) },
        courseLearning: normalizeCourseLearning(saved.courseLearning),
        quizHistory: Array.isArray(saved.quizHistory) ? saved.quizHistory : [],
        aptitudePractice: normalizeAptitudeState(saved.aptitudePractice),
        assessmentHistory: Array.isArray(saved.assessmentHistory) ? saved.assessmentHistory.slice(-100) : [],
        passedTopics: saved.passedTopics && typeof saved.passedTopics === "object" ? Object.fromEntries(Object.entries(saved.passedTopics).map(([k,v])=>[k,Array.isArray(v)?v.map(Number).filter(Number.isInteger):[]])) : {},
        resumeDraft: saved.resumeDraft && typeof saved.resumeDraft === "object" ? { ...saved.resumeDraft } : {},
        interviewSessions: Array.isArray(saved.interviewSessions) ? saved.interviewSessions : [],
        jobRecords: Array.isArray(saved.jobRecords) ? saved.jobRecords.slice(-60).map(normalizeApplication) : [],
        reminders: Array.isArray(saved.reminders) ? saved.reminders.slice(-20) : [],
        activityDates: Array.isArray(saved.activityDates) ? saved.activityDates.slice(-120) : [],
        projects: Array.isArray(saved.projects) ? saved.projects.slice(-30).map(normalizeProject) : [],
        studyGoal: saved.studyGoal && typeof saved.studyGoal === "object" ? { ...saved.studyGoal } : {},
        portfolio: normalizePortfolio(saved.portfolio),
        careerRoadmap: saved.careerRoadmap && typeof saved.careerRoadmap === "object" ? { ...saved.careerRoadmap } : {},
        platform: normalizePlatformState(saved.platform),
        savedJobs: Array.isArray(saved.jobRecords) ? saved.jobRecords.map(j => j.id) : [],
        appliedJobs: Array.isArray(saved.jobRecords) ? saved.jobRecords.filter(j => ["Applied", "Interview"].includes(j.status)).map(j => j.id) : []
    };
}

function escapeHTML(value = "") {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 2600);
}

function readStoredJSON(key, fallback) {
    try {
        return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
    } catch (error) {
        console.warn(`Could not read ${key}:`, error);
        return fallback;
    }
}

function getWeekKey() {
    const date = new Date();
    const day = (date.getDay() + 6) % 7;
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - day);
    return date.toISOString().slice(0, 10);
}

function getDisplayName() {
    return profileData.fullName || activeUser?.displayName || localStorage.getItem("magivoxUser") || "MAGIVOX User";
}

function updateAvatar(element, name, photoURL = "") {
    if (!element) return;
    if (photoURL) {
        element.textContent = "";
        element.style.backgroundImage = `url("${photoURL.replaceAll('"', "")}")`;
        element.style.backgroundSize = "cover";
        element.style.backgroundPosition = "center";
    } else {
        element.style.backgroundImage = "";
        element.textContent = name.charAt(0).toUpperCase();
    }
}

function updateShell() {
    const meta = TOOL_META[activeTool];
    const name = getDisplayName();
    const role = profileData.targetRole || "Exploring careers";
    const language = profileData.preferredLanguage || "English";
    const photoURL = activeUser?.photoURL || "";

    document.title = `${meta.title} | MAGIVOX AI`;
    document.getElementById("pageTitle").textContent = meta.title;
    document.getElementById("toolEyebrow").textContent = meta.eyebrow;
    document.getElementById("toolHeroTitle").textContent = meta.hero;
    document.getElementById("toolHeroDescription").textContent = meta.description;
    document.getElementById("profileName").textContent = name;
    document.getElementById("accountType").textContent = activeUser ? role : "Guest learner";
    document.getElementById("heroRole").textContent = role;
    document.getElementById("heroLanguage").textContent = `${language} learning experience`;
    document.getElementById("modeBadge").textContent = activeUser ? "Account data synced" : "Guest mode • local save";

    updateAvatar(document.getElementById("sidebarAvatar"), name, photoURL);
    updateAvatar(document.getElementById("topAvatar"), name, photoURL);

    document.querySelectorAll("[data-tool-link]").forEach((link) => {
        link.classList.toggle("active", link.dataset.toolLink === activeTool);
    });
    updateNotificationBadge();
}

async function persistState(rootPatch = {}) {
    if (activeUser) {
        await setDoc(
            doc(db, "users", activeUser.uid),
            { appState, ...rootPatch, updatedAt: serverTimestamp() },
            { merge: true }
        );
        profileData = { ...profileData, ...rootPatch };
    } else {
        localStorage.setItem("magivoxGuestAppState", JSON.stringify(appState));
        profileData = { ...profileData, ...rootPatch };
        localStorage.setItem("magivoxGuestProfile", JSON.stringify(profileData));
    }
}

async function recordActivity(rootPatch = {}) {
    const previous = { activityCount: appState.activityCount, activityDates: [...(appState.activityDates || [])], weeklyKey: appState.weeklyKey, weeklyActivity: appState.weeklyActivity };
    appState.activityCount = Number(appState.activityCount || 0) + 1;
    const today = new Date().toISOString().slice(0, 10);
    appState.activityDates = [...new Set([...(appState.activityDates || []), today])].slice(-120);
    const currentWeek = getWeekKey();
    if (appState.weeklyKey !== currentWeek) {
        appState.weeklyKey = currentWeek;
        appState.weeklyActivity = 0;
    }
    appState.weeklyActivity = Number(appState.weeklyActivity || 0) + 1;
    try { await persistState(rootPatch); }
    catch (error) { Object.assign(appState, previous); throw error; }
}

function sectionHeading(eyebrow, title, note = "") {
    return `
        <div class="tool-section-heading">
            <div>
                <p class="eyebrow">${escapeHTML(eyebrow)}</p>
                <h2>${escapeHTML(title)}</h2>
            </div>
            ${note ? `<p>${escapeHTML(note)}</p>` : ""}
        </div>`;
}

function renderActiveTool() {
    updateShell();
    const renderers = {
        roadmaps: renderRoadmaps,
        skills: renderSkills,
        aptitude: renderAptitude,
        exams: renderExams,
        interview: renderInterview,
        resume: renderResume,
        jobs: renderJobs,
        library: () => mountPlatformHub(studioContext()),
        assistant: renderAssistant,
        progress: renderProgress,
        settings: renderSettings,
        support: () => mountSupport(studioContext())
    };
    renderers[activeTool]();
    window.scrollTo({ top: 0, behavior: "auto" });
}

function renderRoadmaps() {
    mountCareerRoadmaps(studioContext());
}

function coursePercent(course) {
    return courseEligibility(course, appState.courseLearning?.[course.id]).percent;
}

function renderSkills() {
    const categories = ["All", ...new Set(COURSES.map((course) => course.category))];
    toolContent.innerHTML = `
        ${resourceHTML()}
        ${sectionHeading("LEARNING LIBRARY", "Courses and skill tracks", "Open a topic with your teacher, then mark your practice progress.")}
        <div class="filter-bar">
            <input id="courseSearch" class="tool-input" type="search" placeholder="Search courses or skills">
            <select id="courseCategory" class="tool-select" aria-label="Course category">${categories.map((category) => `<option>${category}</option>`).join("")}</select>
        </div>
        <div id="courseGrid" class="tool-grid"></div>
        <div id="courseDetail"></div>`;

    const search = document.getElementById("courseSearch");
    const category = document.getElementById("courseCategory");
    const drawGrid = () => {
        const query = search.value.trim().toLowerCase();
        const filtered = COURSES.filter((course) =>
            (category.value === "All" || course.category === category.value) &&
            courseSearchText(course).includes(query)
        );
        const grid = document.getElementById("courseGrid");
        grid.innerHTML = filtered.length ? filtered.map((course) => {
            const percent = coursePercent(course);
            const action = nextCourseAction(course, appState.courseLearning?.[course.id] || {});
            return `
                <article class="tool-card">
                    <div class="tool-card-icon">${course.icon}</div>
                    <h3>${course.title}</h3>
                    <p>${course.description}</p>
                    <p><strong>Next:</strong> ${escapeHTML(action.label)}</p>
                    <div class="tool-card-meta"><span class="tool-chip">${course.category}</span><span class="tool-chip">${course.level}</span><span class="tool-chip ${percent === 100 ? "success" : ""}">${percent}% complete</span></div>
                    <button class="tool-button-secondary" data-course="${course.id}" type="button">${percent ? "Continue course" : "Start course"}</button>
                </article>`;
        }).join("") : `<div class="empty-state">No courses match your search.</div>`;
        grid.querySelectorAll("[data-course]").forEach((button) => button.addEventListener("click", () => showCourse(button.dataset.course)));
    };
    search.addEventListener("input", drawGrid);
    category.addEventListener("change", drawGrid);
    drawGrid();
    bindResources(toolContent);

    const requestedCourse = new URLSearchParams(window.location.search).get("course");
    if (COURSES.some((course) => course.id === requestedCourse)) showCourse(requestedCourse, false);
}

function showCourse(id, scroll = true, selectedIndex = null) {
    const course = getCourse(id);
    if (!course) return;
    const record = courseRecord(appState, id);
    const queryTopic = new URLSearchParams(location.search).get('topic');
    const requested = selectedIndex === null ? (queryTopic === null ? Number(record.currentTopic) : Number(queryTopic)) : Number(selectedIndex);
    const desiredIndex = Math.max(0, Math.min(course.topics.length - 1, Number.isInteger(requested) ? requested : 0));
    const desiredState = topicLearningState(course, record, desiredIndex);
    const recommendedBeforeOpen = nextCourseAction(course, record);
    const topicIndex = desiredState.locked ? recommendedBeforeOpen.topicIndex : desiredIndex;
    if (desiredState.locked) showToast(desiredState.reason);
    recordLessonOpen(record, topicIndex);

    const topic = course.topics[topicIndex];
    const eligibility = courseEligibility(course, record);
    const percent = eligibility.percent;
    const states = course.topics.map((_, index) => topicLearningState(course, record, index));
    const currentState = states[topicIndex];
    const curriculum = getTopicCurriculum(course, topic, topicIndex);
    const recommended = nextCourseAction(course, record);
    const bestAttempt = record.topicTests[topicIndex]?.attempts?.slice().sort((a, b) => b.score - a.score)[0];
    const detail = document.getElementById('courseDetail');
    const lessonUrl = (index, action = '') => `workspace.html?tool=assistant&course=${encodeURIComponent(course.id)}&topic=${index}&lesson=${encodeURIComponent(`${course.title}: ${course.topics[index].title}`)}${action ? `&action=${encodeURIComponent(action)}` : ''}`;
    const testUrl = `workspace.html?tool=exams&course=${encodeURIComponent(course.id)}&topic=${topicIndex}`;
    const continueHref = recommended.kind === 'test' || recommended.kind === 'final' ? `workspace.html?tool=exams&course=${encodeURIComponent(course.id)}&topic=${recommended.topicIndex}` : `#${recommended.kind === 'practice' ? 'practice' : 'learn'}`;

    detail.innerHTML = `
        <section class="tool-panel course-detail">
            <div class="course-detail-header">
                <div><p class="eyebrow">${course.category.toUpperCase()} COURSE</p><h2>${escapeHTML(course.title)}</h2><p class="tool-muted">${eligibility.lessons}/${course.topics.length} lessons · ${eligibility.practices}/${course.topics.length} practices · ${eligibility.tests}/${course.topics.length} topic tests passed</p></div>
                <div class="course-progress-summary"><strong>${percent}%</strong><span>verified progress</span></div>
            </div>
            <div class="progress-line" aria-label="${percent}% course progress"><span style="width:${percent}%"></span></div>
            <div class="course-resource-banner"><div><strong>Course guide and notes</strong><p>${escapeHTML(course.description)}</p></div><div class="tool-actions"><a class="tool-button-secondary" href="#notes">View Notes</a><a class="tool-button-secondary" href="${course.pdf}" target="_blank" rel="noopener">Open PDF</a><a class="text-action" href="${course.pdf}" download>Download PDF</a></div></div>

            <div class="course-study-layout">
                <details class="course-outline" open>
                    <summary>Modules and topics</summary>
                    <nav aria-label="Course modules">
                        ${course.topics.map((item, index) => { const state = states[index]; return `<section class="course-module ${index === topicIndex ? 'current' : ''} ${state.locked ? 'locked' : ''}"><small>MODULE ${index + 1}</small><button type="button" data-topic="${index}" ${state.locked ? 'disabled' : ''} aria-current="${index === topicIndex ? 'step' : 'false'}"><span>${state.locked ? '🔒' : state.passed ? '✓' : index + 1}</span><strong>${escapeHTML(item.title)}</strong></button><span class="learning-status status-${state.label.toLowerCase().replaceAll(' ', '-')}">${state.label}</span><p>${escapeHTML(state.reason)}</p></section>`; }).join('')}
                    </nav>
                </details>

                <main class="course-learning-area">
                    <header class="lesson-header"><div><p class="eyebrow">MODULE ${topicIndex + 1} OF ${course.topics.length}</p><h3>${escapeHTML(topic.title)}</h3></div><span class="learning-status status-${currentState.label.toLowerCase().replaceAll(' ', '-')}">${currentState.label}</span></header>
                    <nav class="lesson-section-nav" aria-label="Topic sections"><a href="#learn">Learn</a><a href="#example">Example</a><a href="#practice">Practice</a><a href="#notes">Notes / PDF</a><a href="#ai-teacher">AI Teacher</a><a href="#topic-test">Test</a></nav>

                    <section id="learn" class="lesson-section"><p class="eyebrow">1 · LEARN FROM BASIC TO ADVANCED</p><h4>Complete lesson material</h4><p>Study these levels in order. Each level explains the theory and then shows how to use it.</p><nav class="lesson-level-nav" aria-label="Lesson levels">${curriculum.map(unit => `<a href="#lesson-${unit.id}">${escapeHTML(unit.level)}</a>`).join('')}</nav>${curriculum.map((unit, unitIndex) => `<article id="lesson-${unit.id}" class="lesson-level"><div class="lesson-level-heading"><span>${unitIndex + 1}</span><div><small>${escapeHTML(unit.level.toUpperCase())}</small><h4>${escapeHTML(unit.title)}</h4></div></div>${unit.paragraphs.map(paragraph => `<p>${escapeHTML(paragraph)}</p>`).join('')}${unit.concepts?.length ? `<h5>Core theory and terms</h5><dl class="concept-definitions">${unit.concepts.map(item => `<div><dt>${escapeHTML(item.term)}</dt><dd>${escapeHTML(item.definition)}</dd></div>`).join('')}</dl>` : ''}${unit.steps?.length ? `<h5>Step-by-step process</h5><ol class="lesson-steps">${unit.steps.map(step => `<li>${escapeHTML(step)}</li>`).join('')}</ol>` : ''}</article>`).join('')}<h4>Key points</h4><ul class="key-point-list">${topic.keywords.map(keyword => `<li>${escapeHTML(keyword)}</li>`).join('')}</ul></section>

                    <section id="example" class="lesson-section"><p class="eyebrow">2 · EXAMPLE</p><h4>Worked example</h4><p class="lesson-example">${escapeHTML(topic.example)}</p><p><strong>Common mistake:</strong> ${escapeHTML(topic.mistake)}</p><p><strong>Check your work:</strong> ${escapeHTML(topic.check)}</p></section>

                    <section id="practice" class="lesson-section topic-practice"><p class="eyebrow">3 · PRACTICE</p><h4>Try it yourself</h4><label>Difficulty<select id="practiceDifficulty" class="tool-select"><option>Easy</option><option>Medium</option><option>Hard</option></select></label><p id="practiceQuestion"></p><textarea id="practiceAnswer" class="tool-textarea" rows="4" maxlength="1500" placeholder="Write your answer before viewing the solution."></textarea><div class="tool-actions"><button id="practiceHint" class="tool-button-secondary" type="button">Show hint</button><button id="recordPractice" class="tool-button" type="button">Submit practice</button><button id="practiceSolution" class="tool-button-secondary" type="button">Show answer</button></div><p id="practiceFeedback" role="status">${currentState.practiceComplete ? 'Practice submitted. You can review it again or continue.' : 'Submit one complete answer to record this practice.'}</p></section>

                    <section id="notes" class="lesson-section"><p class="eyebrow">4 · NOTES / PDF</p><h4>Topic notes</h4><details open><summary>View concise notes without leaving this lesson</summary><p>${escapeHTML(topic.summary)}</p><p><strong>Workflow:</strong> ${escapeHTML(topic.workflow)}</p><p><strong>Remember:</strong> ${escapeHTML(topic.check)}</p></details><div class="tool-actions"><a class="tool-button-secondary" href="${course.pdf}" target="_blank" rel="noopener">Open course PDF</a><a class="text-action" href="${course.pdf}" download>Download PDF</a></div></section>

                    <section id="ai-teacher" class="lesson-section"><p class="eyebrow">5 · AI TEACHER</p><h4>Get help with this topic</h4><p class="tool-muted">These actions open the existing MAGIVOX AI Teacher with this course and topic already selected.</p><div class="ai-topic-actions"><a href="${lessonUrl(topicIndex, 'ask')}">Ask about this topic</a><a href="${lessonUrl(topicIndex, 'simple')}">Explain Simply</a><a href="${lessonUrl(topicIndex, 'example')}">Give Example</a><a href="${lessonUrl(topicIndex, 'telugu')}">Explain in Telugu</a><a href="${lessonUrl(topicIndex, 'quiz')}">Quiz Me</a><a href="${lessonUrl(topicIndex, 'notes')}">Create Notes</a></div></section>

                    <section id="topic-test" class="lesson-section topic-test-card ${currentState.testReady ? 'ready' : 'locked'}"><p class="eyebrow">6 · TOPIC TEST</p><h4>${currentState.passed ? 'Topic test passed' : currentState.testReady ? 'Ready for Topic Test' : 'Topic test locked'}</h4><p>${escapeHTML(currentState.reason)}</p>${bestAttempt ? `<p><strong>Best score:</strong> ${bestAttempt.score}% · ${bestAttempt.wrongCount} answers need review</p>` : ''}<a class="${currentState.testReady ? 'tool-button' : 'tool-button-secondary disabled-link'}" href="${currentState.testReady ? testUrl : '#topic-test'}" aria-disabled="${!currentState.testReady}">${currentState.passed ? 'Review or retake test' : 'Start 5-question test'}</a></section>

                    ${eligibility.finalUnlocked ? `<section class="lesson-section final-unlocked"><p class="eyebrow">COURSE MILESTONE</p><h4>Course learning complete. Final exam unlocked.</h4><p>Every lesson, practice and topic test is complete. Pass the 50-question final exam to become eligible for the certificate.</p><a class="tool-button" href="workspace.html?tool=exams&course=${encodeURIComponent(course.id)}&topic=${course.topics.length - 1}">Start 50-question final exam</a></section>` : ''}

                    <div class="lesson-navigation"><button id="previousTopic" class="tool-button-secondary" type="button" ${topicIndex === 0 ? 'disabled' : ''}>← Previous Topic</button><button id="completeLessonButton" class="tool-button-secondary" type="button" ${currentState.lessonComplete || !canCompleteLesson(record, topicIndex) ? 'disabled' : ''}>${currentState.lessonComplete ? 'Lesson complete ✓' : 'Mark lesson complete'}</button><button id="nextTopic" class="tool-button-secondary" type="button" ${topicIndex === course.topics.length - 1 || !currentState.passed ? 'disabled' : ''}>Next Topic →</button></div>
                </main>
            </div>

            <div class="learning-continue-bar"><div><small>RECOMMENDED NEXT ACTION</small><strong>${escapeHTML(recommended.label)}</strong><span>${escapeHTML(recommended.detail)}</span></div><a id="continueLearningAction" class="tool-button" href="${continueHref}">Continue Learning →</a></div>
        </section>`;

    if (window.matchMedia('(max-width: 900px)').matches) detail.querySelector('.course-outline').open = false;
    detail.querySelectorAll('[data-topic]').forEach(button => button.onclick = () => showCourse(id, false, Number(button.dataset.topic)));
    const question = () => document.getElementById('practiceDifficulty').value === 'Easy' ? `Explain ${topic.title} in your own words.` : document.getElementById('practiceDifficulty').value === 'Medium' ? `Apply this example and explain the result: ${topic.example}` : `Describe the workflow for ${topic.title} and how you would avoid this mistake: ${topic.mistake}`;
    const drawPractice = () => document.getElementById('practiceQuestion').textContent = question();
    drawPractice();
    document.getElementById('practiceDifficulty').onchange = drawPractice;
    document.getElementById('practiceHint').onclick = () => document.getElementById('practiceFeedback').textContent = `Hint: use these ideas where relevant: ${topic.keywords.slice(0, 3).join(', ')}.`;
    document.getElementById('practiceSolution').onclick = () => document.getElementById('practiceFeedback').textContent = `Reference answer: ${topic.summary} Example: ${topic.example}`;
    document.getElementById('recordPractice').onclick = async () => { const answer = document.getElementById('practiceAnswer').value; try { await changeWorkspaceState(state => recordPractice(courseRecord(state, id), topicIndex, document.getElementById('practiceDifficulty').value, answer)); showToast('Practice attempt saved.'); showCourse(id, false, topicIndex); } catch (error) { document.getElementById('practiceFeedback').textContent = error.message; } };
    document.getElementById('completeLessonButton').onclick = async () => { try { await changeWorkspaceState(state => { completeLesson(courseRecord(state, id), topicIndex); state.courseProgress[id] = Object.values(state.courseLearning[id].lessons).filter(item => item.completedAt).length; }); showToast(`Lesson completed: ${topic.title}`); showCourse(id, false, topicIndex); } catch (error) { showToast(error.message); } };
    document.getElementById('previousTopic').onclick = () => showCourse(id, false, topicIndex - 1);
    document.getElementById('nextTopic').onclick = () => showCourse(id, false, topicIndex + 1);
    void persistState().catch(() => showToast('Course opened, but progress could not be synced yet.'));
    if (scroll) detail.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderAptitude() {
    mountAptitude({
        container: toolContent,
        getAptitudeState: () => appState.aptitudePractice,
        saveAptitudeAttempt: attempt => changeWorkspaceState(state => {
            state.aptitudePractice = recordAptitudeAttempt(state.aptitudePractice, attempt);
            state.quizHistory = [...state.quizHistory, { score: attempt.score, type: 'aptitude', mode: attempt.mode, date: attempt.date }].slice(-50);
        })
    });
}

let stateSaving = false;
async function changeWorkspaceState(update, rootPatch = {}) {
    if (stateSaving) throw new Error("Another update is being saved. Please try again in a moment.");
    stateSaving = true;
    const previous = structuredClone(appState);
    try { update(appState); await recordActivity(rootPatch); }
    catch (error) { appState = previous; throw new Error("Could not save this change. Check your connection and try again."); }
    finally { stateSaving = false; }
}
async function issueCourseCertificate(courseId){
    if(!activeUser)throw new Error('Log in to issue a verifiable certificate.');
    const course=getCourse(courseId),record=courseRecord(appState,courseId);
    if(record.certificate)return record.certificate;
    const certificate=createCertificateRecord(activeUser,profileData,course,record);
    await changeWorkspaceState(state=>{courseRecord(state,courseId).certificate=certificate;});
    await publishCertificate(activeUser,certificate);
    return certificate;
}
function studioContext() {
    return {
        container: toolContent, user: activeUser, profile: profileData,
        getInterviews: () => appState.interviewSessions,
        saveInterview: session => changeWorkspaceState(state => { state.interviewSessions = [...state.interviewSessions.filter(item => !session.id || item.id !== session.id), session].slice(-20); }),
        getAssessments: () => appState.assessmentHistory,
        getCourseLearning: courseId => appState.courseLearning?.[courseId] || null,
        getCourseEligibility: courseId => { const course=getCourse(courseId); return courseEligibility(course,appState.courseLearning?.[courseId]); },
        getPassedTopics: courseId => Array.isArray(appState.passedTopics?.[courseId]) ? appState.passedTopics[courseId] : [],
        saveAssessment: async result => { await changeWorkspaceState(state => {
            state.assessmentHistory = [...state.assessmentHistory, result].slice(-100);
            state.quizHistory = [...state.quizHistory, { score: result.score, type: result.type, courseId: result.courseId, date: result.date }].slice(-50);
            recordAssessment(courseRecord(state,result.courseId),result);
            if (result.type === "topic" && result.score >= COURSE_POLICY.topicPass && Number.isInteger(result.topicIndex)) {
                const current = Array.isArray(state.passedTopics?.[result.courseId]) ? state.passedTopics[result.courseId] : [];
                state.passedTopics = { ...(state.passedTopics || {}), [result.courseId]: [...new Set([...current, result.topicIndex])].sort((a,b)=>a-b) };
            }
        }); if(result.type==='final'&&result.score>=COURSE_POLICY.finalPass&&courseEligibility(getCourse(result.courseId),appState.courseLearning?.[result.courseId]).certificateEligible&&!appState.courseLearning?.[result.courseId]?.certificate)await issueCourseCertificate(result.courseId); },
        getResumeDraft: () => appState.resumeDraft || {},
        saveResumeDraft: draft => changeWorkspaceState(state => { state.resumeDraft = { ...draft, savedAt: new Date().toISOString() }; }),
        getActivityCount: () => appState.activityCount,
        getActivityDates: () => appState.activityDates,
        getInterviewCount: () => appState.interviewSessions.length,
        getJobCount: () => appState.jobRecords.length,
        getProjects: () => appState.projects,
        saveProject: project => changeWorkspaceState(state => { const item=normalizeProject(project),existing=state.projects.findIndex(p=>p.id===item.id); if(existing>=0)state.projects=state.projects.map((p,i)=>i===existing?item:p);else{if(state.projects.length>=30)throw new Error("Project portfolio holds 30 items. Remove an old project first.");state.projects=[...state.projects,item];} }),
        removeProject: id => changeWorkspaceState(state => { state.projects = state.projects.filter(p => p.id !== id); }),
        getAptitudeState: () => appState.aptitudePractice,
        getPortfolio: () => appState.portfolio || {},
        savePortfolio: settings => changeWorkspaceState(state => { state.portfolio=normalizePortfolio(settings,profileData); }),
        getCareerRoadmap: () => appState.careerRoadmap || {},
        getCareerEvidenceState: () => appState,
        saveCareerRoadmap: async career => { await changeWorkspaceState(state => { state.careerRoadmap=normalizeCareerState(career,profileData,state.resumeDraft);state.selectedRoadmap=roleId(career.selectedRole); }, { targetRole: career.selectedRole }); updateShell(); },
        getStudyGoal: () => appState.studyGoal || {},
        saveStudyGoal: goal => changeWorkspaceState(state => { state.studyGoal = goal; }),
        issueCertificate: issueCourseCertificate,
        getJobs: () => appState.jobRecords,
        getJobEvidenceState: () => appState,
        saveJob: job => changeWorkspaceState(state => {
            const item=normalizeApplication(job),jobs=state.jobRecords.filter(j => j.id !== item.id);
            if (jobs.length >= 60) throw new Error("The tracker holds 60 jobs. Remove an old entry first.");
            state.jobRecords = [...jobs, item];
            state.savedJobs = state.jobRecords.map(j => j.id);
            state.appliedJobs = state.jobRecords.filter(j => !["Saved", "Selected", "Rejected"].includes(j.status)).map(j => j.id);
        }),
        removeJob: id => changeWorkspaceState(state => { state.jobRecords = state.jobRecords.filter(j => j.id !== id); state.savedJobs = state.savedJobs.filter(j => j !== id); state.appliedJobs = state.appliedJobs.filter(j => j !== id); }),
        getPlatformState: () => appState.platform || {},
        getPlatformEvidenceState: () => appState,
        savePlatformState: platform => changeWorkspaceState(state => { state.platform=normalizePlatformState(platform); }),
        refreshNotificationBadge: updateNotificationBadge,
        getReminders: () => appState.reminders,
        saveReminder: reminder => changeWorkspaceState(state => { if (state.reminders.length >= 20) throw new Error("Remove an old reminder first."); state.reminders.push(reminder); }),
        removeReminder: id => changeWorkspaceState(state => { state.reminders = state.reminders.filter(r => r.id !== id); })
    };
}
function renderExams() { mountAssessments(studioContext()); }
function renderInterview() { mountInterview(studioContext()); }
function renderResume() {
    toolContent.innerHTML = `<div class="resume-hub-tabs"><button id="resumeBuildTab" class="tool-button">Create My Resume</button><button id="resumeReviewTab" class="tool-button-secondary">Review My Existing Resume</button></div><div id="resumeBuildPane" class="studio"></div><div id="resumeReviewPane" class="studio" hidden></div>`;
    const buildPane = document.getElementById("resumeBuildPane"), reviewPane = document.getElementById("resumeReviewPane");
    const base = studioContext();
    mountResumeBuilder({ ...base, container: buildPane });
    document.getElementById("resumeBuildTab").onclick = () => { buildPane.hidden=false; reviewPane.hidden=true; document.getElementById("resumeBuildTab").className="tool-button"; document.getElementById("resumeReviewTab").className="tool-button-secondary"; };
    document.getElementById("resumeReviewTab").onclick = () => { buildPane.hidden=true; reviewPane.hidden=false; document.getElementById("resumeBuildTab").className="tool-button-secondary"; document.getElementById("resumeReviewTab").className="tool-button"; if (!reviewPane.dataset.mounted) { mountResume({ ...base, container: reviewPane }); reviewPane.dataset.mounted="1"; } };
}
function renderAssistant() { mountTeacher(studioContext()); }
function renderJobs() { mountJobs(studioContext()); }
function renderProgress() { mountProgress(studioContext()); }

function renderSettings() {
    const totalLessons = Object.values(appState.courseProgress).reduce((sum, value) => sum + Number(value || 0), 0);
    const latestScore = appState.quizHistory.at(-1)?.score;
    toolContent.innerHTML = `
        ${sectionHeading("PROFILE & PREFERENCES", "Account settings", activeUser ? "Your profile is stored securely in your Firebase account." : "Guest progress is stored only in this browser.")}
        <div class="settings-grid">
            <section class="tool-panel settings-card">
                <h3>Career profile</h3>
                <div class="settings-row"><span>Full name</span><strong>${escapeHTML(getDisplayName())}</strong></div>
                <div class="settings-row"><span>Email</span><strong>${escapeHTML(profileData.email || activeUser?.email || "Guest session")}</strong></div>
                <div class="settings-row"><span>Target role</span><strong>${escapeHTML(profileData.targetRole || "Not selected")}</strong></div>
                <div class="settings-row"><span>Language</span><strong>${escapeHTML(profileData.preferredLanguage || "English")}</strong></div>
                <div class="settings-row"><span>Experience</span><strong>${escapeHTML(profileData.experienceLevel || (activeUser ? "Not selected" : "Guest"))}</strong></div>
                <div class="settings-row"><span>City</span><strong>${escapeHTML(profileData.city || "Not provided")}</strong></div>
                <div class="tool-actions"><a class="tool-button-secondary" href="profile-setup.html">Edit career profile</a></div>
            </section>
            <section class="tool-panel settings-card">
                <h3>Learning preferences</h3>
                <label class="switch-control"><input id="notificationsToggle" type="checkbox" ${appState.notifications ? "checked" : ""}><span>Show learning tips on the dashboard</span></label>
                <div class="settings-row"><span>Notification center</span><a href="workspace.html?tool=library&view=notifications">Manage preferences</a></div>
                <div class="settings-row"><span>AI voice</span><strong>Managed inside AI Teacher and Interview Practice</strong></div>
                <div class="settings-row"><span>Display theme</span><strong>Light theme</strong></div>
                <div class="settings-row"><span>Lessons completed</span><strong>${totalLessons}</strong></div>
                <div class="settings-row"><span>Latest exam score</span><strong>${latestScore === undefined ? "No exam yet" : `${latestScore}%`}</strong></div>
                <div class="settings-row"><span>Tracked jobs</span><strong>${appState.savedJobs.length}</strong></div>
            </section>
            <section class="tool-panel settings-card">
                <h3>Privacy and your data</h3>
                <p class="tool-muted">Download a JSON copy of your learning progress. <a href="privacy.html">How your data is used</a></p>
                <p class="tool-muted">Your recruiter portfolio remains private unless you explicitly publish it.</p>
                <div class="tool-actions"><button id="exportData" class="tool-button-secondary" type="button">Download my data</button><a class="tool-button-secondary" href="workspace.html?tool=progress">Portfolio privacy</a></div>
            </section>
            <section class="tool-panel settings-card">
                <h3>Reset learning progress</h3>
                <p class="tool-muted">This clears course progress, exam history, interview sessions and job tracking. Your account and career profile remain.</p>
                <div class="tool-actions"><button id="resetProgress" class="tool-button-danger" type="button">Reset progress</button></div>
            </section>
            <section class="tool-panel settings-card" id="accountSecurity"></section>
            <section class="tool-panel settings-card"><h3>Account security</h3><p class="tool-muted">Firebase Authentication protects your account. Use a unique password, keep access to your recovery email, and log out on shared devices.</p><div class="tool-actions"><a class="tool-button-secondary" href="reset-password.html">Forgot/reset password support</a><button id="settingsLogout" class="tool-button-secondary" type="button">Log out on this device</button></div><p class="tool-muted">A “log out every device” control requires a secure server-side token revocation service and is not enabled in this static client.</p></section>
        </div><div id="studyReminders" style="margin-top:24px"></div>`;

    mountAccountSecurity(document.getElementById('accountSecurity'), activeUser);
    document.getElementById('settingsLogout').onclick=()=>document.getElementById('logoutButton').click();

    document.getElementById("notificationsToggle").addEventListener("change", async (event) => {
        appState.notifications = event.target.checked;
        try {
            await persistState();
            showToast("Reminder preference saved.");
        } catch (error) {
            console.error(error);
            showToast("Could not save the preference.");
        }
    });
    mountReminders(document.getElementById("studyReminders"), studioContext());
    document.getElementById("exportData").addEventListener("click", () => {
        const exportPayload = {
            exportedAt: new Date().toISOString(),
            profile: { fullName: getDisplayName(), email: profileData.email || activeUser?.email || "", targetRole: profileData.targetRole || "", preferredLanguage: profileData.preferredLanguage || "", experienceLevel: profileData.experienceLevel || "", city: profileData.city || "" },
            learning: appState
        };
        const url = URL.createObjectURL(new Blob([JSON.stringify(exportPayload, null, 2)], { type: "application/json" }));
        const link = document.createElement("a");
        link.href = url;
        link.download = "magivox-learning-data.json";
        link.click();
        URL.revokeObjectURL(url);
        showToast("Your learning data was downloaded.");
    });
    document.getElementById("resetProgress").addEventListener("click", async () => {
        if (!window.confirm("Reset all MAGIVOX learning progress? This cannot be undone.")) return;
        appState = mergeState();
        try {
            await persistState();
            renderSettings();
            showToast("Learning progress reset.");
        } catch (error) {
            console.error(error);
            showToast("Could not reset progress.");
        }
    });
}

async function bootGuest() {
    activeUser = null;
    const storedProfile = readStoredJSON("magivoxGuestProfile", null);
    profileData = storedProfile || {
        fullName: localStorage.getItem("magivoxUser") || "Guest",
        email: "",
        targetRole: "Exploring careers",
        preferredLanguage: "English",
        experienceLevel: "Guest access",
        city: ""
    };
    appState = mergeState(readStoredJSON("magivoxGuestAppState", {}));
    renderActiveTool();
}

async function bootAccount(user) {
    activeUser = user;
    try {
        const snapshot = await getDoc(doc(db, "users", user.uid));
        if (!snapshot.exists() || (snapshot.data().profileComplete !== true && snapshot.data().profileSkipped !== true)) {
            window.location.href = "profile-setup.html";
            return;
        }
        profileData = snapshot.data();
        appState = mergeState(profileData.appState || {});
        renderActiveTool();
    } catch (error) {
        console.error(error);
        toolContent.innerHTML = '<div class="empty-state"><h3>Could not load your workspace</h3><p>Please check your connection and refresh the page.</p></div>';
    }
}

function updateNotificationBadge(){const button=document.getElementById('notificationButton'),count=notificationCount(deriveNotifications(profileData,appState,appState.platform));button.dataset.count=String(count);button.setAttribute('aria-label',count?`${count} unread notifications`:'Notifications');button.classList.toggle('has-notifications',count>0);}
document.getElementById("notificationButton").addEventListener("click", () => { window.location.href = "workspace.html?tool=library&view=notifications"; });
document.getElementById('globalSearchForm')?.addEventListener('submit',event=>{event.preventDefault();const query=document.getElementById('globalSearchInput').value.trim();if(query)window.location.href=`workspace.html?tool=library&q=${encodeURIComponent(query)}`;});

if (localStorage.getItem("magivoxMode") === "guest") {
    bootGuest();
} else {
    onAuthStateChanged(auth, (user) => {
        if (user) bootAccount(user);
        else window.location.href = "login.html";
    });
}


