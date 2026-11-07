import { app, auth } from './firebase-auth.js';
import { getFirestore, doc, getDoc, setDoc, deleteDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js';

const db=getFirestore(app);
const refFor=slug=>doc(db,'publicPortfolios',String(slug||''));
export async function publishPublicPortfolio(slug,payload){
  if(!auth.currentUser)throw new Error('Log in to publish a recruiter portfolio.');
  await setDoc(refFor(slug),{...payload,publishedAt:serverTimestamp()});
}
export async function unpublishPublicPortfolio(slug){
  if(!auth.currentUser)throw new Error('Log in to change portfolio visibility.');
  if(slug)await deleteDoc(refFor(slug));
}
export async function getPublicPortfolio(slug){
  const snapshot=await getDoc(refFor(slug));
  return snapshot.exists()?snapshot.data():null;
}
