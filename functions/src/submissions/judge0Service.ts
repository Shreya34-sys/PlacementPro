import axios from 'axios';

export type JudgeStatus =
  | 'Accepted'
  | 'Wrong Answer'
  | 'Compilation Error'
  | 'Runtime Error'
  | 'Time Limit Exceeded'
  | 'Memory Limit Exceeded'
  | 'Internal Error';

export interface JudgeLanguage {
  id: number;
  name: string;
  key: string;
  monacoLanguage: string;
}

export interface JudgeExecutionResult {
  status: JudgeStatus;
  stdout: string;
  stderr?: string;
  compileOutput?: string;
  runtime: number;
  memory: number;
}

const FALLBACK_LANGUAGES: JudgeLanguage[] = [
  { id: 50, name: 'C', key: 'c', monacoLanguage: 'c' },
  { id: 54, name: 'C++ 17', key: 'cpp', monacoLanguage: 'cpp' },
  { id: 62, name: 'Java', key: 'java', monacoLanguage: 'java' },
  { id: 71, name: 'Python 3', key: 'python', monacoLanguage: 'python' },
  { id: 63, name: 'JavaScript', key: 'javascript', monacoLanguage: 'javascript' },
  { id: 74, name: 'TypeScript', key: 'typescript', monacoLanguage: 'typescript' },
  { id: 51, name: 'C#', key: 'csharp', monacoLanguage: 'csharp' },
  { id: 60, name: 'Go', key: 'go', monacoLanguage: 'go' },
  { id: 73, name: 'Rust', key: 'rust', monacoLanguage: 'rust' },
  { id: 78, name: 'Kotlin', key: 'kotlin', monacoLanguage: 'kotlin' },
  { id: 68, name: 'PHP', key: 'php', monacoLanguage: 'php' },
  { id: 72, name: 'Ruby', key: 'ruby', monacoLanguage: 'ruby' },
  { id: 83, name: 'Swift', key: 'swift', monacoLanguage: 'swift' },
];

const JUDGE0_API_URL = process.env.JUDGE0_API_URL;
const JUDGE0_API_KEY = process.env.JUDGE0_API_KEY;

export const getLanguages = async (): Promise<JudgeLanguage[]> => {
  if (!JUDGE0_API_URL) return FALLBACK_LANGUAGES;

  try {
    const response = await axios.get(`${JUDGE0_API_URL}/languages`, {
      headers: buildHeaders(),
      timeout: 10000,
    });

    if (!Array.isArray(response.data)) return FALLBACK_LANGUAGES;

    return response.data.map((language: { id: number; name: string }) => ({
      id: language.id,
      name: language.name,
      key: mapLanguageKey(language.name),
      monacoLanguage: mapMonacoLanguage(language.name),
    }));
  } catch (error) {
    console.warn('Judge0 languages unavailable, using fallback list:', error);
    return FALLBACK_LANGUAGES;
  }
};

export const getLanguageId = (languageKey: string, explicitLanguageId?: number): number => {
  if (explicitLanguageId) return explicitLanguageId;
  return FALLBACK_LANGUAGES.find((language) => language.key === languageKey)?.id || 54;
};

export const executeCode = async (
  sourceCode: string,
  languageKey: string,
  stdin: string,
  expectedOutput: string,
  explicitLanguageId?: number
): Promise<JudgeExecutionResult> => {
  if (!JUDGE0_API_URL) {
    return simulateExecution(sourceCode, stdin, expectedOutput);
  }

  const languageId = getLanguageId(languageKey, explicitLanguageId);
  const response = await axios.post(
    `${JUDGE0_API_URL}/submissions?base64_encoded=false&wait=true`,
    {
      source_code: sourceCode,
      language_id: languageId,
      stdin,
      expected_output: expectedOutput,
      cpu_time_limit: 2,
      memory_limit: 128000,
    },
    {
      headers: buildHeaders(),
      timeout: 30000,
    }
  );

  const status = mapJudgeStatus(response.data?.status?.description);

  return {
    status,
    stdout: response.data?.stdout || '',
    stderr: response.data?.stderr || undefined,
    compileOutput: response.data?.compile_output || undefined,
    runtime: Math.round(Number(response.data?.time || 0) * 1000),
    memory: Number(response.data?.memory || 0),
  };
};

const buildHeaders = () => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (JUDGE0_API_KEY) headers['X-Auth-Token'] = JUDGE0_API_KEY;
  return headers;
};

const mapJudgeStatus = (description?: string): JudgeStatus => {
  switch (description) {
    case 'Accepted':
      return 'Accepted';
    case 'Wrong Answer':
      return 'Wrong Answer';
    case 'Compilation Error':
      return 'Compilation Error';
    case 'Time Limit Exceeded':
      return 'Time Limit Exceeded';
    case 'Memory Limit Exceeded':
      return 'Memory Limit Exceeded';
    case 'Runtime Error (NZEC)':
    case 'Runtime Error (SIGSEGV)':
    case 'Runtime Error (SIGXFSZ)':
    case 'Runtime Error (SIGFPE)':
    case 'Runtime Error (SIGABRT)':
      return 'Runtime Error';
    default:
      return 'Internal Error';
  }
};

const simulateExecution = (sourceCode: string, stdin: string, expectedOutput: string): JudgeExecutionResult => {
  const lowerCode = sourceCode.toLowerCase();
  if (lowerCode.includes('syntaxerror') || lowerCode.includes('compile_error')) {
    return {
      status: 'Compilation Error',
      stdout: '',
      compileOutput: 'Compilation failed in development mode.',
      runtime: 0,
      memory: 0,
    };
  }

  if (lowerCode.includes('runtimeerror') || lowerCode.includes('nullpointer')) {
    return {
      status: 'Runtime Error',
      stdout: '',
      stderr: 'Runtime error triggered in development mode.',
      runtime: 12,
      memory: 1024,
    };
  }

  const output = lowerCode.includes('wronganswer') ? 'wrong answer' : expectedOutput;
  return {
    status: normalizeOutput(output) === normalizeOutput(expectedOutput) ? 'Accepted' : 'Wrong Answer',
    stdout: output,
    runtime: Math.floor(Math.random() * 80) + 10,
    memory: Math.floor(Math.random() * 2000) + 1000,
  };
};

export const normalizeOutput = (value: string) => value.replace(/\r\n/g, '\n').trim();

const mapLanguageKey = (name: string) => {
  const normalized = name.toLowerCase();
  if (normalized.includes('c++')) return 'cpp';
  if (normalized === 'c' || normalized.startsWith('c ')) return 'c';
  if (normalized.includes('python')) return 'python';
  if (normalized.includes('javascript') || normalized.includes('node')) return 'javascript';
  if (normalized.includes('typescript')) return 'typescript';
  if (normalized.includes('java')) return 'java';
  if (normalized.includes('c#')) return 'csharp';
  if (normalized.includes('go')) return 'go';
  if (normalized.includes('rust')) return 'rust';
  if (normalized.includes('kotlin')) return 'kotlin';
  if (normalized.includes('php')) return 'php';
  if (normalized.includes('ruby')) return 'ruby';
  if (normalized.includes('swift')) return 'swift';
  return normalized.split(' ')[0].replace(/[^a-z0-9]/g, '');
};

const mapMonacoLanguage = (name: string) => {
  const key = mapLanguageKey(name);
  if (key === 'cpp') return 'cpp';
  if (key === 'csharp') return 'csharp';
  return key;
};
