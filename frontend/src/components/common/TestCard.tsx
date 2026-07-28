import React from 'react';
import { Card, Badge, Button, ProgressBar } from 'react-bootstrap';

interface TestCardProps {
  id: string;
  title: string;
  category: string;
  durationMinutes: number;
  totalQuestions: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  passingPercentage: number;
  userBestScore?: number;
  status?: 'Not Started' | 'In Progress' | 'Completed';
  onStartTest: (testId: string) => void;
}

export const TestCard: React.FC<TestCardProps> = ({
  id,
  title,
  category,
  durationMinutes,
  totalQuestions,
  difficulty,
  passingPercentage,
  userBestScore,
  status = 'Not Started',
  onStartTest
}) => {
  const getDifficultyBadge = () => {
    switch (difficulty) {
      case 'Easy':
        return <Badge bg="success" className="px-2 py-1 fs-8">Easy</Badge>;
      case 'Medium':
        return <Badge bg="warning" text="dark" className="px-2 py-1 fs-8">Medium</Badge>;
      case 'Hard':
        return <Badge bg="danger" className="px-2 py-1 fs-8">Hard</Badge>;
    }
  };

  return (
    <Card className="shadow-sm border-0 h-100 hover-lift">
      <Card.Body className="p-3.5 d-flex flex-column">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <div>
            <Badge bg="secondary" className="px-2 py-0.5 fs-8 text-uppercase mb-1">{category}</Badge>
            <h6 className="fw-bold text-dark mb-0">{title}</h6>
          </div>
          {getDifficultyBadge()}
        </div>

        <div className="d-flex align-items-center gap-3 text-muted fs-8 mb-3">
          <span><i className="bi bi-clock me-1 text-primary"></i>{durationMinutes} Mins</span>
          <span><i className="bi bi-question-circle me-1 text-info"></i>{totalQuestions} Questions</span>
          <span><i className="bi bi-check2-circle me-1 text-success"></i>Pass: {passingPercentage}%</span>
        </div>

        {userBestScore !== undefined && (
          <div className="bg-light p-2.5 rounded mb-3 border">
            <div className="d-flex justify-content-between align-items-center fs-8 fw-semibold mb-1">
              <span>Your Best Attempt</span>
              <span className={userBestScore >= passingPercentage ? 'text-success' : 'text-danger'}>
                {userBestScore}% {userBestScore >= passingPercentage ? '(Passed)' : '(Failed)'}
              </span>
            </div>
            <ProgressBar
              now={userBestScore}
              variant={userBestScore >= passingPercentage ? 'success' : 'danger'}
              style={{ height: '6px' }}
            />
          </div>
        )}

        <div className="mt-auto">
          <Button
            variant={status === 'Completed' ? 'outline-success' : 'primary'}
            size="sm"
            className="w-100 fw-bold py-1.5 fs-8"
            onClick={() => onStartTest(id)}
          >
            {status === 'Completed' ? (
              <><i className="bi bi-arrow-repeat me-1"></i> Retake Practice Assessment</>
            ) : (
              <><i className="bi bi-play-circle-fill me-1"></i> Start Assessment</>
            )}
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
};
