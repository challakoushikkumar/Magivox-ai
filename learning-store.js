import { app, auth } from './firebase-auth.js';
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, deleteDoc, query, orderBy, limit, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js';
const db = getFirestore(app);
function account(user) {
  if (!user || auth.currentUser?.uid !== user.uid) throw new Error('Log in to save or open your account data.');
  return user.uid;
}
function shelf(user, kind) {
  if (!['teacherChats', 'teacherNotes'].includes(kind)) throw new Error('Unknown collection.');
  return collection(db, 'users', account(user), kind);
}
export async function listLearningItems(user, kind) {
  const snapshot = await getDocs(query(shelf(user, kind), orderBy('updatedAt', 'desc'), limit(12)));
  account(user);
  return snapshot.docs.map(item => ({ ...item.data(), id: item.id }));
}
export async function saveLearningItem(user, kind, item, id = crypto.randomUUID()) {
  if (navigator.onLine === false) throw new Error('You are offline. Reconnect before saving.');
  await setDoc(doc(shelf(user, kind), id), { ...item, updatedAt: serverTimestamp() });
  return id;
}
export async function deleteLearningItem(user, kind, id) { await deleteDoc(doc(shelf(user, kind), id)); }
export async function submitSupport(user, value, id) {
  const uid = account(user);
  if (navigator.onLine === false) throw new Error('You are offline. Reconnect before submitting.');
  const target = value.kind === 'feature' ? 'featureRequests' : 'supportTickets';
  await setDoc(doc(db, target, id), { ...value, uid, status: 'open', createdAt: serverTimestamp() });
  return id;
}
export async function publishCertificate(user,value){
  account(user);const id=String(value?.id||'').toUpperCase();if(!/^MX-[A-Z0-9]{1,6}-[A-Z0-9]{16}$/.test(id))throw new Error('Invalid certificate ID.');
  const publicRecord={studentName:String(value.studentName||'').slice(0,120),courseId:String(value.courseId||'').slice(0,80),courseName:String(value.courseName||'').slice(0,160),completionDate:String(value.completionDate||''),finalScore:Math.round(Number(value.finalScore)),duration:String(value.duration||'').slice(0,40),issuedAt:String(value.issuedAt||'')};
  await setDoc(doc(db,'certificates',id),publicRecord);return{id,...publicRecord};
}
export async function verifyCertificate(id){
  const normalized=String(id||'').trim().toUpperCase();if(!/^MX-[A-Z0-9]{1,6}-[A-Z0-9]{16}$/.test(normalized))return null;
  const snapshot=await getDoc(doc(db,'certificates',normalized));if(!snapshot.exists())return null;const value=snapshot.data();return{id:normalized,studentName:String(value.studentName||''),courseName:String(value.courseName||''),completionDate:String(value.completionDate||'')};
}
