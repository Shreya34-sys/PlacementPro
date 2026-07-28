import React, { useState } from 'react';
import { Container, Row, Col, Card, Button, Form, ProgressBar, Badge, Modal, ListGroup } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';

interface StudyTask {
  id: string;
  title: string;
  category: 'DSA' | 'Aptitude' | 'SQL' | 'System Design' | 'HR Prep';
  durationMinutes: number;
  completed: boolean;
  dueDate: string;
  priority: 'High' | 'Medium' | 'Low';
}

const initialTasks: StudyTask[] = [
  {
    id: 'task-1',
    title: 'Solve 5 Easy + 2 Medium Array & Hash Map questions',
    category: 'DSA',
    durationMinutes: 90,
    completed: true,
    dueDate: 'Today',
    priority: 'High'
  },
  {
    id: 'task-2',
    title: 'Practice 20 Quantitative Aptitude questions (Time & Work)',
    category: 'Aptitude',
    durationMinutes: 45,
    completed: true,
    dueDate: 'Today',
    priority: 'Medium'
  },
  {
    id: 'task-3',
    title: 'Review SQL Window Functions (RANK, DENSE_RANK, NTILE)',
    category: 'SQL',
    durationMinutes: 30,
    completed: false,
    dueDate: 'Today',
    priority: 'High'
  },
  {
    id: 'task-4',
    title: 'Complete 1 AI Technical Mock Interview session',
    category: 'HR Prep',
    durationMinutes: 30,
    completed: false,
    dueDate: 'Tomorrow',
    priority: 'High'
  },
  {
    id: 'task-5',
    title: 'Study System Design: Load Balancing & Caching Strategies',
    category: 'System Design',
    durationMinutes: 60,
    completed: false,
    dueDate: 'This Week',
    priority: 'Medium'
  }
];

