import React, { useState, useEffect, useCallback } from 'react';
import { Box, Card, CardContent, Typography, Button, Grid, CircularProgress, Stack } from '@mui/material';
import RedeemIcon from '@mui/icons-material/Redeem';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
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
  const addRewardTransaction = async (transactionType, description, points) => {
    try {
      const response = await axios.post('http://localhost:5000/api/rewardTransactions', {
        user_id: user.id,
        transaction_type: transactionType,
        description: description,
        points: points
      });
      console.log('Added reward transaction:', response.data);
    } catch (error) {
      console.error('Error adding reward transaction:', error);
      throw error;
    }
  };

  // Handle redeem all points
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
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress size={60} sx={{ color: '#2E7D32' }} />
        <Typography sx={{ ml: 2 }}>Loading your rewards...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#F4FFF6', display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }}>
      <Grid container spacing={4} sx={{ maxWidth: '1200px', width: '100%' }}>
        <Grid item xs={12} md={8}>
          <Card sx={{ p: 4, textAlign: 'center', boxShadow: 3, mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" color="green">Reward Balance</Typography>
              <Box sx={{ position: 'relative', display: 'inline-flex', mt: 2 }}>
                <CircularProgress variant="determinate" value={progressValue} size={100} thickness={5} sx={{ color: '#2E7D32' }} />
                <Box
                  sx={{
                    top: 0, left: 0, bottom: 0, right: 0,
                    position: 'absolute', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <Typography variant="h4" fontWeight="bold" color="green">{availablePoints}</Typography>
                </Box>
              </Box>
              <Typography variant="body2" color="text.secondary" mt={1}>
                Available Points
              </Typography>
              
              {/* Points Breakdown Display */}
              <Box sx={{ mt: 3, p: 2, backgroundColor: '#E8F5E9', borderRadius: 2 }}>
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

          <Card sx={{ p: 3, boxShadow: 2 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" color="green">Recent Transactions</Typography>
              <Stack spacing={2} mt={2}>
                {recentTransactions.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                    No recent transactions
                  </Typography>
                ) : (
                  recentTransactions.map((transaction, index) => (
                    <Box key={index} display="flex" justifyContent="space-between" sx={{ p: 2, backgroundColor: "#E8F5E9", borderRadius: 2 }}>
                      <Box>
                        <Typography variant="body2">{transaction.description}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(transaction.created_at)}
                        </Typography>
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
          <Card sx={{ p: 3, boxShadow: 3, backgroundColor: '#E8F5E9', borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" color="green">Redeem Rewards</Typography>

              <Stack spacing={3} mt={3}>
                <Box textAlign="center">
                  <Typography variant="subtitle2">Your Total Points</Typography>
                  <Typography variant="h5" fontWeight="bold" color="green">{availablePoints} Points</Typography>
                  <Button 
                    fullWidth 
                    variant="contained" 
                    sx={{ mt: 1, backgroundColor: '#2E7D32', '&:hover': { backgroundColor: '#1B5E20' } }} 
                    startIcon={<RedeemIcon />}
                    onClick={handleRedeemAll}
                    disabled={isRedeeming || availablePoints <= 0}
                  >
                    {isRedeeming ? 'Redeeming...' : 'Redeem All'}
                  </Button>
                </Box>

                <Box textAlign="center">
                  <Typography variant="subtitle2">Waste Reported Reward</Typography>
                  <Typography variant="h5" fontWeight="bold" color="green">{pointsBreakdown.reportingPoints} Points</Typography>
                  <Button 
                    fullWidth 
                    variant="contained" 
                    sx={{ mt: 1, backgroundColor: '#2E7D32', '&:hover': { backgroundColor: '#1B5E20' } }} 
                    startIcon={<AttachMoneyIcon />}
                    onClick={() => handleRedeemCategory('Reporting', pointsBreakdown.reportingPoints)}
                    disabled={isRedeeming || pointsBreakdown.reportingPoints <= 0 || availablePoints <= 0}
                  >
                    {isRedeeming ? 'Redeeming...' : 'Redeem'}
                  </Button>
                </Box>

                <Box textAlign="center">
                  <Typography variant="subtitle2">Waste Collection Reward</Typography>
                  <Typography variant="h5" fontWeight="bold" color="green">{pointsBreakdown.collectionPoints} Points</Typography>
                  <Button 
                    fullWidth 
                    variant="contained" 
                    sx={{ mt: 1, backgroundColor: '#2E7D32', '&:hover': { backgroundColor: '#1B5E20' } }} 
                    startIcon={<AttachMoneyIcon />}
                    onClick={() => handleRedeemCategory('Collection', pointsBreakdown.collectionPoints)}
                    disabled={isRedeeming || pointsBreakdown.collectionPoints <= 0 || availablePoints <= 0}
                  >
                    {isRedeeming ? 'Redeeming...' : 'Redeem'}
                  </Button>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Rcontent;