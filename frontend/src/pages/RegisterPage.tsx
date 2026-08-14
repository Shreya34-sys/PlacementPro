import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, InputGroup, Alert } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';

interface RegisterPageProps {
  onNavigateToLogin: () => void;
  onRegisterSuccess: () => void;
  onNavigateToTerms: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onNavigateToLogin, onRegisterSuccess, onNavigateToTerms }) => {
  const { register } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!fullName.trim()) newErrors.fullName = 'Full name is required.';
    if (!email.trim()) newErrors.email = 'Email address is required.';
    else if (!emailRegex.test(email)) newErrors.email = 'Enter a valid email address.';
    if (!password) newErrors.password = 'Password is required.';
    else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters.';
    if (!confirmPassword) newErrors.confirmPassword = 'Please confirm your password.';
    else if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match.';
    if (!acceptTerms) newErrors.terms = 'You must agree to the Terms & Conditions.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setErrors({});
    setTimeout(() => {
      register({ name: fullName, email, role: 'student' });
      setLoading(false);
      onRegisterSuccess();
    }, 700);
  };

  const handleGoogleContinue = () => {
    if (!acceptTerms) {
      setErrors({ terms: 'You must agree to the Terms & Conditions.' });
      return;
    }

    setLoading(true);
    setErrors({});
    setTimeout(() => {
      register({
        name: fullName.trim() || 'Google User',
        email: email.trim() || 'google.user@placementpro.edu',
        role: 'student',
      });
      setLoading(false);
      onRegisterSuccess();
    }, 700);
  };

  return (
    <div className="py-4 py-lg-5 d-flex align-items-center" style={{ backgroundColor: '#F8FAFC', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <Container>
        <Row className="justify-content-center">
          <Col md={8} lg={6} xl={5}>
            <Card className="border-0 shadow-sm p-4 p-md-5" style={{ borderRadius: '16px' }}>
              <div className="text-center mb-4">
                <div className="bg-primary text-white rounded-3 d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '48px', height: '48px', backgroundColor: '#2563EB' }}>
                  <i className="bi bi-person-plus-fill fs-4" />
                </div>
                <h3 className="fw-bold text-dark mb-1">Create your account</h3>
              </div>

              {errors.terms && (
                <Alert variant="danger" dismissible onClose={() => setErrors({ ...errors, terms: undefined })} className="py-2 fs-7 rounded-3">
                  {errors.terms}
                </Alert>
              )}

              <Form onSubmit={handleRegister} noValidate>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold fs-7 text-dark">Full Name</Form.Label>
                  <Form.Control type="text" value={fullName} onChange={(event) => { setFullName(event.target.value); if (errors.fullName) setErrors({ ...errors, fullName: undefined }); }} isInvalid={!!errors.fullName} className="py-2" autoComplete="name" />
                  <Form.Control.Feedback type="invalid">{errors.fullName}</Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold fs-7 text-dark">Email Address</Form.Label>
                  <Form.Control type="email" value={email} onChange={(event) => { setEmail(event.target.value); if (errors.email) setErrors({ ...errors, email: undefined }); }} isInvalid={!!errors.email} className="py-2" autoComplete="email" />
                  <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold fs-7 text-dark">Password</Form.Label>
                  <InputGroup hasValidation>
                    <Form.Control type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => { setPassword(event.target.value); if (errors.password) setErrors({ ...errors, password: undefined }); }} isInvalid={!!errors.password} className="py-2 border-end-0" autoComplete="new-password" />
                    <Button variant="outline-secondary" className="border-start-0" type="button" aria-label="Toggle password visibility" onClick={() => setShowPassword(!showPassword)}><i className={`bi bi-${showPassword ? 'eye-slash' : 'eye'}`} /></Button>
                    <Form.Control.Feedback type="invalid">{errors.password}</Form.Control.Feedback>
                  </InputGroup>
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label className="fw-semibold fs-7 text-dark">Confirm Password</Form.Label>
                  <InputGroup hasValidation>
                    <Form.Control type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword} onChange={(event) => { setConfirmPassword(event.target.value); if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: undefined }); }} isInvalid={!!errors.confirmPassword} className="py-2 border-end-0" autoComplete="new-password" />
                    <Button variant="outline-secondary" className="border-start-0" type="button" aria-label="Toggle confirm password visibility" onClick={() => setShowConfirmPassword(!showConfirmPassword)}><i className={`bi bi-${showConfirmPassword ? 'eye-slash' : 'eye'}`} /></Button>
                    <Form.Control.Feedback type="invalid">{errors.confirmPassword}</Form.Control.Feedback>
                  </InputGroup>
                </Form.Group>

                <Form.Check className="mb-4 fs-7" id="accept-terms-check" label={<>I agree to the <a href="#terms" onClick={(event) => { event.preventDefault(); onNavigateToTerms(); }} className="fw-semibold">Terms &amp; Conditions</a></>} checked={acceptTerms} onChange={(event) => { setAcceptTerms(event.target.checked); if (errors.terms) setErrors({ ...errors, terms: undefined }); }} />

                <Button type="submit" disabled={loading} className="w-100 fw-bold py-2 rounded-3 border-0" style={{ backgroundColor: '#2563EB' }}>
                  {loading ? 'Creating Account...' : 'Create Account'}
                </Button>

                <div className="d-flex align-items-center gap-3 my-4 text-secondary fs-8">
                  <div className="flex-grow-1 border-top" />
                  <span>OR</span>
                  <div className="flex-grow-1 border-top" />
                </div>

                <Button
                  type="button"
                  variant="outline-secondary"
                  disabled={loading}
                  className="w-100 fw-semibold py-2 rounded-3"
                  onClick={handleGoogleContinue}
                >
                  <i className="bi bi-google me-2" />
                  Continue with Google
                </Button>

                <div className="text-center pt-4 fs-7 text-secondary">
                  Already have an account?{' '}
                  <Button variant="link" className="p-0 fw-bold text-decoration-none" onClick={onNavigateToLogin}>Login</Button>
                </div>
              </Form>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};
