import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, InputGroup, Alert, Modal } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { createGoogleUserProfile, signInWithGoogle } from '../utils/googleAuth';

interface LoginPageProps {
  onNavigateToRegister: () => void;
  onLoginSuccess: () => void;
  onNavigate: (tab: string) => void;
}

const footerSections = [
  {
    title: 'Contact Us',
    links: ['College Support', 'placementpro01@gmail.com', 'Find us online'],
  },
  {
    title: 'Learning',
    links: ['DSA Preparation', 'Aptitude & Reasoning', 'Programming', 'Core CS Subjects', 'Web Development'],
  },
  {
    title: 'Career',
    links: ['Placement Preparation', 'Interview Preparation', 'Resume Building', 'Mock Interviews', 'Company Preparation'],
  },
  {
    title: 'Company',
    links: ['About Us', 'For Students', 'For Colleges', 'Contact Us', 'Privacy Policy', 'Terms & Conditions'],
  },
  {
    title: 'Resources',
    links: ['Placement Roadmaps', 'Practice Tests', 'Coding Resources', 'Interview Questions', 'Placement Blogs', 'FAQs'],
  },
  {
    title: 'Social Links',
    links: ['LinkedIn', 'GitHub', 'Instagram'],
  },
];

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigateToRegister, onLoginSuccess, onNavigate }) => {
  const { login, continueWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  
  // Validation & Error states
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [loading, setLoading] = useState(false);
  
  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!email.trim()) {
      newErrors.email = 'College email or email address is required.';
    } else if (!emailRegex.test(email)) {
      newErrors.email = 'Please enter a valid email address (e.g. alex@student.edu).';
    }

    if (!password) {
      newErrors.password = 'Password is required.';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setErrors({});

    // Simulate JWT authentication flow
    setTimeout(() => {
      login(email, 'student');
      setLoading(false);
      onLoginSuccess();
    }, 600);
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrors({});

    try {
      const googleProfile = await signInWithGoogle();
      continueWithGoogle(createGoogleUserProfile(googleProfile));
      onLoginSuccess();
    } catch (error) {
      setErrors({
        general:
          error instanceof Error
            ? error.message
            : 'Google authentication failed. Please try again or sign in with email.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (resetEmail.trim() && resetEmail.includes('@')) {
      setResetSent(true);
      setTimeout(() => {
        setResetSent(false);
        setShowForgotModal(false);
        setResetEmail('');
      }, 2500);
    }
  };

  const navigateToPolicy = (event: React.MouseEvent<HTMLAnchorElement>, tab: 'terms' | 'privacy') => {
    event.preventDefault();
    onNavigate(tab);
  };

  return (
    <div style={{ backgroundColor: '#F8FAFC', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }} className="d-flex flex-column">
      <main className="d-flex flex-grow-1 align-items-center py-4 py-lg-5">
        <Container>
          <Row className="justify-content-center">
            <Col lg={10} xl={9}>
              <Card className="border-0 shadow-sm overflow-hidden" style={{ borderRadius: '16px' }}>
                <Row className="g-0">
                {/* Left Side Visual Banner */}
                <Col lg={5} className="d-none d-lg-flex flex-column justify-content-between p-4 p-xl-5 text-white" style={{ backgroundColor: '#2563EB' }}>
                  <div>
                    <div className="d-flex align-items-center gap-2 mb-4">
                      <div className="bg-white text-primary rounded-3 p-2 d-flex align-items-center justify-content-center shadow-xs" style={{ width: '40px', height: '40px' }}>
                        <i className="bi bi-briefcase-fill fs-5" style={{ color: '#2563EB' }}></i>
                      </div>
                      <span className="fw-extrabold fs-4 tracking-tight">Placement<span className="opacity-90 fw-light">Pro</span></span>
                    </div>

                    <h3 className="fw-extrabold text-white mb-3 leading-tight">
                      Supercharge Your Campus Placement Journey
                    </h3>
                    <p className="opacity-85 fs-7 mb-4 leading-relaxed">
                      Access company question banks, practice AI mock interviews, track daily progress, and connect directly with top recruiters.
                    </p>
                  </div>



                  <div className="pt-3 border-top border-white border-opacity-20 d-flex align-items-center justify-content-between fs-8 opacity-75">
                    <span>&copy; 2026 PlacementPro Inc.</span>
                    <span>Student Career Portal</span>
                  </div>
                </Col>

                {/* Right Side Login Form */}
                <Col lg={7} className="bg-white p-4 p-sm-5 d-flex flex-column justify-content-center">
                  <div className="max-w-md mx-auto w-100">
                    <div className="d-flex d-lg-none align-items-center gap-2 mb-4 justify-content-center">
                      <div className="bg-primary text-white rounded-3 p-2 d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px', backgroundColor: '#2563EB' }}>
                        <i className="bi bi-briefcase-fill fs-5"></i>
                      </div>
                      <span className="fw-extrabold fs-4 tracking-tight text-dark">Placement<span className="text-primary" style={{ color: '#2563EB' }}>Pro</span></span>
                    </div>

                    <div className="mb-4 text-center text-lg-start">
                      <h4 className="fw-extrabold text-dark mb-1">Student Portal Login</h4>
                      <p className="text-secondary fs-7">Enter your college credentials to access your dashboard</p>
                    </div>

                    {errors.general && (
                      <Alert variant="danger" dismissible onClose={() => setErrors({})} className="py-2.5 fs-7 rounded-3">
                        <i className="bi bi-exclamation-circle-fill me-2"></i>
                        {errors.general}
                      </Alert>
                    )}

                    <Form onSubmit={handleLogin} noValidate>
                      {/* College Email */}
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold fs-7 text-dark">College Email / Email</Form.Label>
                        <InputGroup hasValidation>
                          <InputGroup.Text className="bg-light text-muted border-end-0">
                            <i className="bi bi-envelope"></i>
                          </InputGroup.Text>
                          <Form.Control
                            type="email"
                            placeholder="e.g. alex.johnson@student.edu"
                            value={email}
                            onChange={(e) => {
                              setEmail(e.target.value);
                              if (errors.email) setErrors({ ...errors, email: undefined });
                            }}
                            isInvalid={!!errors.email}
                            className="border-start-0 ps-0 py-2 fs-7"
                            required
                          />
                          <Form.Control.Feedback type="invalid" className="fs-8 fw-medium">
                            {errors.email}
                          </Form.Control.Feedback>
                        </InputGroup>
                      </Form.Group>

                      {/* Password */}
                      <Form.Group className="mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <Form.Label className="fw-semibold fs-7 text-dark mb-0">Password</Form.Label>
                          <Button
                            variant="link"
                            className="p-0 fs-8 text-decoration-none fw-semibold"
                            style={{ color: '#2563EB' }}
                            onClick={() => setShowForgotModal(true)}
                          >
                            Forgot Password?
                          </Button>
                        </div>
                        <InputGroup hasValidation>
                          <InputGroup.Text className="bg-light text-muted border-end-0">
                            <i className="bi bi-lock"></i>
                          </InputGroup.Text>
                          <Form.Control
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Enter password (min 6 chars)"
                            value={password}
                            onChange={(e) => {
                              setPassword(e.target.value);
                              if (errors.password) setErrors({ ...errors, password: undefined });
                            }}
                            isInvalid={!!errors.password}
                            className="border-start-0 border-end-0 ps-0 py-2 fs-7"
                            required
                          />
                          <Button
                            variant="outline-secondary"
                            className="border-start-0 bg-light text-muted"
                            onClick={() => setShowPassword(!showPassword)}
                            type="button"
                            tabIndex={-1}
                          >
                            <i className={`bi bi-${showPassword ? 'eye-slash' : 'eye'}`}></i>
                          </Button>
                          <Form.Control.Feedback type="invalid" className="fs-8 fw-medium">
                            {errors.password}
                          </Form.Control.Feedback>
                        </InputGroup>
                      </Form.Group>

                      {/* Remember Me */}
                      <div className="d-flex align-items-center justify-content-between mb-4">
                        <Form.Check
                          type="checkbox"
                          id="remember-me-check"
                          label="Remember me on this device"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="fs-7 text-secondary"
                        />
                      </div>

                      {/* Submit Button */}
                      <Button
                        type="submit"
                        disabled={loading}
                        className="w-100 fw-bold py-2.5 rounded-3 text-white border-0 shadow-xs mb-3 transition-all"
                        style={{ backgroundColor: '#2563EB' }}
                      >
                        {loading ? (
                          <span className="d-flex align-items-center justify-content-center gap-2">
                            <span className="spinner-border spinner-border-sm" role="status"></span>
                            <span>Signing In securely...</span>
                          </span>
                        ) : (
                          <span className="d-flex align-items-center justify-content-center gap-2">
                            <span>Log In to Dashboard</span>
                            <i className="bi bi-arrow-right fs-6"></i>
                          </span>
                        )}
                      </Button>

                      {/* Or Divider */}
                      <div className="d-flex align-items-center my-3">
                        <hr className="flex-grow-1 my-0 text-muted opacity-25" />
                        <span className="px-3 fs-8 text-muted fw-bold text-uppercase">Or</span>
                        <hr className="flex-grow-1 my-0 text-muted opacity-25" />
                      </div>

                      {/* Google Login Button */}
                      <Button
                        variant="outline-secondary"
                        type="button"
                        onClick={handleGoogleLogin}
                        disabled={loading}
                        className="w-100 fw-semibold py-2.5 rounded-3 bg-white border hover-bg-light text-dark d-flex align-items-center justify-content-center gap-2.5 fs-7 mb-4 shadow-xs"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24">
                          <path
                            fill="#4285F4"
                            d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                          />
                          <path
                            fill="#34A853"
                            d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.15C3.26 21.3 7.31 24 12 24z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M5.28 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.39l3.99-3.15z"
                          />
                          <path
                            fill="#EA4335"
                            d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.61l3.99 3.15c.95-2.85 3.6-4.96 6.72-4.96z"
                          />
                        </svg>
                        <span>Continue with Google</span>
                      </Button>



                      {/* Don't have an account link */}
                      <div className="text-center">
                        <span className="text-secondary fs-7 me-1">Don't have an account?</span>
                        <Button
                          variant="link"
                          className="p-0 fw-bold fs-7 text-decoration-none"
                          style={{ color: '#2563EB' }}
                          onClick={onNavigateToRegister}
                        >
                          Register Now
                        </Button>
                      </div>
                    </Form>
                  </div>
                </Col>
                </Row>
              </Card>
            </Col>
          </Row>

          {/* Forgot Password Modal */}
          <Modal show={showForgotModal} onHide={() => setShowForgotModal(false)} centered className="rounded-16">
            <Modal.Header closeButton className="border-0 pb-0">
              <Modal.Title className="fw-bold fs-5">Reset Password</Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-4">
              {resetSent ? (
                <Alert variant="success" className="mb-0 fs-7 py-3">
                  <i className="bi bi-check-circle-fill me-2 fs-6"></i>
                  Password reset link has been sent to <strong>{resetEmail}</strong>. Please check your college inbox.
                </Alert>
              ) : (
                <Form onSubmit={handleForgotSubmit}>
                  <p className="text-secondary fs-7 mb-3">
                    Enter your registered college email address and we'll send you instructions to reset your password.
                  </p>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold fs-7">College Email Address</Form.Label>
                    <Form.Control
                      type="email"
                      placeholder="student@college.edu"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      required
                    />
                  </Form.Group>
                  <div className="d-flex justify-content-end gap-2 pt-2">
                    <Button variant="light" size="sm" onClick={() => setShowForgotModal(false)} className="fw-semibold">
                      Cancel
                    </Button>
                    <Button type="submit" size="sm" className="fw-bold text-white" style={{ backgroundColor: '#2563EB' }}>
                      Send Reset Link
                    </Button>
                  </div>
                </Form>
              )}
            </Modal.Body>
          </Modal>
        </Container>
      </main>

      <footer style={{ backgroundColor: '#0B1220' }} className="text-white pt-5 pb-4">
        <Container>
          <Row className="g-4 g-lg-5">
            <Col lg={3} md={6}>
              <div className="d-flex align-items-center gap-2 mb-3">
                <div
                  className="bg-white rounded-3 d-flex align-items-center justify-content-center"
                  style={{ width: '38px', height: '38px' }}
                >
                  <i className="bi bi-briefcase-fill fs-5" style={{ color: '#2563EB' }}></i>
                </div>
                <span className="fw-extrabold fs-4 tracking-tight">Placement<span className="fw-light">Pro</span></span>
              </div>
              <p className="mb-0 fs-7" style={{ color: '#CBD5E1', maxWidth: '260px' }}>
                Your complete platform for placement preparation.
              </p>
            </Col>

            {footerSections.map((section) => (
              <Col key={section.title} lg={section.title === 'Social Links' ? 2 : 3} md={4} sm={6}>
                <h6 className="fw-bold text-white mb-3">{section.title}</h6>
                <ul className="list-unstyled d-grid gap-2 mb-0">
                  {section.links.map((link) => (
                    <li key={link}>
                      <a
                        href={link === 'Terms & Conditions' ? '#terms' : link === 'Privacy Policy' ? '#privacy' : '#'}
                        onClick={(event) => {
                          if (link === 'Terms & Conditions') {
                            navigateToPolicy(event, 'terms');
                            return;
                          }
                          if (link === 'Privacy Policy') {
                            navigateToPolicy(event, 'privacy');
                            return;
                          }
                          event.preventDefault();
                        }}
                        className="text-decoration-none fs-7"
                        style={{ color: '#CBD5E1' }}
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </Col>
            ))}
          </Row>

          <div className="border-top mt-5 pt-4 text-center fs-7" style={{ borderColor: 'rgba(203, 213, 225, 0.18)' }}>
            <span style={{ color: '#CBD5E1' }}>&copy; 2026 PlacementPro. All rights reserved.</span>
          </div>
        </Container>
      </footer>
    </div>
  );
};
