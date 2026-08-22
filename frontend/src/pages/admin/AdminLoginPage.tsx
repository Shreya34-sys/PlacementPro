import React, {
  useEffect,
  useState,
} from 'react';

import {
  Alert,
  Button,
  Card,
  Form,
  Spinner,
} from 'react-bootstrap';

import {
  useAdminAuth,
} from '../../context/AdminAuthContext';


interface AdminLoginPageProps {
  onLoginSuccess: () => void;
  onBackToStudentLogin: () => void;
}


export const AdminLoginPage: React.FC<
  AdminLoginPageProps
> = ({
  onLoginSuccess,
  onBackToStudentLogin,
}) => {

  const {
    login,
    sendMagicLink,
    completeMagicLinkLogin,
    isAdminAuthenticated,
    loading,
  } = useAdminAuth();


  const [email, setEmail] =
    useState('');

  const [password, setPassword] =
    useState('');

  const [error, setError] =
    useState('');

  const [success, setSuccess] =
    useState('');

  const [loginLoading, setLoginLoading] =
    useState(false);

  const [magicLoading, setMagicLoading] =
    useState(false);


  /*
   * ONLY process Firebase Magic Links.
   *
   * Normal password login does NOT enter
   * this block.
   */
  useEffect(() => {

    const url =
      window.location.href;

    /*
     * If there is no Firebase action code,
     * this is a normal admin page.
     */
    if (!url.includes('oobCode=')) {
      return;
    }


    const completeLogin = async () => {

      try {

        await completeMagicLinkLogin();

      } catch (error) {

        console.error(
          'Magic link error:',
          error
        );

        setError(
          error instanceof Error
            ? error.message
            : 'Magic link login failed.'
        );

      }

    };


    completeLogin();

  }, [completeMagicLinkLogin]);


  /*
   * Go to dashboard after successful admin login.
   */
  useEffect(() => {

    if (isAdminAuthenticated) {
      onLoginSuccess();
    }

  }, [
    isAdminAuthenticated,
    onLoginSuccess,
  ]);


  /*
   * PASSWORD LOGIN
   */
  const handlePasswordLogin =
    async (
      e: React.FormEvent
    ) => {

      e.preventDefault();

      setError('');
      setSuccess('');

      if (!email.trim() || !password) {

        setError(
          'Please enter email and password.'
        );

        return;
      }

      setLoginLoading(true);

      try {

        await login(
          email.trim(),
          password
        );

        /*
         * AdminAuthContext will also detect
         * authentication and navigate.
         */
        onLoginSuccess();

      } catch (error) {

        setError(
          error instanceof Error
            ? error.message
            : 'Login failed.'
        );

      } finally {

        setLoginLoading(false);
      }
    };


  /*
   * MAGIC EMAIL LOGIN
   */
  const handleMagicLink =
    async () => {

      setError('');
      setSuccess('');

      if (!email.trim()) {

        setError(
          'Please enter your admin email first.'
        );

        return;
      }

      setMagicLoading(true);

      try {

        await sendMagicLink(
          email.trim()
        );

        setSuccess(
          `Magic login link sent to ${email.trim()}. Check your email inbox.`
        );

      } catch (error) {

        setError(
          error instanceof Error
            ? error.message
            : 'Could not send magic login link.'
        );

      } finally {

        setMagicLoading(false);
      }
    };


  return (
    <div
      className="min-vh-100 d-flex align-items-center justify-content-center"
      style={{
        backgroundColor: '#F8FAFC',
        padding: '20px',
      }}
    >

      <Card
        className="border-0 shadow-sm"
        style={{
          width: '100%',
          maxWidth: '430px',
          borderRadius: '16px',
        }}
      >

        <Card.Body className="p-4 p-md-5">

          <div className="text-center mb-4">

            <div
              className="mx-auto mb-3 d-flex align-items-center justify-content-center"
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '12px',
                backgroundColor: '#2563EB',
                color: 'white',
              }}
            >
              <i className="bi bi-shield-lock-fill fs-4"></i>
            </div>

            <h3 className="fw-bold mb-1">
              Admin Login
            </h3>

            <p className="text-secondary mb-0">
              PlacementPro Administration
            </p>

          </div>


          {error && (
            <Alert
              variant="danger"
              className="small"
              dismissible
              onClose={() => setError('')}
            >
              {error}
            </Alert>
          )}


          {success && (
            <Alert
              variant="success"
              className="small"
              dismissible
              onClose={() => setSuccess('')}
            >
              {success}
            </Alert>
          )}


          {/* PASSWORD LOGIN */}

          <Form
            onSubmit={handlePasswordLogin}
          >

            <Form.Group className="mb-3">

              <Form.Label>
                Admin Email
              </Form.Label>

              <Form.Control
                type="email"
                placeholder="ppadmin@gmail.com"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                autoComplete="email"
              />

            </Form.Group>


            <Form.Group className="mb-3">

              <Form.Label>
                Password
              </Form.Label>

              <Form.Control
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                autoComplete="current-password"
              />

            </Form.Group>


            <Button
              type="submit"
              className="w-100 fw-bold mb-3"
              disabled={
                loginLoading ||
                magicLoading ||
                loading
              }
              style={{
                backgroundColor: '#2563EB',
                borderColor: '#2563EB',
              }}
            >

              {loginLoading ? (
                <>
                  <Spinner
                    size="sm"
                    className="me-2"
                  />

                  Logging in...
                </>
              ) : (
                <>
                  <i className="bi bi-box-arrow-in-right me-2"></i>

                  Login with Password
                </>
              )}

            </Button>

          </Form>


          <div className="d-flex align-items-center my-3">

            <hr className="flex-grow-1" />

            <span className="px-2 text-secondary small">
              OR
            </span>

            <hr className="flex-grow-1" />

          </div>


          {/* MAGIC EMAIL LOGIN */}

          <Button
            type="button"
            variant="outline-primary"
            className="w-100 fw-semibold"
            disabled={
              loginLoading ||
              magicLoading ||
              loading
            }
            onClick={handleMagicLink}
          >

            {magicLoading ? (
              <>
                <Spinner
                  size="sm"
                  className="me-2"
                />

                Sending Magic Link...
              </>
            ) : (
              <>
                <i className="bi bi-envelope me-2"></i>

                Login with Magic Email Link
              </>
            )}

          </Button>


          <div className="text-center mt-4">

            <Button
              variant="link"
              className="text-decoration-none"
              onClick={
                onBackToStudentLogin
              }
            >
              ← Back to Student Login
            </Button>

          </div>

        </Card.Body>

      </Card>

    </div>
  );
};