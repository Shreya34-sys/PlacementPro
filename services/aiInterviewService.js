const Groq = require('groq-sdk');
const fs = require('fs');
const os = require('os');
const path = require('path');

// Initialize Groq client safely
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || 'missing_groq_api_key'
});

// Standard HR Interview Stage Definitions
const HR_TOPICS = [
  {
    topic: 'Self-Introduction',
    category: 'hr',
    title: 'Candidate Introduction & Background',
    defaultPrompt: 'Tell me about yourself, your educational journey, and what drives your passion in this field.'
  },
  {
    topic: 'Projects & Technical Experience',
    category: 'technical',
    title: 'Key Project & Problem Solving',
    defaultPrompt: 'Could you walk me through your most impactful project? What challenges did you encounter and how did you resolve them?'
  },
  {
    topic: 'Strengths & Weaknesses',
    category: 'hr',
    title: 'Self-Awareness & Growth Mindset',
    defaultPrompt: 'What would you consider your greatest professional strength, and what is one area you are actively working to improve?'
  },
  {
    topic: 'Teamwork & Collaboration',
    category: 'behavioral',
    title: 'Collaboration in Diverse Teams',
    defaultPrompt: 'Tell me about a time you worked in a team with differing opinions or technical disagreements. How did you handle it?'
  },
  {
    topic: 'Conflict Handling & Pressure',
    category: 'behavioral',
    title: 'Handling Tight Deadlines & Adversity',
    defaultPrompt: 'Describe a situation where you faced a tight deadline or high pressure. How did you prioritize your tasks to deliver successfully?'
  },
  {
    topic: 'Career Goals & Vision',
    category: 'hr',
    title: 'Long-term Aspirations & Culture Fit',
    defaultPrompt: 'Where do you see yourself in the next 3 to 5 years, and how do you plan to achieve those career goals?'
  },
  {
    topic: 'Behavioral & Situational (STAR)',
    category: 'behavioral',
    title: 'Learning from Setbacks',
    defaultPrompt: 'Can you share a time when a project or plan did not go as expected? What happened, what was your role, and what did you learn?'
  }
];

/**
 * Generate a dynamic conversational response and next question.
 * The AI responds naturally with an acknowledgement of the student's answer,
 * followed by a relevant follow-up or transition to the next topic.
 */
