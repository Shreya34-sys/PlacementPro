import { doc, serverTimestamp, setDoc, getDoc } from 'firebase/firestore';
import { firestoreDb } from './firebase';

export const saveUserToFirestore = async (user: {
  uid: string;
  name: string;
  email: string;
  avatarUrl?: string;
  provider?: string;
}) => {
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
    // New user, set defaults
    await setDoc(userRef, {
      ...baseData,
      createdAt: serverTimestamp(),
      problemsSolved: 0,
      codingXp: 0,
      aptitudeScore: 0,
      interviewScore: 0,
      totalPoints: 0,
      department: 'Computer Science', // default department for now
    });
  } else {
    // Existing user, merge updates
    await setDoc(userRef, baseData, { merge: true });
  }
};
