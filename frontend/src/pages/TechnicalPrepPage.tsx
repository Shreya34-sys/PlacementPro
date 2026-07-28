import React, { useState } from 'react';
import { Container, Row, Col, Card, Button, Badge, Tab, Nav, Accordion, ProgressBar } from 'react-bootstrap';

interface TechnicalPrepPageProps {
  onNavigate?: (tab: string) => void;
}

interface SubjectModule {
  id: string;
  title: string;
  icon: string;
  color: string;
  topicsCount: number;
  completedPercent: number;
  description: string;
  keyTopics: string[];
  sampleQuestions: {
    q: string;
    ans: string;
    code?: string;
  }[];
}

const subjects: SubjectModule[] = [
  {
    id: 'dbms',
    title: 'DBMS & SQL',
    icon: '🗄️',
    color: 'primary',
    topicsCount: 18,
    completedPercent: 60,
    description: 'Relational Model, Normalization (1NF to 5NF), Indexing, ACID Properties, Transactions, SQL Joins & Subqueries.',
    keyTopics: ['ER Diagrams & Relational Algebra', 'ACID Properties & Concurrency', 'Normalization (1NF, 2NF, 3NF, BCNF)', 'Indexing & B-Trees', 'SQL Joins & Group By'],
    sampleQuestions: [
      {
        q: 'What is the difference between WHERE and HAVING clause in SQL?',
        ans: 'WHERE clause is used to filter rows before aggregation takes place, whereas HAVING clause filters groups after the GROUP BY clause executes.',
        code: `SELECT department, COUNT(*) \nFROM employees \nWHERE salary > 50000 \nGROUP BY department \nHAVING COUNT(*) > 5;`,
      },
      {
        q: 'What are ACID properties in database transactions?',
        ans: 'Atomicity (All or Nothing), Consistency (Valid State), Isolation (Concurrent execution protection), Durability (Persisted changes).',
      },
    ],
  },
  {
    id: 'os',
    title: 'Operating Systems',
    icon: '🖥️',
    color: 'info',
    topicsCount: 15,
    completedPercent: 40,
    description: 'Process Management, CPU Scheduling, Synchronization, Semaphores, Deadlocks, Memory Management, Virtual Memory & Paging.',
    keyTopics: ['Process vs Thread', 'CPU Scheduling Algorithms', 'Semaphores & Mutex', 'Deadlock Detection & Banker Algorithm', 'Paging & Page Replacement'],
    sampleQuestions: [
      {
        q: 'What is the difference between a Process and a Thread?',
        ans: 'A process is an execution unit with its own virtual address space. A thread is a lightweight execution unit within a process that shares memory with sibling threads.',
      },
      {
        q: 'What are the 4 necessary conditions for Deadlock?',
        ans: '1. Mutual Exclusion, 2. Hold and Wait, 3. No Preemption, 4. Circular Wait.',
      },
    ],
  },
  {
    id: 'cn',
    title: 'Computer Networks',
    icon: '🌐',
    color: 'success',
    topicsCount: 14,
    completedPercent: 50,
    description: 'OSI Model (7 Layers), TCP/IP Suite, HTTP/HTTPS, DNS, IP Addressing & Subnetting, TCP 3-Way Handshake, Socket Programming.',
    keyTopics: ['OSI 7 Layers vs TCP/IP', 'TCP vs UDP Protocols', 'HTTP / HTTPS & SSL/TLS', 'DNS Lookup Process', 'IPv4 Subnetting'],
    sampleQuestions: [
      {
        q: 'Explain the TCP 3-Way Handshake process.',
        ans: '1. SYN: Client sends SYN packet to server. 2. SYN-ACK: Server responds with SYN-ACK. 3. ACK: Client sends ACK back to establish reliable connection.',
      },
    ],
  },
  {
    id: 'oop',
    title: 'Object-Oriented Programming (OOP)',
    icon: '🧩',
    color: 'warning',
    topicsCount: 12,
    completedPercent: 75,
    description: '4 Pillars of OOP: Abstraction, Encapsulation, Inheritance, Polymorphism. Design Patterns (Singleton, Factory, Observer).',
    keyTopics: ['Encapsulation vs Abstraction', 'Method Overloading vs Overriding', 'Interfaces vs Abstract Classes', 'Solid Principles', 'Design Patterns'],
    sampleQuestions: [
      {
        q: 'What is the difference between Abstract Class and Interface in Java/TypeScript?',
        ans: 'An abstract class can have state (instance fields) and default implemented methods. An interface specifies a pure contract of method signatures.',
      },
    ],
  },
  {
    id: 'fullstack',
    title: 'Java / JS / React / Node.js',
    icon: '⚡',
    color: 'danger',
    topicsCount: 25,
    completedPercent: 35,
    description: 'Java Collections Framework, JS Event Loop & Promises, React Virtual DOM & Hooks, Node.js Async I/O & Express routes.',
    keyTopics: ['JS Closures & Event Loop', 'React useEffect & Virtual DOM', 'Java HashMap Internals', 'Node.js Non-Blocking I/O'],
    sampleQuestions: [
      {
        q: 'How does the JavaScript Event Loop handle asynchronous code?',
        ans: 'JS executes synchronous code in the Call Stack. Async tasks (Promises/setTimeout) are queued in Microtask/Macrotask queues and pushed back to the Call Stack when empty.',
      },
    ],
  },
];

