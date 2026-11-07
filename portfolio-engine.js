import { COURSES } from './course-catalog.js';
import { courseEligibility, nextCourseAction } from './course-learning-engine.js';
import { analyzeResume } from './resume-engine.js';
import { performanceAnalytics } from './aptitude-engine.js';

const clamp=n=>Math.max(0,Math.min(100,Math.round(Number(n)||0)));
const validDate=value=>{const date=new Date(value||'');return Number.isNaN(date.getTime())?'':date.toISOString();};
const latest=(items,date=x=>x?.date)=>[...(items||[])].filter(Boolean).sort((a,b)=>new Date(date(b)||0)-new Date(date(a)||0))[0]||null;
const average=values=>values.length?Math.round(values.reduce((sum,x)=>sum+Number(x||0),0)/values.length):0;
const tokens=value=>String(value||'').split(/[,|\n]+/).map(x=>x.trim()).filter(Boolean);
export function currentStreak(dates=[],now=new Date()){
  const set=new Set((dates||[]).map(x=>String(x).slice(0,10))),day=new Date(now),key=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;let count=0;
  if(!set.has(key(day))){day.setDate(day.getDate()-1);}
  for(;;){if(!set.has(key(day)))break;count++;day.setDate(day.getDate()-1);}return count;
}
export function normalizeProject(value={}){
  const safeUrl=input=>{try{const url=new URL(String(input||''));return url.protocol==='https:'?url.href:'';}catch{return'';}};
  return {id:String(value.id||'').slice(0,80),title:String(value.title||'').trim().slice(0,120),description:String(value.description||'').trim().slice(0,1600),tools:String(value.tools||'').trim().slice(0,300),role:String(value.role||'').trim().slice(0,100),course:String(value.course||'').trim().slice(0,140),screenshot:safeUrl(value.screenshot),github:safeUrl(value.github||value.url),live:safeUrl(value.live),completionDate:String(value.completionDate||value.date||'').slice(0,40),date:validDate(value.date||value.completionDate)};
}
export function normalizePortfolio(value={},profile={}){
  const raw=value&&typeof value==='object'&&!Array.isArray(value)?value:{};
  const slug=String(raw.slug||'').toLowerCase().replace(/[^a-z0-9-]/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'').slice(0,60);
  return {about:String(raw.about||'').trim().slice(0,1200),visibility:raw.visibility==='public'?'public':'private',slug,linkedin:String(raw.linkedin||profile.linkedin||'').trim().slice(0,1000),github:String(raw.github||profile.github||'').trim().slice(0,1000),resumeUrl:String(raw.resumeUrl||'').trim().slice(0,1000)};
}
const roleCourses=role=>/front|web/i.test(role)?['html','css','javascript']:/java/i.test(role)?['java','dsa','sql']:/python/i.test(role)?['python','dsa','sql']:/gis/i.test(role)?['gis','excel','sql']:/data|analyst|business/i.test(role)?['excel','sql','powerbi','tableau','python']:COURSES.slice(0,5).map(x=>x.id);
export function skillEvidence(appState={},projects=[]){
  const aliases={powerbi:['power bi','powerbi'],javascript:['javascript','java script'],html:['html'],css:['css'],sql:['sql'],python:['python'],java:['java'],tableau:['tableau'],excel:['excel'],gis:['gis']};
  return COURSES.map(course=>{const record=appState.courseLearning?.[course.id]||{},eligibility=courseEligibility(course,record),lessonRatio=eligibility.lessons/eligibility.required,testRatio=eligibility.tests/eligibility.required,final=Number(record.finalBestScore||0),haystack=projects.map(project=>`${project.course} ${project.tools}`.toLowerCase()).join(' | '),projectEvidence=(aliases[course.id]||[course.id]).some(term=>new RegExp(`(^|[^a-z])${term.replace(' ','\\s*')}([^a-z]|$)`,'i').test(haystack))?10:0,score=clamp(lessonRatio*30+testRatio*40+final*.2+projectEvidence);return{id:course.id,name:course.title.replace(/ A to Z| for Data Analysis| Programming| Development| Fundamentals/gi,'').trim(),score,level:score>=85?'Strong':score>=65?'Proficient':score>=30?'Developing':score>0?'Beginner':'No evidence',eligibility,next:nextCourseAction(course,record)};});
}
function completedProjects(projects){return projects.filter(project=>project.title&&project.description.length>=30&&project.tools&&project.completionDate);}
export function buildPortfolioEvidence({profile={},appState={}}={}){
  const projects=(appState.projects||[]).map(normalizeProject),completed=completedProjects(projects),courses=COURSES.map(course=>({course,record:appState.courseLearning?.[course.id]||{},eligibility:courseEligibility(course,appState.courseLearning?.[course.id]||{})})),skills=skillEvidence(appState,completed),relevantIds=roleCourses(profile.targetRole||''),relevantSkills=skills.filter(x=>relevantIds.includes(x.id)),activeSkills=relevantSkills.some(x=>x.score)?relevantSkills:skills.filter(x=>x.score>0),courseScore=average((activeSkills.length?activeSkills:relevantSkills).map(x=>x.eligibility.percent)),courseExams=(appState.assessmentHistory||[]).filter(x=>x.type==='final'),topicExams=(appState.assessmentHistory||[]).filter(x=>x.type==='topic'),examScore=average((courseExams.length?courseExams:topicExams).map(x=>x.score)),aptitude=performanceAnalytics(appState.aptitudePractice),aptitudeRows=appState.aptitudePractice?.questionHistory||[],aptitudeAccuracy=average(aptitudeRows.filter(x=>x.category==='Aptitude').map(x=>x.correct?100:0)),reasoningAccuracy=average(aptitudeRows.filter(x=>x.category==='Reasoning').map(x=>x.correct?100:0)),resume=analyzeResume(appState.resumeDraft||{},appState.resumeDraft?.jd||''),interviews=(appState.interviewSessions||[]).filter(x=>Number.isFinite(Number(x.score))),lastInterview=latest(interviews),projectScore=clamp(completed.length*34),skillScore=average(relevantSkills.map(x=>x.score));
  const components={courses:{score:courseScore,weight:20,label:'Course progress'},exams:{score:examScore,weight:10,label:'Topic and final exams'},aptitude:{score:average([aptitudeAccuracy,reasoningAccuracy]),weight:10,label:'Aptitude and reasoning'},resume:{score:resume.isScoreReady?resume.atsScore:0,weight:20,label:'Resume readiness'},interview:{score:Number(lastInterview?.score||0),weight:15,label:'Interview practice'},projects:{score:projectScore,weight:15,label:'Completed projects'},skills:{score:skillScore,weight:10,label:'Role skill evidence'}};
  const readiness=clamp(Object.values(components).reduce((sum,x)=>sum+x.score*x.weight/100,0)),certificates=courses.filter(x=>x.record?.certificate).map(x=>x.record.certificate),strong=skills.filter(x=>x.score>=70).sort((a,b)=>b.score-a.score).slice(0,5),weak=relevantSkills.filter(x=>x.score<60).sort((a,b)=>a.score-b.score).slice(0,5),streak=currentStreak(appState.activityDates||[]);
  let nextStep;if(!resume.isScoreReady)nextStep={label:'Complete your resume',detail:resume.scoreRequirements.find(x=>!x.complete)?.help||'Add the missing resume details.',href:'workspace.html?tool=resume'};else if(weak.length)nextStep={label:`Continue ${weak[0].name}`,detail:weak[0].next.label,href:`workspace.html?tool=skills&course=${weak[0].id}&topic=${weak[0].next.topicIndex}`};else if(!completed.length)nextStep={label:'Add one completed project',detail:'Show evidence of how you applied your skills.',href:'#portfolioProjects'};else if(!lastInterview||lastInterview.score<75)nextStep={label:'Take another interview practice',detail:'Build clearer role-specific answers.',href:'workspace.html?tool=interview'};else nextStep={label:'Keep building role evidence',detail:'Complete the next course or add a verified project.',href:'workspace.html?tool=skills'};
  return {readiness,components,courseScore,examScore,aptitudeAccuracy,reasoningAccuracy,resume,resumeSavedAt:appState.resumeDraft?.savedAt||'',lastInterview,projects,completedProjects:completed,skills,strong,weak,nextStep,certificates,streak,courses,interviews,aptitude,aptitudeState:appState.aptitudePractice||{}};
}
export function earnedBadges(evidence){
  const badges=[];const add=(id,label,reason,date)=>badges.push({id,label,reason,date:validDate(date)});
  const firstCert=evidence.certificates[0];if(firstCert)add('first-course','First Course Completed','Earned a verified MAGIVOX course certificate.',firstCert.issuedAt);
  const sql=evidence.courses.find(x=>x.course.id==='sql');if(sql?.eligibility.tests>0)add('sql-learner','SQL Learner','Passed at least one SQL topic assessment.',sql.record.topicTests?.[0]?.passedAt||sql.record.updatedAt);
  if(evidence.streak>=7)add('streak-7','7 Day Streak','Studied on seven consecutive days.',new Date().toISOString());
  if(Number(evidence.lastInterview?.score)>=75)add('interview-ready','Interview Ready','Latest completed interview score is at least 75.',evidence.lastInterview.date);
  if(evidence.resume.isScoreReady&&evidence.resume.atsScore>=75)add('resume-ready','Resume Ready','Evidence-based ATS score is at least 75.',evidence.resumeSavedAt);
  if(Number(evidence.aptitude.improvement)>=10)add('aptitude-improver','Aptitude Improver','Recent aptitude accuracy improved by at least 10 points.',evidence.aptitudeState?.attempts?.at?.(-1)?.date);
  return badges;
}
export function progressTimeline(evidence){
  const events=[];const add=(type,title,date,detail='')=>{const value=validDate(date);if(value)events.push({type,title,date:value,detail});};
  for(const {course,record} of evidence.courses){add('course',`${course.title} started`,record.startedAt);course.topics.forEach((topic,index)=>{add('topic',`${topic.title} completed`,record.lessons?.[index]?.completedAt,course.title);add('exam',`${topic.title} test passed`,record.topicTests?.[index]?.passedAt,course.title);});add('exam',`${course.title} final exam passed`,record.finalPassedAt,record.finalBestScore?`${record.finalBestScore}%`:'');if(record.certificate)add('certificate',`${course.title} certificate earned`,record.certificate.issuedAt,record.certificate.id);}
  for(const interview of evidence.interviews)add('interview','Interview practice completed',interview.date,`${interview.role||interview.mode||'Practice'} · ${interview.score}%`);
  if(evidence.resumeSavedAt)add('resume','Resume improved',evidence.resumeSavedAt,`${evidence.resume.atsScore}% ATS`);
  for(const project of evidence.projects)add('project',`${project.title} added`,project.date||project.completionDate,project.tools);
  for(const badge of earnedBadges(evidence))add('badge',`${badge.label} badge earned`,badge.date,badge.reason);
  return events.sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,80);
}
export function chartSeries(evidence){
  const aptitudeAttempts=evidence.aptitudeState?.attempts||[];
  return {interview:evidence.interviews.map(x=>({date:x.date,value:clamp(x.score)})).sort((a,b)=>new Date(a.date)-new Date(b.date)),aptitude:aptitudeAttempts.filter(x=>x.mode==='aptitude'||x.mode==='topic').map(x=>({date:x.date,value:clamp(x.accuracy)})),reasoning:aptitudeAttempts.filter(x=>x.mode==='reasoning').map(x=>({date:x.date,value:clamp(x.accuracy)})),courses:evidence.courses.filter(x=>x.eligibility.percent>0).map(x=>({label:x.course.title,value:x.eligibility.percent})),exams:(evidence.courses.flatMap(x=>x.record.finalExams||[])).map(x=>({date:x.date,value:clamp(x.score)}))};
}
export function publicPortfolioPayload({profile,portfolio,evidence}){
  const settings=normalizePortfolio(portfolio,profile),safeLink=value=>{try{const url=new URL(value);return url.protocol==='https:'?url.href:'';}catch{return'';}};
  if(settings.visibility!=='public'||!/^[a-z0-9][a-z0-9-]{1,58}[a-z0-9]$/.test(settings.slug))throw new Error('Choose Public and use a valid 3–60 character portfolio slug.');
  return {name:String(profile.fullName||'').slice(0,120),targetRole:String(profile.targetRole||'').slice(0,120),about:settings.about,skills:evidence.skills.filter(x=>x.score>0).map(x=>({name:x.name,level:x.level})).slice(0,20),projects:evidence.projects.filter(x=>x.title&&x.description).map(x=>({title:x.title,description:x.description,tools:x.tools,role:x.role,screenshot:x.screenshot,github:x.github,live:x.live,completionDate:x.completionDate})).slice(0,20),certificates:evidence.certificates.map(x=>({courseName:x.courseName,completionDate:x.completionDate,finalScore:clamp(x.finalScore),id:x.id})).slice(0,20),linkedin:safeLink(settings.linkedin),github:safeLink(settings.github),resumeUrl:safeLink(settings.resumeUrl)};
}
