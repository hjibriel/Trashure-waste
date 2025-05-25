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
import { useSignUp } from '@clerk/clerk-react';
import Alert from "@mui/material/Alert";
import GoogleIcon from '@mui/icons-material/Google'; // optional Google icon

function Signup () {
     
    const {signUp, isLoaded} = useSignUp();
    const [showPassword, setShowPassword] = useState(false);
    const [firstname, setFirstname] = useState("");
    const [lastname, setLastname] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleClickShowPassword = () => setShowPassword((show) => !show);
  
    const handleMouseDownPassword = (event) => {
      event.preventDefault();
    };
  
    const handleSignup = async (e) => {
      e.preventDefault();
      setIsSubmitting(true);

      if (!isLoaded) {
        setError("Clerk is loading, please wait");
        setIsSubmitting(false);
        return;
      }
    
      // Basic form validation
      if (!firstname.trim()) {
        setError("First Name is required.");
        setIsSubmitting(false);
        return;
      }
      if (!lastname.trim()) {
        setError("Last Name is required.");
        setIsSubmitting(false);
        return;
      }
      if (!email.includes("@")) {
        setError("Invalid email format.");
        setIsSubmitting(false);
        return;
      }
      if (password.length < 8) {
        setError("Password must be at least 8 characters.");
        setIsSubmitting(false);
        return;
      }
    
      try {
        // Create user account
        await signUp.create({
          firstName: firstname,
          lastName: lastname,
          emailAddress: email,
          password,
        });

        // Prepare email verification using email link strategy
        await signUp.prepareEmailAddressVerification({
          strategy: "email_link",
          redirectUrl: 'http://localhost:3000/dashboard'
        });

        // Navigate to verification page
        window.location.href = 'http://localhost:3000/verify';
      } 
      catch (err) {
        console.error("Error during Signup:", err);
        setError(err.errors?.[0]?.message || "An error occurred during signup");
        setIsSubmitting(false);
      }
    };       

    const handleGoogle = async () => {
      if (!isLoaded) {
        setError("Clerk is loading, please wait");
        return;
      }

      try {
        await signUp.authenticateWithRedirect({
          strategy: "oauth_google",
          // Use a dedicated callback route for OAuth
          redirectUrl: "http://localhost:3000/googlecallback",
          redirectUrlComplete: "http://localhost:3000/dashboard"
        });
      } 
      catch (error) {
        setError(error.errors?.[0]?.message || "Google sign-in failed");
        console.error("Error during Google Signup:", error);
      }
    }

    return (
      <div className='signup'>
          <div className='signup-pic'>
              <img alt='Join Us in Reducing Waste Together' src="/signup.jpeg"/>
          </div>
          <div className='signup-form'> 
              <h1>Create an account</h1>
              {error && <Alert severity="error">{error}</Alert>}
      <Box
        component="form"
        sx={{ '& > :not(style)': { m: 1, width: '25ch' } }}
        noValidate
        autoComplete="off"
        onSubmit={handleSignup}
      >
        <TextField 
          label="First name" 
          type="name" 
          value={firstname} 
          variant="outlined" 
          onChange={(e) => setFirstname(e.target.value)}
          required 
        />
        <TextField 
          label="Last Name" 
          type="name" 
          value={lastname}  
          variant="outlined" 
          onChange={(e) => setLastname(e.target.value)}
          required 
        />
        <TextField 
          label="Email" 
          type="email" 
          value={email} 
          variant="outlined"
          onChange={(e) => setEmail(e.target.value)}  
          required
        />
        <FormControl sx={{ m: 1, width: '25ch' }} variant="outlined">
          <InputLabel htmlFor="outlined-adornment-password">Password</InputLabel>
          <OutlinedInput
            id="outlined-adornment-password"
            label="Password"
            type={showPassword ? 'text' : 'password'}
            value={password} 
            onChange={(e) => setPassword(e.target.value)}
            required
            endAdornment={
              <InputAdornment position="end">
                <IconButton
                  aria-label={
                    showPassword ? 'hide the password' : 'display the password'
                  }
                  onClick={handleClickShowPassword}
                  onMouseDown={handleMouseDownPassword}
                  edge="end"
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            }
          />
        </FormControl>
        <Button 
          type='submit' 
          variant="contained" 
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Signing Up...' : 'Sign Up'}
        </Button>
        <Button 
          variant="contained" 
           startIcon={<GoogleIcon />}
          onClick={handleGoogle}
          disabled={isSubmitting}
        >
          Signup With Google
        </Button>
      </Box>
      <span style={{ display: 'block', marginTop: '10px' }}>
        Got an account? <Link to="/login" style={{ color: '#000000', textDecoration: 'none' }}>log in</Link>
      </span>
      </div>
      </div>
    )
}

export default Signup;