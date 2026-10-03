const fs = require('fs');
const path = require('path');

function clamp(n, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Number.isFinite(Number(n)) ? Number(n) : 0));
}

function wordCount(text) {
  return (String(text || '').trim().match(/\S+/g) || []).length;
}

function normalize(s) {
  return String(s || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function parseAcceptedAnswers(value) {
  if (value == null || value === '') return [];

  // Already an array (for callers that pass parsed data).
  if (Array.isArray(value)) return value.filter(Boolean).map(String);

  const raw = String(value).trim();
  if (!raw) return [];

  // Preferred format: JSON array, e.g. [\"ice\",\"Ice\"].
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.filter(Boolean).map(String);
    if (typeof parsed === 'string' && parsed.trim()) return [parsed.trim()];
  } catch (_) {
    // Older/admin-entered questions may contain plain text such as \"az\".
  }

  // Accept simple comma/pipe separated answers as a forgiving fallback.
  if (raw.includes(',') || raw.includes('|')) {
    return raw.split(/[,|]/).map(s => s.trim()).filter(Boolean);
  }

  // A single plain-text accepted answer is valid too.
  return [raw];
}

function exactScore(transcript, expected, acceptedAnswers) {
  const actual = normalize(transcript);
  const answers = [expected, ...(Array.isArray(acceptedAnswers) ? acceptedAnswers : [])]
    .filter(Boolean).map(normalize);
  if (!actual || !answers.length) return null;
  if (answers.includes(actual)) return 100;
  const best = answers.reduce((m, a) => {
    const aa = new Set(actual.split(' ')), bb = new Set(a.split(' '));
    const overlap = [...aa].filter(x => bb.has(x)).length;
    return Math.max(m, overlap / Math.max(aa.size, bb.size) * 100);
  }, 0);
  return clamp(best);
}

function basicSpeechScores({ transcript, durationMs, pauseCount = 0, longestPauseMs = 0 }) {
  const words = wordCount(transcript);
  const minutes = Math.max((Number(durationMs) || 0) / 60000, 0.01);
  const wpm = words / minutes;
  const fluency = clamp(100 - Math.abs(wpm - 125) * 0.65 - pauseCount * 3 - (longestPauseMs > 2500 ? 8 : 0));
  const pronunciation = clamp(78 + Math.min(words, 40) * 0.35 - pauseCount * 1.5);
  return { words, wpm, fluency, pronunciation };
}

function localLanguageScore({ transcript, expectedText }) {
  const text = String(transcript || '').trim();
  if (!text) return { grammar: 0, vocabulary: 0, coherence: 0 };
  const words = text.split(/\s+/).filter(Boolean);
  const unique = new Set(words.map(w => w.toLowerCase().replace(/[^\w]/g, ''))).size;
  const vocabulary = clamp(45 + unique / Math.max(words.length, 1) * 55);
  const sentences = text.split(/[.!?]+/).filter(Boolean).length;
  const coherence = clamp(50 + Math.min(sentences, 5) * 8 + (expectedText ? 8 : 0));
  const grammar = clamp(62 + Math.min(20, words.length * 0.5));
  return { grammar, vocabulary, coherence };
}

let cachedLlmModel = null;

async function resolveLlmModel(groq) {
  if (cachedLlmModel) return cachedLlmModel;
  const requested = process.env.VERSANT_LLM_MODEL?.trim();
  try {
    const page = await groq.models.list();
    const ids = (page?.data || []).map(m => m.id).filter(Boolean);
    const preferred = [
      requested,
      'openai/gpt-oss-120b',
      'openai/gpt-oss-20b',
      'llama-3.3-70b-versatile',
      'llama-4-scout-17b-16e-instruct'
    ].filter(Boolean);
    cachedLlmModel = preferred.find(id => ids.includes(id)) || null;
    if (cachedLlmModel) {
      console.log('[Versant] LLM grading model:', cachedLlmModel);
    } else {
      console.warn('[Versant] No compatible LLM model found in this Groq account. Using local scoring.');
    }
    return cachedLlmModel;
  } catch (e) {
    console.warn('[Versant] Could not list Groq models; using local scoring:', e.message);
    return null;
  }
}

function extractJsonObject(raw) {
  let text = String(raw || '').trim();
  text = text.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
  const first = text.indexOf('{');
  const last = text.lastIndexOf('}');
  if (first < 0 || last <= first) throw new Error('LLM returned no JSON object.');
  text = text.slice(first, last + 1);

  try { return JSON.parse(text); } catch (_) {}

  // Repair a few common model mistakes: smart quotes and trailing commas.
  const repaired = text
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/,\s*([}\]])/g, '$1');
  try { return JSON.parse(repaired); } catch (_) {}

  // If feedback contains an unescaped quote/newline, keep the numeric scores and
  // discard the damaged feedback rather than throwing away the whole LLM grade.
  const score = {};
  for (const key of ['grammar','vocabulary','coherence','pronunciation','fluency','overall']) {
    const m = repaired.match(new RegExp('"?' + key + '"?\\s*:\\s*(-?\\d+(?:\\.\\d+)?)', 'i'));
    if (m) score[key] = Number(m[1]);
  }
  if (Object.keys(score).length >= 3) {
    const feedbackMatch = repaired.match(/"feedback"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/i);
    if (feedbackMatch) score.feedback = feedbackMatch[1];
    return score;
  }

  throw new Error('LLM returned malformed JSON.');
}