export const StudyPlannerPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [tasks, setTasks] = useState<StudyTask[]>(initialTasks);
  const [filterCategory, setFilterCategory] = useState<string>('All');
  
  // Pomodoro timer state
  const [timerSeconds, setTimerSeconds] = useState<number>(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [activeTaskTitle, setActiveTaskTitle] = useState<string>('DSA Array Solving');

  // New task modal
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newTaskTitle, setNewTaskTitle] = useState<string>('');
  const [newTaskCategory, setNewTaskCategory] = useState<StudyTask['category']>('DSA');
  const [newTaskDuration, setNewTaskDuration] = useState<number>(30);
  const [newTaskPriority, setNewTaskPriority] = useState<StudyTask['priority']>('Medium');

  const toggleTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t))
    );
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newTask: StudyTask = {
      id: `task-${Date.now()}`,
      title: newTaskTitle.trim(),
      category: newTaskCategory,
      durationMinutes: Number(newTaskDuration),
      completed: false,
      dueDate: 'This Week',
      priority: newTaskPriority
    };

    setTasks([newTask, ...tasks]);
    setNewTaskTitle('');
    setShowAddModal(false);
  };

  const completedCount = tasks.filter((t) => t.completed).length;
  const progressPercent = Math.round((completedCount / Math.max(1, tasks.length)) * 100);

  const filteredTasks = tasks.filter((t) =>
    filterCategory === 'All' ? true : t.category === filterCategory
  );

  return (
    <Container fluid className="px-0">
      {/* Header Bar */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h3 className="fw-bold mb-1 d-flex align-items-center gap-2">
            <i className="bi bi-calendar-check text-primary"></i> Placement Study Planner & Focus Roadmap
          </h3>
          <p className="text-muted mb-0 fs-7">
            Structure your campus interview preparation, track daily targets, and manage timed practice sprints.
          </p>
        </div>

        <Button variant="primary" className="fw-bold px-3 py-2" onClick={() => setShowAddModal(true)}>
          <i className="bi bi-plus-circle me-1.5"></i> Add Custom Study Goal
        </Button>
      </div>

      {/* Overview Cards & Focus Timer Row */}
      <Row className="g-3 mb-4">
        {/* Progress Card */}
        <Col lg={4}>
          <Card className="shadow-sm border-0 h-100 bg-primary bg-gradient text-white">
            <Card.Body className="p-4 d-flex flex-column justify-content-between">
              <div>
                <span className="text-uppercase fw-bold opacity-75 fs-8">Daily Goal Completion</span>
                <h2 className="fw-extrabold my-2">{completedCount} of {tasks.length} Goals Done</h2>
                <p className="fs-8 opacity-90 mb-3">
                  You are performing consistently! Complete 2 more goals to reach your weekly campus prep benchmark.
                </p>
              </div>

              <div>
                <div className="d-flex justify-content-between fs-8 fw-semibold mb-1">
                  <span>Target Rate</span>
                  <span>{progressPercent}%</span>
                </div>
                <ProgressBar now={progressPercent} variant="light" style={{ height: '8px' }} />
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Focus Pomodoro Timer */}
        <Col lg={8}>
          <Card className="shadow-sm border-0 h-100">
            <Card.Header className="bg-white py-3 fw-bold fs-6 d-flex justify-content-between align-items-center">
              <span><i className="bi bi-stopwatch text-danger me-2"></i>25-Minute Focus Sprint Timer</span>
              <Badge bg="danger-subtle" text="danger">Pomodoro Technique</Badge>
            </Card.Header>
            <Card.Body className="p-4 d-flex flex-column justify-content-center align-items-center">
              <span className="text-muted fs-8 mb-1">Active Target: <strong>{activeTaskTitle}</strong></span>
              <div className="display-3 fw-extrabold text-dark font-monospace mb-3">
                {Math.floor(timerSeconds / 60).toString().padStart(2, '0')}:{(timerSeconds % 60).toString().padStart(2, '0')}
              </div>

              <div className="d-flex gap-2">
                <Button
                  variant={isTimerRunning ? 'warning' : 'success'}
                  className="fw-bold px-4 py-2"
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                >
                  <i className={`bi ${isTimerRunning ? 'bi-pause-fill' : 'bi-play-fill'} me-1`}></i>
                  {isTimerRunning ? 'Pause Session' : 'Start Focus Session'}
                </Button>

                <Button
                  variant="outline-secondary"
                  className="fw-bold px-3 py-2"
                  onClick={() => {
                    setIsTimerRunning(false);
                    setTimerSeconds(25 * 60);
                  }}
                >
                  <i className="bi bi-arrow-counterclockwise me-1"></i> Reset
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Task Checklist & Roadmap */}
      <Card className="shadow-sm border-0 mb-4">
        <Card.Header className="bg-white py-3 px-3.5 d-flex flex-wrap align-items-center justify-content-between gap-2 border-bottom">
          <div className="fw-bold text-dark fs-6 d-flex align-items-center gap-2">
            <i className="bi bi-list-task text-primary"></i> Target Preparation Checklist
          </div>

          {/* Filter Pills */}
          <div className="d-flex gap-1.5">
            {['All', 'DSA', 'Aptitude', 'SQL', 'System Design', 'HR Prep'].map((cat) => (
              <Button
                key={cat}
                variant={filterCategory === cat ? 'primary' : 'outline-secondary'}
                size="sm"
                className="fs-8 py-0.5 px-2.5"
                onClick={() => setFilterCategory(cat)}
              >
                {cat}
              </Button>
            ))}
          </div>
        </Card.Header>

        <Card.Body className="p-0">
          <ListGroup variant="flush">
            {filteredTasks.map((t) => (
              <ListGroup.Item
                key={t.id}
                className={`p-3 border-bottom d-flex align-items-center justify-content-between gap-3 ${
                  t.completed ? 'bg-light text-muted' : ''
                }`}
              >
                <div className="d-flex align-items-center gap-3">
                  <Form.Check
                    type="checkbox"
                    id={`task-chk-${t.id}`}
                    checked={t.completed}
                    onChange={() => toggleTask(t.id)}
                    className="fs-5"
                  />
                  <div>
                    <h6 className={`fw-bold mb-0 ${t.completed ? 'text-decoration-line-through text-muted' : 'text-dark'}`}>
                      {t.title}
                    </h6>
                    <div className="d-flex align-items-center gap-2 mt-1 fs-8">
                      <Badge bg="secondary" className="px-2 py-0.5">{t.category}</Badge>
                      <span><i className="bi bi-clock me-1 text-primary"></i>{t.durationMinutes} mins</span>
                      <span><i className="bi bi-calendar3 me-1 text-muted"></i>{t.dueDate}</span>
                    </div>
                  </div>
                </div>

                <div className="d-flex align-items-center gap-2">
                  <Badge bg={t.priority === 'High' ? 'danger' : t.priority === 'Medium' ? 'warning' : 'info'} text={t.priority === 'Medium' ? 'dark' : 'white'} className="fs-8 px-2 py-1">
                    {t.priority} Priority
                  </Badge>

                  <Button
                    variant="outline-primary"
                    size="sm"
                    className="fs-8 py-0.5"
                    onClick={() => {
                      setActiveTaskTitle(t.title);
                      setTimerSeconds(t.durationMinutes * 60);
                      setIsTimerRunning(true);
                    }}
                  >
                    <i className="bi bi-play-circle me-1"></i> Focus
                  </Button>
                </div>
              </ListGroup.Item>
            ))}
          </ListGroup>
        </Card.Body>
      </Card>

      {/* Modal to Add Goal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} centered>
        <Form onSubmit={handleAddTask}>
          <Modal.Header closeButton>
            <Modal.Title className="fs-6 fw-bold">Add Custom Placement Target</Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-4">
            <Form.Group className="mb-3">
              <Form.Label className="fs-8 fw-semibold">Target Title</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g. Solve 3 Dynamic Programming problems on LeetCode"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                required
              />
            </Form.Group>

            <Row className="g-3 mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fs-8 fw-semibold">Category</Form.Label>
                  <Form.Select
                    value={newTaskCategory}
                    onChange={(e) => setNewTaskCategory(e.target.value as any)}
                  >
                    <option value="DSA">DSA</option>
                    <option value="Aptitude">Aptitude</option>
                    <option value="SQL">SQL</option>
                    <option value="System Design">System Design</option>
                    <option value="HR Prep">HR Prep</option>
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fs-8 fw-semibold">Estimated Time (Mins)</Form.Label>
                  <Form.Control
                    type="number"
                    value={newTaskDuration}
                    onChange={(e) => setNewTaskDuration(Number(e.target.value))}
                    min={10}
                    max={240}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label className="fs-8 fw-semibold">Priority</Form.Label>
              <Form.Select
                value={newTaskPriority}
                onChange={(e) => setNewTaskPriority(e.target.value as any)}
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </Form.Select>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" className="fw-bold">
              Save Goal
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};
