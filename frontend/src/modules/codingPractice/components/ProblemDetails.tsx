import React from 'react';
import { Card, Badge, Row, Col, Button } from 'react-bootstrap';
import { Problem, Submission } from '../types/problem';
import { CodeEditor } from './CodeEditor';

// FIX #2 — prop types now match CodingPracticePage exactly (languageId is number, not optional)
interface ProblemDetailsProps {
  problem:          Problem;
  onBack:           () => void;
  onRunCode:        (code: string, language: string, languageId: number) => Promise<any>;
  onSubmit:         (code: string, language: string, languageId: number) => Promise<Submission>;
  submissions:      Submission[];
  isBookmarked:     boolean;
  onToggleBookmark: () => void;
}

export const ProblemDetails: React.FC<ProblemDetailsProps> = ({
  problem,
  onBack,
  onRunCode,
  onSubmit,
  submissions,
  isBookmarked,
  onToggleBookmark,
}) => {
  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'Easy':   return 'success';
      case 'Medium': return 'warning';
      case 'Hard':   return 'danger';
      case 'Expert': return 'dark';
      default:       return 'secondary';
    }
  };

  return (
    <div>
      {/* Top bar */}
      <div className="d-flex align-items-center justify-content-between mb-3">
        <Button variant="outline-secondary" size="sm" onClick={onBack} className="fw-bold">
          <i className="bi bi-arrow-left me-1" /> Back to Problems
        </Button>

        <Button
          variant={isBookmarked ? 'primary' : 'outline-primary'}
          size="sm"
          onClick={onToggleBookmark}
          className="fw-bold"
        >
          <i className={`bi ${isBookmarked ? 'bi-bookmark-fill' : 'bi-bookmark'} me-1`} />
          {isBookmarked ? 'Bookmarked' : 'Bookmark'}
        </Button>
      </div>

      <Row className="g-4">
        {/* Left — Problem statement */}
        <Col lg={5} className="d-flex flex-column gap-3">
          <Card className="border-0 shadow-sm" style={{ borderRadius: '12px' }}>
            <Card.Body className="p-4">
              {/* Difficulty + rating + source badges */}
              <div className="d-flex align-items-center gap-2 mb-3 flex-wrap">
                <Badge bg={getDifficultyColor(problem.difficulty)} className="px-2 py-1 fs-8">
                  {problem.difficulty}
                </Badge>
                {problem.rating && (
                  <Badge bg="secondary" className="px-2 py-1 fs-8 bg-opacity-75">
                    Rating: {problem.rating}
                  </Badge>
                )}
                <span className="text-muted fs-8 text-capitalize">{problem.source}</span>
              </div>

              <h4 className="fw-bold text-dark mb-3">{problem.title}</h4>

              {/* Solved count + external link */}
              <div className="border-bottom pb-3 mb-3 fs-8 text-muted">
                <span>
                  {problem.solvedCount >= 1000
                    ? `${(problem.solvedCount / 1000).toFixed(1)}k solved on platform`
                    : problem.solvedCount > 0
                    ? `${problem.solvedCount} solved on platform`
                    : 'Be the first to solve this!'}
                </span>
                {problem.source === 'codeforces' && problem.sourceUrl && (
                  <>
                    <span className="mx-2">·</span>
                    <a
                      href={problem.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-decoration-none text-primary fw-semibold"
                    >
                      <i className="bi bi-box-arrow-up-right me-1" />
                      View on Codeforces
                    </a>
                  </>
                )}
              </div>

              {/* Problem statement */}
              <h6 className="fw-bold text-dark fs-7 mb-2">Problem Statement</h6>
              {problem.description ? (
                <p className="text-secondary fs-8 whitespace-pre-line leading-relaxed mb-4">
                  {problem.description}
                </p>
              ) : (
                <div className="bg-light border rounded p-3 mb-4 fs-8 text-secondary">
                  <p className="mb-2">
                    Full problem statement available on the official Codeforces page.
                    Copyright restrictions prevent reproducing the full text here.
                  </p>
                  {problem.contestId && problem.problemIndex && (
                    <p className="mb-0">
                      <strong>Reference:</strong> Contest {problem.contestId}, Problem {problem.problemIndex}
                    </p>
                  )}
                  {problem.sourceUrl && (
                    <a
                      href={problem.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-sm btn-outline-primary mt-2"
                    >
                      <i className="bi bi-box-arrow-up-right me-1" />
                      Open Full Statement
                    </a>
                  )}
                </div>
              )}

              {/* Input/output format */}
              {problem.inputFormat && (
                <>
                  <h6 className="fw-bold text-dark fs-7 mb-2">Input Format</h6>
                  <p className="text-secondary fs-8 whitespace-pre-line mb-3">{problem.inputFormat}</p>
                </>
              )}
              {problem.outputFormat && (
                <>
                  <h6 className="fw-bold text-dark fs-7 mb-2">Output Format</h6>
                  <p className="text-secondary fs-8 whitespace-pre-line mb-3">{problem.outputFormat}</p>
                </>
              )}

              {/* Examples */}
              {problem.examples && problem.examples.length > 0 && (
                <>
                  <h6 className="fw-bold text-dark fs-7 mb-2">Examples</h6>
                  <div className="d-grid gap-2 mb-4">
                    {problem.examples.map((ex, i) => (
                      <div
                        key={`${problem.id}-ex-${i}`}
                        className="bg-light p-3 rounded border font-monospace fs-9"
                      >
                        <div className="mb-1">
                          <strong>Input:</strong>
                          <pre className="mb-1 text-wrap">{ex.input}</pre>
                        </div>
                        <div className="mb-1">
                          <strong>Output:</strong>
                          <pre className="mb-1 text-wrap">{ex.output}</pre>
                        </div>
                        {ex.explanation && (
                          <div className="text-muted">
                            <strong>Explanation:</strong> {ex.explanation}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Constraints */}
              {problem.constraints && (
                <>
                  <h6 className="fw-bold text-dark fs-7 mb-2">Constraints</h6>
                  <p className="text-secondary fs-8 whitespace-pre-line mb-3">{problem.constraints}</p>
                </>
              )}

              {/* Tags */}
              <h6 className="fw-bold text-dark fs-7 mb-2">Tags</h6>
              <div className="d-flex flex-wrap gap-1">
                {(problem.source === 'placementpro' ? problem.topics : problem.tags).map((tag) => (
                  <Badge
                    key={tag}
                    bg="primary-subtle"
                    text="primary"
                    className="border border-primary-subtle fs-8 px-2 py-1"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Right — Code editor */}
        <Col lg={7}>
          <CodeEditor
            problem={problem}
            onRunCode={onRunCode}
            onSubmit={onSubmit}
            submissions={submissions}
          />
        </Col>
      </Row>
    </div>
  );
};
