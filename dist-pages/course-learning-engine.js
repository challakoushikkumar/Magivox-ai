export const COURSE_POLICY = Object.freeze({ topicPass:70, finalPass:70, practiceDifficulties:['Easy','Medium','Hard'], requiredPracticeAttempts:1, durationHoursPerTopic:4 });

const iso = value => { const date=new Date(value||''); return Number.isNaN(date.getTime())?'':date.toISOString(); };
const attempts = value => Array.isArray(value) ? value.slice(-20).filter(item=>item&&Number.isFinite(Number(item.score))).map(item=>({...item,score:Math.max(0,Math.min(100,Math.round(Number(item.score)))),date:iso(item.date)})) : [];
export function normalizeCourseLearning(value={}){
  if(!value||typeof value!=='object'||Array.isArray(value))return{};
  return Object.fromEntries(Object.entries(value).map(([courseId,raw])=>[courseId,{startedAt:iso(raw?.startedAt),updatedAt:iso(raw?.updatedAt),currentTopic:Math.max(0,Math.floor(Number(raw?.currentTopic)||0)),lessons:raw?.lessons&&typeof raw.lessons==='object'?raw.lessons:{},practices:raw?.practices&&typeof raw.practices==='object'?raw.practices:{},topicTests:raw?.topicTests&&typeof raw.topicTests==='object'?raw.topicTests:{},finalExams:attempts(raw?.finalExams),finalBestScore:Math.max(0,Math.min(100,Math.round(Number(raw?.finalBestScore)||0))),finalPassedAt:iso(raw?.finalPassedAt),certificate:raw?.certificate&&typeof raw.certificate==='object'?{...raw.certificate}:null}]));
}
export function courseRecord(state,courseId,now=new Date().toISOString()){
  state.courseLearning ||= {};
  state.courseLearning[courseId] ||= {startedAt:now,updatedAt:now,currentTopic:0,lessons:{},practices:{},topicTests:{},finalExams:[],finalBestScore:0,finalPassedAt:'',certificate:null};
  return state.courseLearning[courseId];
}
export function recordLessonOpen(record,index,now=new Date().toISOString()){record.lessons[index]={...(record.lessons[index]||{}),openedAt:record.lessons[index]?.openedAt||now};record.currentTopic=index;record.updatedAt=now;}
export function recordPractice(record,index,difficulty,response,now=new Date().toISOString()){
  const answer=String(response||'').trim();if(answer.length<8)throw new Error('Write a complete practice answer before recording the attempt.');
  const current=record.practices[index]||{attempts:[]};current.attempts=[...(current.attempts||[]),{difficulty,date:now,answered:true}].slice(-20);record.practices[index]=current;record.updatedAt=now;
}
export function canCompleteLesson(record,index){return Boolean(record.lessons[index]?.openedAt&&(record.practices[index]?.attempts||[]).some(item=>item.answered));}
export function completeLesson(record,index,now=new Date().toISOString()){if(!canCompleteLesson(record,index))throw new Error('Complete one topic practice answer before marking this lesson complete.');record.lessons[index]={...record.lessons[index],completedAt:record.lessons[index].completedAt||now};record.currentTopic=index;record.updatedAt=now;}
export function recordAssessment(record,result,policy=COURSE_POLICY){
  const item={id:String(result.id||''),score:Math.max(0,Math.min(100,Math.round(Number(result.score)||0))),date:iso(result.date)||new Date().toISOString(),seconds:Math.max(0,Math.round(Number(result.seconds)||0)),topicBreakdown:result.topicBreakdown||{},wrongCount:Math.max(0,Math.round(Number(result.wrongCount)||0))};
  if(result.type==='topic'&&Number.isInteger(result.topicIndex)){const prior=record.topicTests[result.topicIndex]||{attempts:[]};prior.attempts=[...(prior.attempts||[]),item].slice(-20);prior.bestScore=Math.max(Number(prior.bestScore)||0,item.score);if(item.score>=policy.topicPass){prior.passedAt=prior.passedAt||item.date;record.currentTopic=Math.max(Number(record.currentTopic)||0,result.topicIndex+1);}record.topicTests[result.topicIndex]=prior;}
  if(result.type==='final'){record.finalExams=[...(record.finalExams||[]),item].slice(-20);record.finalBestScore=Math.max(Number(record.finalBestScore)||0,item.score);if(item.score>=policy.finalPass)record.finalPassedAt=record.finalPassedAt||item.date;}
  record.updatedAt=item.date;return item;
}
export function courseEligibility(course,record,policy=COURSE_POLICY){
  const required=course.topics.length;
  const lessons=course.topics.filter((_,i)=>record?.lessons?.[i]?.completedAt).length;
  const practices=course.topics.filter((_,i)=>(record?.practices?.[i]?.attempts||[]).some(a=>a.answered)).length;
  const tests=course.topics.filter((_,i)=>Number(record?.topicTests?.[i]?.bestScore)>=policy.topicPass).length;
  const passedFinal=[...(record?.finalExams||[])].reverse().find(item=>item.score>=policy.finalPass)||null;
  const finalUnlocked=lessons===required&&practices===required&&tests===required;
  const certificateEligible=finalUnlocked&&Boolean(passedFinal);
  const earned=lessons+practices+tests+(passedFinal?1:0),total=required*3+1;
  return {required,lessons,practices,tests,finalUnlocked,passedFinal,certificateEligible,percent:Math.round(earned/total*100),nextTopic:course.topics.findIndex((_,i)=>!record?.lessons?.[i]?.completedAt||!(record?.practices?.[i]?.attempts||[]).some(a=>a.answered)||Number(record?.topicTests?.[i]?.bestScore)<policy.topicPass)};
}
export function topicLearningState(course,record,index,policy=COURSE_POLICY){
  const topic=course?.topics?.[index];
  if(!topic)return{label:'Locked',locked:true,reason:'This topic is unavailable.'};
  const previousPassed=index===0||Number(record?.topicTests?.[index-1]?.bestScore)>=policy.topicPass;
  const opened=Boolean(record?.lessons?.[index]?.openedAt),practiceComplete=Boolean((record?.practices?.[index]?.attempts||[]).some(item=>item.answered));
  const lessonComplete=Boolean(record?.lessons?.[index]?.completedAt),bestScore=Number(record?.topicTests?.[index]?.bestScore)||0,passed=bestScore>=policy.topicPass;
  if(!previousPassed)return{label:'Locked',locked:true,opened,practiceComplete,lessonComplete,passed,bestScore,testReady:false,reason:`Pass Topic ${index}: ${course.topics[index-1].title} to unlock this topic.`};
  if(passed)return{label:'Completed',locked:false,opened,practiceComplete,lessonComplete,passed:true,bestScore,testReady:true,reason:`Topic test passed with a best score of ${bestScore}%.`};
  if(lessonComplete&&practiceComplete)return{label:'Ready for Test',locked:false,opened,practiceComplete,lessonComplete,passed:false,bestScore,testReady:true,reason:'Lesson and practice complete. Start the 5-question topic test.'};
  if(practiceComplete)return{label:'In Progress',locked:false,opened,practiceComplete,lessonComplete:false,passed:false,bestScore,testReady:false,reason:'Practice submitted. Mark the lesson complete to unlock the topic test.'};
  if(opened)return{label:'Practice Required',locked:false,opened:true,practiceComplete:false,lessonComplete:false,passed:false,bestScore,testReady:false,reason:'Submit one practice answer, then mark the lesson complete.'};
  return{label:'Not Started',locked:false,opened:false,practiceComplete:false,lessonComplete:false,passed:false,bestScore,testReady:false,reason:'Open the lesson to begin.'};
}
export function nextCourseAction(course,record,policy=COURSE_POLICY){
  const eligibility=courseEligibility(course,record,policy);
  for(let index=0;index<course.topics.length;index++){
    const state=topicLearningState(course,record,index,policy);
    if(state.locked)continue;
    if(!state.opened)return{kind:'lesson',topicIndex:index,label:`Start ${course.topics[index].title}`,detail:'Read the lesson and example.'};
    if(!state.practiceComplete)return{kind:'practice',topicIndex:index,label:`Complete ${course.topics[index].title} practice`,detail:'Submit one practice answer.'};
    if(!state.lessonComplete)return{kind:'complete',topicIndex:index,label:`Mark ${course.topics[index].title} complete`,detail:'Confirm the lesson after practice.'};
    if(!state.passed)return{kind:'test',topicIndex:index,label:`Take the ${course.topics[index].title} topic test`,detail:`Score ${policy.topicPass}% or higher to unlock the next topic.`};
  }
  if(!eligibility.passedFinal)return{kind:'final',topicIndex:Math.max(0,course.topics.length-1),label:'Start the 50-question final exam',detail:`All topics are complete. Score ${policy.finalPass}% or higher.`};
  return{kind:'complete',topicIndex:Math.max(0,course.topics.length-1),label:'Course completed',detail:'Your certificate is eligible.'};
}
export function createCertificateRecord(user,profile,course,record,now=new Date().toISOString()){
  const eligibility=courseEligibility(course,record);if(!eligibility.certificateEligible)throw new Error('Course requirements are incomplete.');
  const id=`MX-${course.id.toUpperCase().slice(0,6)}-${crypto.randomUUID().replaceAll('-','').slice(0,16).toUpperCase()}`;
  return {id,uid:user.uid,studentName:String(profile.fullName||user.displayName||'Learner').slice(0,120),courseId:course.id,courseName:course.title,completionDate:eligibility.passedFinal.date,finalScore:eligibility.passedFinal.score,duration:`${course.topics.length*COURSE_POLICY.durationHoursPerTopic} Hours`,issuedAt:now};
}
