import React, { useState } from 'react';
import { Container, Row, Col, Card, Badge, Table, Form, Spinner, Alert } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { useLeaderboard, LeaderboardEntry } from '../services/leaderboardService';

// Helper to determine badge/color based on rank/stats
const getBadge = (rank: number) => {
  if (rank === 1) return { text: 'Campus Titan 🥇', bg: 'bg-warning text-dark' };
  if (rank === 2) return { text: 'Code Ninja 🥈', bg: 'bg-secondary text-white' };
  if (rank === 3) return { text: 'Algo Master 🥉', bg: 'bg-danger text-white' };
  if (rank <= 10) return { text: 'Rising Star 🌟', bg: 'bg-primary text-white' };
  return { text: 'Consistent Learner', bg: 'bg-info text-white' };
};

export const LeaderboardPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [selectedDept, setSelectedDept] = useState<string>('All');
  
  const { leaderboard, loading, error } = useLeaderboard(selectedDept);

  const podiumTop3 = leaderboard.slice(0, 3);
  const currentUserEntry = currentUser ? leaderboard.find(e => e.id === currentUser.id) : null;

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
          <option value="Computer Science & Engineering">Computer Science & Engineering</option>
          <option value="Computer Science">Computer Science</option>
          <option value="Information Tech">Information Tech</option>
          <option value="Data Science">Data Science</option>
          <option value="Electronics (ECE)">Electronics (ECE)</option>
        </Form.Select>
      </div>

      {error && (
        <Alert variant="danger">
          Error loading leaderboard: {error.message}
        </Alert>
      )}

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3 text-muted">Loading leaderboard...</p>
        </div>
      ) : leaderboard.length === 0 ? (
        <Card className="text-center py-5 shadow-sm border-0 bg-light">
          <Card.Body>
            <i className="bi bi-emoji-frown text-muted" style={{ fontSize: '3rem' }}></i>
            <h5 className="mt-3 text-dark">No students available yet.</h5>
            <p className="text-muted">Once students start practicing, they will appear here.</p>
          </Card.Body>
        </Card>
      ) : (
        <>
          {/* Top 3 Podium Row */}
          {podiumTop3.length > 0 && (
            <Row className="g-3 mb-4 align-items-end justify-content-center">
              {/* Rank 2 - Left */}
              {podiumTop3.length > 1 && (
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
                      <small className="text-muted d-block fs-8 mb-2">{podiumTop3[1].department || 'Student'}</small>
                      <Badge bg="secondary" className="px-2.5 py-1 mb-3">{getBadge(podiumTop3[1].rank).text}</Badge>

                      <div className="bg-light p-2.5 rounded border text-center fs-8">
                        <span className="text-muted d-block">Total Points</span>
                        <strong className="fs-6 text-dark">{podiumTop3[1].totalPoints || 0} pts</strong>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              )}

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
                    <small className="opacity-90 d-block fs-8 mb-2">{podiumTop3[0].department || 'Student'}</small>
                    <Badge bg="warning" text="dark" className="px-3 py-1 fw-bold mb-3">{getBadge(podiumTop3[0].rank).text}</Badge>

                    <div className="bg-white text-dark p-2.5 rounded border text-center fs-8">
                      <span className="text-muted d-block">Champion Points</span>
                      <strong className="fs-5 text-primary fw-extrabold">{podiumTop3[0].totalPoints || 0} pts</strong>
                    </div>
                  </Card.Body>
                </Card>
              </Col>

              {/* Rank 3 - Right */}
              {podiumTop3.length > 2 && (
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
                      <small className="text-muted d-block fs-8 mb-2">{podiumTop3[2].department || 'Student'}</small>
                      <Badge bg="danger" className="px-2.5 py-1 mb-3">{getBadge(podiumTop3[2].rank).text}</Badge>

                      <div className="bg-light p-2.5 rounded border text-center fs-8">
                        <span className="text-muted d-block">Total Points</span>
                        <strong className="fs-6 text-dark">{podiumTop3[2].totalPoints || 0} pts</strong>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              )}
            </Row>
          )}

          {/* User Rank Snapshot Card */}
          {currentUserEntry && (
            <Card className="shadow-sm border-0 bg-light border-start border-4 border-primary mb-4">
              <Card.Body className="p-3.5 d-flex flex-wrap align-items-center justify-content-between gap-3">
                <div className="d-flex align-items-center gap-3">
                  <div className="bg-primary text-white p-3 rounded-circle fw-bold fs-4">
                    #{currentUserEntry.rank}
                  </div>
                  <div>
                    <h6 className="fw-bold text-dark mb-0">Your Current Campus Rank: #{currentUserEntry.rank}</h6>
                    <small className="text-muted fs-8">
                      {currentUserEntry.name} • {currentUserEntry.department || 'Student'} • {currentUserEntry.totalPoints?.toLocaleString() || 0} Total Points
                    </small>
                  </div>
                </div>

                <div className="d-flex align-items-center gap-3 fs-8">
                  <div>
                    <span className="text-muted d-block">Problems Solved</span>
                    <strong className="text-dark">{currentUserEntry.problemsSolved || 0}</strong>
                  </div>
                  <div className="border-start ps-3">
                    <span className="text-muted d-block">Avg Interview Rating</span>
                    <strong className="text-success">{currentUserEntry.interviewScore ? `${currentUserEntry.interviewScore}%` : 'N/A'}</strong>
                  </div>
                </div>
              </Card.Body>
            </Card>
          )}
          {!currentUserEntry && currentUser && (
             <Card className="shadow-sm border-0 bg-light border-start border-4 border-secondary mb-4">
               <Card.Body className="p-3.5 d-flex flex-wrap align-items-center justify-content-between gap-3">
                 <div className="d-flex align-items-center gap-3">
                   <div className="bg-secondary text-white p-3 rounded-circle fw-bold fs-4">
                     --
                   </div>
                   <div>
                     <h6 className="fw-bold text-dark mb-0">Your Current Campus Rank: Unranked</h6>
                     <small className="text-muted fs-8">
                       {currentUser.name} • {currentUser.department || 'Student'} • Start practicing to get ranked!
                     </small>
                   </div>
                 </div>
               </Card.Body>
             </Card>
          )}

          {/* Full Leaderboard Table Card */}
          <Card className="shadow-sm border-0 mb-4">
            <Card.Header className="bg-white py-3 fw-bold fs-6">
              <i className="bi bi-list-ol text-primary me-2"></i> Overall Student Rankings ({leaderboard.length})
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
                  {leaderboard.map((student) => {
                    const badgeInfo = getBadge(student.rank);
                    return (
                      <tr key={student.id} className={student.id === currentUser?.id ? 'table-primary bg-opacity-10 fw-semibold' : ''}>
                        <td className="ps-3 fw-bold text-center">
                          {student.rank === 1 ? '🥇 1' : student.rank === 2 ? '🥈 2' : student.rank === 3 ? '🥉 3' : `#${student.rank}`}
                        </td>
                        <td>
                          <div className="d-flex align-items-center gap-2.5">
                            <div
                              className={`rounded-circle fw-bold d-flex align-items-center justify-content-center ${badgeInfo.bg}`}
                              style={{ width: '32px', height: '32px', fontSize: '0.9rem' }}
                            >
                              {student.name.charAt(0)}
                            </div>
                            <div>
                              <div className="fw-bold text-dark">{student.name}</div>
                              <small className="text-muted fs-8">{badgeInfo.text}</small>
                            </div>
                          </div>
                        </td>
                        <td>{student.department || '-'}</td>
                        <td className="fw-semibold text-primary">{student.problemsSolved || 0} Problems</td>
                        <td>
                          {student.aptitudeScore !== undefined ? (
                            <Badge bg="success-subtle" text="success">{student.aptitudeScore}%</Badge>
                          ) : (
                            <span className="text-muted small">Not Attempted</span>
                          )}
                        </td>
                        <td>
                          {student.interviewScore !== undefined ? (
                            <Badge bg="info-subtle" text="info">{student.interviewScore}%</Badge>
                          ) : (
                            <span className="text-muted small">Not Attempted</span>
                          )}
                        </td>
                        <td className="pe-3 text-end fw-extrabold text-dark fs-6">{student.totalPoints?.toLocaleString() || 0} pts</td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </>
      )}
    </Container>
  );
};
