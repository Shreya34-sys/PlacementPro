import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, InputGroup, Alert } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';

interface RegisterPageProps {
  onNavigateToLogin: () => void;
  onRegisterSuccess: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onNavigateToLogin, onRegisterSuccess }) => {
  const { register } = useAuth();

  // Form Fields as explicitly requested
  const [fullName, setFullName] = useState('');
  const [collegeEmail, setCollegeEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [collegeName, setCollegeName] = useState('');
  const [department, setDepartment] = useState('Computer Science & Engineering');
  const [academicYear, setAcademicYear] = useState('4th Year (Batch 2026)');
  const [rollNumber, setRollNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Controls
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  
  // Error handling & loading state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[0-9+\-\s]{8,15}$/;

    if (!fullName.trim()) {
      newErrors.fullName = 'Full Name is required.';
    }

    if (!collegeEmail.trim()) {
      newErrors.collegeEmail = 'College Email address is required.';
    } else if (!emailRegex.test(collegeEmail)) {
      newErrors.collegeEmail = 'Please enter a valid email address (e.g. student@college.edu).';
    }

    if (!mobileNumber.trim()) {
      newErrors.mobileNumber = 'Mobile Number is required.';
    } else if (!phoneRegex.test(mobileNumber)) {
      newErrors.mobileNumber = 'Please enter a valid phone number.';
    }

    if (!collegeName.trim()) {
      newErrors.collegeName = 'College or University name is required.';
    }

    if (!password) {
      newErrors.password = 'Password is required.';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long.';
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }

    if (!acceptTerms) {
      newErrors.terms = 'You must accept the Terms & Privacy Policy to register.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setErrors({});

    // Simulate registration API & JWT generation
    setTimeout(() => {
      register({
        name: fullName,
        email: collegeEmail,
        role: 'student',
        department: department,
        batchYear: academicYear.includes('2026') ? '2026' : '2027',
        phone: mobileNumber,
      });
      setLoading(false);
      onRegisterSuccess();
    }, 700);
  };

  return (
    <div style={{ backgroundColor: '#F8FAFC', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }} className="py-4 py-lg-5 d-flex align-items-center">
      <Container>
        <Row className="justify-content-center">
          <Col lg={9} xl={8}>
            <Card className="border-0 shadow-sm p-4 p-md-5" style={{ borderRadius: '16px' }}>
              {/* Header */}
              <div className="d-flex align-items-center justify-content-between pb-3 border-bottom mb-4">
                <div className="d-flex align-items-center gap-3">
                  <div className="bg-primary text-white rounded-3 p-2.5 d-flex align-items-center justify-content-center shadow-xs" style={{ width: '48px', height: '48px', backgroundColor: '#2563EB' }}>
                    <i className="bi bi-mortarboard-fill fs-4"></i>
                  </div>
                  <div>
                    <h4 className="fw-extrabold text-dark mb-0">Student Registration</h4>
                    <p className="text-secondary fs-7 mb-0">Join PlacementPro to unlock campus placements & career tools</p>
                  </div>
                </div>

                <Button
                  variant="outline-secondary"
                  size="sm"
                  className="d-none d-sm-flex align-items-center gap-2 fw-semibold fs-7 rounded-3"
                  onClick={onNavigateToLogin}
                >
                  <i className="bi bi-box-arrow-in-right"></i>
                  <span>Sign In</span>
                </Button>
              </div>

              {errors.terms && (
                <Alert variant="danger" dismissible onClose={() => setErrors({ ...errors, terms: undefined })} className="py-2.5 fs-7 rounded-3 mb-4">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  {errors.terms}
                </Alert>
              )}

              <Form onSubmit={handleRegister} noValidate>
                {/* Row 1: Full Name & College Email */}
                <Row className="g-3 mb-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-semibold fs-7 text-dark">
                        Full Name <span className="text-danger">*</span>
                      </Form.Label>
                      <InputGroup hasValidation>
                        <InputGroup.Text className="bg-light text-muted border-end-0">
                          <i className="bi bi-person"></i>
                        </InputGroup.Text>
                        <Form.Control
                          type="text"
                          placeholder="e.g. Eleanor Vance"
                          value={fullName}
                          onChange={(e) => {
                            setFullName(e.target.value);
                            if (errors.fullName) setErrors({ ...errors, fullName: undefined });
                          }}
                          isInvalid={!!errors.fullName}
                          className="border-start-0 ps-0 py-2 fs-7"
                          required
                        />
                        <Form.Control.Feedback type="invalid" className="fs-8 fw-medium">
                          {errors.fullName}
                        </Form.Control.Feedback>
                      </InputGroup>
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-semibold fs-7 text-dark">
                        College Email <span className="text-danger">*</span>
                      </Form.Label>
                      <InputGroup hasValidation>
                        <InputGroup.Text className="bg-light text-muted border-end-0">
                          <i className="bi bi-envelope"></i>
                        </InputGroup.Text>
                        <Form.Control
                          type="email"
                          placeholder="e.g. eleanor@student.edu"
                          value={collegeEmail}
                          onChange={(e) => {
                            setCollegeEmail(e.target.value);
                            if (errors.collegeEmail) setErrors({ ...errors, collegeEmail: undefined });
                          }}
                          isInvalid={!!errors.collegeEmail}
                          className="border-start-0 ps-0 py-2 fs-7"
                          required
                        />
                        <Form.Control.Feedback type="invalid" className="fs-8 fw-medium">
                          {errors.collegeEmail}
                        </Form.Control.Feedback>
                      </InputGroup>
                    </Form.Group>
                  </Col>
                </Row>

                {/* Row 2: Mobile Number & College Name */}
                <Row className="g-3 mb-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-semibold fs-7 text-dark">
                        Mobile Number <span className="text-danger">*</span>
                      </Form.Label>
                      <InputGroup hasValidation>
                        <InputGroup.Text className="bg-light text-muted border-end-0">
                          <i className="bi bi-telephone"></i>
                        </InputGroup.Text>
                        <Form.Control
                          type="tel"
                          placeholder="+91 98765 43210"
                          value={mobileNumber}
                          onChange={(e) => {
                            setMobileNumber(e.target.value);
                            if (errors.mobileNumber) setErrors({ ...errors, mobileNumber: undefined });
                          }}
                          isInvalid={!!errors.mobileNumber}
                          className="border-start-0 ps-0 py-2 fs-7"
                          required
                        />
                        <Form.Control.Feedback type="invalid" className="fs-8 fw-medium">
                          {errors.mobileNumber}
                        </Form.Control.Feedback>
                      </InputGroup>
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-semibold fs-7 text-dark">
                        College / University Name <span className="text-danger">*</span>
                      </Form.Label>
                      <InputGroup hasValidation>
                        <InputGroup.Text className="bg-light text-muted border-end-0">
                          <i className="bi bi-building"></i>
                        </InputGroup.Text>
                        <Form.Control
                          type="text"
                          placeholder="e.g. Stanford Institute of Technology"
                          value={collegeName}
                          onChange={(e) => {
                            setCollegeName(e.target.value);
                            if (errors.collegeName) setErrors({ ...errors, collegeName: undefined });
                          }}
                          isInvalid={!!errors.collegeName}
                          className="border-start-0 ps-0 py-2 fs-7"
                          required
                        />
                        <Form.Control.Feedback type="invalid" className="fs-8 fw-medium">
                          {errors.collegeName}
                        </Form.Control.Feedback>
                      </InputGroup>
                    </Form.Group>
                  </Col>
                </Row>

                {/* Row 3: Department, Academic Year, Roll Number */}
                <Row className="g-3 mb-3">
                  <Col md={5}>
                    <Form.Group>
                      <Form.Label className="fw-semibold fs-7 text-dark">Department / Branch</Form.Label>
                      <Form.Select
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className="py-2 fs-7"
                      >
                        <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                        <option value="Information Technology">Information Technology</option>
                        <option value="Artificial Intelligence & Data Science">Artificial Intelligence & Data Science</option>
                        <option value="Electronics & Communication">Electronics & Communication</option>
                        <option value="Electrical Engineering">Electrical Engineering</option>
                        <option value="Mechanical Engineering">Mechanical Engineering</option>
                        <option value="Civil Engineering">Civil Engineering</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>

                  <Col md={4}>
                    <Form.Group>
                      <Form.Label className="fw-semibold fs-7 text-dark">Academic Year</Form.Label>
                      <Form.Select
                        value={academicYear}
                        onChange={(e) => setAcademicYear(e.target.value)}
                        className="py-2 fs-7"
                      >
                        <option value="4th Year (Batch 2026)">4th Year (Batch 2026)</option>
                        <option value="3rd Year (Batch 2027)">3rd Year (Batch 2027)</option>
                        <option value="2nd Year (Batch 2028)">2nd Year (Batch 2028)</option>
                        <option value="1st Year (Batch 2029)">1st Year (Batch 2029)</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>

                  <Col md={3}>
                    <Form.Group>
                      <Form.Label className="fw-semibold fs-7 text-dark">Roll Number <span className="text-muted fw-normal fs-8">(Optional)</span></Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="e.g. CS2026-084"
                        value={rollNumber}
                        onChange={(e) => setRollNumber(e.target.value)}
                        className="py-2 fs-7"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                {/* Row 4: Password & Confirm Password */}
                <Row className="g-3 mb-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-semibold fs-7 text-dark">
                        Password <span className="text-danger">*</span>
                      </Form.Label>
                      <InputGroup hasValidation>
                        <InputGroup.Text className="bg-light text-muted border-end-0">
                          <i className="bi bi-lock"></i>
                        </InputGroup.Text>
                        <Form.Control
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Min 6 characters"
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
                  </Col>

                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-semibold fs-7 text-dark">
                        Confirm Password <span className="text-danger">*</span>
                      </Form.Label>
                      <InputGroup hasValidation>
                        <InputGroup.Text className="bg-light text-muted border-end-0">
                          <i className="bi bi-shield-check"></i>
                        </InputGroup.Text>
                        <Form.Control
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Re-enter password"
                          value={confirmPassword}
                          onChange={(e) => {
                            setConfirmPassword(e.target.value);
                            if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: undefined });
                          }}
                          isInvalid={!!errors.confirmPassword}
                          className="border-start-0 ps-0 py-2 fs-7"
                          required
                        />
                        <Form.Control.Feedback type="invalid" className="fs-8 fw-medium">
                          {errors.confirmPassword}
                        </Form.Control.Feedback>
                      </InputGroup>
                    </Form.Group>
                  </Col>
                </Row>

                {/* Show Password Checkbox */}
                <div className="mb-3">
                  <Form.Check
                    type="checkbox"
                    id="show-password-toggle-reg"
                    label="Show password in plaintext"
                    checked={showPassword}
                    onChange={(e) => setShowPassword(e.target.checked)}
                    className="fs-8 text-muted"
                  />
                </div>

                {/* Accept Terms & Privacy Policy */}
                <div className="mb-4">
                  <Form.Check
                    type="checkbox"
                    id="accept-terms-check"
                    label={
                      <span className="fs-7 text-secondary">
                        I agree to the <a href="#terms" onClick={(e) => e.preventDefault()} style={{ color: '#2563EB' }} className="fw-semibold">Terms of Service</a> & <a href="#privacy" onClick={(e) => e.preventDefault()} style={{ color: '#2563EB' }} className="fw-semibold">Privacy Policy</a> of PlacementPro.
                      </span>
                    }
                    checked={acceptTerms}
                    onChange={(e) => {
                      setAcceptTerms(e.target.checked);
                      if (errors.terms) setErrors({ ...errors, terms: undefined });
                    }}
                    isInvalid={!!errors.terms}
                  />
                  {errors.terms && <div className="text-danger fs-8 fw-medium mt-1">{errors.terms}</div>}
                </div>

                {/* Submit Register Button */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-100 fw-bold py-2.5 rounded-3 text-white border-0 shadow-xs mb-3 transition-all"
                  style={{ backgroundColor: '#2563EB' }}
                >
                  {loading ? (
                    <span className="d-flex align-items-center justify-content-center gap-2">
                      <span className="spinner-border spinner-border-sm" role="status"></span>
                      <span>Creating Student Account...</span>
                    </span>
                  ) : (
                    <span className="d-flex align-items-center justify-content-center gap-2">
                      <i className="bi bi-person-check-fill fs-6"></i>
                      <span>Create Account & Continue</span>
                    </span>
                  )}
                </Button>

                {/* Footer link to Login */}
                <div className="text-center pt-2">
                  <span className="text-secondary fs-7 me-1">Already have an account?</span>
                  <Button
                    variant="link"
                    className="p-0 fw-bold fs-7 text-decoration-none"
                    style={{ color: '#2563EB' }}
                    onClick={onNavigateToLogin}
                  >
                    Sign In to existing account
                  </Button>
                </div>
              </Form>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};
