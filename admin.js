import { app,auth } from './firebase-auth.js';
import { COURSES } from './course-catalog.js';
import { getFirestore,collection,deleteDoc,doc,getDocs,limit,orderBy,query,serverTimestamp,setDoc,updateDoc } from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js';
import { getIdTokenResult,onAuthStateChanged,signOut } from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js';

const db=getFirestore(app),status=document.querySelector('#adminStatus'),appView=document.querySelector('#adminApp');
const e=v=>String(v||'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const friendly=error=>{console.error('Admin operation failed',error);return navigator.onLine===false?'Connection problem. Please check your internet and try again.':/permission|denied/i.test(`${error?.code} ${error?.message}`)?'You do not have access to this item.':'This admin operation could not be completed. Please try again.';};
let items=[];

function learningInsights(users){
 const popularity=new Map(),difficulty=new Map();
 for(const user of users)for(const [courseId,record] of Object.entries(user.appState?.courseLearning||{})){
  if(record.startedAt||record.updatedAt||Object.keys(record.lessons||{}).length)popularity.set(courseId,(popularity.get(courseId)||0)+1);
  for(const [topicIndex,result] of Object.entries(record.topicTests||{})){const score=Number(result.bestScore);if(Number.isFinite(score)){const key=`${courseId}:${topicIndex}`,current=difficulty.get(key)||{sum:0,count:0};current.sum+=score;current.count++;difficulty.set(key,current);}}
 }
 const popular=[...popularity].sort((a,b)=>b[1]-a[1])[0],difficult=[...difficulty].sort((a,b)=>a[1].sum/a[1].count-b[1].sum/b[1].count)[0];
 const popularCourse=popular?COURSES.find(x=>x.id===popular[0])?.title||popular[0]:'No course activity';
 let difficultTopic='No topic attempts';if(difficult){const [courseId,index]=difficult[0].split(':'),course=COURSES.find(x=>x.id===courseId);difficultTopic=course?.topics?.[Number(index)]?.title||`${courseId} topic ${Number(index)+1}`;}
 return{popularCourse,difficultTopic};
}

async function load(){
 status.textContent='Loading authorized platform data…';
 try{
  const [usersSnap,certSnap,ticketsSnap,featuresSnap,itemsSnap]=await Promise.all([
   getDocs(query(collection(db,'users'),limit(500))),getDocs(query(collection(db,'certificates'),limit(500))),
   getDocs(query(collection(db,'supportTickets'),orderBy('createdAt','desc'),limit(100))),getDocs(query(collection(db,'featureRequests'),orderBy('createdAt','desc'),limit(100))),
   getDocs(query(collection(db,'adminContent'),orderBy('updatedAt','desc'),limit(200)))
  ]),users=usersSnap.docs.map(x=>x.data()),now=Date.now(),active=users.filter(x=>(x.appState?.activityDates||[]).some(d=>now-new Date(d).getTime()<30*86400000)).length,
  completions=users.reduce((n,x)=>n+Object.values(x.appState?.courseLearning||{}).filter(c=>c.finalPassedAt).length,0),
  examScores=users.flatMap(x=>(x.appState?.assessmentHistory||[]).map(a=>Number(a.score)).filter(Number.isFinite)),resumeUsage=users.filter(x=>x.appState?.resumeDraft?.savedAt).length,
  interviewUsage=users.reduce((n,x)=>n+(x.appState?.interviewSessions||[]).length,0),insights=learningInsights(users);
  document.querySelector('#adminMetrics').innerHTML=[['Total users',users.length],['Active learners (30d)',active],['Course completions',completions],['Average exam',examScores.length?`${Math.round(examScores.reduce((a,b)=>a+b,0)/examScores.length)}%`:'No exams'],['Popular course',insights.popularCourse],['Difficult topic',insights.difficultTopic],['Certificates',certSnap.size],['Support tickets',ticketsSnap.size],['Resume users',resumeUsage],['Interview sessions',interviewUsage]].map(([a,b])=>`<article><small>${e(a)}</small><strong>${e(b)}</strong></article>`).join('');
  items=itemsSnap.docs.map(x=>({id:x.id,...x.data()}));drawItems();drawRequests('#adminTickets',ticketsSnap,'supportTickets');drawRequests('#adminFeatures',featuresSnap,'featureRequests');drawCertificates(certSnap);status.textContent='Admin data loaded. Results are limited for safe browser performance.';
 }catch(err){status.textContent=friendly(err);}
}
function drawRequests(selector,snapshot,collectionName){
 document.querySelector(selector).innerHTML=snapshot.empty?'<div class="empty-state">No records.</div>':snapshot.docs.map(x=>{const d=x.data();return`<article class="admin-request"><strong>${e(d.title)}</strong><span>${e(d.category)} · ${e(d.status)}</span><p>${e(d.description)}</p><div class="tool-actions"><button class="tool-button-secondary" data-request-status="${e(collectionName)}" data-request-id="${e(x.id)}" data-next-status="${d.status==='resolved'?'open':'resolved'}">${d.status==='resolved'?'Reopen':'Resolve'}</button></div></article>`;}).join('');
 document.querySelectorAll(`${selector} [data-request-status]`).forEach(button=>button.onclick=async()=>{button.disabled=true;try{await updateDoc(doc(db,button.dataset.requestStatus,button.dataset.requestId),{status:button.dataset.nextStatus});await load();}catch(err){status.textContent=friendly(err);button.disabled=false;}});
}
function drawCertificates(snapshot){const target=document.querySelector('#adminCertificates');target.innerHTML=snapshot.empty?'<div class="empty-state">No certificates generated.</div>':snapshot.docs.slice(0,50).map(x=>{const d=x.data();return`<article class="admin-request"><strong>${e(d.courseName)}</strong><span>${e(x.id)} · ${e(d.finalScore)}%</span><p>${e(d.studentName)} · ${e(d.completionDate)}</p></article>`;}).join('');}
function drawItems(){document.querySelector('#adminItems').innerHTML=items.length?items.map(x=>`<article class="admin-item"><div><span>${e(x.type)} · ${e(x.status)}</span><strong>${e(x.title)}</strong></div><div class="tool-actions"><button data-edit-admin="${e(x.id)}" class="tool-button-secondary">Edit</button><button data-delete-admin="${e(x.id)}" class="text-danger">Delete</button></div></article>`).join(''):'<div class="empty-state">No admin content records yet.</div>';document.querySelectorAll('[data-edit-admin]').forEach(b=>b.onclick=()=>edit(items.find(x=>x.id===b.dataset.editAdmin)));document.querySelectorAll('[data-delete-admin]').forEach(b=>b.onclick=async()=>{if(!confirm('Delete this admin content record?'))return;try{await deleteDoc(doc(db,'adminContent',b.dataset.deleteAdmin));await load();}catch(err){status.textContent=friendly(err);}});}
function edit(item={}){const form=document.querySelector('#adminItemForm');form.hidden=false;for(const field of ['id','type','title','status','content'])if(form.elements[field])form.elements[field].value=item[field]||'';form.scrollIntoView({behavior:'smooth'});}
document.querySelector('#newAdminItem').onclick=()=>edit();
document.querySelector('#cancelAdminItem').onclick=()=>document.querySelector('#adminItemForm').hidden=true;
document.querySelector('#adminItemForm').onsubmit=async ev=>{ev.preventDefault();const data=Object.fromEntries(new FormData(ev.currentTarget).entries()),recordId=data.id||crypto.randomUUID();try{await setDoc(doc(db,'adminContent',recordId),{type:data.type,title:data.title.trim(),status:data.status,content:data.content.trim(),updatedAt:serverTimestamp()});ev.currentTarget.reset();ev.currentTarget.hidden=true;await load();}catch(err){status.textContent=friendly(err);}};
document.querySelector('#adminLogout').onclick=async()=>{await signOut(auth);location.href='login.html';};
onAuthStateChanged(auth,async user=>{if(!user){status.textContent='Sign in with an authorized administrator account.';return;}try{const token=await getIdTokenResult(user,true);if(token.claims.admin!==true){status.textContent='You do not have access to this item.';return;}appView.hidden=false;await load();}catch(err){status.textContent=friendly(err);}});
