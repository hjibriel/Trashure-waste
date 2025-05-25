import { useState, useEffect } from 'react';
import { useSignUp } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';

function Verify() {
  const navigate = useNavigate();
  const { signUp, setActive, isLoaded } = useSignUp();
  const [error, setError] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState('waiting'); // waiting, verifying, complete, failed, no-token

  useEffect(() => {
    if (!isLoaded || !signUp) return;

    // Check if we have a token in the URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (!token) {
      // If no token, we're waiting for the user to click the link in their email
      setVerificationStatus('waiting');
      return;
    }

    // If we have a token, verify it
    const verifyToken = async () => {
      setVerificationStatus('verifying');
      try {
        // Attempt to verify the email address with the token
        const result = await signUp.attemptEmailAddressVerification({
          strategy: "email_link",
          token
        });
        
        if (result.status === 'complete') {
          setVerificationStatus('complete');
          
          // Set the newly created session as active
          await setActive({ session: result.createdSessionId });
          
          // Redirect to dashboard after a short delay
          setTimeout(() => {
            window.location.href = 'http://localhost:3000/dashboard';
          }, 2000);
        } else {
          setVerificationStatus('failed');
          setError('Verification failed. The link may have expired.');
        }
      } catch (err) {
        console.error('Verification error:', err);
        setError(err.errors?.[0]?.message || 'Failed to verify your email. The link may have expired.');
        setVerificationStatus('failed');
      }
    };

    verifyToken();
  }, [isLoaded, signUp, setActive]);

  const handleResendVerification = async () => {
    if (!signUp) {
      navigate('/signup');
      return;
    }

    try {
      // Resend the verification email
      await signUp.prepareEmailAddressVerification({
        strategy: "email_link",
        redirectUrl: 'http://localhost:3000/verify'
      });
      
      setError(null);
      setVerificationStatus('waiting');
      alert('A new verification link has been sent to your email.');
    } catch (err) {
      console.error('Resend error:', err);
      setError('Failed to resend verification link. Please try again or go back to sign up.');
    }
  };

  if (!isLoaded) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <div className="signup">
      <div className="signup-pic">
        <img alt="Join Us in Reducing Waste Together" src="/signup.jpeg" />
      </div>
      <div className="signup-form">
        <h1>Verify your Email</h1>

        {verificationStatus === 'waiting' && (
          <Box sx={{ textAlign: 'center', my: 3 }}>
            <Alert severity="info" sx={{ mb: 3 }}>
              We've sent a verification link to your email address. Please check your inbox and click the link to verify your account.
            </Alert>
            <Typography variant="body1" sx={{ mb: 3 }}>
              Didn't receive the email? Check your spam folder or click below to resend.
            </Typography>
            <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button 
                variant="contained" 
                onClick={handleResendVerification}
              >
                Resend Verification Email
              </Button>
              
              <Link to="/signup" style={{ textDecoration: 'none', width: '100%' }}>
                <Button variant="text" fullWidth>
                  Back to Signup
                </Button>
              </Link>
            </Box>
          </Box>
        )}

        {verificationStatus === 'verifying' && (
          <Box sx={{ textAlign: 'center', my: 3 }}>
            <CircularProgress sx={{ mb: 3 }} />
            <Alert severity="info">Verifying your email address...</Alert>
          </Box>
        )}

        {verificationStatus === 'complete' && (
          <Box sx={{ textAlign: 'center', my: 3 }}>
            <Alert severity="success" sx={{ mb: 3 }}>
              Email verified successfully! Redirecting to your dashboard...
            </Alert>
            <CircularProgress sx={{ mt: 2 }} />
          </Box>
        )}

        {verificationStatus === 'failed' && (
          <Box sx={{ textAlign: 'center', my: 3 }}>
            <Alert severity="error" sx={{ mb: 3 }}>
              {error || 'Verification failed. Please try again.'}
            </Alert>
            <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button 
                variant="contained" 
                onClick={handleResendVerification}
              >
                Resend Verification Email
              </Button>
              
              <Link to="/signup" style={{ textDecoration: 'none', width: '100%' }}>
                <Button variant="text" fullWidth>
                  Back to Signup
                </Button>
              </Link>
            </Box>
          </Box>
        )}

        {verificationStatus === 'no-token' && (
          <Box sx={{ textAlign: 'center', my: 3 }}>
            <Alert severity="warning" sx={{ mb: 3 }}>
              No verification token found. Please check your email and click the verification link.
            </Alert>
            <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button 
                variant="contained" 
                onClick={handleResendVerification}
              >
                Resend Verification Email
              </Button>
              
              <Link to="/signup" style={{ textDecoration: 'none', width: '100%' }}>
                <Button variant="text" fullWidth>
                  Back to Signup
                </Button>
              </Link>
            </Box>
          </Box>
        )}
      </div>
    </div>
  );
}

export default Verify;