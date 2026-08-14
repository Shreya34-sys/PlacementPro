import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { firestoreDb } from './firebase';

export const saveUserToFirestore = async (user: {
  uid: string;
  name: string;
  email: string;
  avatarUrl?: string;
}) => {
  await setDoc(
    doc(firestoreDb, 'users', user.uid),
    {
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl || '',
      role: 'student',
      provider: 'google',
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    },
    { merge: true }
  );
};
