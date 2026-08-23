import { doc, serverTimestamp, setDoc, getDoc } from 'firebase/firestore';
import { firestoreDb } from './firebase';

export const saveUserToFirestore = async (user: {
  uid: string;
  name: string;
  email: string;
  avatarUrl?: string;
  provider?: string;
}) => {
  // Guard: Firestore may be undefined when Firebase is not configured
  if (!firestoreDb) {
    console.warn('[saveUserToFirestore] Firestore not configured — skipping user save.');
    return;
  }

  const userRef = doc(firestoreDb, 'users', user.uid);
  const userSnap = await getDoc(userRef);

  const baseData = {
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl || '',
    role: 'student',
    provider: user.provider || 'google',
    updatedAt: serverTimestamp(),
  };

  if (!userSnap.exists()) {
    await setDoc(userRef, {
      ...baseData,
      createdAt: serverTimestamp(),
      problemsSolved: 0,
      codingXp: 0,
      aptitudeScore: 0,
      interviewScore: 0,
      totalPoints: 0,
      streak: 0,
      department: 'Computer Science',
    });
  } else {
    await setDoc(userRef, baseData, { merge: true });
  }
};
