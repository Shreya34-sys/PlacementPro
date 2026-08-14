import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, InputGroup, Alert } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { createGoogleUserProfile, signInWithGoogle } from '../utils/googleAuth';

interface RegisterPageProps {
  onNavigateToLogin: () => void;
  onRegisterSuccess: () => void;
  onNavigateToTerms: () => void;
  onNavigateToPrivacy: () => void;
}

type RegisterErrors = {
  fullName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  terms?: string;
  general?: string;
};

const googleIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
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
);

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

export const RegisterPage: React.FC<RegisterPageProps> = ({
  onNavigateToLogin,
  onRegisterSuccess,
  onNavigateToTerms,
  onNavigateToPrivacy,
}) => {
  const { register, continueWithGoogle } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [errors, setErrors] = useState<RegisterErrors>({});
  const [loading, setLoading] = useState(false);

  const clearError = (key: keyof RegisterErrors) => {
    if (errors[key]) {
      setErrors({ ...errors, [key]: undefined });
    }
  };

  const validate = () => {
    const newErrors: RegisterErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required.';
    }

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

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password.';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }

    if (!acceptTerms) {
      newErrors.terms = 'Please agree to the Terms & Conditions and Privacy Policy.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setErrors({});

    setTimeout(() => {
      register({ name: fullName.trim(), email: email.trim(), role: 'student' });
      setLoading(false);
      onRegisterSuccess();
    }, 700);
  };

  const handleGoogleContinue = async () => {
    if (!acceptTerms) {
      setErrors({ terms: 'Please agree to the Terms & Conditions and Privacy Policy.' });
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const googleProfile = await signInWithGoogle();
      continueWithGoogle(createGoogleUserProfile(googleProfile));
      onRegisterSuccess();
    } catch (error) {
      setErrors({
        general:
          error instanceof Error
            ? error.message
            : 'Google signup failed. Please try again or create your account with email.',
      });
    } finally {
      setLoading(false);
    }
  };

  const navigateToTerms = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    event.stopPropagation();
    onNavigateToTerms();
  };

  const navigateToPrivacy = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    event.stopPropagation();
    onNavigateToPrivacy();
  };

  return (
    <div style={{ backgroundColor: '#F8FAFC', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <main className="d-flex align-items-center py-4 py-lg-5" style={{ minHeight: '100vh' }}>
        <Container>
          <Row className="justify-content-center">
            <Col lg={10} xl={9}>
              <Card className="border-0 shadow-sm overflow-hidden" style={{ borderRadius: '16px' }}>
                <Row className="g-0">
                  <Col
                    lg={5}
                    className="d-none d-lg-flex flex-column justify-content-between p-4 p-xl-5 text-white"
                    style={{ backgroundColor: '#2563EB' }}
                  >
                    <div>
                      <div className="d-flex align-items-center gap-2 mb-4">
                        <div
                          className="bg-white text-primary rounded-3 p-2 d-flex align-items-center justify-content-center shadow-xs"
                          style={{ width: '40px', height: '40px' }}
                        >
                          <i className="bi bi-briefcase-fill fs-5" style={{ color: '#2563EB' }}></i>
                        </div>
                        <span className="fw-extrabold fs-4 tracking-tight">
                          Placement<span className="opacity-90 fw-light">Pro</span>
                        </span>
                      </div>

                      <h3 className="fw-extrabold text-white mb-3 leading-tight">
                        Start Your Campus Placement Journey
                      </h3>
                      <p className="opacity-85 fs-7 mb-4 leading-relaxed">
                        Create your student account to practice aptitude, coding, interviews, and track every placement milestone in one focused dashboard.
                      </p>
                    </div>

                    <div className="pt-3 border-top border-white border-opacity-20 d-flex align-items-center justify-content-between fs-8 opacity-75">
                      <span>&copy; 2026 PlacementPro Inc.</span>
                      <span>Student Career Portal</span>
                    </div>
                  </Col>

                  <Col lg={7} className="bg-white p-4 p-sm-5 d-flex flex-column justify-content-center">
                    <div className="max-w-md mx-auto w-100">
                      <div className="d-flex d-lg-none align-items-center gap-2 mb-4 justify-content-center">
                        <div
                          className="bg-primary text-white rounded-3 p-2 d-flex align-items-center justify-content-center"
                          style={{ width: '36px', height: '36px', backgroundColor: '#2563EB' }}
                        >
                          <i className="bi bi-briefcase-fill fs-5"></i>
                        </div>
                        <span className="fw-extrabold fs-4 tracking-tight text-dark">
                          Placement<span className="text-primary" style={{ color: '#2563EB' }}>Pro</span>
                        </span>
                      </div>

                      <div className="mb-4 text-center text-lg-start">
                        <h4 className="fw-extrabold text-dark mb-1">Create Your Student Account</h4>
                        <p className="text-secondary fs-7 mb-0">
                          Register with your college credentials to access your PlacementPro dashboard
                        </p>
                      </div>

                      {(errors.general || errors.terms) && (
                        <Alert
                          variant="danger"
                          dismissible
                          onClose={() => setErrors({ ...errors, general: undefined, terms: undefined })}
                          className="py-2.5 fs-7 rounded-3"
                        >
                          <i className="bi bi-exclamation-circle-fill me-2"></i>
                          {errors.general || errors.terms}
                        </Alert>
                      )}

                      <Form onSubmit={handleRegister} noValidate>
                        <Button
                          variant="outline-secondary"
                          type="button"
                          onClick={handleGoogleContinue}
                          disabled={loading}
                          className="w-100 fw-semibold py-2.5 rounded-3 bg-white border hover-bg-light text-dark d-flex align-items-center justify-content-center gap-2.5 fs-7 mb-3 shadow-xs"
                        >
                          {googleIcon}
                          <span>Continue with Google</span>
                        </Button>

                        <div className="d-flex align-items-center my-3">
                          <hr className="flex-grow-1 my-0 text-muted opacity-25" />
                          <span className="px-3 fs-8 text-muted fw-bold text-uppercase">Or</span>
                          <hr className="flex-grow-1 my-0 text-muted opacity-25" />
                        </div>

                        <Form.Group className="mb-3">
                          <Form.Label className="fw-semibold fs-7 text-dark">Full Name</Form.Label>
                          <InputGroup hasValidation>
                            <InputGroup.Text className="bg-light text-muted border-end-0">
                              <i className="bi bi-person"></i>
                            </InputGroup.Text>
                            <Form.Control
                              type="text"
                              placeholder="e.g. Alex Johnson"
                              value={fullName}
                              onChange={(event) => {
                                setFullName(event.target.value);
                                clearError('fullName');
                              }}
                              isInvalid={!!errors.fullName}
                              className="border-start-0 ps-0 py-2 fs-7"
                              autoComplete="name"
                              required
                            />
                            <Form.Control.Feedback type="invalid" className="fs-8 fw-medium">
                              {errors.fullName}
                            </Form.Control.Feedback>
                          </InputGroup>
                        </Form.Group>

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
                              onChange={(event) => {
                                setEmail(event.target.value);
                                clearError('email');
                              }}
                              isInvalid={!!errors.email}
                              className="border-start-0 ps-0 py-2 fs-7"
                              autoComplete="email"
                              required
                            />
                            <Form.Control.Feedback type="invalid" className="fs-8 fw-medium">
                              {errors.email}
                            </Form.Control.Feedback>
                          </InputGroup>
                        </Form.Group>

                        <Form.Group className="mb-3">
                          <Form.Label className="fw-semibold fs-7 text-dark">Password</Form.Label>
                          <InputGroup hasValidation>
                            <InputGroup.Text className="bg-light text-muted border-end-0">
                              <i className="bi bi-lock"></i>
                            </InputGroup.Text>
                            <Form.Control
                              type={showPassword ? 'text' : 'password'}
                              placeholder="Enter password (min 6 chars)"
                              value={password}
                              onChange={(event) => {
                                setPassword(event.target.value);
                                clearError('password');
                              }}
                              isInvalid={!!errors.password}
                              className="border-start-0 border-end-0 ps-0 py-2 fs-7"
                              autoComplete="new-password"
                              required
                            />
                            <Button
                              variant="outline-secondary"
                              className="border-start-0 bg-light text-muted"
                              onClick={() => setShowPassword(!showPassword)}
                              type="button"
                              aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                              <i className={`bi bi-${showPassword ? 'eye-slash' : 'eye'}`}></i>
                            </Button>
                            <Form.Control.Feedback type="invalid" className="fs-8 fw-medium">
                              {errors.password}
                            </Form.Control.Feedback>
                          </InputGroup>
                        </Form.Group>

                        <Form.Group className="mb-3">
                          <Form.Label className="fw-semibold fs-7 text-dark">Confirm Password</Form.Label>
                          <InputGroup hasValidation>
                            <InputGroup.Text className="bg-light text-muted border-end-0">
                              <i className="bi bi-shield-lock"></i>
                            </InputGroup.Text>
                            <Form.Control
                              type={showConfirmPassword ? 'text' : 'password'}
                              placeholder="Confirm your password"
                              value={confirmPassword}
                              onChange={(event) => {
                                setConfirmPassword(event.target.value);
                                clearError('confirmPassword');
                              }}
                              isInvalid={!!errors.confirmPassword}
                              className="border-start-0 border-end-0 ps-0 py-2 fs-7"
                              autoComplete="new-password"
                              required
                            />
                            <Button
                              variant="outline-secondary"
                              className="border-start-0 bg-light text-muted"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              type="button"
                              aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                            >
                              <i className={`bi bi-${showConfirmPassword ? 'eye-slash' : 'eye'}`}></i>
                            </Button>
                            <Form.Control.Feedback type="invalid" className="fs-8 fw-medium">
                              {errors.confirmPassword}
                            </Form.Control.Feedback>
                          </InputGroup>
                        </Form.Group>

                        <Form.Check
                          type="checkbox"
                          id="accept-terms-check"
                          checked={acceptTerms}
                          onChange={(event) => {
                            setAcceptTerms(event.target.checked);
                            clearError('terms');
                          }}
                          className="fs-7 text-secondary mb-4"
                          label={
                            <>
                              I agree to the{' '}
                              <a
                                href="#terms"
                                onClick={navigateToTerms}
                                className="fw-semibold text-decoration-none"
                                style={{ color: '#2563EB' }}
                              >
                                Terms &amp; Conditions
                              </a>{' '}
                              and{' '}
                              <a
                                href="#privacy"
                                onClick={navigateToPrivacy}
                                className="fw-semibold text-decoration-none"
                                style={{ color: '#2563EB' }}
                              >
                                Privacy Policy
                              </a>
                            </>
                          }
                        />

                        <Button
                          type="submit"
                          disabled={loading}
                          className="w-100 fw-bold py-2.5 rounded-3 text-white border-0 shadow-xs mb-3 transition-all"
                          style={{ backgroundColor: '#2563EB' }}
                        >
                          {loading ? (
                            <span className="d-flex align-items-center justify-content-center gap-2">
                              <span className="spinner-border spinner-border-sm" role="status"></span>
                              <span>Creating Account...</span>
                            </span>
                          ) : (
                            <span className="d-flex align-items-center justify-content-center gap-2">
                              <span>Create Account</span>
                              <i className="bi bi-arrow-right fs-6"></i>
                            </span>
                          )}
                        </Button>

                        <div className="text-center">
                          <span className="text-secondary fs-7 me-1">Already have an account?</span>
                          <Button
                            variant="link"
                            className="p-0 fw-bold fs-7 text-decoration-none"
                            style={{ color: '#2563EB' }}
                            onClick={onNavigateToLogin}
                          >
                            Login
                          </Button>
                        </div>
                      </Form>
                    </div>
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>
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
                        onClick={
                          link === 'Terms & Conditions'
                            ? navigateToTerms
                            : link === 'Privacy Policy'
                              ? navigateToPrivacy
                              : (event) => event.preventDefault()
                        }
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
