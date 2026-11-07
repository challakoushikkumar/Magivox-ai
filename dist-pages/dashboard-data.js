import { app, auth } from "./firebase-auth.js";

import {
    getFirestore,
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import { COURSES, getCourse } from './course-catalog.js';
import { courseEligibility, nextCourseAction, normalizeCourseLearning } from './course-learning-engine.js';
import { careerEvidence, generateDailyPlan, normalizeCareerState, smartRecommendation } from './career-roadmap-engine.js';
import { jobsDashboard } from './job-engine.js';
import { platformDashboard, notificationCount } from './platform-engine.js';
import { performanceAnalytics } from './aptitude-engine.js';
import { analyzeResume } from './resume-engine.js';

const db = getFirestore(app);

function readGuestData() {
    let profile = {};
    let appState = {};
    try {
        profile = JSON.parse(localStorage.getItem("magivoxGuestProfile") || "{}");
        appState = JSON.parse(localStorage.getItem("magivoxGuestAppState") || "{}");
    } catch (error) {
        console.warn("Guest data could not be read:", error);
    }
    return {
        profile: {
            fullName: profile.fullName || localStorage.getItem("magivoxUser") || "Guest",
            targetRole: profile.targetRole || "Guest learner"
        },
        appState
    };
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

function setCourseProgress(id, completed, total = 5) {
    const percent = Math.round((Math.min(Number(completed || 0), total) / total) * 100);
    const text = document.getElementById(`${id}ProgressText`);
    const bar = document.getElementById(`${id}ProgressBar`);
    if (text) text.textContent = `${percent}%`;
    if (bar) bar.style.width = `${percent}%`;
}

function getWeekKey() {
    const date = new Date();
    const day = (date.getDay() + 6) % 7;
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - day);
    return date.toISOString().slice(0, 10);
}

function renderDashboard(profile, appState = {}, user = null) {
    const fullName = profile.fullName || user?.displayName || "MAGIVOX User";
    const firstName = fullName.trim().split(/\s+/)[0] || "Learner";
    const role = profile.targetRole || (user ? "Learner account" : "Guest learner");
    const photoURL = user?.photoURL || "";

    document.getElementById("welcomeName").textContent = firstName;
    document.getElementById("profileName").textContent = fullName;
    document.getElementById("accountType").textContent = role;
    updateAvatar(document.getElementById("sidebarAvatar"), firstName, photoURL);
    updateAvatar(document.getElementById("topAvatar"), firstName, photoURL);

    const progress = appState.courseProgress || {};
    const learning = normalizeCourseLearning(appState.courseLearning || {});
    const totalLessons = Object.values(learning).reduce((sum,record)=>sum+Object.values(record.lessons||{}).filter(item=>item.completedAt).length,0);
    const certificates = Object.values(learning).filter(record=>record.certificate).length;
    const interviewsList = Array.isArray(appState.interviewSessions) ? appState.interviewSessions : [];
    const interviews = interviewsList.length;
    const latestInterview=[...interviewsList].reverse().find(item=>Number.isFinite(Number(item.score)));
    const aptitude=performanceAnalytics(appState.aptitudePractice||{});
    const resume=analyzeResume(appState.resumeDraft||{});
    const applications = Array.isArray(appState.jobRecords) ? appState.jobRecords.filter(j => ["Applied", "Interview"].includes(j.status)).length : 0;
    const careerState=normalizeCareerState(appState.careerRoadmap,profile,appState.resumeDraft||{});
    const career=careerEvidence(profile,appState,careerState);
    const readiness=career.roadmapReadiness;
    const recommendation=smartRecommendation(career);
    const freshToday=generateDailyPlan(career),savedToday=careerState.dailyPlan?.date===freshToday.date?careerState.dailyPlan:freshToday;
    const nextToday=(savedToday.items||[]).find(x=>x.status==='pending')||(savedToday.items||[])[0];
    const weeklyCompleted = appState.weeklyKey === getWeekKey()
        ? Math.min(Number(appState.weeklyActivity || 0), 5)
        : 0;
    const weeklyPercent = Math.round((weeklyCompleted / 5) * 100);

    document.getElementById("lessonsCompletedValue").textContent = totalLessons;
    document.getElementById("lessonCertificateText").textContent = `${certificates} certificate${certificates===1?'':'s'} earned`;
    document.getElementById("averageScoreValue").textContent = `${aptitude.accuracy}%`;
    document.getElementById("aptitudeWeakTopicText").textContent = aptitude.attempts?`Weak topic: ${aptitude.weakTopics[0]?.topic||'No weak topic detected'}`:'No aptitude attempts yet';
    document.getElementById("interviewsPractisedValue").textContent = latestInterview?`${Number(latestInterview.score)}%`:'—';
    document.getElementById("interviewAttemptsText").textContent = `${interviews} completed practice session${interviews===1?'':'s'}`;
    document.getElementById("resumeReadinessValue").textContent = resume.isScoreReady?`${resume.atsScore}%`:'—';
    document.getElementById("resumeReadinessText").textContent = resume.isScoreReady?'ATS content score ready':`${resume.completedRequirements}/${resume.totalRequirements} essential sections complete`;
    const readinessEl = document.getElementById("jobReadinessValue"); if (readinessEl) readinessEl.textContent = `${readiness}%`;
    document.getElementById('dashboardTargetRole').textContent=career.role.role;
    document.getElementById('dashboardRoadmapStage').textContent=career.currentStage.label;
    document.getElementById('dashboardTodayPlan').textContent=nextToday?.label||'Review your completed roadmap evidence';
    document.getElementById('dashboardTodayLink').href=nextToday?.href||'workspace.html?tool=roadmaps';
    document.getElementById('dashboardRecommendation').textContent=recommendation.label;
    document.getElementById('dashboardRecommendationLink').href=recommendation.href;
    const applicationsText=document.getElementById("applicationsActiveText");if(applicationsText)applicationsText.textContent = `${applications} ${applications === 1 ? "application" : "applications"} active`;
    const jobSummary=jobsDashboard(appState.jobRecords||[],profile,appState);
    document.getElementById('dashboardSavedJobs').textContent=jobSummary.saved;
    document.getElementById('dashboardApplications').textContent=jobSummary.applications;
    document.getElementById('dashboardUpcomingInterviews').textContent=jobSummary.upcoming;
    document.getElementById('dashboardFollowUps').textContent=jobSummary.followUps;
    document.getElementById('dashboardBestJob').textContent=jobSummary.bestMatch?`${jobSummary.bestMatch.title} · ${jobSummary.bestMatch.score}%`:'Add a full job description';
    document.getElementById('dashboardJobPrep').textContent=jobSummary.recommended;
    const platform=platformDashboard(profile,appState);
    document.getElementById('recentActivityList').innerHTML=platform.activity.length?platform.activity.map(item=>`<a href="${item.href}"><span>${item.type}</span><div><strong>${item.title}</strong><small>${item.detail||new Date(item.createdAt).toLocaleDateString()}</small></div></a>`).join(''):'<div class="empty-state">Start a lesson, practice session, resume, interview, project or saved job to build your activity history.</div>';
    document.getElementById("weeklyCompleted").textContent = weeklyCompleted;
    document.getElementById("weeklyProgressBar").style.width = `${weeklyPercent}%`;
    document.getElementById("weeklyMessage").textContent = weeklyCompleted >= 5 ? "Goal complete — excellent consistency" : `${5 - weeklyCompleted} more ${5 - weeklyCompleted === 1 ? "task" : "tasks"} to complete your goal`;

    setCourseProgress("excel", Object.values(learning.excel?.lessons||{}).filter(x=>x.completedAt).length);
    setCourseProgress("sql", Object.values(learning.sql?.lessons||{}).filter(x=>x.completedAt).length);
    setCourseProgress("dsa", Object.values(learning.dsa?.lessons||{}).filter(x=>x.completedAt).length);

    const activeEntries = Object.entries(learning).filter(([id]) => getCourse(id)).sort((a,b) => new Date(b[1].updatedAt || 0) - new Date(a[1].updatedAt || 0));
    const [activeId, activeRecord] = activeEntries[0] || [COURSES[0].id, learning[COURSES[0].id] || {}];
    const activeCourse = getCourse(activeId) || COURSES[0];
    const action = nextCourseAction(activeCourse, activeRecord);
    const eligibility = courseEligibility(activeCourse, activeRecord);
    const topicIndex = Math.max(0, Math.min(activeCourse.topics.length - 1, action.topicIndex));
    document.getElementById('continueCourseTitle').textContent = activeCourse.title;
    document.getElementById('continuePosition').textContent = `Module ${topicIndex + 1} of ${activeCourse.topics.length} · ${activeCourse.topics[topicIndex].title}`;
    document.getElementById('continueProgressText').textContent = `${eligibility.percent}% complete`;
    document.getElementById('continueProgressBar').style.width = `${eligibility.percent}%`;
    document.getElementById('continueNextAction').textContent = action.label;
    document.getElementById('continueLastStudied').textContent = activeRecord.updatedAt ? `Last studied ${new Date(activeRecord.updatedAt).toLocaleDateString()}` : 'Not started yet';
    document.getElementById('continueLearningLink').href = `workspace.html?tool=skills&course=${encodeURIComponent(activeCourse.id)}&topic=${topicIndex}`;

    const notificationButton = document.querySelector(".notification-button");
    const unread=notificationCount(platform.notifications);notificationButton.dataset.count=String(unread);notificationButton.classList.toggle('has-notifications',unread>0);notificationButton.setAttribute('aria-label',unread?`${unread} unread notifications`:'Notifications');notificationButton?.addEventListener("click", () => { window.location.href = "workspace.html?tool=library&view=notifications"; });
    document.getElementById('globalSearchForm')?.addEventListener('submit',event=>{event.preventDefault();const query=document.getElementById('globalSearchInput').value.trim();if(query)window.location.href=`workspace.html?tool=library&q=${encodeURIComponent(query)}`;});
}

if (localStorage.getItem("magivoxMode") === "guest") {
    const { profile, appState } = readGuestData();
    renderDashboard(profile, appState);
} else {
    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            window.location.href = "login.html";
            return;
        }
        try {
            const snapshot = await getDoc(doc(db, "users", user.uid));
            if (!snapshot.exists() || (snapshot.data().profileComplete !== true && snapshot.data().profileSkipped !== true)) {
                window.location.href = "profile-setup.html";
                return;
            }
            const profile = snapshot.data();
            renderDashboard(profile, profile.appState || {}, user);
        } catch (error) {
            console.error("Profile loading error:", error);
            renderDashboard({ fullName: user.displayName || "MAGIVOX User", targetRole: "Learner account" }, {}, user);
            const notice = document.createElement("p");
            notice.className = "inline-message error";
            notice.setAttribute("role", "alert");
            notice.textContent = "Your saved profile and progress could not be loaded. The counters below are unavailable. Check your connection and refresh.";
            document.querySelector(".welcome-banner").before(notice);
            ["lessonsCompletedValue", "averageScoreValue", "interviewsPractisedValue", "resumeReadinessValue", "jobReadinessValue", "weeklyCompleted"].forEach(id => { const item=document.getElementById(id);if(item)item.textContent = "—"; });
        }
    });
}
