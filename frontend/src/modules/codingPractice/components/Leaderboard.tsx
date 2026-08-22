import React, { useState, useEffect } from 'react';
import { Card, Table, Badge, Spinner, Row, Col } from 'react-bootstrap';
import { LeaderboardEntry } from '../types/problem';
import { getLeaderboard } from '../services/submissionService';

export const Leaderboard: React.FC = () => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const data = await getLeaderboard();
        setEntries(data);
      } catch (e) {
        console.error('Error fetching leaderboard:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  return (
    <Row className="g-4">
      {/* Top 3 Visual Podium */}
      {!loading && entries.length >= 3 && (
        <Col lg={12} className="mb-2">
          <Row className="justify-content-center align-items-end g-3 text-center py-4 bg-light rounded-4">
            {/* #2 */}
            <Col xs={4} md={3} className="order-1">
              <div className="bg-white p-3 rounded-4 shadow-sm border border-light position-relative">
                <Badge bg="secondary" className="position-absolute top-0 start-50 translate-middle-y rounded-circle p-2 fs-8" style={{ width: '28px', height: '28px' }}>2</Badge>
                <div className="fw-bold text-dark fs-7 mt-2 text-truncate">{entries[1].name}</div>
                <small className="text-primary fw-bold d-block fs-8">{entries[1].codingXp} XP</small>
                <small className="text-muted fs-9">{entries[1].problemsSolved} solved</small>
              </div>
            </Col>

            {/* #1 */}
            <Col xs={4} md={3} className="order-2 mb-3">
              <div className="bg-white p-4 rounded-4 shadow border border-warning position-relative" style={{ transform: 'scale(1.08)' }}>
                <Badge bg="warning" text="dark" className="position-absolute top-0 start-50 translate-middle-y rounded-circle p-2 fs-7" style={{ width: '32px', height: '32px' }}>
                  <i className="bi bi-trophy-fill"></i>
                </Badge>
                <div className="fw-bold text-dark fs-7 mt-2 text-truncate">{entries[0].name}</div>
                <small className="text-primary fw-extrabold d-block fs-7">{entries[0].codingXp} XP</small>
                <small className="text-muted fs-8">{entries[0].problemsSolved} solved</small>
              </div>
            </Col>

            {/* #3 */}
            <Col xs={4} md={3} className="order-3">
              <div className="bg-white p-3 rounded-4 shadow-sm border border-light position-relative">
                <Badge bg="danger" className="position-absolute top-0 start-50 translate-middle-y rounded-circle p-2 fs-8" style={{ width: '28px', height: '28px' }}>3</Badge>
                <div className="fw-bold text-dark fs-7 mt-2 text-truncate">{entries[2].name}</div>
                <small className="text-primary fw-bold d-block fs-8">{entries[2].codingXp} XP</small>
                <small className="text-muted fs-9">{entries[2].problemsSolved} solved</small>
              </div>
            </Col>
          </Row>
        </Col>
      )}

      {/* Leaderboard Table List */}
      <Col lg={12}>
        <Card className="border-0 shadow-sm" style={{ borderRadius: '12px' }}>
          <Card.Header className="bg-white py-3 border-bottom">
            <h5 className="fw-bold mb-0 text-dark">
              <i className="bi bi-bar-chart-line text-primary me-2"></i> Coding Practice Leaderboard
            </h5>
          </Card.Header>
          <Card.Body className="p-0">
            {loading ? (
              <div className="text-center py-5">
                <Spinner animation="border" variant="primary" role="status" className="mb-2" />
                <div className="text-muted fs-7">Loading leaderboard rankings...</div>
              </div>
            ) : (
              <div className="table-responsive">
                <Table hover align="center" className="mb-0">
                  <thead>
                    <tr className="text-muted fs-8 fw-semibold bg-light-subtle">
                      <th style={{ width: '80px' }} className="ps-4">Rank</th>
                      <th>Student</th>
                      <th>Problems Solved</th>
                      <th>Streak</th>
                      <th className="pe-4 text-end">XP Rating</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((entry, index) => (
                      <tr key={entry.userId || index}>
                        <td className="ps-4">
                          <span className={`fw-bold fs-7 ${index < 3 ? 'text-primary' : 'text-secondary'}`}>
                            #{index + 1}
                          </span>
                        </td>
                        <td>
                          <div className="d-flex align-items-center gap-2.5">
                            <img
                              src={entry.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                              alt={entry.name}
                              className="rounded-circle border"
                              width="30"
                              height="30"
                              style={{ objectFit: 'cover' }}
                            />
                            <div>
                              <div className="fw-semibold text-dark fs-8">{entry.name}</div>
                              <small className="text-muted fs-9 text-capitalize">{entry.role}</small>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="fw-semibold fs-8">{entry.problemsSolved} Solved</span>
                        </td>
                        <td>
                          <Badge bg="danger-subtle" text="danger" className="border border-danger-subtle px-2.5 py-1.5 fs-9">
                            <i className="bi bi-fire me-1"></i> {entry.streak} days
                          </Badge>
                        </td>
                        <td className="pe-4 text-end">
                          <span className="fw-bold fs-7 text-primary">{entry.codingXp} XP</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
};
