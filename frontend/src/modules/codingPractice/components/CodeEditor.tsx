import React, { useState, useEffect } from 'react';
import { Card, Button, Form, Spinner, Tab, Tabs, Alert, Badge } from 'react-bootstrap';
import MonacoEditor from '@monaco-editor/react';
import { JudgeLanguage, Problem, RunCodeResult, Submission } from '../types/problem';
import {
  getJudgeLanguages,
  runCodeWithStdin,
  CustomStdinResult,
} from '../services/submissionService';

// ---------------------------------------------------------------------------
// Default starter code per language key
// ---------------------------------------------------------------------------
const DEFAULT_STARTER_CODE: Record<string, string> = {
  c:          `#include <stdio.h>\n\nint main(void) {\n    // Read input using scanf\n    // Write output using printf\n    return 0;\n}`,
  cpp:        `#include <iostream>\nusing namespace std;\n\nint main() {\n    // Read input using cin\n    // Write output using cout\n    return 0;\n}`,
  java:       `import java.util.*;\n\nclass Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        // Write your solution here\n    }\n}`,
  python:     `# Write your solution here\nimport sys\ninput = sys.stdin.readline\n\ndef solve():\n    pass\n\nif __name__ == '__main__':\n    solve()`,
  javascript: `process.stdin.resume();\nprocess.stdin.setEncoding('utf8');\nlet input = '';\nprocess.stdin.on('data', d => input += d);\nprocess.stdin.on('end', () => {\n    const lines = input.trim().split('\\n');\n    // Write your solution here\n    console.log(lines[0]);\n});`,
  typescript: `process.stdin.resume();\nprocess.stdin.setEncoding('utf8');\nlet input = '';\nprocess.stdin.on('data', (d: string) => input += d);\nprocess.stdin.on('end', () => {\n    const lines = input.trim().split('\\n');\n    console.log(lines[0]);\n});`,
  csharp:     `using System;\nusing System.IO;\n\nclass Program {\n    static void Main() {\n        // Write your solution here\n        string? line = Console.ReadLine();\n        Console.WriteLine(line);\n    }\n}`,
  go:         `package main\n\nimport (\n    "bufio"\n    "fmt"\n    "os"\n)\n\nfunc main() {\n    reader := bufio.NewReader(os.Stdin)\n    // Write your solution here\n    fmt.Fscan(reader)\n}`,
  rust:       `use std::io::{self, BufRead};\n\nfn main() {\n    let stdin = io::stdin();\n    for line in stdin.lock().lines() {\n        let line = line.unwrap();\n        println!("{}", line);\n    }\n}`,
  kotlin:     `import java.util.Scanner\n\nfun main() {\n    val sc = Scanner(System.\`in\`)\n    // Write your solution here\n}`,
};

