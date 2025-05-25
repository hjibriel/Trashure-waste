import React, { useState, useEffect, useCallback } from 'react';
import {
  Container, Card, Typography, TextField, Button,
  MenuItem, Box, Grid, Modal
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { useOutletContext } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import axios from 'axios';

function Waste() {
  const { setAvailablePoints, availablePoints } = useOutletContext();
  const { user } = useUser();

  const [location, setLocation] = useState('');
  const [wasteType, setWasteType] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(null);
  const [open, setOpen] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [userReports, setUserReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const wasteTypes = ['Plastic', 'Paper', 'Metal', 'Organic', 'Mixed'];
  const priorities = ['High', 'Medium', 'Low'];

  const fetchUserReports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/reportwaste');
      const data = await res.json();
      // Filter reports for current user
      const userReports = data.filter(report => report.user_id === user.id);
      setUserReports(userReports);
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching user reports:', err);
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    if (user) {
      fetchUserReports();
    }
  }, [user, fetchUserReports]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file.');
        return;
      }
      
      // Validate file size (e.g., max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB.');
        return;
      }
      
      setImage(file);
      setOpen(true);
    }
  };

  const handleVerify = async () => {
    setIsVerifying(true);
    try {
      // Simulate AI verification logic
      // In a real app, you might send the image to an AI service for verification
      
      // For now, simulate verification process
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
      
      // Simulate verification result (90% chance of success for demo)
      const isVerified = Math.random() > 0.1;
      
      if (isVerified) {
        // Auto-detect waste type based on image (simulated)
        const detectedTypes = ['Plastic', 'Paper', 'Metal', 'Organic'];
        const randomType = detectedTypes[Math.floor(Math.random() * detectedTypes.length)];
        
        setWasteType(randomType);
        setVerificationStatus('Verified');
        alert(`Image verified! Detected waste type: ${randomType}`);
      } else {
        setVerificationStatus('Failed');
        alert('Verification failed. Please try uploading a clearer image.');
      }
      
      setOpen(false);
    } catch (error) {
      console.error('Error during verification:', error);
      setVerificationStatus('Failed');
      alert('Verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const uploadImageToServer = async (imageFile) => {
    // In a real application, you would upload the image to a file storage service
    // For now, we'll simulate this and return a mock path
    return `uploads/waste_images/${Date.now()}_${imageFile.name}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      alert('Please log in to submit a report.');
      return;
    }

    if (!location || !wasteType || !image || verificationStatus !== 'Verified') {
      alert('Please complete all fields and verify the image.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Upload image and get path
      const imagePath = await uploadImageToServer(image);
      
      // Prepare payload for backend
      const payload = {
        user_id: user.id,
        location: location.trim(),
        image_path: imagePath,
        description: description.trim(),
        waste_type: wasteType,
        priority: priority.toLowerCase(),
        verification_status: 'Verified',
        points_awarded: 10
      };

      // Submit to backend
      const response = await axios.post('http://localhost:5000/api/reportwaste', payload);
      
      if (response.status === 201) {
        // Update points
        setAvailablePoints(availablePoints + 10);
        
        alert('Waste report submitted successfully! You earned 10 points.');
        
        // Reset form
        resetForm();
        
        // Refresh user reports
        await fetchUserReports();
      }
    } catch (error) {
      console.error('Error submitting waste report:', error);
      
      if (error.response?.data?.error) {
        alert(`Error: ${error.response.data.error}`);
      } else {
        alert('Failed to submit waste report. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setLocation('');
    setWasteType('');
    setPriority('Medium');
    setDescription('');
    setImage(null);
    setVerificationStatus(null);
  };

  return (
    <Container maxWidth="md" sx={{ mt: 13, ml: 20 }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" sx={{ color: '#2e7d32' }}>
          Report Improper Waste Disposal
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Help make your community cleaner and earn rewards!
        </Typography>
      </Box>

      {/* Points Summary */}
      <Card elevation={3} sx={{ p: 2, mb: 3, bgcolor: '#e8f5e9' }}>
        <Typography variant="h6" align="center" sx={{ color: '#2e7d32' }}>
          Your Reporting Stats
        </Typography>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={4}>
            <Typography align="center">
              <strong>{userReports.length}</strong><br />
              <small>Total Reports</small>
            </Typography>
          </Grid>
          <Grid item xs={4}>
            <Typography align="center">
              <strong>{userReports.filter(r => r.verification_status === 'Verified').length}</strong><br />
              <small>Verified</small>
            </Typography>
          </Grid>
          <Grid item xs={4}>
            <Typography align="center">
              <strong>{userReports.filter(r => r.verification_status === 'Verified').reduce((sum, r) => sum + (r.points_awarded || 0), 0)}</strong><br />
              <small>Points Earned</small>
            </Typography>
          </Grid>
        </Grid>
      </Card>

      <Card elevation={5} sx={{ p: 4, bgcolor: '#f5f5f5' }}>
        <Box sx={{ bgcolor: '#2e7d32', color: 'white', p: 3, borderRadius: 2, mb: 3 }}>
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            Reporting Process
          </Typography>
          <Typography variant="body2">1. Take a clear photo of the waste.</Typography>
          <Typography variant="body2">2. Provide the location of the waste.</Typography>
          <Typography variant="body2">3. Wait for verification.</Typography>
          <Typography variant="body2">4. Earn rewards for verified reports!</Typography>
        </Box>

        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField 
                fullWidth 
                label="Location" 
                value={location} 
                onChange={(e) => setLocation(e.target.value)} 
                required 
                placeholder="Enter the specific location where waste was found"
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ 
                border: '2px dashed #aaa', 
                borderRadius: 2, 
                textAlign: 'center', 
                py: 3, 
                cursor: 'pointer', 
                bgcolor: image ? '#e8f5e9' : 'transparent',
                '&:hover': { borderColor: '#2e7d32' }
              }}>
                <input 
                  type="file" 
                  accept="image/*" 
                  hidden 
                  onChange={handleImageUpload} 
                  id="upload-photo" 
                />
                <label htmlFor="upload-photo" style={{ cursor: 'pointer' }}>
                  <CloudUploadIcon color="success" sx={{ fontSize: 32 }} />
                  <Typography variant="body2" mt={1}>
                    {image ? `Selected: ${image.name}` : 'Click or drag to upload image'}
                  </Typography>
                  {image && (
                    <Typography variant="caption" color="text.secondary">
                      Click to change image
                    </Typography>
                  )}
                </label>
              </Box>
            </Grid>

            <Grid item xs={12}>
              <TextField 
                fullWidth 
                label="Description" 
                multiline 
                rows={3} 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                required 
                placeholder="Describe the waste situation in detail"
              />
            </Grid>

            <Grid item xs={6}>
              <TextField 
                select 
                label="Waste Type" 
                fullWidth 
                value={wasteType} 
                onChange={(e) => setWasteType(e.target.value)} 
                required
                helperText="Auto-filled after image verification"
                disabled={!verificationStatus}
              >
                {wasteTypes.map((type) => (
                  <MenuItem key={type} value={type}>{type}</MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={6}>
              <TextField 
                select 
                label="Priority Level" 
                fullWidth 
                value={priority} 
                onChange={(e) => setPriority(e.target.value)}
              >
                {priorities.map((p) => (
                  <MenuItem key={p} value={p}>{p}</MenuItem>
                ))}
              </TextField>
            </Grid>

            {verificationStatus && (
              <Grid item xs={12}>
                <Typography 
                  align="center" 
                  sx={{ 
                    color: verificationStatus === 'Verified' ? 'green' : 'red', 
                    mb: 2,
                    fontWeight: 'bold'
                  }}
                >
                  {verificationStatus === 'Verified' ? '✅ Image Verified' : '❌ Verification Failed'}
                </Typography>
              </Grid>
            )}

            <Grid item xs={12}>
              <Button 
                fullWidth 
                variant="contained" 
                type="submit" 
                disabled={isSubmitting || verificationStatus !== 'Verified'}
                sx={{ 
                  bgcolor: '#2e7d32', 
                  borderRadius: 2, 
                  padding: '14px 0',
                  '&:hover': { bgcolor: '#1b5e20' }
                }}
              >
                {isSubmitting ? 'Submitting Report...' : 'Submit Report'}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Card>

      {/* Image Verification Modal */}
      <Modal open={open} onClose={() => !isVerifying && setOpen(false)}>
        <Box sx={{ 
          p: 3, 
          bgcolor: 'white', 
          borderRadius: 2, 
          textAlign: 'center', 
          width: 400, 
          mx: 'auto', 
          mt: 10,
          maxHeight: '80vh',
          overflow: 'auto'
        }}>
          <Typography variant="h6" mb={2}>Verify Waste Image</Typography>
          {image && (
            <Box sx={{ mb: 2 }}>
              <img 
                src={URL.createObjectURL(image)} 
                alt="Preview" 
                style={{ 
                  width: '100%', 
                  maxHeight: '300px',
                  objectFit: 'contain',
                  borderRadius: 10,
                  border: '1px solid #ddd'
                }} 
              />
              <Typography variant="caption" display="block" mt={1} color="text.secondary">
                File: {image.name} ({(image.size / 1024 / 1024).toFixed(2)} MB)
              </Typography>
            </Box>
          )}
          <Button 
            onClick={handleVerify} 
            variant="contained" 
            color="success" 
            disabled={isVerifying}
            sx={{ mt: 2, mr: 1 }}
          >
            {isVerifying ? 'Verifying...' : 'Verify Image'}
          </Button>
          <Button 
            onClick={() => setOpen(false)} 
            variant="outlined" 
            disabled={isVerifying}
            sx={{ mt: 2 }}
          >
            Cancel
          </Button>
        </Box>
      </Modal>

      {/* Recent Reports */}
      {userReports.length > 0 && (
        <Card elevation={3} sx={{ mt: 3, p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ color: '#2e7d32' }}>
            Your Recent Reports
          </Typography>
          <Grid container spacing={2}>
            {userReports.slice(0, 3).map((report, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Card variant="outlined" sx={{ p: 2, height: '100%' }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {report.waste_type} • {report.priority}
                  </Typography>
                  <Typography variant="body2" noWrap>
                    📍 {report.location}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Status: <span style={{ 
                      color: report.verification_status === 'Verified' ? 'green' : 'orange' 
                    }}>
                      {report.verification_status}
                    </span>
                  </Typography>
                  {report.verification_status === 'Verified' && (
                    <Typography variant="body2" sx={{ color: 'green', fontWeight: 'bold' }}>
                      +{report.points_awarded} points
                    </Typography>
                  )}
                </Card>
              </Grid>
            ))}
          </Grid>
        </Card>
      )}
    </Container>
  );
}

export default Waste;