export const TechnicalPrepPage: React.FC<TechnicalPrepPageProps> = ({ onNavigate }) => {
  const [selectedSubject, setSelectedSubject] = useState<SubjectModule>(subjects[0]);

  return (
    <Container fluid className="px-0">
      {/* Top Breadcrumb Header */}
      <div className="mb-4 bg-white p-3.5 rounded-3 shadow-xs border">
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb mb-1 fs-7">
            <li className="breadcrumb-item">
              <a
                href="#dashboard"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate && onNavigate('dashboard');
                }}
                className="text-decoration-none text-primary fw-medium"
              >
                <img src="https://img.icons8.com/?size=100&id=aVHe2jHuORcA&format=png&color=000000" alt="Dashboard" width="16" height="16" referrerPolicy="no-referrer" className="me-1 align-text-bottom" style={{ objectFit: 'contain' }} />
                Dashboard
              </a>
            </li>
            <li className="breadcrumb-item">
              <a
                href="#placement-prep"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate && onNavigate('placement-prep');
                }}
                className="text-decoration-none text-primary fw-medium"
              >
                📚 Placement Preparation
              </a>
            </li>
            <li className="breadcrumb-item active text-secondary" aria-current="page">
              💻 Technical Preparation
            </li>
          </ol>
        </nav>
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div>
            <h3 className="fw-bold text-dark mb-1">💻 Technical CS Core Preparation</h3>
            <p className="text-muted mb-0 fs-7">
              Master core Computer Science subjects: DBMS, OS, Computer Networks, OOP, Java, JavaScript, React, and Node.js.
            </p>
          </div>
          <Button
            variant="outline-primary"
            size="sm"
            className="fw-bold px-3"
            onClick={() => onNavigate && onNavigate('placement-prep')}
          >
            <i className="bi bi-arrow-left me-1"></i> Back to Placement Prep
          </Button>
        </div>
      </div>

      {/* Grid of Subject Cards */}
      <Row className="g-3 mb-4">
        {subjects.map((subj) => {
          const isSelected = selectedSubject.id === subj.id;
          return (
            <Col key={subj.id} md={6} lg={2.4 as any} className="col-12 col-md-6 col-lg">
              <Card
                onClick={() => setSelectedSubject(subj)}
                className={`h-100 border cursor-pointer transition-all hover-lift rounded-3 ${
                  isSelected ? 'border-primary shadow-sm bg-primary-subtle' : 'bg-white'
                }`}
              >
                <Card.Body className="p-3 text-center d-flex flex-column justify-content-between">
                  <div>
                    <span className="fs-1 d-block mb-2">{subj.icon}</span>
                    <h6 className="fw-bold text-dark mb-1">{subj.title}</h6>
                    <small className="text-muted d-block mb-2 fs-8">{subj.topicsCount} Modules</small>
                  </div>
                  <div>
                    <ProgressBar now={subj.completedPercent} style={{ height: '5px' }} variant={subj.color} className="mb-1" />
                    <span className="fs-8 fw-bold text-secondary">{subj.completedPercent}% Progress</span>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          );
        })}
      </Row>

      {/* Selected Subject Main View */}
      <Card className="shadow-xs border-0 rounded-16 overflow-hidden mb-4">
        <Card.Header className="bg-dark text-white p-4">
          <div className="d-flex align-items-center gap-3">
            <span className="display-5 bg-white bg-opacity-10 p-2 rounded-3">{selectedSubject.icon}</span>
            <div>
              <h3 className="fw-bold text-white mb-1">{selectedSubject.title} Module</h3>
              <p className="text-white-50 mb-0 fs-7">{selectedSubject.description}</p>
            </div>
          </div>
        </Card.Header>

        <Card.Body className="p-4">
          <Row className="g-4">
            <Col lg={5}>
              <h6 className="fw-bold text-dark mb-3">🎯 Core Topics Breakdown</h6>
              <div className="d-flex flex-column gap-2.5 mb-4">
                {selectedSubject.keyTopics.map((topic, idx) => (
                  <div key={idx} className="p-3 bg-light rounded-3 border d-flex align-items-center justify-content-between">
                    <span className="fs-7 fw-semibold text-dark">
                      <i className="bi bi-check-circle-fill text-success me-2"></i> {topic}
                    </span>
                    <Badge bg="primary">Topic {idx + 1}</Badge>
                  </div>
                ))}
              </div>

              <Card className="bg-primary bg-opacity-10 border-primary border-opacity-25 p-3 rounded-3">
                <h6 className="fw-bold text-primary mb-1"><i className="bi bi-award me-1"></i> Quick Practice Tip</h6>
                <p className="fs-7 text-dark mb-0">
                  Focus on explaining concepts clearly using real-world analogies during technical interviews.
                </p>
              </Card>
            </Col>

            <Col lg={7}>
              <h6 className="fw-bold text-dark mb-3">❓ High-Frequency Technical Interview Questions</h6>
              <Accordion defaultActiveKey="0">
                {selectedSubject.sampleQuestions.map((sq, idx) => (
                  <Accordion.Item key={idx} eventKey={idx.toString()}>
                    <Accordion.Header>
                      <span className="fw-semibold text-dark fs-7">Q{idx + 1}: {sq.q}</span>
                    </Accordion.Header>
                    <Accordion.Body className="bg-light fs-7">
                      <p className="text-dark mb-2 fw-medium">{sq.ans}</p>
                      {sq.code && (
                        <pre className="p-3 bg-dark text-light rounded-3 font-monospace fs-8 mb-0">
                          <code>{sq.code}</code>
                        </pre>
                      )}
                    </Accordion.Body>
                  </Accordion.Item>
                ))}
              </Accordion>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </Container>
  );
};