// Fallback list — uses IDs from ce.judge0.com
const FALLBACK_LANGUAGES: JudgeLanguage[] = [
  { id: 104, name: 'C (Clang 18.1.8)',       key: 'c',          monacoLanguage: 'c' },
  { id: 105, name: 'C++ 23 (Clang 18.1.8)',  key: 'cpp',        monacoLanguage: 'cpp' },
  { id: 91,  name: 'Java (OpenJDK 17)',       key: 'java',       monacoLanguage: 'java' },
  { id: 92,  name: 'Python 3 (3.11.2)',       key: 'python',     monacoLanguage: 'python' },
  { id: 93,  name: 'JavaScript (Node.js 18)', key: 'javascript', monacoLanguage: 'javascript' },
  { id: 94,  name: 'TypeScript (5.0.3)',      key: 'typescript', monacoLanguage: 'typescript' },
  { id: 51,  name: 'C# (Mono 6.6.0)',        key: 'csharp',     monacoLanguage: 'csharp' },
  { id: 60,  name: 'Go (1.13.5)',             key: 'go',         monacoLanguage: 'go' },
  { id: 73,  name: 'Rust (1.40.0)',           key: 'rust',       monacoLanguage: 'rust' },
  { id: 78,  name: 'Kotlin (1.3.70)',         key: 'kotlin',     monacoLanguage: 'kotlin' },
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface CodeEditorProps {
  problem:     Problem;
  onRunCode:   (code: string, language: string, languageId: number) => Promise<RunCodeResult>;
  onSubmit:    (code: string, language: string, languageId: number) => Promise<Submission>;
  submissions: Submission[];
}

type PanelTab = 'testcases' | 'custom' | 'submissions';

// ---------------------------------------------------------------------------
// Status → display helpers
// ---------------------------------------------------------------------------
type OutputKind = 'accepted' | 'pending' | 'wrong' | 'compile' | 'runtime' | 'tle' | 'mle' | 'system';

const getOutputKind = (status: string): OutputKind => {
  switch (status) {
    case 'Accepted':              return 'accepted';
    case 'Pending':               return 'pending';
    case 'Wrong Answer':          return 'wrong';
    case 'Compilation Error':     return 'compile';
    case 'Runtime Error':         return 'runtime';
    case 'Time Limit Exceeded':   return 'tle';
    case 'Memory Limit Exceeded': return 'mle';
    default:                      return 'system';
  }
};

const KIND_VARIANT: Record<OutputKind, string> = {
  accepted: 'success',
  pending:  'info',
  wrong:    'danger',
  compile:  'warning',
  runtime:  'danger',
  tle:      'warning',
  mle:      'warning',
  system:   'secondary',
};

const KIND_ICON: Record<OutputKind, string> = {
  accepted: 'bi-check-circle-fill',
  pending:  'bi-hourglass-split',
  wrong:    'bi-x-circle-fill',
  compile:  'bi-exclamation-triangle-fill',
  runtime:  'bi-bug-fill',
  tle:      'bi-clock-fill',
  mle:      'bi-memory',
  system:   'bi-wifi-off',
};

// ---------------------------------------------------------------------------
// CodeEditor component
// ---------------------------------------------------------------------------
export const CodeEditor: React.FC<CodeEditorProps> = ({
  problem,
  onRunCode,
  onSubmit,
  submissions,
}) => {
  // FIX #1 — store selected language by numeric ID (not key string) so that
  // multiple variants of the same language (e.g. C GCC vs C Clang) are
  // unambiguously identified. The dropdown value = String(id).
  const [selectedId,    setSelectedId]    = useState<number>(FALLBACK_LANGUAGES[0].id); // 104 = C Clang
  const [languages,     setLanguages]     = useState<JudgeLanguage[]>(FALLBACK_LANGUAGES);
  const [code,          setCode]          = useState('');
  const [theme,         setTheme]         = useState<'vs-dark' | 'light'>('vs-dark');
  const [isRunning,     setIsRunning]     = useState(false);
  const [isSubmitting,  setIsSubmitting]  = useState(false);
  const [panelTab,      setPanelTab]      = useState<PanelTab>('testcases');
  const [runResult,     setRunResult]     = useState<RunCodeResult | null>(null);
  const [submitResult,  setSubmitResult]  = useState<Submission | null>(null);

  const [customInput,      setCustomInput]      = useState('');
  const [customResult,     setCustomResult]     = useState<CustomStdinResult | null>(null);
  const [isRunningCustom,  setIsRunningCustom]  = useState(false);
  const [customError,      setCustomError]      = useState<string | null>(null);

  // Derive the currently-selected JudgeLanguage object
  const selectedLang: JudgeLanguage =
    languages.find((l) => l.id === selectedId) ?? FALLBACK_LANGUAGES[0];

  // Fetch real language list from the backend on mount
  useEffect(() => {
    getJudgeLanguages()
      .then((items) => {
        if (items.length > 0) {
          setLanguages(items);
          // Default to cpp (prefer C++ 17 GCC or first cpp variant found)
          const defaultLang =
            items.find((l) => l.key === 'cpp' && l.name.includes('17')) ??
            items.find((l) => l.key === 'cpp') ??
            items[0];
          setSelectedId(defaultLang.id);
        }
      })
      .catch(() => {
        setLanguages(FALLBACK_LANGUAGES);
        const defaultLang = FALLBACK_LANGUAGES.find((l) => l.key === 'cpp') ?? FALLBACK_LANGUAGES[0];
        setSelectedId(defaultLang.id);
      });
  }, []);

  // Restore code from localStorage when problem or language changes
  useEffect(() => {
    const storageKey = `code_${problem.id}_${selectedId}`;
    const saved = localStorage.getItem(storageKey);
    const starter =
      problem.starterCode?.[selectedLang.key] ??
      DEFAULT_STARTER_CODE[selectedLang.key] ??
      '';
    setCode(saved ?? starter);
  }, [problem.id, selectedId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCodeChange = (value?: string) => {
    const v = value ?? '';
    setCode(v);
    localStorage.setItem(`code_${problem.id}_${selectedId}`, v);
  };

  const handleResetCode = () => {
    if (!window.confirm('Reset code to default template?')) return;
    const defaultCode =
      problem.starterCode?.[selectedLang.key] ??
      DEFAULT_STARTER_CODE[selectedLang.key] ??
      '';
    setCode(defaultCode);
    localStorage.setItem(`code_${problem.id}_${selectedId}`, defaultCode);
  };

  // Run against problem test cases (or compile+run for Codeforces)
  const handleRun = async () => {
    setIsRunning(true);
    setPanelTab('testcases');
    setRunResult(null);
    try {
      const res = await onRunCode(code, selectedLang.key, selectedId);
      setRunResult(res);
    } catch (e) {
      setRunResult({
        status:      'Internal Error',
        passedTests: 0,
        totalTests:  0,
        runtime:     0,
        memory:      0,
        results:     [],
        errorMessage: e instanceof Error ? e.message : 'Execution failed. Please try again.',
      });
    } finally {
      setIsRunning(false);
    }
  };

  // Run with custom stdin
  const handleRunCustom = async () => {
    setIsRunningCustom(true);
    setCustomResult(null);
    setCustomError(null);
    try {
      const res = await runCodeWithStdin({
        language:    selectedLang.key,
        languageId:  selectedId,
        code,
        customStdin: customInput,
      });
      setCustomResult(res);
    } catch (e) {
      setCustomError(e instanceof Error ? e.message : 'Execution failed. Please try again.');
    } finally {
      setIsRunningCustom(false);
    }
  };

  // Submit solution
  const handleSubmit = async () => {
    setIsSubmitting(true);
    setPanelTab('submissions');
    setSubmitResult(null);
    try {
      const res = await onSubmit(code, selectedLang.key, selectedId);
      setSubmitResult(res);
    } catch (e) {
      console.error('Submit failed:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isBusy = isRunning || isSubmitting || isRunningCustom;

  return (
    <Card className="border-0 shadow-sm overflow-hidden" style={{ borderRadius: '12px', height: '100%' }}>

      {/* ── Header ── */}
      <Card.Header className="bg-white py-2 px-3 d-flex align-items-center justify-content-between border-bottom">
        <div className="d-flex align-items-center gap-2">
          {/* FIX #1 — value is String(id), not key */}
          <Form.Select
            size="sm"
            style={{ width: '200px' }}
            value={String(selectedId)}
            onChange={(e) => setSelectedId(Number(e.target.value))}
            className="fw-semibold"
            disabled={isBusy}
          >
            {languages.map((l) => (
              <option key={l.id} value={String(l.id)}>
                {l.name}
              </option>
            ))}
          </Form.Select>

          <Button
            variant="outline-secondary" size="sm"
            onClick={() => setTheme(theme === 'vs-dark' ? 'light' : 'vs-dark')}
            title="Toggle editor theme"
          >
            <i className={`bi ${theme === 'vs-dark' ? 'bi-sun-fill text-warning' : 'bi-moon-fill'}`} />
          </Button>

          <Button
            variant="outline-danger" size="sm"
            onClick={handleResetCode}
            title="Reset code to template"
            disabled={isBusy}
          >
            <i className="bi bi-arrow-counterclockwise" />
          </Button>
        </div>

        <div className="d-flex gap-2">
          <Button
            variant="outline-primary" size="sm"
            className="fw-bold px-3"
            onClick={handleRun}
            disabled={isBusy}
          >
            {isRunning
              ? <><Spinner size="sm" animation="border" className="me-1" />Running…</>
              : <><i className="bi bi-play-fill me-1" />Run</>}
          </Button>

          <Button
            variant="success" size="sm"
            className="fw-bold px-3"
            onClick={handleSubmit}
            disabled={isBusy}
          >
            {isSubmitting
              ? <><Spinner size="sm" animation="border" className="me-1" />Submitting…</>
              : <><i className="bi bi-cloud-arrow-up-fill me-1" />Submit</>}
          </Button>
        </div>
      </Card.Header>

      {/* ── Monaco Editor ── */}
      <div className="bg-dark p-0" style={{ minHeight: '360px' }}>
        <MonacoEditor
          height="360px"
          language={selectedLang.monacoLanguage}
          theme={theme}
          value={code}
          onChange={handleCodeChange}
          options={{
            fontSize: 13,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
          }}
        />
      </div>

      {/* ── Bottom Panel ── */}
      <Card.Footer className="bg-white p-0 border-top">
        <Tabs
          activeKey={panelTab}
          onSelect={(k) => setPanelTab((k as PanelTab) ?? 'testcases')}
          className="px-3 border-bottom nav-tabs-sm"
        >
          <Tab eventKey="testcases"   title="Run Output" />
          <Tab eventKey="custom"      title={<><i className="bi bi-terminal me-1" />Custom Input</>} />
          <Tab eventKey="submissions" title="Submissions" />
        </Tabs>

        <div className="p-3 fs-8" style={{ minHeight: '150px', maxHeight: '260px', overflowY: 'auto' }}>
          {panelTab === 'testcases' && (
            <RunOutputsPanel isRunning={isRunning} result={runResult} problemId={problem.id} />
          )}
          {panelTab === 'custom' && (
            <CustomInputPanel
              customInput={customInput}
              onInputChange={setCustomInput}
              onRun={handleRunCustom}
              isRunning={isRunningCustom}
              isBusy={isBusy}
              result={customResult}
              error={customError}
            />
          )}
          {panelTab === 'submissions' && (
            <SubmissionsPanel
              isSubmitting={isSubmitting}
              submitResult={submitResult}
              submissions={submissions}
            />
          )}
        </div>
      </Card.Footer>
    </Card>
  );
};

// ---------------------------------------------------------------------------
// Run Outputs panel
// ---------------------------------------------------------------------------
const RunOutputsPanel: React.FC<{
  isRunning: boolean;
  result:    RunCodeResult | null;
  problemId: string;
}> = ({ isRunning, result, problemId }) => {

  if (isRunning) return (
    <div className="text-muted text-center py-3">
      <Spinner size="sm" animation="border" className="me-2" />
      Compiling and running your code…
    </div>
  );

  if (!result) return (
    <div className="text-muted text-center py-3">
      <i className="bi bi-play-circle me-2" />
      Click <strong>Run</strong> to compile and execute your code.
    </div>
  );

  const kind = getOutputKind(result.status);

  // ── Compile-run mode (Codeforces / no test cases) ──────────────────────
  if (result.totalTests === 0) {
    const hasCompileError = result.status === 'Compilation Error';
    const hasRuntimeError = result.status === 'Runtime Error';
    const succeeded       = !hasCompileError && !hasRuntimeError && result.status !== 'Internal Error';

    return (
      <div>
        <Alert variant={KIND_VARIANT[kind]} className="py-2 mb-2 d-flex flex-wrap align-items-center gap-2 fw-bold">
          <i className={`bi ${KIND_ICON[kind]}`} />
          {succeeded ? '✓ Compiled and executed successfully' : `✗ ${result.status}`}
          {succeeded && (
            <span className="fw-normal fs-9 text-muted ms-1">
              — No test cases for this problem. Use <strong>Custom Input</strong> to test with your own input.
            </span>
          )}
        </Alert>

        {/* Compilation error output */}
        {hasCompileError && (result.compileOutput || result.errorMessage) && (
          <OutputSection
            label="Compiler Output"
            value={result.compileOutput || result.errorMessage || ''}
            variant="warning"
          />
        )}

        {/* Runtime error output */}
        {hasRuntimeError && (result.stderr || result.errorMessage) && (
          <OutputSection
            label="Runtime Error"
            value={result.stderr || result.errorMessage || ''}
            variant="danger"
          />
        )}

        {/* Successful stdout */}
        {succeeded && result.stdout && (
          <OutputSection label="Output" value={result.stdout} variant="success" />
        )}
        {succeeded && !result.stdout && (
          <p className="text-muted font-monospace fs-9 mb-1">(program produced no output)</p>
        )}

        {/* Stderr even on success (warnings etc.) */}
        {succeeded && result.stderr && (
          <OutputSection label="Stderr" value={result.stderr} variant="warning" />
        )}

        <small className="text-muted mt-1 d-block">
          {result.runtime > 0 && `Runtime: ${result.runtime} ms`}
          {result.runtime > 0 && result.memory > 0 && ' · '}
          {result.memory  > 0 && `Memory: ${Math.round(result.memory / 1024)} MB`}
        </small>
      </div>
    );
  }

  // ── Test-case evaluation mode ───────────────────────────────────────────
  if (result.errorMessage && result.results.length === 0) {
    return <OutputErrorBlock kind={kind} status={result.status} message={result.errorMessage} />;
  }

  return (
    <div>
      <Alert variant={KIND_VARIANT[kind]} className="py-2 mb-2 d-flex align-items-center gap-2 fw-bold">
        <i className={`bi ${KIND_ICON[kind]}`} />
        {result.status === 'Accepted'
          ? `✓ All ${result.totalTests} sample test cases passed!`
          : `✗ ${result.status}`}
      </Alert>

      {result.errorMessage && (
        <pre className="bg-light rounded border p-2 text-danger font-monospace fs-9 text-wrap mb-2">
          {result.errorMessage}
        </pre>
      )}

      <div className="d-grid gap-2">
        {result.results.map((r, i) => (
          <div
            key={`${problemId}-run-${i}`}
            className={`p-2 rounded border font-monospace bg-light ${r.passed ? 'border-success' : 'border-danger'}`}
          >
            <div className={r.passed ? 'text-success fw-bold mb-1' : 'text-danger fw-bold mb-1'}>
              <i className={`bi ${r.passed ? 'bi-check-circle-fill' : 'bi-x-circle-fill'} me-1`} />
              Case {i + 1}: {r.passed ? 'Passed' : 'Failed'}
              {r.status && r.status !== 'Accepted' && r.status !== 'Wrong Answer' && (
                <Badge bg={KIND_VARIANT[getOutputKind(r.status)]} className="ms-2 fs-9">
                  {r.status}
                </Badge>
              )}
            </div>
            <LabeledPre label="Input"    value={r.input} />
            <LabeledPre label="Output"   value={r.output || '(empty)'} highlight={!r.passed ? 'danger' : undefined} />
            <LabeledPre label="Expected" value={r.expected} />
            {r.errorMessage && <LabeledPre label="Error" value={r.errorMessage} highlight="danger" />}
          </div>
        ))}
      </div>

      <small className="text-muted mt-2 d-block">
        Passed {result.passedTests}/{result.totalTests} tests
        {result.runtime > 0 && ` · Runtime: ${result.runtime} ms`}
        {result.memory  > 0 && ` · Memory: ${Math.round(result.memory / 1024)} MB`}
      </small>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Custom Input panel
// ---------------------------------------------------------------------------
const CustomInputPanel: React.FC<{
  customInput:   string;
  onInputChange: (v: string) => void;
  onRun:         () => void;
  isRunning:     boolean;
  isBusy:        boolean;
  result:        CustomStdinResult | null;
  error:         string | null;
}> = ({ customInput, onInputChange, onRun, isRunning, isBusy, result, error }) => (
  <div className="d-flex flex-column gap-2">
    <div>
      <label className="fw-semibold text-muted mb-1 fs-8">
        <i className="bi bi-input-cursor-text me-1" />
        Standard Input (stdin)
      </label>
      <Form.Control
        as="textarea"
        rows={3}
        className="font-monospace fs-9"
        placeholder={"Enter input here…\nExample:\n5\n10 20 30 40 50"}
        value={customInput}
        onChange={(e) => onInputChange(e.target.value)}
        disabled={isBusy}
        style={{ resize: 'vertical' }}
      />
    </div>

    <div>
      <Button
        variant="outline-primary" size="sm"
        className="fw-bold px-3"
        onClick={onRun}
        disabled={isBusy}
      >
        {isRunning
          ? <><Spinner size="sm" animation="border" className="me-1" />Running…</>
          : <><i className="bi bi-play-fill me-1" />Run with Input</>}
      </Button>
    </div>

    {isRunning && (
      <div className="text-muted text-center py-2">
        <Spinner size="sm" animation="border" className="me-2" />Executing…
      </div>
    )}

    {error && !isRunning && (
      <Alert variant="danger" className="py-2 mb-0">
        <i className="bi bi-wifi-off me-2" />
        <strong>Error:</strong> {error}
      </Alert>
    )}

    {result && !isRunning && !error && <CustomResultBlock result={result} />}
  </div>
);

const CustomResultBlock: React.FC<{ result: CustomStdinResult }> = ({ result }) => {
  const kind = getOutputKind(result.status);
  return (
    <div>
      <Alert variant={KIND_VARIANT[kind]} className="py-2 mb-2 d-flex align-items-center gap-2 fw-bold">
        <i className={`bi ${KIND_ICON[kind]}`} />
        {result.status === 'Accepted' ? '✓ Executed successfully' : `✗ ${result.status}`}
      </Alert>

      {result.status === 'Compilation Error' && result.compileOutput && (
        <OutputSection label="Compiler Output" value={result.compileOutput} variant="warning" />
      )}
      {result.status === 'Runtime Error' && (result.stderr || result.compileOutput) && (
        <OutputSection label="Runtime Error"   value={result.stderr || result.compileOutput} variant="danger" />
      )}
      {result.stdout && result.status !== 'Compilation Error' && (
        <OutputSection label="Output" value={result.stdout} variant="success" />
      )}
      {!result.stdout && result.status === 'Accepted' && (
        <p className="text-muted font-monospace fs-9 mb-1">(no output)</p>
      )}
      <small className="text-muted">
        {result.runtime > 0 && `Runtime: ${result.runtime} ms`}
        {result.runtime > 0 && result.memory > 0 && ' · '}
        {result.memory  > 0 && `Memory: ${Math.round(result.memory / 1024)} MB`}
      </small>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Submissions panel  — FIX #4: show stdout/compile output for Codeforces
// ---------------------------------------------------------------------------
const SubmissionsPanel: React.FC<{
  isSubmitting: boolean;
  submitResult: Submission | null;
  submissions:  Submission[];
}> = ({ isSubmitting, submitResult, submissions }) => {

  if (isSubmitting) return (
    <div className="text-muted text-center py-3">
      <Spinner size="sm" animation="border" className="me-2" />
      Submitting solution to judge…
    </div>
  );

  return (
    <div>
      {submitResult && (() => {
        const kind = getOutputKind(submitResult.status);
        const isPending = submitResult.status === 'Pending';
        return (
          <div className="mb-3">
            <Alert variant={KIND_VARIANT[kind]} className="py-2 mb-2 d-flex flex-wrap align-items-center gap-2 fw-bold">
              <i className={`bi ${KIND_ICON[kind]}`} />
              {submitResult.status === 'Accepted'
                ? '✓ Solution Accepted! (+XP earned)'
                : isPending
                  ? '⏳ Submission saved — no test cases configured for this problem'
                  : `✗ ${submitResult.status}`}
            </Alert>

            {/* Show compile error */}
            {submitResult.status === 'Compilation Error' && submitResult.errorMessage && (
              <OutputSection label="Compiler Output" value={submitResult.errorMessage} variant="warning" />
            )}

            {/* Show runtime error */}
            {submitResult.status === 'Runtime Error' && submitResult.errorMessage && (
              <OutputSection label="Runtime Error" value={submitResult.errorMessage} variant="danger" />
            )}

            {/* For Codeforces (Pending) — show the stdout so user knows code ran */}
            {isPending && (submitResult as Submission & { stdout?: string }).stdout && (
              <OutputSection
                label="Program Output (compile run)"
                value={(submitResult as Submission & { stdout?: string }).stdout!}
                variant="info"
              />
            )}

            {/* For Accepted with test cases */}
            {submitResult.status === 'Accepted' && (submitResult.totalTests ?? 0) > 0 && (
              <small className="text-muted d-block">
                Passed {submitResult.passedTests ?? 0}/{submitResult.totalTests ?? 0} tests
                {(submitResult.runtime ?? 0) > 0 && ` · Runtime: ${submitResult.runtime} ms`}
                {(submitResult.memory  ?? 0) > 0 && ` · Memory: ${Math.round((submitResult.memory ?? 0) / 1024)} MB`}
              </small>
            )}
          </div>
        );
      })()}

      {submissions.length === 0 && !submitResult ? (
        <div className="text-muted text-center py-2">No submissions yet for this problem.</div>
      ) : (
        <div className="d-grid gap-1 mt-1">
          {submissions.map((sub) => {
            const kind = getOutputKind(sub.status);
            return (
              <div
                key={sub.id}
                className="d-flex align-items-center justify-content-between p-2 rounded border bg-light"
              >
                <div className="d-flex align-items-center gap-2">
                  <i className={`bi ${KIND_ICON[kind]} text-${KIND_VARIANT[kind]}`} />
                  <Badge bg={KIND_VARIANT[kind]}>{sub.status}</Badge>
                  <span className="text-muted fs-9">{sub.language}</span>
                  {(sub.passedTests ?? 0) > 0 && (
                    <span className="text-muted fs-9">
                      {sub.passedTests}/{sub.totalTests} tests
                    </span>
                  )}
                </div>
                <small className="text-muted fs-9">
                  {typeof sub.submittedAt === 'string'
                    ? new Date(sub.submittedAt).toLocaleString()
                    : sub.submittedAt?.toDate?.()?.toLocaleString?.() ?? ''}
                </small>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Shared sub-components
// ---------------------------------------------------------------------------
const LabeledPre: React.FC<{ label: string; value: string; highlight?: string }> = ({ label, value, highlight }) => (
  <div className="mb-1">
    <span className="text-muted fs-9">{label}:</span>
    <pre className={`mb-0 fs-9 text-wrap ${highlight ? `text-${highlight}` : 'text-dark'}`}>{value}</pre>
  </div>
);

const OutputSection: React.FC<{ label: string; value: string; variant: string }> = ({ label, value, variant }) => (
  <div className="mb-2">
    <div className={`fw-semibold fs-8 text-${variant} mb-1`}>{label}:</div>
    <pre className="bg-light rounded border p-2 font-monospace fs-9 text-wrap mb-0">{value}</pre>
  </div>
);

const OutputErrorBlock: React.FC<{ kind: OutputKind; status: string; message: string }> = ({ kind, status, message }) => (
  <div>
    <Alert variant={KIND_VARIANT[kind]} className="py-2 mb-2 d-flex align-items-center gap-2 fw-bold">
      <i className={`bi ${KIND_ICON[kind]}`} />
      {status}
    </Alert>
    <pre className="bg-light rounded border p-2 font-monospace fs-9 text-wrap text-danger mb-0">{message}</pre>
  </div>
);
