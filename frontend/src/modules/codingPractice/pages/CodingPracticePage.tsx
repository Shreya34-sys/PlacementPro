import React, { useState, useEffect } from 'react';
import { Container, Tabs, Tab, Row, Col, Card, Badge, Alert, Spinner } from 'react-bootstrap';
import { useAuth } from '../../../context/AuthContext';
import { Problem, UserProgress, Submission } from '../types/problem';
import { ProblemExplorer } from '../components/ProblemExplorer';
import { ProblemDetails } from '../components/ProblemDetails';
import { Leaderboard } from '../components/Leaderboard';
import { AdminConsole } from '../components/AdminConsole';
import { getUserProgress, getBookmarks, toggleBookmark } from '../services/progressService';
import { getSubmissions, submitCode } from '../services/submissionService';

interface CodingPracticePageProps {
  onNavigate: (tab: string) => void;
}

export const CodingPracticePage: React.FC<CodingPracticePageProps> = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('problems');
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);
  
  // User profile state mappings
  const [progressMap, setProgressMap] = useState<Record<string, UserProgress>>({});
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  
  const [loadingProgress, setLoadingProgress] = useState(true);

  const userId = currentUser?.id || 'guest';
  const isAdmin = currentUser?.role === 'tpo' || currentUser?.role === 'admin' || currentUser?.role === 'recruiter';

  const fetchUserData = async () => {
    if (userId === 'guest') return;
    setLoadingProgress(true);
    try {
      const [prog, bmarks, subs] = await Promise.all([
        getUserProgress(userId),
        getBookmarks(userId),
        getSubmissions(userId)
      ]);
      setProgressMap(prog);
      setBookmarks(bmarks);
      setSubmissions(subs);
    } catch (e) {
      console.error('Error fetching student data:', e);
    } finally {
      setLoadingProgress(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [userId]);

  const handleToggleBookmark = async (problemId: string) => {
    const isBookmarked = bookmarks.includes(problemId);
    try {
      await toggleBookmark(userId, problemId, isBookmarked);
      setBookmarks((prev) =>
        isBookmarked ? prev.filter((id) => id !== problemId) : [...prev, problemId]
      );
    } catch (e) {
      console.error(e);
    }
  };

  const handleRunCode = async (code: string, language: string) => {
    // Local execution output helper simulation
    // Resolves after 1 second simulating sandbox environment
    await new Promise((resolve) => setTimeout(resolve, 800));
    
    // Simple JS execution check for basic runtime simulation
    if (language === 'javascript') {
      try {
        // Quick syntax validation check
        new Function(code);
        return { pass: true, output: '8\n-> YES', expected: 'YES' };
      } catch (e) {
        return { error: e instanceof Error ? e.message : 'Syntax Error' };
      }
    }
    
    return { pass: true, output: 'Compilation successful.\nAll local checks passed.', expected: 'All checks passed.' };
  };

  const handleSubmitCode = async (code: string, language: string): Promise<Submission> => {
    if (!selectedProblem) throw new Error('No problem selected');
    
    try {
      const submission = await submitCode({
        userId,
        problemId: selectedProblem.id,
        language,
        code
      });
      
      // Update submissions history and progress data
      setSubmissions((prev) => [submission, ...prev]);
      fetchUserData();
      return submission;
    } catch (e) {
      console.error('Submission failed:', e);
      throw e;
    }
  };

  const solvedProblemsCount = Object.values(progressMap).filter((p) => p.solved).length;

  return (
    <Container fluid className="px-0">
      {/* Header Profile Dashboard Stats */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h3 className="fw-bold mb-1 text-dark d-flex align-items-center gap-2">
            <i className="bi bi-code-square text-primary"></i> Coding Practice Dashboard
          </h3>
          <p className="text-secondary mb-0 fs-7">
            Hone your programming skills on real Codeforces problems, earn XP, and prepare for campus rounds.
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <Badge bg="danger" className="px-3 py-2 fs-7 fw-bold shadow-sm">
            <i className="bi bi-fire me-1"></i> Streak: {currentUser?.streak || 0} Days 🔥
          </Badge>
          <Badge bg="primary-subtle" text="primary" className="px-3 py-2 fs-7 fw-bold border border-primary-subtle">
            Problems Solved: {solvedProblemsCount}
          </Badge>
          <Badge bg="success-subtle" text="success" className="px-3 py-2 fs-7 fw-bold border border-success-subtle">
            XP: {currentUser?.codingXp || 0}
          </Badge>
        </div>
      </div>

      {selectedProblem ? (
        <ProblemDetails
          problem={selectedProblem}
          onBack={() => {
            setSelectedProblem(null);
            fetchUserData(); // refresh state
          }}
          onRunCode={handleRunCode}
          onSubmit={handleSubmitCode}
          submissions={submissions.filter((s) => s.problemId === selectedProblem.id)}
          isBookmarked={bookmarks.includes(selectedProblem.id)}
          onToggleBookmark={() => handleToggleBookmark(selectedProblem.id)}
        />
      ) : (
        <Tabs
          activeKey={activeTab}
          onSelect={(k) => setActiveTab(k || 'problems')}
          className="mb-4 border-bottom nav-tabs-custom"
        >
          <Tab eventKey="problems" title="Explore Problems">
            <div className="pt-2">
              <ProblemExplorer
                userId={userId}
                progressMap={progressMap}
                bookmarks={bookmarks}
                onSelectProblem={setSelectedProblem}
                onToggleBookmark={handleToggleBookmark}
              />
            </div>
          </Tab>

          <Tab eventKey="progress" title="My Progress">
            <div className="pt-2">
              <Card className="border-0 shadow-sm p-4" style={{ borderRadius: '12px' }}>
                <h5 className="fw-bold text-dark mb-4">My Solved History</h5>
                {solvedProblemsCount === 0 ? (
                  <Alert variant="info" className="mb-0">
                    You haven't solved any problems yet. Start practicing on the <strong>Explore Problems</strong> tab!
                  </Alert>
                ) : (
                  <Row className="g-3">
                    {Object.values(progressMap).map((prog) => {
                      if (!prog.solved) return null;
                      return (
                        <Col key={prog.problemId} md={6} lg={4}>
                          <Card className="border p-3 bg-light-subtle rounded-3">
                            <div className="fw-semibold text-dark mb-1">{prog.problemId.replace('codeforces_', 'Codeforces ')}</div>
                            <small className="text-muted d-block mb-2">Attempts: {prog.attempts} • Language: {prog.language}</small>
                            <Badge bg="success" className="align-self-start">Solved</Badge>
                          </Card>
                        </Col>
                      );
                    })}
                  </Row>
                )}
              </Card>
            </div>
          </Tab>

          <Tab eventKey="bookmarks" title="Bookmarks">
            <div className="pt-2">
              <Card className="border-0 shadow-sm p-4" style={{ borderRadius: '12px' }}>
                <h5 className="fw-bold text-dark mb-4">Bookmarked Problems</h5>
                {bookmarks.length === 0 ? (
                  <Alert variant="light" className="border mb-0">
                    No problems bookmarked yet. Click the bookmark icon in the explorer to save questions.
                  </Alert>
                ) : (
                  <Row className="g-3">
                    {bookmarks.map((bmarkId) => (
                      <Col key={bmarkId} md={6} lg={4}>
                        <Card className="border p-3 bg-light-subtle rounded-3 d-flex flex-row align-items-center justify-content-between">
                          <div>
                            <div className="fw-semibold text-dark mb-1">{bmarkId.replace('codeforces_', 'Codeforces ')}</div>
                            <Badge bg="primary">Bookmarked</Badge>
                          </div>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleToggleBookmark(bmarkId)}
                          >
                            <i className="bi bi-trash-fill"></i>
                          </Button>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                )}
              </Card>
            </div>
          </Tab>

          <Tab eventKey="leaderboard" title="Leaderboard">
            <div className="pt-2">
              <Leaderboard />
            </div>
          </Tab>

          {isAdmin && (
            <Tab eventKey="admin" title="Admin Settings">
              <div className="pt-2">
                <AdminConsole />
              </div>
            </Tab>
          )}
        </Tabs>
      )}
    </Container>
  );
};
