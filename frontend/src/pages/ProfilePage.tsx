import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Badge } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { ResumeUploader } from '../components/student/ResumeUploader';
import { NotificationToast } from '../components/common/NotificationToast';

export const ProfilePage: React.FC = () => {
  const { currentUser, updateProfile } = useAuth();

  const [formData, setFormData] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    department: currentUser?.department || 'Computer Science',
    batchYear: currentUser?.batchYear || '2026',
    cgpa: currentUser?.cgpa || 8.8,
    phone: currentUser?.phone || '+1 (555) 234-5678',
    companyName: currentUser?.companyName || '',
  });

  const [skills, setSkills] = useState<string[]>(['React', 'Node.js', 'SQL', 'Data Structures', 'Python']);
  const [newSkill, setNewSkill] = useState('');
  const [showToast, setShowToast] = useState(false);

  if (!currentUser) {
    return (
      <Container className="py-5 text-center">
        <h5 className="fw-bold mb-3">Please sign in to view your profile</h5>
      </Container>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile(formData);
    setShowToast(true);
  };


  const handleAddSkill = () => {
    if (!newSkill.trim()) return;
    setSkills([...skills, newSkill.trim()]);
    setNewSkill('');
  };

  return (
    <Container fluid className="px-0">
      <div className="mb-4">
        <h3 className="fw-bold mb-1">User Profile & Resume Credentials</h3>
        <p className="text-muted mb-0">Update academic parameters, contact information, and placement resume.</p>
      </div>

      <Row className="g-4">
        <Col lg={7}>
          <Card className="shadow-sm border-0">
            <Card.Header className="bg-white fw-bold py-3">
              <i className="bi bi-person-lines-fill text-primary me-2"></i> Profile Specifications
            </Card.Header>
            <Card.Body className="p-4">
              <Form onSubmit={handleSubmit}>
                <Row className="g-3 mb-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-semibold fs-7">Full Name</Form.Label>
                      <Form.Control
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-semibold fs-7">Email Address</Form.Label>
                      <Form.Control type="email" value={formData.email} disabled />
                    </Form.Group>
                  </Col>
                </Row>

                {currentUser.role === 'student' && (
                  <>
                    <Row className="g-3 mb-3">
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="fw-semibold fs-7">Department / Branch</Form.Label>
                          <Form.Select
                            value={formData.department}
                            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                          >
                            <option value="Computer Science">Computer Science</option>
                            <option value="Information Technology">Information Technology</option>
                            <option value="Electronics">Electronics</option>
                            <option value="Electrical">Electrical</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={3}>
                        <Form.Group>
                          <Form.Label className="fw-semibold fs-7">Batch Year</Form.Label>
                          <Form.Control
                            type="text"
                            value={formData.batchYear}
                            onChange={(e) => setFormData({ ...formData, batchYear: e.target.value })}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={3}>
                        <Form.Group>
                          <Form.Label className="fw-semibold fs-7">CGPA Grade</Form.Label>
                          <Form.Control
                            type="number"
                            step="0.1"
                            min="0"
                            max="10"
                            value={formData.cgpa}
                            onChange={(e) => setFormData({ ...formData, cgpa: parseFloat(e.target.value) })}
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  </>
                )}

                <Row className="g-3 mb-4">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-semibold fs-7">Phone Number</Form.Label>
                      <Form.Control
                        type="text"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </Form.Group>
                  </Col>
                  {currentUser.role === 'recruiter' && (
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fw-semibold fs-7">Organization / Company</Form.Label>
                        <Form.Control
                          type="text"
                          value={formData.companyName}
                          onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                        />
                      </Form.Group>
                    </Col>
                  )}
                </Row>

                <Button variant="primary" type="submit" className="fw-bold px-4">
                  Save Changes
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={5}>
          {/* Resume Upload Box */}
          {currentUser.role === 'student' && (
            <div className="mb-4">
              <ResumeUploader resumeUrl={currentUser.resumeUrl} />
            </div>
          )}

          {/* Key Skills */}
          <Card className="shadow-sm border-0">
            <Card.Header className="bg-white fw-bold py-3">
              <i className="bi bi-tools text-primary me-2"></i> Verified Technical Skills
            </Card.Header>
            <Card.Body className="p-4">
              <div className="d-flex flex-wrap gap-2 mb-3">
                {skills.map((skill, idx) => (
                  <Badge key={idx} bg="primary" className="px-3 py-2 fs-7 fw-normal">
                    {skill}
                  </Badge>
                ))}
              </div>

              <div className="d-flex gap-2">
                <Form.Control
                  type="text"
                  placeholder="Add skill (e.g. Docker, AWS)"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                />
                <Button variant="outline-primary" size="sm" onClick={handleAddSkill}>
                  Add
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <NotificationToast
        show={showToast}
        message="Profile details successfully updated!"
        variant="success"
        onClose={() => setShowToast(false)}
      />
    </Container>
  );
};