async function generateNextQuestion({ conversationHistory = [], studentAnswer = '', currentTopicIndex = 0, studentName = 'Candidate' }) {
  const nextTopicIndex = currentTopicIndex + 1;
  const isFinalQuestion = nextTopicIndex >= HR_TOPICS.length;
  const targetTopic = HR_TOPICS[Math.min(nextTopicIndex, HR_TOPICS.length - 1)];

  const systemPrompt = `You are Sarah, a warm, professional, and experienced HR Director conducting an interactive job placement interview with an engineering college student named ${studentName}.

Your goal is to make the candidate feel like they are speaking to a real, empathetic, and attentive human interviewer, NOT a cold computer script.

Guidelines for your response:
1. ACKNOWLEDGE THE ANSWER: Start with 1-2 concise, conversational sentences acknowledging what the candidate just said. Pick up on specific details from their answer (e.g., their tech stack, teamwork experience, or personal reflection). Be positive and encouraging.
2. ASK THE NEXT QUESTION:
   - Topic for this turn: "${targetTopic.topic}" (${targetTopic.title}).
   - You may ask a tailored question based on what they just shared or smoothly transition into the new topic: "${targetTopic.defaultPrompt}".
   - Keep the question clear, engaging, and spoken in a natural conversational rhythm suitable for Text-to-Speech (TTS).
3. Do NOT ask multiple questions in a single response. Ask only ONE clear question.
4. Output your response in valid JSON with this exact structure (use ONLY standard ASCII straight double quotes ", NEVER curly or typographical quotes):
{
  "acknowledgement": "1-2 sentences acknowledging the candidate's previous response with warmth and active listening.",
  "questionText": "The single clear question you are asking aloud.",
  "topic": "${targetTopic.topic}",
  "speechText": "The combined text to be spoken aloud: acknowledgement + pause + questionText."
}`;

  const messages = [
    { role: 'system', content: systemPrompt }
  ];

  // Include recent conversation turns for context
  conversationHistory.slice(-6).forEach(turn => {
    if (turn.role === 'interviewer') {
      messages.push({ role: 'assistant', content: turn.text });
    } else if (turn.role === 'student') {
      messages.push({ role: 'user', content: turn.text });
    }
  });

  messages.push({
    role: 'user',
    content: `Candidate's answer to previous question: "${studentAnswer}". Current topic index: ${currentTopicIndex}. Generate the acknowledgement and next question.`
  });

  try {
    const response = await groq.chat.completions.create({
      model: 'openai/gpt-oss-20b',
      messages,
      temperature: 0.7,
      max_tokens: 1200,
      response_format: { type: 'json_object' }
    }, { timeout: 10000 });

    const parsed = JSON.parse(response.choices[0].message.content);
    return {
      acknowledgement: parsed.acknowledgement || 'Thank you for sharing that.',
      questionText: parsed.questionText || targetTopic.defaultPrompt,
      speechText: parsed.speechText || `${parsed.acknowledgement || 'Thank you for sharing.'} ${parsed.questionText || targetTopic.defaultPrompt}`,
      topic: targetTopic.topic,
      topicIndex: nextTopicIndex,
      isFinalQuestion
    };
  } catch (error) {
    console.warn('Groq AI next question generation fallback:', error.message);
    if (error?.error?.failed_generation) {
      try {
        const cleaned = error.error.failed_generation.replace(/[“”]/g, '"');
        const parsed = JSON.parse(cleaned);
        if (parsed.questionText || parsed.acknowledgement) {
          return {
            acknowledgement: parsed.acknowledgement || 'Thank you for sharing that.',
            questionText: parsed.questionText || targetTopic.defaultPrompt,
            speechText: parsed.speechText || `${parsed.acknowledgement || 'Thank you.'} ${parsed.questionText || targetTopic.defaultPrompt}`,
            topic: targetTopic.topic,
            topicIndex: nextTopicIndex,
            isFinalQuestion
          };
        }
      } catch (e) {}
    }
    // Graceful fallback with warm, pre-crafted HR responses
    const acknowledgement = studentAnswer.length > 30
      ? 'Thank you for sharing that perspective with me.'
      : 'Understood, thank you.';
    const questionText = targetTopic.defaultPrompt;
    return {
      acknowledgement,
      questionText,
      speechText: `${acknowledgement} ${questionText}`,
      topic: targetTopic.topic,
      topicIndex: nextTopicIndex,
      isFinalQuestion
    };
  }
}

/**
 * Generate comprehensive AI feedback on communication, confidence,
 * relevance, clarity, and answer structure with actionable suggestions.
 */
