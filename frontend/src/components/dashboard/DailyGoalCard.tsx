import React, { useState } from 'react';
import { Card, ProgressBar, Button, Badge, Modal, Form } from 'react-bootstrap';

interface DailyGoalCardProps {
  onGoalCompleted?: () => void;
}

export const DailyGoalCard: React.FC<DailyGoalCardProps> = () => {
  const [targetCount, setTargetCount] = useState<number>(3);
  const [completedCount, setCompletedCount] = useState<number>(2);
  const [goalType, setGoalType] = useState<string>('Problems');
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [tempTarget, setTempTarget] = useState<number>(3);
  const [tempType, setTempType] = useState<string>('Problems');

  const progressPercent = Math.min(100, Math.round((completedCount / targetCount) * 100));
  const isCompleted = completedCount >= targetCount;

  const handleIncrement = () => {
    setCompletedCount((prev) => prev + 1);
  };

  const handleSaveGoal = () => {
    setTargetCount(tempTarget);
    setGoalType(tempType);
    if (completedCount > tempTarget) {
      setCompletedCount(tempTarget);
    }
    setShowEditModal(false);
  };

  return (
    <>
      <Card className="bg-white bg-opacity-15 border border-white border-opacity-25 rounded-16 text-white p-3.5 shadow-xs backdrop-blur h-100 d-flex flex-column justify-content-between">
        <div className="d-flex justify-content-between align-items-center mb-2.5">
          <div className="d-flex align-items-center gap-2">
            <span className="fs-5 leading-none"> </span>
            <div>
              <span className="fw-bold fs-8 tracking-wider text-uppercase text-white-50 d-block leading-none">Daily Goal</span>
              <span className="fw-bold fs-7 text-white leading-tight">Solve {targetCount} {goalType}</span>
            </div>
          </div>
          <Badge
            bg={isCompleted ? 'success' : 'warning'}
            text={isCompleted ? 'white' : 'dark'}
            className="fw-bold px-2.5 py-1.5 fs-8 rounded-pill shadow-xs"
          >
            {isCompleted ? ' Done!' : 'In Progress'}
          </Badge>
        </div>

        <div className="my-2">
          <div className="d-flex justify-content-between align-items-center mb-1.5">
            <span className="fs-8 fw-semibold text-white-50">Today's Progress</span>
            <span className="fw-extrabold fs-7 text-warning">
              {completedCount} of {targetCount} {goalType}
            </span>
          </div>

          <ProgressBar
            now={progressPercent}
            variant={isCompleted ? 'success' : 'warning'}
            style={{ height: '8px', borderRadius: '4px' }}
            className="bg-black bg-opacity-30"
          />
        </div>

        <div className="d-flex align-items-center gap-2 pt-1">
          <Button
            variant="light"
            size="sm"
            className="fw-bold text-primary py-1.5 px-3 fs-8 flex-grow-1 shadow-xs border-0 d-flex align-items-center justify-content-center gap-1.5"
            onClick={handleIncrement}
            disabled={isCompleted}
          >
            {isCompleted ? (
              <>
                <i className="bi bi-check-circle-fill text-success fs-7"></i>
                <span>Goal Completed!</span>
              </>
            ) : (
              <>
                <i className="bi bi-plus-lg fs-7"></i>
                <span>Log Solved {goalType.slice(0, -1)} (+1)</span>
              </>
            )}
          </Button>

          <Button
            variant="outline-light"
            size="sm"
            className="py-1.5 px-2.5 text-white hover-bg-white-10 border-white border-opacity-30 d-flex align-items-center justify-content-center"
            onClick={() => {
              setTempTarget(targetCount);
              setTempType(goalType);
              setShowEditModal(true);
            }}
            title="Configure Daily Target"
            aria-label="Configure Daily Target"
          >
            <i className="bi bi-gear-fill fs-7"></i>
          </Button>
        </div>
      </Card>

      {/* Modal for setting daily targets */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="sm" centered>
        <Modal.Header closeButton className="bg-primary text-white py-2.5">
          <Modal.Title className="fs-6 fw-bold">
            <i className="bi bi-sliders me-2"></i> Set Daily Target
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-3">
          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold fs-7 text-dark">Target Activity Type</Form.Label>
            <Form.Select
              size="sm"
              value={tempType}
              onChange={(e) => setTempType(e.target.value)}
              className="fw-medium"
            >
              <option value="Problems">Coding Problems</option>
              <option value="Lessons">Aptitude Lessons</option>
              <option value="Quizzes">CS Quizzes</option>
              <option value="Mock Tests">Mock Interviews</option>
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold fs-7 text-dark">Daily Target Count</Form.Label>
            <Form.Select
              size="sm"
              value={tempTarget}
              onChange={(e) => setTempTarget(Number(e.target.value))}
              className="fw-medium"
            >
              <option value={1}>1 per day (Relaxed)</option>
              <option value={2}>2 per day (Recommended)</option>
              <option value={3}>3 per day (Focused)</option>
              <option value={5}>5 per day (Intense)</option>
              <option value={10}>10 per day (Marathon)</option>
            </Form.Select>
          </Form.Group>

          <Button variant="primary" size="sm" className="w-100 fw-bold py-2" onClick={handleSaveGoal}>
            Save Daily Target
          </Button>
        </Modal.Body>
      </Modal>
    </>
  );
};
