import React, { useState } from 'react';
import { Container, Row, Col, Card, Badge, Table, Form, Button } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';

interface LeaderboardEntry {
  rank: number;
  name: string;
  department: string;
  points: number;
  problemsSolved: number;
  aptitudeScore: number;
  interviewRating: number;
  badge: string;
  avatarBg: string;
}

const mockLeaderboard: LeaderboardEntry[] = [
  {
    rank: 1,
    name: 'Aarav Sharma',
    department: 'Computer Science',
    points: 2450,
    problemsSolved: 142,
    aptitudeScore: 98,
    interviewRating: 95,
    badge: 'Campus Titan 🥇',
    avatarBg: 'bg-warning text-dark'
  },
  {
    rank: 2,
    name: 'Priya Patel',
    department: 'Information Tech',
    points: 2310,
    problemsSolved: 128,
    aptitudeScore: 96,
    interviewRating: 92,
    badge: 'Code Ninja 🥈',
    avatarBg: 'bg-secondary text-white'
  },
  {
    rank: 3,
    name: 'Rohan Verma',
    department: 'Data Science',
    points: 2180,
    problemsSolved: 119,
    aptitudeScore: 94,
    interviewRating: 90,
    badge: 'Algo Master 🥉',
    avatarBg: 'bg-danger text-white'
  },
  {
    rank: 4,
    name: 'Shreya Sharma',
    department: 'Computer Science',
    points: 2040,
    problemsSolved: 106,
    aptitudeScore: 92,
    interviewRating: 88,
    badge: 'Rising Star 🌟',
    avatarBg: 'bg-primary text-white'
  },
  {
    rank: 5,
    name: 'Vikram Malhotra',
    department: 'Electronics (ECE)',
    points: 1950,
    problemsSolved: 98,
    aptitudeScore: 90,
    interviewRating: 86,
    badge: 'Problem Solver',
    avatarBg: 'bg-info text-white'
  },
  {
    rank: 6,
    name: 'Ananya Gupta',
    department: 'Computer Science',
    points: 1870,
    problemsSolved: 92,
    aptitudeScore: 88,
    interviewRating: 85,
    badge: 'High Performer',
    avatarBg: 'bg-dark text-white'
  },
  {
    rank: 7,
    name: 'Kabir Das',
    department: 'Information Tech',
    points: 1790,
    problemsSolved: 86,
    aptitudeScore: 86,
    interviewRating: 82,
    badge: 'Consistent Learner',
    avatarBg: 'bg-success text-white'
  }
];

