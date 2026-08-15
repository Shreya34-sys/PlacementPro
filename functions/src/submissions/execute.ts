import * as admin from 'firebase-admin';
import { Request, Response } from 'express';

export const submitSolutionLogic = async (req: Request, res: Response) => {
  const db = admin.firestore();
  const { userId, problemId, language, code } = req.body;

  if (!userId || !problemId || !language || !code) {
    res.status(400).json({ error: 'Missing required parameters: userId, problemId, language, code' });
    return;
  }

  try {
    // 1. Fetch problem metadata to confirm existence
    const problemRef = db.collection('problems').doc(problemId);
    const problemSnap = await problemRef.get();
    
    if (!problemSnap.exists) {
      res.status(404).json({ error: 'Problem not found' });
      return;
    }

    // 2. Perform mock code compilation and evaluation
    // Simple verification check to make it realistic
    let status: 'Accepted' | 'Wrong Answer' | 'Compilation Error' | 'Runtime Error' = 'Accepted';
    let errorMessage: string | undefined;
    let runtime = Math.floor(Math.random() * 80) + 10; // 10ms - 90ms
    let memory = Math.floor(Math.random() * 2000) + 1000; // 1000KB - 3000KB

    const lowerCode = code.toLowerCase();

    // Simulation of compile error
    if (lowerCode.includes('syntaxerror') || lowerCode.includes('compile_error')) {
      status = 'Compilation Error';
      errorMessage = 'Compilation Failed: line 5: expected ";" before token "return"';
    } 
    // Simulation of runtime error
    else if (lowerCode.includes('runtimeerror') || lowerCode.includes('nullpointer')) {
      status = 'Runtime Error';
      errorMessage = 'Runtime Exception: Segment Fault / Core Dumped (std::out_of_range)';
    }
    // Simulation of Wrong Answer
    else if (lowerCode.includes('wronganswer') || code.length < 30) {
      status = 'Wrong Answer';
      errorMessage = 'Wrong Answer on Test Case #4: Output mismatch. Expected: YES, Got: NO';
    }
    // Watermelon problem check logic simulation
    else if (problemId === 'codeforces_4_A') {
      const isWatermelonCorrect = 
        (lowerCode.includes('% 2') || lowerCode.includes('modulo')) && 
        (lowerCode.includes('> 2') || lowerCode.includes('>2') || lowerCode.includes('!= 2') || lowerCode.includes('!=2'));
        
      if (!isWatermelonCorrect) {
        status = 'Wrong Answer';
        errorMessage = 'Wrong Answer on Test Case #3: Failed input w = 2. Output was YES, expected NO.';
      }
    }

    // 3. Create submission document
    const submissionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const submissionRef = db.collection('submissions').doc(submissionId);
    
    const submissionData = {
      userId,
      problemId,
      language,
      status,
      runtime,
      memory,
      code,
      errorMessage,
      submittedAt: new Date().toISOString(),
    };

    await submissionRef.set(submissionData);

    // 4. Update user progress document
    const progressRef = db.collection('userProgress').doc(userId).collection('problems').doc(problemId);
    const progressSnap = await progressRef.get();
    
    let isAlreadySolved = false;
    let attempts = 0;

    if (progressSnap.exists) {
      const data = progressSnap.data();
      isAlreadySolved = data?.solved || false;
      attempts = data?.attempts || 0;
    }

    attempts += 1;

    const progressData = {
      problemId,
      solved: isAlreadySolved || (status === 'Accepted'),
      attempts,
      bestRuntime: status === 'Accepted' 
        ? Math.min(runtime, progressSnap.data()?.bestRuntime || 999999) 
        : (progressSnap.data()?.bestRuntime || null),
      lastSubmittedAt: admin.firestore.FieldValue.serverTimestamp(),
      language,
    };

    await progressRef.set(progressData, { merge: true });

    // 5. If accepted and not solved before, update User Profile metrics (XP, solved count, streak)
    if (status === 'Accepted' && !isAlreadySolved) {
      const userRef = db.collection('users').doc(userId);
      await db.runTransaction(async (transaction) => {
        const userSnap = await transaction.get(userRef);
        if (userSnap.exists) {
          const userData = userSnap.data();
          const currentXp = userData?.codingXp || 0;
          const currentSolved = userData?.problemsSolved || 0;
          const currentStreak = userData?.streak || 0;

          transaction.update(userRef, {
            codingXp: currentXp + 100, // +100 XP per solved problem
            problemsSolved: currentSolved + 1,
            streak: currentStreak === 0 ? 1 : currentStreak, // Init streak if 0
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        } else {
          // If profile doc doesn't exist, create it
          transaction.set(userRef, {
            codingXp: 100,
            problemsSolved: 1,
            streak: 1,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          }, { merge: true });
        }
      });
    }

    res.status(200).json({
      success: true,
      submission: {
        id: submissionId,
        ...submissionData
      }
    });

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('Error executing submission:', errorMsg);
    res.status(500).json({ error: errorMsg });
  }
};
