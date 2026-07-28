import React, { useState } from 'react';
import { Container, Row, Col, Card, Badge, Button, Modal, Form } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { InterviewSchedule } from '../types';
import { formatDate } from '../utils/formatters';
import { NotificationToast } from '../components/common/NotificationToast';

export const InterviewsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [schedules, setSchedules] = useState<InterviewSchedule[]>([
    {
      id: 'sch-1',
      jobId: 'job-1',
      companyName: 'TechCorp Solutions',
      roundName: 'Technical Interview - Round 1',
      date: '2026-08-20',
      time: '10:00 AM - 11:30 AM',
      mode: 'Online',
      venueOrLink: 'https://meet.placementpro.edu/techcorp-r1',
      studentIds: ['usr-1'],
    },
    {
      id: 'sch-2',
      jobId: 'job-2',
      companyName: 'DataPulse Analytics',
      roundName: 'Online Coding Assessment',
      date: '2026-08-18',
      time: '02:00 PM - 03:30 PM',
      mode: 'Online',
      venueOrLink: 'https://assess.datapulse.com/test-room-88',
      studentIds: ['usr-1'],
    },
    {
      id: 'sch-3',
      jobId: 'job-3',
      companyName: 'CloudScale Dynamics',
      roundName: 'System Architecture & HR Round',
      date: '2026-08-25',
      time: '11:00 AM - 12:00 PM',
      mode: 'In-Person',
      venueOrLink: 'Campus Placement Cell, Block C - Hall 102',
      studentIds: ['usr-1'],
    },
  ]);

  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    companyName: '',
    roundName: '',
    date: '',
    time: '10:00 AM',
    mode: 'Online' as 'Online' | 'In-Person',
    venueOrLink: '',
  });

  const [showToast, setShowToast] = useState(false);

  const handleAddSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    const created: InterviewSchedule = {
      id: `sch-${Date.now()}`,
      jobId: 'job-1',
      ...newSchedule,
      studentIds: ['usr-1'],
    };
    setSchedules([created, ...schedules]);
    setShowScheduleModal(false);
    setShowToast(true);
  };

  return (
    <Container fluid className="px-0">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div>
          <h3 className="fw-bold mb-1">Interview & Assessment Schedule</h3>
          <p className="text-muted mb-0">Upcoming drive rounds, venue information, and online assessment links.</p>
        </div>
        {(currentUser.role === 'recruiter' || currentUser.role === 'tpo') && (
          <Button variant="primary" className="fw-semibold" onClick={() => setShowScheduleModal(true)}>
            <i className="bi bi-calendar-plus me-2"></i> Schedule Round
          </Button>
        )}
      </div>

      <Row className="g-4">
        {schedules.map((sch) => (
          <Col key={sch.id} md={6} xl={4}>
            <Card className="shadow-sm border-0 h-100">
              <Card.Header className="bg-white fw-bold py-3 d-flex justify-content-between align-items-center">
                <span className="text-primary">{sch.companyName}</span>
                <Badge bg={sch.mode === 'Online' ? 'info' : 'secondary'}>{sch.mode}</Badge>
              </Card.Header>
              <Card.Body className="p-4 d-flex flex-column">
                <h5 className="fw-bold text-dark mb-2">{sch.roundName}</h5>
                <div className="bg-light p-3 rounded mb-3 fs-7">
                  <div className="mb-2">
                    <i className="bi bi-calendar3 me-2 text-primary"></i>
                    <strong>Date:</strong> {formatDate(sch.date)}
                  </div>
                  <div className="mb-2">
                    <i className="bi bi-clock me-2 text-warning"></i>
                    <strong>Time:</strong> {sch.time}
                  </div>
                  <div>
                    <i className="bi bi-geo-alt me-2 text-danger"></i>
                    <strong>Venue/Link:</strong> {sch.venueOrLink}
                  </div>
                </div>

                <div className="mt-auto">
                  {sch.mode === 'Online' ? (
                    <Button
                      variant="success"
                      size="sm"
                      className="w-100 fw-semibold"
                      href={sch.venueOrLink}
                      target="_blank"
                    >
                      <i className="bi bi-camera-video me-2"></i> Join Online Round
                    </Button>
                  ) : (
                    <Button variant="outline-dark" size="sm" className="w-100 fw-semibold" disabled>
                      <i className="bi bi-building me-2"></i> On-Campus Venue Confirmed
                    </Button>
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Schedule Modal for Recruiters/TPO */}
      <Modal show={showScheduleModal} onHide={() => setShowScheduleModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fs-6 fw-bold">Schedule Interview / Assessment</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleAddSchedule}>
          <Modal.Body className="p-4">
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Company Name</Form.Label>
              <Form.Control
                type="text"
                required
                placeholder="e.g. TechCorp Solutions"
                value={newSchedule.companyName}
                onChange={(e) => setNewSchedule({ ...newSchedule, companyName: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Round Title</Form.Label>
              <Form.Control
                type="text"
                required
                placeholder="e.g. Technical Round 2 / HR Assessment"
                value={newSchedule.roundName}
                onChange={(e) => setNewSchedule({ ...newSchedule, roundName: e.target.value })}
              />
            </Form.Group>
            <Row className="g-2 mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Date</Form.Label>
                  <Form.Control
                    type="date"
                    required
                    value={newSchedule.date}
                    onChange={(e) => setNewSchedule({ ...newSchedule, date: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Time Slot</Form.Label>
                  <Form.Control
                    type="text"
                    required
                    placeholder="e.g. 10:00 AM - 11:30 AM"
                    value={newSchedule.time}
                    onChange={(e) => setNewSchedule({ ...newSchedule, time: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Mode</Form.Label>
              <Form.Select
                value={newSchedule.mode}
                onChange={(e) => setNewSchedule({ ...newSchedule, mode: e.target.value as 'Online' | 'In-Person' })}
              >
                <option value="Online">Online</option>
                <option value="In-Person">In-Person</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Venue Location or Video Link</Form.Label>
              <Form.Control
                type="text"
                required
                placeholder="e.g. https://meet.google.com/xyz or Hall 3B"
                value={newSchedule.venueOrLink}
                onChange={(e) => setNewSchedule({ ...newSchedule, venueOrLink: e.target.value })}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" size="sm" onClick={() => setShowScheduleModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Publish Schedule
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <NotificationToast
        show={showToast}
        message="Interview round successfully scheduled and sent to candidates!"
        variant="success"
        onClose={() => setShowToast(false)}
      />
    </Container>
  );
};