export const LeaderboardPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [selectedDept, setSelectedDept] = useState<string>('All');

  const filteredLeaderboard = mockLeaderboard.filter((entry) =>
    selectedDept === 'All' ? true : entry.department === selectedDept
  );

  const podiumTop3 = mockLeaderboard.slice(0, 3);

  return (
    <Container fluid className="px-0">
      {/* Header Banner */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h3 className="fw-bold mb-1 d-flex align-items-center gap-2">
            <i className="bi bi-trophy-fill text-warning"></i> Campus Placement Leaderboard
          </h3>
          <p className="text-muted mb-0 fs-7">
            Real-time student rankings calculated from Aptitude Tests, Coding Problems, and AI Interview Scores.
          </p>
        </div>

        <Form.Select
          size="sm"
          style={{ width: '220px' }}
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
        >
          <option value="All">All Departments</option>
          <option value="Computer Science">Computer Science</option>
          <option value="Information Tech">Information Tech</option>
          <option value="Data Science">Data Science</option>
          <option value="Electronics (ECE)">Electronics (ECE)</option>
        </Form.Select>
      </div>

      {/* Top 3 Podium Row */}
      <Row className="g-3 mb-4 align-items-end">
        {/* Rank 2 - Left */}
        <Col md={4} className="order-2 order-md-1">
          <Card className="shadow-sm border-0 text-center p-3 h-100 border-top border-4 border-secondary">
            <Card.Body>
              <div className="display-6 fw-extrabold text-secondary mb-1">2nd</div>
              <div
                className="rounded-circle bg-secondary text-white fw-bold d-flex align-items-center justify-content-center mx-auto mb-2 shadow-sm"
                style={{ width: '64px', height: '64px', fontSize: '1.4rem' }}
              >
                {podiumTop3[1].name.charAt(0)}
              </div>
              <h6 className="fw-bold text-dark mb-0">{podiumTop3[1].name}</h6>
              <small className="text-muted d-block fs-8 mb-2">{podiumTop3[1].department}</small>
              <Badge bg="secondary" className="px-2.5 py-1 mb-3">{podiumTop3[1].badge}</Badge>

              <div className="bg-light p-2.5 rounded border text-center fs-8">
                <span className="text-muted d-block">Total Points</span>
                <strong className="fs-6 text-dark">{podiumTop3[1].points} pts</strong>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Rank 1 - Center (Tallest) */}
        <Col md={4} className="order-1 order-md-2">
          <Card className="shadow-lg border-0 text-center p-4 bg-primary bg-gradient text-white transform-scale-105">
            <Card.Body>
              <div className="display-5 fw-extrabold text-warning mb-1">
                <i className="bi bi-crown-fill me-1"></i> 1st
              </div>
              <div
                className="rounded-circle bg-warning text-dark fw-bold d-flex align-items-center justify-content-center mx-auto mb-2 shadow"
                style={{ width: '76px', height: '76px', fontSize: '1.8rem' }}
              >
                {podiumTop3[0].name.charAt(0)}
              </div>
              <h5 className="fw-extrabold mb-0">{podiumTop3[0].name}</h5>
              <small className="opacity-90 d-block fs-8 mb-2">{podiumTop3[0].department}</small>
              <Badge bg="warning" text="dark" className="px-3 py-1 fw-bold mb-3">{podiumTop3[0].badge}</Badge>

              <div className="bg-white text-dark p-2.5 rounded border text-center fs-8">
                <span className="text-muted d-block">Champion Points</span>
                <strong className="fs-5 text-primary fw-extrabold">{podiumTop3[0].points} pts</strong>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Rank 3 - Right */}
        <Col md={4} className="order-3 order-md-3">
          <Card className="shadow-sm border-0 text-center p-3 h-100 border-top border-4 border-danger">
            <Card.Body>
              <div className="display-6 fw-extrabold text-danger mb-1">3rd</div>
              <div
                className="rounded-circle bg-danger text-white fw-bold d-flex align-items-center justify-content-center mx-auto mb-2 shadow-sm"
                style={{ width: '64px', height: '64px', fontSize: '1.4rem' }}
              >
                {podiumTop3[2].name.charAt(0)}
              </div>
              <h6 className="fw-bold text-dark mb-0">{podiumTop3[2].name}</h6>
              <small className="text-muted d-block fs-8 mb-2">{podiumTop3[2].department}</small>
              <Badge bg="danger" className="px-2.5 py-1 mb-3">{podiumTop3[2].badge}</Badge>

              <div className="bg-light p-2.5 rounded border text-center fs-8">
                <span className="text-muted d-block">Total Points</span>
                <strong className="fs-6 text-dark">{podiumTop3[2].points} pts</strong>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* User Rank Snapshot Card */}
      <Card className="shadow-sm border-0 bg-light border-start border-4 border-primary mb-4">
        <Card.Body className="p-3.5 d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div className="d-flex align-items-center gap-3">
            <div className="bg-primary text-white p-3 rounded-circle fw-bold fs-4">
              #4
            </div>
            <div>
              <h6 className="fw-bold text-dark mb-0">Your Current Campus Rank: #4</h6>
              <small className="text-muted fs-8">Shreya Sharma • Computer Science • 2,040 Total Points</small>
            </div>
          </div>

          <div className="d-flex align-items-center gap-3 fs-8">
            <div>
              <span className="text-muted d-block">Problems Solved</span>
              <strong className="text-dark">106 / 150</strong>
            </div>
            <div className="border-start ps-3">
              <span className="text-muted d-block">Avg Interview Rating</span>
              <strong className="text-success">88 %</strong>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Full Leaderboard Table Card */}
      <Card className="shadow-sm border-0 mb-4">
        <Card.Header className="bg-white py-3 fw-bold fs-6">
          <i className="bi bi-list-ol text-primary me-2"></i> Overall Student Rankings ({filteredLeaderboard.length})
        </Card.Header>
        <Card.Body className="p-0">
          <Table responsive hover className="mb-0 align-middle fs-7">
            <thead className="table-light">
              <tr>
                <th className="ps-3 py-3" style={{ width: '80px' }}>Rank</th>
                <th>Candidate Student</th>
                <th>Department</th>
                <th>Coding Solved</th>
                <th>Aptitude Score</th>
                <th>AI Interview Score</th>
                <th className="pe-3 text-end">Total Points</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeaderboard.map((student) => (
                <tr key={student.rank} className={student.rank === 4 ? 'table-primary bg-opacity-10 fw-semibold' : ''}>
                  <td className="ps-3 fw-bold text-center">
                    {student.rank === 1 ? '🥇 1' : student.rank === 2 ? '🥈 2' : student.rank === 3 ? '🥉 3' : `#${student.rank}`}
                  </td>
                  <td>
                    <div className="d-flex align-items-center gap-2.5">
                      <div
                        className={`rounded-circle fw-bold d-flex align-items-center justify-content-center ${student.avatarBg}`}
                        style={{ width: '32px', height: '32px', fontSize: '0.9rem' }}
                      >
                        {student.name.charAt(0)}
                      </div>
                      <div>
                        <div className="fw-bold text-dark">{student.name}</div>
                        <small className="text-muted fs-8">{student.badge}</small>
                      </div>
                    </div>
                  </td>
                  <td>{student.department}</td>
                  <td className="fw-semibold text-primary">{student.problemsSolved} Problems</td>
                  <td><Badge bg="success-subtle" text="success">{student.aptitudeScore}%</Badge></td>
                  <td><Badge bg="info-subtle" text="info">{student.interviewRating}%</Badge></td>
                  <td className="pe-3 text-end fw-extrabold text-dark fs-6">{student.points} pts</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </Container>
  );
};
