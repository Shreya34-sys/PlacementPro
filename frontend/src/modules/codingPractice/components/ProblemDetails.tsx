import React from 'react';
import { Card, Badge, Row, Col, Button } from 'react-bootstrap';
import { Problem, Submission } from '../types/problem';
import { CodeEditor } from './CodeEditor';

interface ProblemDetailsProps {
  problem: Problem;
  onBack: () => void;
  onRunCode: (code: string, language: string) => Promise<any>;
  onSubmit: (code: string, language: string) => Promise<Submission>;
  submissions: Submission[];
  isBookmarked: boolean;
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
      case 'Easy': return 'success';
      case 'Medium': return 'warning';
      case 'Hard': return 'danger';
      case 'Expert': return 'dark';
      default: return 'secondary';
    }
  };

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <Button variant="outline-secondary" size="sm" onClick={onBack} className="fw-bold">
          <i className="bi bi-arrow-left me-1"></i> Back to Problems
        </Button>

        <Button
          variant={isBookmarked ? 'primary' : 'outline-primary'}
          size="sm"
          onClick={onToggleBookmark}
          className="fw-bold"
        >
          <i className={`bi ${isBookmarked ? 'bi-bookmark-fill' : 'bi-bookmark'} me-1`}></i>
          {isBookmarked ? 'Bookmarked' : 'Bookmark'}
        </Button>
      </div>

      <Row className="g-4">
        {/* Left column: Problem Details & Spec */}
        <Col lg={5} className="d-flex flex-column gap-3">
          <Card className="border-0 shadow-sm" style={{ borderRadius: '12px' }}>
            <Card.Body className="p-4">
              <div className="d-flex align-items-center gap-2 mb-3">
                <Badge bg={getDifficultyColor(problem.difficulty)} className="px-2.5 py-1.5 fs-8">
                  {problem.difficulty}
                </Badge>
                {problem.rating && (
                  <Badge bg="secondary" className="px-2.5 py-1.5 fs-8 bg-opacity-75">
                    Rating: {problem.rating}
                  </Badge>
                )}
                <span className="text-muted fs-8 text-capitalize">{problem.source}</span>
              </div>

              <h4 className="fw-bold text-dark mb-3">{problem.title}</h4>

              <div className="border-bottom pb-3 mb-3 fs-8 text-muted">
                <span>{(problem.solvedCount / 1000).toFixed(1)}k Solved on platform</span>
                {problem.source === 'codeforces' && problem.sourceUrl && (
                  <>
                    <span className="mx-2">•</span>
                    <a href={problem.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-decoration-none">
                      View Official Codeforces Statement <i className="bi bi-box-arrow-up-right ms-0.5"></i>
                    </a>
                  </>
                )}
              </div>

              <h6 className="fw-bold text-dark fs-7 mb-2">Problem Statement</h6>
              <p className="text-secondary fs-8 whitespace-pre-line leading-relaxed mb-4">
                {problem.description || 'Since full statement text copyright limits may apply, you can reference the basic problem details and specifications here. For full external problems, tests, and constraints, please view the official problem link above.'}

                {!problem.description && problem.contestId && problem.problemIndex ? (
                  <>
                    <br /><br />
                    <strong>Problem Reference:</strong> Contest {problem.contestId}, Index {problem.problemIndex}.
                  </>
                ) : null}
              </p>

              {problem.inputFormat && (
                <>
                  <h6 className="fw-bold text-dark fs-7 mb-2">Input Format</h6>
                  <p className="text-secondary fs-8 whitespace-pre-line">{problem.inputFormat}</p>
                </>
              )}

              {problem.outputFormat && (
                <>
                  <h6 className="fw-bold text-dark fs-7 mb-2">Output Format</h6>
                  <p className="text-secondary fs-8 whitespace-pre-line">{problem.outputFormat}</p>
                </>
              )}

              {problem.examples && problem.examples.length > 0 && (
                <>
                  <h6 className="fw-bold text-dark fs-7 mb-2">Examples</h6>
                  <div className="d-grid gap-2 mb-4">
                    {problem.examples.map((example, index) => (
                      <div key={`${problem.id}-example-${index}`} className="bg-light p-3 rounded border font-monospace fs-9">
                        <div className="mb-1"><strong>Input:</strong><pre className="mb-1 text-wrap">{example.input}</pre></div>
                        <div className="mb-1"><strong>Output:</strong><pre className="mb-1 text-wrap">{example.output}</pre></div>
                        {example.explanation && (
                          <div className="text-muted font-sans"><strong>Explanation:</strong> {example.explanation}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}

              {problem.constraints && (
                <>
                  <h6 className="fw-bold text-dark fs-7 mb-2">Constraints</h6>
                  <p className="text-secondary fs-8 whitespace-pre-line">{problem.constraints}</p>
                </>
              )}

              <h6 className="fw-bold text-dark fs-7 mb-2">Tags</h6>
              <div className="d-flex flex-wrap gap-1.5">
                {(problem.source === 'placementpro' ? problem.topics : problem.tags).map((tag) => (
                  <Badge key={tag} bg="primary-subtle" text="primary" className="border border-primary-subtle fs-8 px-2.5 py-1.5">
                    {tag}
                  </Badge>
                ))}
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Right column: Workspace (Monaco Editor) */}
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
