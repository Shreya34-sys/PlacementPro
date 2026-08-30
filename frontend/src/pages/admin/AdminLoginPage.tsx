

import React, { useEffect, useState } from 'react';

import {
  Alert,
  Button,
  Card,
  Form,
  Spinner,
} from 'react-bootstrap';

import { useAdminAuth } from '../../context/AdminAuthContext';

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
    loading,
  } = useAdminAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [loginLoading, setLoginLoading] =
    useState(false);

  const [magicLoading, setMagicLoading] =
    useState(false);


  /*
   * MAGIC LINK ONLY
   *
   * This runs only when Firebase has an
   * oobCode in the URL.
   *
   * Normal #admin page opening will NOT
   * trigger login.
   */
  useEffect(() => {

    const url = window.location.href;

    if (!url.includes('oobCode=')) {
      return;
    }

    const completeLogin = async () => {

      try {

        await completeMagicLinkLogin();

        /*
         * Only after successful magic-link
         * authentication.
         */
        onLoginSuccess();

      } catch (err) {

        console.error(
          'Magic link error:',
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : 'Magic link login failed.'
        );
      }
    };

    completeLogin();

  }, [
    completeMagicLinkLogin,
    onLoginSuccess,
  ]);


  /*
   * PASSWORD LOGIN
   *
   * This function runs ONLY when the
   * user submits the form.
   */
  const handlePasswordLogin = async (
    e: React.FormEvent<HTMLFormElement>
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

      /*
       * Firebase admin authentication.
       */
      await login(
        email.trim(),
        password
      );

      /*
       * Dashboard opens ONLY after
       * login() succeeds.
       */
      onLoginSuccess();

    } catch (err) {

      console.error(
        'Admin login error:',
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : 'Login failed.'
      );

    } finally {

      setLoginLoading(false);
    }
  };


  /*
   * MAGIC EMAIL LOGIN
   */
  const handleMagicLink = async () => {

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

    } catch (err) {

      console.error(
        'Magic link sending error:',
        err
      );

      setError(
        err instanceof Error
          ? err.message
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

          {/* HEADER */}

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
              <i className="bi bi-shield-lock-fill fs-4" />
            </div>

            <h3 className="fw-bold mb-1">
              Admin Login
            </h3>

            <p className="text-secondary mb-0">
              PlacementPro Administration
            </p>

          </div>


          {/* ERROR */}

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


          {/* SUCCESS */}

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
                placeholder="abc@gmail.com"
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
                  <i className="bi bi-box-arrow-in-right me-2" />

                  Login with Password
                </>
              )}

            </Button>

          </Form>


          {/* DIVIDER */}

          <div className="d-flex align-items-center my-3">

            <hr className="flex-grow-1" />

            <span className="px-2 text-secondary small">
              OR
            </span>

            <hr className="flex-grow-1" />

          </div>


          {/* MAGIC LINK */}

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
                <i className="bi bi-envelope me-2" />

                Login with Magic Email Link
              </>
            )}

          </Button>


          {/* BACK */}

          <div className="text-center mt-4">

            <Button
              type="button"
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