function normalizeAiGrade(ai) {
  if (!ai || typeof ai !== 'object') return null;
  const keys = ['grammar','vocabulary','coherence','pronunciation','fluency','overall'];
  const out = {};
  let count = 0;
  for (const key of keys) {
    if (ai[key] !== undefined && Number.isFinite(Number(ai[key]))) {
      out[key] = clamp(ai[key]);
      count++;
    }
  }
  if (count < 3) return null;
  out.feedback = String(ai.feedback || 'Response evaluated by the communication scoring model.').slice(0, 1000);
  return out;
}

async function llmGrade({ transcript, questionText, expectedText, sectionKey }) {
  const key = process.env.GROQ_API_KEY;
  if (!key || !transcript?.trim()) return null;
  try {
    const Groq = require('groq-sdk');
    const groq = new Groq({ apiKey: key, timeout: 45000, maxRetries: 2 });
    const model = await resolveLlmModel(groq);
    if (!model) return null;

    const prompt = `You are grading an English communication assessment.\n\n` +
      `Section: ${sectionKey}\n` +
      `Question: ${questionText}\n` +
      `Expected/reference answer: ${expectedText || 'not applicable'}\n` +
      `Candidate transcript: ${transcript}\n\n` +
      `Return ONLY one valid JSON object. No markdown, no explanation.\n` +
      `Use integer scores from 0 to 100 for grammar, vocabulary, coherence, pronunciation, fluency and overall.\n` +
      `Pronunciation can only be estimated from transcript evidence; do not claim phoneme-level acoustic accuracy.\n` +
      `Keys: grammar,vocabulary,coherence,pronunciation,fluency,overall,feedback.`;

    const completion = await groq.chat.completions.create({
      model,
      temperature: 0,
      max_tokens: 800,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: 'You are a strict JSON-only grading engine. Output syntactically valid JSON.' },
        { role: 'user', content: prompt }
      ]
    });

    const raw = completion.choices?.[0]?.message?.content || '';
    return normalizeAiGrade(extractJsonObject(raw));
  } catch (e) {
    cachedLlmModel = null;
    console.warn('[Versant] LLM grading unavailable; using local scoring:', e.message);
    return null;
  }
}

async function transcribeAudio(filePath) {
  const key = process.env.GROQ_API_KEY;
  if (!key) {
    console.warn('[Versant] GROQ_API_KEY missing; continuing without STT.');
    return '';
  }

  const Groq = require('groq-sdk');
  const groq = new Groq({ apiKey: key, timeout: 60000, maxRetries: 2 });
  const model = process.env.VERSANT_STT_MODEL || 'whisper-large-v3-turbo';

  try {
    const result = await groq.audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      model,
      response_format: 'json',
      temperature: 0
    });
    return String(result?.text || '').trim();
  } catch (e) {
    // STT failure must not crash the candidate's submission. The response can
    // still receive speech/local metrics from the captured recording metadata.
    console.warn('[Versant] STT unavailable; continuing with local scoring:', e.message);
    return '';
  }
}

async function scoreResponse({ filePath, transcript, question, durationMs, pauseCount, longestPauseMs }) {
  // If the frontend already supplied a transcript, use it. Otherwise try STT,
  // but never allow a Groq timeout to abort the whole response submission.
  const text = String(transcript || '').trim() || await transcribeAudio(filePath);
  const speech = basicSpeechScores({ transcript: text, durationMs, pauseCount, longestPauseMs });
  const local = localLanguageScore({ transcript: text, expectedText: question.expected_text });
  const accepted = parseAcceptedAnswers(question.accepted_answers);
  const exact = exactScore(text, question.expected_text, accepted);

  // LLM grading is optional. If Groq JSON generation fails, local scoring is
  // still returned and the candidate can finish the test.
  const ai = text ? await llmGrade({
    transcript: text,
    questionText: question.question_text,
    expectedText: question.expected_text,
    sectionKey: question.section_key
  }) : null;

  const grammar = clamp(ai?.grammar ?? local.grammar);
  const vocabulary = clamp(ai?.vocabulary ?? local.vocabulary);
  const coherence = clamp(ai?.coherence ?? local.coherence);
  const pronunciation = clamp(ai?.pronunciation ?? speech.pronunciation);
  const fluency = clamp(ai?.fluency ?? speech.fluency);
  const sentenceMastery = exact === null ? clamp((grammar + coherence) / 2) : exact;
  const total = clamp(
    exact !== null
      ? exact * 0.45 + fluency * 0.2 + pronunciation * 0.15 + grammar * 0.1 + vocabulary * 0.1
      : fluency * 0.25 + pronunciation * 0.2 + grammar * 0.2 + vocabulary * 0.15 + coherence * 0.2
  );

  return {
    transcript: text,
    words: speech.words,
    wpm: Number(speech.wpm.toFixed(2)),
    fluency: Number(fluency.toFixed(2)),
    pronunciation: Number(pronunciation.toFixed(2)),
    grammar: Number(grammar.toFixed(2)),
    vocabulary: Number(vocabulary.toFixed(2)),
    coherence: Number(coherence.toFixed(2)),
    sentenceMastery: Number(sentenceMastery.toFixed(2)),
    exact: exact === null ? null : Number(exact.toFixed(2)),
    total: Number(total.toFixed(2)),
    feedback: ai?.feedback || (text
      ? 'Response evaluated using speech and local language metrics.'
      : 'Audio was captured, but automatic transcription was temporarily unavailable. The response was scored using available speech metrics.'),
    gradingMode: ai ? 'stt+llm' : (text ? 'stt+local' : 'audio+local')
  };
}

function cefrFromScore(score) {
  if (score >= 85) return 'C1';
  if (score >= 70) return 'B2';
  if (score >= 55) return 'B1';
  if (score >= 40) return 'A2';
  return 'A1';
}

module.exports = { transcribeAudio, scoreResponse, cefrFromScore };
