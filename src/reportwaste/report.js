import React, { useState, useEffect, useCallback } from 'react';
import {
  Container, Card, Typography, TextField, Button,
  MenuItem, Box, Grid, Modal
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { useOutletContext } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import axios from 'axios';
import { verifyWasteImage, estimateWasteWeight } from '../utils/imageVerification';

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
  const [verificationDetails, setVerificationDetails] = useState(null);
  const [weightEstimation, setWeightEstimation] = useState(null);

  const wasteTypes = ['Plastic', 'Paper', 'Metal', 'Organic', 'Mixed', 'Glass', 'Electronics'];
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
      setImage(file);
      setVerificationStatus(null);
      setVerificationDetails(null);
      setWeightEstimation(null);
      setOpen(true);
    }
  };

  const handleVerify = async () => {
    if (!image) {
      alert('Please select an image first.');
      return;
    }

    setIsVerifying(true);
    setVerificationStatus(null);
    
    try {
      // Use the utility function for image verification
      const verificationResult = await verifyWasteImage(image);
      
      if (!verificationResult.success) {
        setVerificationStatus('Failed');
        alert(`❌ Verification failed: ${verificationResult.error}`);
        setOpen(false);
        return;
      }

      const analysisResult = verificationResult.data;
      setVerificationDetails(analysisResult);
      
      // Estimate weight using utility function
      const weightResult = await estimateWasteWeight(image, analysisResult.wasteTypes || ['general']);
      if (weightResult.success) {
        setWeightEstimation(weightResult.data);
      }

      // Determine verification status
      if (analysisResult.isWaste && analysisResult.confidence >= 60) {
        // Auto-select appropriate waste type based on detected types
        const detectedType = mapWasteTypeToSelection(analysisResult.wasteTypes);
        setWasteType(detectedType);
        setVerificationStatus('Verified');
        
        const weightInfo = weightResult.success 
          ? `\nEstimated Weight: ${weightResult.data.estimatedWeight}kg (${weightResult.data.weightRange.min}-${weightResult.data.weightRange.max}kg)`
          : '';
        
        alert(`✅ Image verified successfully!\n\nDetected: ${detectedType}\nConfidence: ${analysisResult.confidence}%\nDescription: ${analysisResult.description}${weightInfo}`);
      } else if (!analysisResult.isWaste) {
        setVerificationStatus('Failed');
        alert(`❌ Verification failed: No waste detected in the image.\n\nReason: ${analysisResult.reasoning}`);
      } else {
        setVerificationStatus('Failed');
        alert(`❌ Verification failed: Low confidence level (${analysisResult.confidence}%).\n\nPlease upload a clearer image of the waste.`);
      }
      
      setOpen(false);
    } catch (error) {
      console.error('Error during verification:', error);
      setVerificationStatus('Failed');
      alert(`❌ Verification failed: ${error.message}\n\nPlease try again or contact support if the issue persists.`);
      setOpen(false);
    } finally {
      setIsVerifying(false);
    }
  };

  // Helper function to map detected waste types to our selection options
  const mapWasteTypeToSelection = (detectedTypes) => {
    if (!detectedTypes || detectedTypes.length === 0) return 'Mixed';
    
    const typeMapping = {
      'plastic': 'Plastic',
      'paper': 'Paper',
      'metal': 'Metal',
      'organic': 'Organic',
      'glass': 'Glass',
      'electronics': 'Electronics',
      'general': 'Mixed'
    };

    // Return the first mapped type or Mixed if no match
    for (const detected of detectedTypes) {
      const mapped = typeMapping[detected.toLowerCase()];
      if (mapped) return mapped;
    }
    
    return 'Mixed';
  };

  const uploadImageToServer = async (imageFile) => {
    // In a real application, you would upload the image to a file storage service
    // For now, we'll simulate this and return a mock path
    return `uploads/waste_images/${Date.now()}_${imageFile.name}`;
  };

  const calculatePoints = (verificationDetails, weightEstimation) => {
    let basePoints = 15; // Increased base points
    let bonusPoints = 0;

    // Confidence bonus
    if (verificationDetails?.confidence >= 80) {
      bonusPoints += 10;
    } else if (verificationDetails?.confidence >= 70) {
      bonusPoints += 5;
    }

    // Weight-based bonus
    if (weightEstimation?.estimatedWeight > 5) {
      bonusPoints += 15; // Large waste bonus
    } else if (weightEstimation?.estimatedWeight > 2) {
      bonusPoints += 8; // Medium waste bonus
    }

    // Priority bonus
    if (priority === 'High') {
      bonusPoints += 5;
    }

    return {
      basePoints,
      bonusPoints,
      totalPoints: basePoints + bonusPoints
    };
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
      
      // Calculate points
      const pointsCalculation = calculatePoints(verificationDetails, weightEstimation);
      
      // Prepare payload for backend
      const payload = {
        user_id: user.id,
        location: location.trim(),
        image_path: imagePath,
        description: description.trim(),
        waste_type: wasteType,
        priority: priority.toLowerCase(),
        verification_status: 'Verified',
        points_awarded: pointsCalculation.totalPoints,
        verification_confidence: verificationDetails?.confidence || 0,
        verification_description: verificationDetails?.description || '',
        estimated_weight: weightEstimation?.estimatedWeight || null,
        weight_range_min: weightEstimation?.weightRange?.min || null,
        weight_range_max: weightEstimation?.weightRange?.max || null
      };

      // Submit to backend
      const response = await axios.post('http://localhost:5000/api/reportwaste', payload);
      
      if (response.status === 201) {
        // Update points
        setAvailablePoints(availablePoints + pointsCalculation.totalPoints);
        
        const pointsBreakdown = `Base: ${pointsCalculation.basePoints} + Bonus: ${pointsCalculation.bonusPoints} = ${pointsCalculation.totalPoints} points`;
        const weightInfo = weightEstimation ? `\nEstimated weight: ${weightEstimation.estimatedWeight}kg` : '';
        
        alert(`✅ Waste report submitted successfully!\n${pointsBreakdown}${weightInfo}`);
        
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
    setVerificationDetails(null);
    setWeightEstimation(null);
  };

  return (
    <Container maxWidth="md" sx={{ mt: 13, ml: 20 }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" sx={{ color: '#2e7d32' }}>
          Report Improper Waste Disposal
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Help make your community cleaner and earn rewards! Enhanced with smart verification.
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
            Smart Waste Reporting Process
          </Typography>
          <Typography variant="body2">1. Take a clear photo of the waste.</Typography>
          <Typography variant="body2">2. Smart verification analyzes image quality and content.</Typography>
          <Typography variant="body2">3. Weight estimation helps assess environmental impact.</Typography>
          <Typography variant="body2">4. Earn points based on quality, weight, and priority!</Typography>
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
                      Click to change image • Smart verification required
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
                helperText="Auto-detected after verification"
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
                <Box sx={{ textAlign: 'center', mb: 2 }}>
                  <Typography 
                    sx={{ 
                      color: verificationStatus === 'Verified' ? 'green' : 'red', 
                      fontWeight: 'bold',
                      mb: 1
                    }}
                  >
                    {verificationStatus === 'Verified' ? '✅ Smart Verification Successful' : '❌ Smart Verification Failed'}
                  </Typography>
                  {verificationDetails && verificationStatus === 'Verified' && (
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Confidence: {verificationDetails.confidence}% | 
                        Type: {wasteType}
                        {verificationDetails.confidence >= 80 && ' 🌟 High Quality Bonus!'}
                      </Typography>
                      {weightEstimation && (
                        <Typography variant="body2" color="text.secondary">
                          Estimated Weight: {weightEstimation.estimatedWeight}kg 
                          ({weightEstimation.weightRange.min}-{weightEstimation.weightRange.max}kg range)
                          {weightEstimation.estimatedWeight > 5 && ' 📦 Large Waste Bonus!'}
                        </Typography>
                      )}
                    </Box>
                  )}
                </Box>
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
          <Typography variant="h6" mb={2}>Smart Image Verification</Typography>
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
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Smart verification will analyze this image for waste detection, type classification, and weight estimation.
          </Typography>
          <Button 
            onClick={handleVerify} 
            variant="contained" 
            color="success" 
            disabled={isVerifying}
            sx={{ mt: 2, mr: 1 }}
          >
            {isVerifying ? 'Analyzing...' : 'Verify Image'}
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
      {loading ? (
        <Card elevation={3} sx={{ mt: 3, p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            Loading your reports...
          </Typography>
        </Card>
      ) : userReports.length > 0 ? (
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
                    {report.verification_confidence && (
                      <span style={{ fontSize: '0.8em', marginLeft: '8px' }}>
                        🎯 {report.verification_confidence}%
                      </span>
                    )}
                  </Typography>
                  <Typography variant="body2" noWrap>
                    📍 {report.location}
                  </Typography>
                  {report.estimated_weight && (
                    <Typography variant="body2" sx={{ fontSize: '0.8em', color: 'text.secondary' }}>
                      ⚖️ ~{report.estimated_weight}kg
                    </Typography>
                  )}
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
      ) : (
        <Card elevation={3} sx={{ mt: 3, p: 3, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom sx={{ color: '#2e7d32' }}>
            No Reports Yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Submit your first waste report to start earning points!
          </Typography>
        </Card>
      )}
    </Container>
  );
}

export default Waste;