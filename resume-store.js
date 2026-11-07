import { app, auth } from './firebase-auth.js';
import { getFirestore, collection, doc, setDoc, getDocs, deleteDoc, query, orderBy, limit, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js';
import { normalizeResumeData } from './resume-engine.js';
const db = getFirestore(app);
function account(user) { if (!user || auth.currentUser?.uid !== user.uid) throw new Error('Log in to save or open resume versions.'); return user.uid; }
function shelf(user) { return collection(db, 'users', account(user), 'resumes'); }
export async function listResumeVersions(user) {
  const snapshot = await getDocs(query(shelf(user), orderBy('updatedAt','desc'), limit(20))); account(user);
  return snapshot.docs.map(item => ({ ...item.data().data, id:item.id, title:item.data().title || item.data().data?.title || 'Resume' }));
}
export async function saveResumeVersion(user, value) {
  if (navigator.onLine === false) throw new Error('You are offline. Reconnect before saving.');
  const data = normalizeResumeData(value), id = data.id || crypto.randomUUID(); data.id = id; data.createdAt ||= new Date().toISOString();
  await setDoc(doc(shelf(user), id), { title:data.title, data, updatedAt:serverTimestamp() }); return data;
}
export async function deleteResumeVersion(user, id) { await deleteDoc(doc(shelf(user), String(id || '').slice(0,80))); }
