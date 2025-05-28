import '../App.css'
import React, { useState, useEffect, useCallback } from 'react';
import { Box, Card, CardContent, Typography, Button, Grid, CircularProgress, Stack, Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import RedeemIcon from '@mui/icons-material/Redeem';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PaymentIcon from '@mui/icons-material/Payment';
import { useOutletContext } from "react-router-dom";
import { useUser } from '@clerk/clerk-react';
import axios from 'axios';


const Rcontent = () => {
  const { availablePoints, setAvailablePoints } = useOutletContext();
  const { user } = useUser();
  
  // State management
  const [loading, setLoading] = useState(true);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [pointsBreakdown, setPointsBreakdown] = useState({
    collectionPoints: 0,
    reportingPoints: 0,
    totalPoints: 0
  });
  const [isRedeeming, setIsRedeeming] = useState(false);
  
  // PayPal integration states
  const [paypalDialogOpen, setPaypalDialogOpen] = useState(false);
  const [paypalEmail, setPaypalEmail] = useState('');
  const [redemptionAmount, setRedemptionAmount] = useState(0);
  const [redemptionType, setRedemptionType] = useState('');
  const [conversionRate] = useState(0.01); // 1 point = $0.01
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Fetch all user data and calculate points
  const fetchAllUserData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch all data sequentially to ensure proper calculation
      const [collections, reports] = await Promise.all([
        fetchUserCollections(),
        fetchUserReports(),
        fetchRewardTransactions() // This will update recentTransactions state
      ]);

      // Calculate total points from actual data
      const collectionPoints = collections.reduce((sum, c) => {
        return sum + (c.points_earned || 0);
      }, 0);
      
      const verifiedReports = reports.filter(report => report.verification_status === 'Verified');
      
      const reportingPoints = verifiedReports.reduce((sum, report) => {
        return sum + (report.points_awarded || 0);
      }, 0);
      
      const totalCalculatedPoints = collectionPoints + reportingPoints;

      // Try to get stored rewards, but use calculated points as fallback
      let finalTotalPoints = totalCalculatedPoints;
      let userReward = null;
      
      try {
        userReward = await fetchUserRewards();
        
        if (userReward && userReward.total_points !== undefined) {
          // If there's a significant discrepancy, use the calculated points
          if (Math.abs(userReward.total_points - totalCalculatedPoints) > 5) {
            finalTotalPoints = totalCalculatedPoints;
            // Update the stored value to match calculated
            await updateUserRewards(totalCalculatedPoints);
          } else {
            finalTotalPoints = userReward.total_points;
          }
        }
      } catch (error) {
        console.error('Error fetching stored rewards, using calculated points:', error);
        finalTotalPoints = totalCalculatedPoints;
      }

      // Update all states with final calculated values
      const finalBreakdown = {
        collectionPoints,
        reportingPoints,
        totalPoints: finalTotalPoints
      };

      setPointsBreakdown(finalBreakdown);
      setAvailablePoints(finalTotalPoints);
      
    } catch (error) {
      console.error('Error in fetchAllUserData:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id, setAvailablePoints]);

  useEffect(() => {
    if (user) {
      fetchAllUserData();
    }
  }, [user, fetchAllUserData]);

  // Fetch user collections and return them
  const fetchUserCollections = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/collect');
      if (!res.ok) {
        throw new Error('Failed to fetch collections');
      }
      
      const data = await res.json();
      const userCollections = data.filter(c => c.user_id === user.id);
      
      return userCollections;
    } catch (err) {
      console.error('Error fetching collections:', err);
      return [];
    }
  };

  // Fetch user waste reports and return them
  const fetchUserReports = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/reportwaste');
      if (!res.ok) {
        throw new Error('Failed to fetch reports');
      }
      
      const data = await res.json();
      const userReports = data.filter(report => report.user_id === user.id);
      
      return userReports;
    } catch (err) {
      console.error('Error fetching reports:', err);
      return [];
    }
  };

  // Fetch reward transactions for recent activity
  const fetchRewardTransactions = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/rewardTransactions');
      if (!res.ok) {
        throw new Error('Failed to fetch reward transactions');
      }
      
      const data = await res.json();
      const userTransactions = data
        .filter(t => t.user_id === user.id)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5); // Get last 5 transactions
      
      setRecentTransactions(userTransactions);
      return userTransactions;
    } catch (err) {
      console.error('Error fetching reward transactions:', err);
      setRecentTransactions([]);
      return [];
    }
  };

  // Fetch user rewards from database
  const fetchUserRewards = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/userRewards');
      if (!res.ok) {
        throw new Error('Failed to fetch user rewards');
      }
      
      const data = await res.json();
      const userReward = data.find(r => r.user_id === user.id);
      
      return userReward;
    } catch (err) {
      console.error('Error fetching user rewards:', err);
      return null;
    }
  };

  // Update user rewards in database
  const updateUserRewards = async (newTotalPoints) => {
    try {
      const response = await axios.post('http://localhost:5000/api/userRewards', {
        user_id: user.id,
        total_points: newTotalPoints
      });
      console.log('Updated user rewards response:', response.data);
    } catch (error) {
      console.error('Error updating user rewards:', error);
      throw error;
    }
  };

  // Add reward transaction
  const addRewardTransaction = async (transactionType, description, points, paypalEmail = null, cashAmount = null) => {
    try {
      const response = await axios.post('http://localhost:5000/api/rewardTransactions', {
        user_id: user.id,
        transaction_type: transactionType,
        description: description,
        points: points,
        paypal_email: paypalEmail,
        cash_amount: cashAmount
      });
      console.log('Added reward transaction:', response.data);
    } catch (error) {
      console.error('Error adding reward transaction:', error);
      throw error;
    }
  };

  // PayPal payment processing (mock implementation)
  const processPayPalPayment = async (email, amount, points) => {
    try {
      // This is a mock implementation - in a real app, you'd integrate with PayPal API
      console.log(`Processing PayPal payment: $${amount} to ${email} for ${points} points`);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock success response
      return {
        success: true,
        transactionId: `PP_${Date.now()}`,
        message: 'Payment processed successfully'
      };
    } catch (error) {
      console.error('PayPal payment error:', error);
      return {
        success: false,
        message: 'Payment processing failed'
      };
    }
  };

  // Open PayPal redemption dialog
  const openPayPalDialog = (type, points) => {
    setRedemptionType(type);
    setRedemptionAmount(points);
    setPaypalDialogOpen(true);
  };

  // Handle PayPal redemption
  const handlePayPalRedemption = async () => {
    if (!paypalEmail || !paypalEmail.includes('@')) {
      alert('Please enter a valid PayPal email address.');
      return;
    }

    if (redemptionAmount <= 0) {
      alert('No points available to redeem.');
      return;
    }

    const cashAmount = (redemptionAmount * conversionRate).toFixed(2);
    
    if (!window.confirm(`Redeem ${redemptionAmount} points for $${cashAmount} via PayPal to ${paypalEmail}?`)) {
      return;
    }

    setIsProcessingPayment(true);
    
    try {
      // Process PayPal payment
      const paymentResult = await processPayPalPayment(paypalEmail, cashAmount, redemptionAmount);
      
      if (!paymentResult.success) {
        throw new Error(paymentResult.message);
      }

      // Update points and create transaction record
      const newTotal = availablePoints - redemptionAmount;
      
      await addRewardTransaction(
        'paypal_redeem', 
        `PayPal redemption: $${cashAmount} to ${paypalEmail}`, 
        -redemptionAmount,
        paypalEmail,
        parseFloat(cashAmount)
      );
      
      await updateUserRewards(newTotal);
      
      // Update local state based on redemption type
      if (redemptionType === 'all') {
        setAvailablePoints(0);
        setPointsBreakdown({
          collectionPoints: 0,
          reportingPoints: 0,
          totalPoints: 0
        });
      } else {
        const remainingRatio = redemptionType === 'collection' || redemptionType === 'reporting' 
          ? Math.max(0, (availablePoints - redemptionAmount) / availablePoints)
          : 1;
          
        let newCollectionPoints = pointsBreakdown.collectionPoints;
        let newReportingPoints = pointsBreakdown.reportingPoints;
        
        if (redemptionType === 'collection') {
          newCollectionPoints = Math.max(0, pointsBreakdown.collectionPoints - redemptionAmount);
        } else if (redemptionType === 'reporting') {
          newReportingPoints = Math.max(0, pointsBreakdown.reportingPoints - redemptionAmount);
        }
        
        setAvailablePoints(newTotal);
        setPointsBreakdown({
          collectionPoints: newCollectionPoints,
          reportingPoints: newReportingPoints,
          totalPoints: newTotal
        });
      }
      
      // Refresh transactions
      await fetchRewardTransactions();
      
      alert(`Successfully redeemed ${redemptionAmount} points for $${cashAmount}! Payment sent to ${paypalEmail}.`);
      
      // Close dialog and reset
      setPaypalDialogOpen(false);
      setPaypalEmail('');
      setRedemptionAmount(0);
      setRedemptionType('');
      
    } catch (error) {
      console.error('Error processing PayPal redemption:', error);
      alert('Failed to process PayPal redemption. Please try again.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Handle regular redemption (without PayPal)
  const handleRedeemAll = async () => {
    if (availablePoints <= 0) {
      alert('No points available to redeem.');
      return;
    }

    if (!window.confirm(`Are you sure you want to redeem all ${availablePoints} points?`)) {
      return;
    }

    setIsRedeeming(true);
    try {
      // Add transaction record
      await addRewardTransaction('redeem', 'Redeemed all points', -availablePoints);
      
      // Update user rewards to 0
      await updateUserRewards(0);
      
      // Update local state
      setAvailablePoints(0);
      setPointsBreakdown({
        collectionPoints: 0,
        reportingPoints: 0,
        totalPoints: 0
      });
      
      // Refresh transactions
      await fetchRewardTransactions();
      
      alert(`Successfully redeemed ${availablePoints} points!`);
    } catch (error) {
      console.error('Error redeeming points:', error);
      alert('Failed to redeem points. Please try again.');
    } finally {
      setIsRedeeming(false);
    }
  };

  // Handle redeem specific category
  const handleRedeemCategory = async (categoryName, points) => {
    if (points <= 0) {
      alert(`No ${categoryName} points available to redeem.`);
      return;
    }

    if (availablePoints <= 0) {
      alert('No points available to redeem.');
      return;
    }

    const pointsToRedeem = Math.min(points, availablePoints);
    
    if (!window.confirm(`Are you sure you want to redeem ${pointsToRedeem} ${categoryName} points?`)) {
      return;
    }

    setIsRedeeming(true);
    try {
      const newTotal = availablePoints - pointsToRedeem;
      
      await addRewardTransaction('redeem', `Redeemed ${categoryName} points`, -pointsToRedeem);
      await updateUserRewards(newTotal);
      
      const remainingRatio = newTotal / availablePoints;
      const newCollectionPoints = Math.floor(pointsBreakdown.collectionPoints * remainingRatio);
      const newReportingPoints = Math.floor(pointsBreakdown.reportingPoints * remainingRatio);
      
      let adjustedCollectionPoints = newCollectionPoints;
      let adjustedReportingPoints = newReportingPoints;
      
      if (categoryName === 'Collection') {
        adjustedCollectionPoints = Math.max(0, pointsBreakdown.collectionPoints - pointsToRedeem);
        if (adjustedCollectionPoints + adjustedReportingPoints > newTotal) {
          adjustedReportingPoints = newTotal - adjustedCollectionPoints;
        }
      } else if (categoryName === 'Reporting') {
        adjustedReportingPoints = Math.max(0, pointsBreakdown.reportingPoints - pointsToRedeem);
        if (adjustedCollectionPoints + adjustedReportingPoints > newTotal) {
          adjustedCollectionPoints = newTotal - adjustedReportingPoints;
        }
      }
      
      setAvailablePoints(newTotal);
      setPointsBreakdown({
        collectionPoints: adjustedCollectionPoints,
        reportingPoints: adjustedReportingPoints,
        totalPoints: newTotal
      });
      
      await fetchRewardTransactions();
      
      alert(`Successfully redeemed ${pointsToRedeem} ${categoryName} points!`);
    } catch (error) {
      console.error('Error redeeming points:', error);
      alert('Failed to redeem points. Please try again.');
    } finally {
      setIsRedeeming(false);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      return 'Invalid Date';
    }
  };

  // Calculate progress for circular progress (max 100)
  const progressValue = Math.min((availablePoints / 1000) * 100, 100);

  if (loading) {
    return (
      <Box className="loading-container">
        <CircularProgress size={60} sx={{ color: '#2E7D32' }} />
        <Typography sx={{ ml: 2 }}>Loading your rewards...</Typography>
      </Box>
    );
  }

  return (
    <Box className="main-container">
      <Grid container spacing={4} className="content-grid">
        <Grid item xs={12} md={8}>
          <Card className="balance-card">
            <CardContent>
              <Typography variant="h6" fontWeight="bold" color="green">Reward Balance</Typography>
              <Box className="progress-container">
                <CircularProgress variant="determinate" value={progressValue} size={100} thickness={5} sx={{ color: '#2E7D32' }} />
                <Box className="progress-text">
                  <Typography variant="h4" fontWeight="bold" color="green">{availablePoints}</Typography>
                </Box>
              </Box>
              <Typography variant="body2" color="text.secondary" mt={1}>
                Available Points
              </Typography>
              
              {/* Points Breakdown Display */}
              <Box className="breakdown-container">
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="text.secondary">Collection Points</Typography>
                    <Typography variant="h6" fontWeight="bold" color="green">
                      {pointsBreakdown.collectionPoints}
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="text.secondary">Reporting Points</Typography>
                    <Typography variant="h6" fontWeight="bold" color="green">
                      {pointsBreakdown.reportingPoints}
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="text.secondary">Total Points</Typography>
                    <Typography variant="h6" fontWeight="bold" color="green">
                      {pointsBreakdown.totalPoints}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            </CardContent>
          </Card>

          <Card className="transactions-card">
            <CardContent>
              <Typography variant="h6" fontWeight="bold" color="green">Recent Transactions</Typography>
              <Stack spacing={2} mt={2}>
                {recentTransactions.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" className="no-transactions">
                    No recent transactions
                  </Typography>
                ) : (
                  recentTransactions.map((transaction, index) => (
                    <Box key={index} className="transaction-item">
                      <Box>
                        <Typography variant="body2">{transaction.description}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(transaction.created_at)}
                        </Typography>
                        {transaction.paypal_email && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            PayPal: {transaction.paypal_email}
                          </Typography>
                        )}
                        {transaction.cash_amount && (
                          <Typography variant="caption" color="primary" display="block">
                            Cash: ${transaction.cash_amount}
                          </Typography>
                        )}
                      </Box>
                      <Typography 
                        fontWeight="bold" 
                        color={transaction.points > 0 ? "#2E7D32" : "#d32f2f"}
                      >
                        {transaction.points > 0 ? '+' : ''}{transaction.points}
                      </Typography>
                    </Box>
                  ))
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card className="redeem-card">
            <CardContent>
              <Typography variant="h6" fontWeight="bold" color="green">Redeem Rewards</Typography>

              <Stack spacing={3} mt={3}>
                <Box textAlign="center">
                  <Typography variant="subtitle2">Your Total Points</Typography>
                  <Typography variant="h5" fontWeight="bold" color="green">{availablePoints} Points</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    ≈ ${(availablePoints * conversionRate).toFixed(2)} USD
                  </Typography>
                  <Button 
                    fullWidth 
                    variant="contained" 
                    className="redeem-button" 
                    startIcon={<RedeemIcon />}
                    onClick={handleRedeemAll}
                    disabled={isRedeeming || availablePoints <= 0}
                    sx={{ mb: 1 }}
                  >
                    {isRedeeming ? 'Redeeming...' : 'Redeem All'}
                  </Button>
                  <Button 
                    fullWidth 
                    variant="outlined" 
                    className="paypal-button" 
                    startIcon={<PaymentIcon />}
                    onClick={() => openPayPalDialog('all', availablePoints)}
                    disabled={isRedeeming || availablePoints <= 0}
                  >
                    Redeem via PayPal
                  </Button>
                </Box>

                <Box textAlign="center">
                  <Typography variant="subtitle2">Waste Reported Reward</Typography>
                  <Typography variant="h5" fontWeight="bold" color="green">{pointsBreakdown.reportingPoints} Points</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    ≈ ${(pointsBreakdown.reportingPoints * conversionRate).toFixed(2)} USD
                  </Typography>
                  <Button 
                    fullWidth 
                    variant="contained" 
                    className="redeem-button" 
                    startIcon={<AttachMoneyIcon />}
                    onClick={() => handleRedeemCategory('Reporting', pointsBreakdown.reportingPoints)}
                    disabled={isRedeeming || pointsBreakdown.reportingPoints <= 0 || availablePoints <= 0}
                    sx={{ mb: 1 }}
                  >
                    {isRedeeming ? 'Redeeming...' : 'Redeem'}
                  </Button>
                  <Button 
                    fullWidth 
                    variant="outlined" 
                    className="paypal-button" 
                    startIcon={<PaymentIcon />}
                    onClick={() => openPayPalDialog('reporting', pointsBreakdown.reportingPoints)}
                    disabled={isRedeeming || pointsBreakdown.reportingPoints <= 0 || availablePoints <= 0}
                  >
                    Redeem via PayPal
                  </Button>
                </Box>

                <Box textAlign="center">
                  <Typography variant="subtitle2">Waste Collection Reward</Typography>
                  <Typography variant="h5" fontWeight="bold" color="green">{pointsBreakdown.collectionPoints} Points</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    ≈ ${(pointsBreakdown.collectionPoints * conversionRate).toFixed(2)} USD
                  </Typography>
                  <Button 
                    fullWidth 
                    variant="contained" 
                    className="redeem-button" 
                    startIcon={<AttachMoneyIcon />}
                    onClick={() => handleRedeemCategory('Collection', pointsBreakdown.collectionPoints)}
                    disabled={isRedeeming || pointsBreakdown.collectionPoints <= 0 || availablePoints <= 0}
                    sx={{ mb: 1 }}
                  >
                    {isRedeeming ? 'Redeeming...' : 'Redeem'}
                  </Button>
                  <Button 
                    fullWidth 
                    variant="outlined" 
                    className="paypal-button" 
                    startIcon={<PaymentIcon />}
                    onClick={() => openPayPalDialog('collection', pointsBreakdown.collectionPoints)}
                    disabled={isRedeeming || pointsBreakdown.collectionPoints <= 0 || availablePoints <= 0}
                  >
                    Redeem via PayPal
                  </Button>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* PayPal Redemption Dialog */}
      <Dialog open={paypalDialogOpen} onClose={() => setPaypalDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <PaymentIcon color="primary" />
            PayPal Redemption
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Redeem {redemptionAmount} points for ${(redemptionAmount * conversionRate).toFixed(2)} USD via PayPal
          </Typography>
          
          <TextField
            fullWidth
            label="PayPal Email Address"
            type="email"
            value={paypalEmail}
            onChange={(e) => setPaypalEmail(e.target.value)}
            placeholder="Enter your PayPal email"
            variant="outlined"
            sx={{ mb: 2 }}
            helperText="Enter the email address associated with your PayPal account"
          />
          
          <Box className="paypal-summary">
            <Typography variant="subtitle2" gutterBottom>Redemption Summary:</Typography>
            <Typography variant="body2">Points to redeem: {redemptionAmount}</Typography>
            <Typography variant="body2">Cash amount: ${(redemptionAmount * conversionRate).toFixed(2)} USD</Typography>
            <Typography variant="body2">Conversion rate: 1 point = ${conversionRate} USD</Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaypalDialogOpen(false)} disabled={isProcessingPayment}>
            Cancel
          </Button>
          <Button 
            onClick={handlePayPalRedemption} 
            variant="contained" 
            disabled={isProcessingPayment || !paypalEmail}
            startIcon={isProcessingPayment ? <CircularProgress size={20} /> : <PaymentIcon />}
          >
            {isProcessingPayment ? 'Processing...' : 'Redeem via PayPal'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Rcontent;