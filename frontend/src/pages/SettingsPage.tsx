import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Tabs, Tab, Badge, Alert } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { NotificationToast } from '../components/common/NotificationToast';

export const SettingsPage: React.FC = () => {
  const { currentUser, updateProfile } = useAuth();
  const { theme, setTheme, toggleTheme } = useTheme();

  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [phone, setPhone] = useState(currentUser?.phone || '+1 (555) 234-5678');
  const [department, setDepartment] = useState(currentUser?.department || 'Computer Science');
  const [batchYear, setBatchYear] = useState(currentUser?.batchYear || '2026');

  // Preferences
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [driveNotifications, setDriveNotifications] = useState(true);
  const [interviewReminders, setInterviewReminders] = useState(true);
  const [whatsappAlerts, setWhatsappAlerts] = useState(false);

  // Security
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({ name, email, phone, department, batchYear });
    setToastMessage('Profile details updated successfully!');
    setShowToast(true);
  };

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    setToastMessage('Notification preferences saved!');
    setShowToast(true);
  };

  const handleSaveSecurity = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert('New password and confirm password do not match.');
      return;
    }
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setToastMessage('Security password updated successfully!');
    setShowToast(true);
  };

  return (
    <Container fluid className="px-0">
      <div className="mb-4">
        <h3 className="fw-bold mb-1">Account & Portal Settings</h3>
        <p className="text-muted mb-0">Manage your profile, placement drive notifications, security, and portal preferences.</p>
      </div>

      <Row className="g-4">
        <Col lg={3}>
          <Card className="shadow-sm border-0 text-center p-3 mb-4">
            <Card.Body>
              <div
                className="rounded-circle bg-primary text-white fw-bold d-flex align-items-center justify-content-center mx-auto mb-3 shadow-sm"
                style={{ width: '80px', height: '80px', fontSize: '2rem' }}
              >
                {currentUser?.name.charAt(0) || 'U'}
              </div>
              <h6 className="fw-bold text-dark mb-0">{currentUser?.name}</h6>
              <small className="text-muted d-block mb-2">{currentUser?.email}</small>
              <Badge bg="primary" className="px-2.5 py-1 text-uppercase fs-8">
                {currentUser?.role}
              </Badge>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={9}>
          <Card className="shadow-sm border-0">
            <Card.Header className="bg-white py-3">
              <Tabs defaultActiveKey="profile" id="settings-tabs" className="nav-tabs-sm">
                <Tab eventKey="profile" title="Profile Details" />
                <Tab eventKey="notifications" title="Notifications & Alerts" />
                <Tab eventKey="security" title="Security & Password" />
              </Tabs>
            </Card.Header>

            <Card.Body className="p-4">
              {/* Profile Form */}
              <Form onSubmit={handleSaveProfile} className="mb-4">
                <h6 className="fw-bold text-dark mb-3">Personal & Academic Information</h6>
                <Row className="g-3 mb-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fs-8 fw-semibold">Full Name</Form.Label>
                      <Form.Control
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fs-8 fw-semibold">Email Address</Form.Label>
                      <Form.Control
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fs-8 fw-semibold">Phone Number</Form.Label>
                      <Form.Control
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fs-8 fw-semibold">Department / Branch</Form.Label>
                      <Form.Select
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                      >
                        <option value="Computer Science">Computer Science & Eng.</option>
                        <option value="Information Tech">Information Technology</option>
                        <option value="Electronics (ECE)">Electronics (ECE)</option>
                        <option value="Data Science">Data Science</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fs-8 fw-semibold">Graduation Batch Year</Form.Label>
                      <Form.Select
                        value={batchYear}
                        onChange={(e) => setBatchYear(e.target.value)}
                      >
                        <option value="2025">2025 Batch</option>
                        <option value="2026">2026 Batch</option>
                        <option value="2027">2027 Batch</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <Button variant="primary" type="submit" className="fw-bold px-4 py-2">
                  <i className="bi bi-save me-1.5"></i> Save Profile Changes
                </Button>
              </Form>

              <hr className="my-4" />

              {/* Appearance & Global Theme Switcher */}
              <div className="mb-4">
                <h6 className="fw-bold text-dark mb-1">Appearance & Global Theme</h6>
                <p className="text-muted fs-8 mb-3">Choose how PlacementPro looks across all pages and modules.</p>

                <Row className="g-3 mb-3">
                  <Col md={6}>
                    <Card
                      className={`cursor-pointer transition-all border-2 p-3 ${
                        theme === 'light' ? 'border-primary bg-primary-subtle' : 'border-secondary bg-white'
                      }`}
                      onClick={() => setTheme('light')}
                    >
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <div className="d-flex align-items-center gap-2">
                          <i className="bi bi-sun-fill text-warning fs-5"></i>
                          <span className="fw-bold text-dark">Light Mode</span>
                        </div>
                        <Form.Check
                          type="radio"
                          id="theme-light-radio"
                          name="theme-radio"
                          checked={theme === 'light'}
                          onChange={() => setTheme('light')}
                        />
                      </div>
                      <small className="text-muted fs-8">
                        Clean, bright layout with crisp dark typography and high-contrast blue accents.
                      </small>
                    </Card>
                  </Col>

                  <Col md={6}>
                    <Card
                      className={`cursor-pointer transition-all border-2 p-3 ${
                        theme === 'dark' ? 'border-primary bg-dark text-white' : 'border-secondary bg-white'
                      }`}
                      onClick={() => setTheme('dark')}
                    >
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <div className="d-flex align-items-center gap-2">
                          <i className="bi bi-moon-stars-fill text-indigo fs-5"></i>
                          <span className={`fw-bold ${theme === 'dark' ? 'text-white' : 'text-dark'}`}>
                            Dark Mode
                          </span>
                        </div>
                        <Form.Check
                          type="radio"
                          id="theme-dark-radio"
                          name="theme-radio"
                          checked={theme === 'dark'}
                          onChange={() => setTheme('dark')}
                        />
                      </div>
                      <small className={`${theme === 'dark' ? 'text-white-50' : 'text-muted'} fs-8`}>
                        Eye-safe dark slate background for late-night coding practice and interview prep.
                      </small>
                    </Card>
                  </Col>
                </Row>
              </div>

              <hr className="my-4" />

              {/* Notifications Form */}
              <Form onSubmit={handleSavePreferences} className="mb-4">
                <h6 className="fw-bold text-dark mb-3">Drive & Interview Notifications</h6>
                <div className="mb-3">
                  <Form.Check
                    type="switch"
                    id="email-alerts-switch"
                    label="Email Drive Announcements"
                    checked={emailAlerts}
                    onChange={(e) => setEmailAlerts(e.target.checked)}
                    className="fw-bold mb-1"
                  />
                  <small className="text-muted d-block ms-4 fs-8">
                    Receive instant alerts when companies post eligible jobs for your CGPA range.
                  </small>
                </div>

                <div className="mb-3">
                  <Form.Check
                    type="switch"
                    id="drive-notifications-switch"
                    label="Application Status Push Notifications"
                    checked={driveNotifications}
                    onChange={(e) => setDriveNotifications(e.target.checked)}
                    className="fw-bold mb-1"
                  />
                  <small className="text-muted d-block ms-4 fs-8">
                    Get real-time updates when recruiters shortlist your profile or publish interview schedules.
                  </small>
                </div>

                <div className="mb-3">
                  <Form.Check
                    type="switch"
                    id="interview-reminders-switch"
                    label="Calendar & SMS Interview Reminders"
                    checked={interviewReminders}
                    onChange={(e) => setInterviewReminders(e.target.checked)}
                    className="fw-bold mb-1"
                  />
                  <small className="text-muted d-block ms-4 fs-8">
                    Receive reminders 2 hours prior to online aptitude tests and technical interview rounds.
                  </small>
                </div>

                <Button variant="outline-primary" type="submit" className="fw-bold px-4 py-1.5 fs-8">
                  Update Preferences
                </Button>
              </Form>

              <hr className="my-4" />

              {/* Security Form */}
              <Form onSubmit={handleSaveSecurity}>
                <h6 className="fw-bold text-dark mb-3">Account Security & Password</h6>
                <Row className="g-3 mb-3">
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label className="fs-8 fw-semibold">Current Password</Form.Label>
                      <Form.Control
                        type="password"
                        placeholder="••••••••"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                      />
                    </Form.Group>
                  </Col>

                  <Col md={4}>
                    <Form.Group>
                      <Form.Label className="fs-8 fw-semibold">New Password</Form.Label>
                      <Form.Control
                        type="password"
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                    </Form.Group>
                  </Col>

                  <Col md={4}>
                    <Form.Group>
                      <Form.Label className="fs-8 fw-semibold">Confirm Password</Form.Label>
                      <Form.Control
                        type="password"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Button variant="outline-secondary" type="submit" className="fw-bold px-4 py-1.5 fs-8">
                  Update Password
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <NotificationToast
        show={showToast}
        message={toastMessage || 'Settings updated successfully!'}
        variant="success"
        onClose={() => setShowToast(false)}
      />
    </Container>
  );
};
