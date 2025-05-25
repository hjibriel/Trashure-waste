import '../App.css'
import { useState } from 'react';
import { Link } from 'react-router-dom';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputLabel from '@mui/material/InputLabel';
import InputAdornment from '@mui/material/InputAdornment';
import FormControl from '@mui/material/FormControl';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import Button from '@mui/material/Button';
import { Alert } from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google'; // optional Google icon
import { useSignIn } from "@clerk/clerk-react"

function LogIn() {
  const { signIn, isLoaded } = useSignIn();
  const [error, setError] = useState();
     
        const [showPassword, setShowPassword] = useState(false);
        const [email, setEmail] = useState("");
        const [password, setPassword] = useState("");
      
        const handleClickShowPassword = () => setShowPassword((show) => !show);
      
        const handleMouseDownPassword = (event) => {
          event.preventDefault();
        };
      
        const handleMouseUpPassword = (event) => {
          event.preventDefault();
        };

        if (!isLoaded) return null;

        const handleSignIn = async (event) => {
          event.preventDefault();
  
          if (!email) {
              setError("Please enter your email.");
              return;
            }
            
            if (!password) {
              setError("Please enter your password.");
              return;
            }
      
          try {
              const signInAttempt = await signIn.create({
                  identifier: email,
              });
      
              const result = await signInAttempt.attemptFirstFactor({
                  strategy: "password",
                  password: password,
              });
      
              if (result.status === "complete") {
                  setTimeout(() => {
                      window.location.href = "http://localhost:3000/dashboard";
                  }, 1500);
              } else {
                  setError("Invalid credentials. Please try again.");
              }
          } catch (err) {
              const errorMessage = err.errors?.[0]?.long_message || "Sign-in failed. Please try again.";
              setError(errorMessage);
          }
      };

    return (
        <div className='signup'>
            <div className='signup-pic'>
                <img alt='Join Us in Reducing Waste Together' src="/signup.jpeg"/>
            </div>
            <div className='signup-form'> 
                <h1>Unlock Your Reward- Log in Now</h1>
                {error && <Alert severity="error">{error}</Alert>}
        <Box
        component="form"
        sx={{ '& > :not(style)': { m: 1, width: '25ch' } }}
        noValidate
        autoComplete="off"
        onSubmit={handleSignIn}
      >
        <TextField label="Email" type="email" variant="outlined" value={email} onChange={(e) => setEmail(e.target.value)} />
        <FormControl sx={{ m: 1, width: '25ch' }} variant="outlined">
          <InputLabel htmlFor="outlined-adornment-password">Password</InputLabel>
          <OutlinedInput
            id="outlined-adornment-password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            endAdornment={
              <InputAdornment position="end">
                <IconButton
                  aria-label={
                    showPassword ? 'hide the password' : 'display the password'
                  }
                  onClick={handleClickShowPassword}
                  onMouseDown={handleMouseDownPassword}
                  onMouseUp={handleMouseUpPassword}
                  edge="end"
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            }
            label="Password"
          />
        </FormControl>
        <Button type='submit' variant="contained">
            Log in
        </Button>
  
                <Button
          variant="contained"
          fullWidth
          startIcon={<GoogleIcon />}
          onClick={() => {
            signIn.authenticateWithRedirect({
              strategy: "oauth_google",
              redirectUrl: "/dashboard",
            });
          }}
          sx={{
            backgroundColor: '#4285F4',
            color: '#fff',
            textTransform: 'none',
            fontWeight: 'bold',
            '&:hover': {
              backgroundColor: '#357ae8',
            },
          }}
        >
          Log in with Google
        </Button>

        
      </Box>
      <span style={{ display: 'block', marginTop: '10px' }}>
                    Don’t have an account? <Link to="/signup" style={{ color: '#000000', textDecoration: 'none' }}>Sign up</Link>
                </span>
      </div>
      </div>
    )

    
}

export default LogIn;