async function generateComprehensiveFeedback({ conversationHistory = [], studentName = 'Candidate' }) {
  const systemPrompt = `You are an expert HR Interview Evaluation Specialist and Senior Recruiter evaluating a placement candidate named ${studentName}.

Evaluate the student's entire interview performance objectively based on their actual spoken answers across these 5 dimensions:
1. Communication (0-100): Articulation, appropriate vocabulary, professional phrasing, fluency.
2. Confidence (0-100): Directness, tone, conviction, absence of excessive hedging.
3. Relevance (0-100): Direct alignment with HR prompts, concrete details rather than generic cliches.
4. Clarity (0-100): Conciseness, avoiding rambling, logical idea flow.
5. Answer Structure (0-100): Effective organization, structured storytelling (e.g., STAR method: Situation, Task, Action, Result).

You must output valid JSON matching this schema:
{
  "overallScore": number (0-100),
  "scores": {
    "communication": number (0-100),
    "confidence": number (0-100),
    "relevance": number (0-100),
    "clarity": number (0-100),
    "answerStructure": number (0-100)
  },
  "executiveSummary": "A 2-3 sentence overall assessment of the candidate's interview readiness.",
  "strengths": [
    "Specific strength 1 with citation or detail from their responses",
    "Specific strength 2 with citation or detail from their responses",
    "Specific strength 3"
  ],
  "areasForImprovement": [
    "Actionable improvement tip 1 (e.g., using STAR structure for behavioral questions)",
    "Actionable improvement tip 2 (e.g., elaborating more on technical impact/metrics)",
    "Actionable improvement tip 3"
  ],
  "detailedFeedback": {
    "communication": "Detailed paragraph on verbal communication and delivery.",
    "confidence": "Detailed paragraph on presence and conviction.",
    "relevance": "Detailed paragraph on addressing interview questions directly.",
    "clarity": "Detailed paragraph on structure and precision.",
    "answerStructure": "Detailed paragraph on narrative structure and examples."
  }
}
CRITICAL REQUIREMENT: Use ONLY standard straight ASCII double quotes (") for all JSON strings. NEVER use typographical or curly quotes (“ or ”).`;

  const transcriptText = conversationHistory.map((turn, i) =>
    `${turn.role.toUpperCase()}: ${turn.text}`
  ).join('\n\n');

  try {
    const response = await groq.chat.completions.create({
      model: 'openai/gpt-oss-20b',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Here is the complete interview transcript:\n\n${transcriptText}\n\nGenerate the comprehensive evaluation report in JSON.` }
      ],
      temperature: 0.5,
      max_tokens: 2500,
      response_format: { type: 'json_object' }
    }, { timeout: 15000 });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.warn('Groq AI feedback generation fallback:', error.message);
    if (error?.error?.failed_generation) {
      try {
        const cleaned = error.error.failed_generation.replace(/[“”]/g, '"');
        const parsed = JSON.parse(cleaned);
        if (parsed.overallScore && parsed.scores) return parsed;
      } catch (e) {}
    }
    // Calculated heuristic fallback
    const totalWords = conversationHistory
      .filter(t => t.role === 'student')
      .reduce((acc, t) => acc + (t.text ? t.text.split(/\s+/).length : 0), 0);
    const avgWords = Math.max(10, Math.round(totalWords / Math.max(1, conversationHistory.length / 2)));
    const scoreBase = Math.min(88, Math.max(65, 60 + Math.round(avgWords / 2)));

    return {
      overallScore: scoreBase,
      scores: {
        communication: Math.min(92, scoreBase + 2),
        confidence: scoreBase,
        relevance: Math.min(95, scoreBase + 3),
        clarity: Math.max(60, scoreBase - 3),
        answerStructure: Math.max(60, scoreBase - 2)
      },
      executiveSummary: `${studentName} demonstrated good general understanding and communicated their background in a clear, polite manner. With more structured examples (such as the STAR framework), their interview performance will be even more compelling.`,
      strengths: [
        'Clear and polite vocal articulation throughout the interview.',
        'Willingness to share personal experiences and project backgrounds.',
        'Positive attitude toward collaborative teamwork and learning.'
      ],
      areasForImprovement: [
        'Use the STAR method (Situation, Task, Action, Result) when describing past projects and conflicts.',
        'Quantify achievements where possible (e.g., performance gains, user counts, turnaround time).',
        'Elaborate more deeply on your personal contributions versus general team efforts.'
      ],
      detailedFeedback: {
        communication: 'Spoke clearly with understandable pacing. Continued practice will enhance professional vocabulary.',
        confidence: 'Maintained composure and answered prompts without prolonged hesitations.',
        relevance: 'Addressed the core intent of each interview question directly.',
        clarity: 'Key ideas were expressed well, though some answers could be more concisely summarized.',
        answerStructure: 'Structure was conversational; organizing answers into beginning, middle, and result will maximize impact.'
      }
    };
  }
}

/**
 * Transcribe audio using Groq Whisper (whisper-large-v3-turbo)
 * Used as a server-side fallback if client-side Web Speech recognition fails.
 */
async function transcribeAudio(audioBuffer, mimeType = 'audio/webm') {
  const extension = mimeType.includes('ogg') ? 'ogg' : mimeType.includes('wav') ? 'wav' : 'webm';
  const tempPath = path.join(os.tmpdir(), `ai-interview-${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`);

  try {
    fs.writeFileSync(tempPath, audioBuffer);
    const transcription = await groq.audio.transcriptions.create({
      file: fs.createReadStream(tempPath),
      model: 'whisper-large-v3-turbo',
      language: 'en',
      response_format: 'json'
    });
    return transcription.text || '';
  } catch (err) {
    console.error('Groq Whisper transcription error:', err.message);
    return '';
  } finally {
    try {
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    } catch {}
  }
}

module.exports = {
  HR_TOPICS,
  generateNextQuestion,
  generateComprehensiveFeedback,
  transcribeAudio
};
