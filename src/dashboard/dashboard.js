import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  Paper,
  Grid,
  CircularProgress,
  Chip,
} from "@mui/material";

import ReportIcon from "@mui/icons-material/Flag";
import RecycleIcon from "@mui/icons-material/Delete";
import StarIcon from "@mui/icons-material/Star";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import VerifiedIcon from "@mui/icons-material/Verified";
import PendingIcon from "@mui/icons-material/Schedule";
import { useUser } from '@clerk/clerk-react';

const Dashboard = () => {
  const { user } = useUser();
  const userName = user?.fullName || 'User';
  
  // State for dashboard data
  const [dashboardData, setDashboardData] = useState({
    totalWeight: 0,
    totalCollections: 0,
    totalPoints: 0,
    scheduledPickups: 0,
    // New waste report stats
    totalReports: 0,
    verifiedReports: 0,
    reportPoints: 0,
    pendingReports: 0,
    recentActivities: [],
    loading: true
  });

  // Fetch collections data
  const fetchCollections = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/collect');
      const data = await res.json();
      return data;
    } catch (err) {
      console.error('Error fetching collections:', err);
      return [];
    }
  };

  // Fetch pickups data
  const fetchPickups = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/pickuprequest');
      const data = await res.json();
      return data;
    } catch (err) {
      console.error('Error fetching pickups:', err);
      return [];
    }
  };

  // Fetch waste reports data
  const fetchWasteReports = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/reportwaste');
      const data = await res.json();
      return data;
    } catch (err) {
      console.error('Error fetching waste reports:', err);
      return [];
    }
  };

  // Calculate dashboard statistics
  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user?.id) return;

      setDashboardData(prev => ({ ...prev, loading: true }));

      try {
        const [collections, pickups, wasteReports] = await Promise.all([
          fetchCollections(),
          fetchPickups(),
          fetchWasteReports()
        ]);

        // Filter user's data
        const userCollections = collections.filter(c => c.user_id === user.id);
        const userPickups = pickups.filter(p => p.user_id === user.id);
        const userReports = wasteReports.filter(r => r.user_id === user.id);

        // Calculate collection statistics
        const totalWeight = userCollections.reduce((sum, c) => sum + parseFloat(c.weight || 0), 0);
        const collectionPoints = userCollections.reduce((sum, c) => sum + (c.points_earned || 0), 0);
        const totalCollections = userCollections.length;
        const scheduledPickups = userPickups.filter(p => !p.status || p.status.toLowerCase() !== 'collected').length;

        // Calculate waste report statistics
        const totalReports = userReports.length;
        const verifiedReports = userReports.filter(r => r.verification_status === 'Verified').length;
        const reportPoints = userReports
          .filter(r => r.verification_status === 'Verified')
          .reduce((sum, r) => sum + (r.points_awarded || 0), 0);
        const pendingReports = userReports.filter(r => r.verification_status === 'Pending' || !r.verification_status).length;

        // Total points from all activities
        const totalPoints = collectionPoints + reportPoints;

        // Generate recent activities
        const recentActivities = [];
        
        // Add recent collections
        const recentCollections = userCollections
          .sort((a, b) => new Date(b.created_at || b.collection_date) - new Date(a.created_at || a.collection_date))
          .slice(0, 2);
        
        recentCollections.forEach(collection => {
          const date = new Date(collection.created_at || collection.collection_date);
          const timeAgo = getTimeAgo(date);
          recentActivities.push({
            id: `collection-${collection.collection_id || collection.id}`,
            action: `You collected ${collection.weight}kg of waste at ${collection.location}`,
            time: timeAgo,
            type: 'collection',
            iconColor: "#74c69d",
            points: collection.points_earned || 0
          });
        });

        // Add recent waste reports
        const recentReports = userReports
          .sort((a, b) => new Date(b.created_at || b.report_date) - new Date(a.created_at || a.report_date))
          .slice(0, 3);
        
        recentReports.forEach(report => {
          const date = new Date(report.created_at || report.report_date);
          const timeAgo = getTimeAgo(date);
          const status = report.verification_status || 'Pending';
          recentActivities.push({
            id: `report-${report.report_id || report.id}`,
            action: `You reported ${report.waste_type} waste at ${report.location}`,
            time: timeAgo,
            type: 'report',
            iconColor: status === 'Verified' ? "#4caf50" : "#ff9800",
            status: status,
            points: status === 'Verified' ? (report.points_awarded || 0) : 0
          });
        });

        // Add recent pickup requests
        const recentPickups = userPickups
          .sort((a, b) => new Date(b.created_at || b.request_date) - new Date(a.created_at || a.request_date))
          .slice(0, 2);
        
        recentPickups.forEach(pickup => {
          const date = new Date(pickup.created_at || pickup.request_date);
          const timeAgo = getTimeAgo(date);
          const status = pickup.status || 'Pending';
          recentActivities.push({
            id: `pickup-${pickup.request_id}`,
            action: `You scheduled ${pickup.waste_type} pickup at ${pickup.location}`,
            time: timeAgo,
            type: 'pickup',
            iconColor: "#a9d6e5",
            status: status
          });
        });

        // Sort activities by most recent (you might want to implement proper date sorting)
        recentActivities.sort((a, b) => {
          if (a.time.includes('minute') && !b.time.includes('minute')) return -1;
          if (!a.time.includes('minute') && b.time.includes('minute')) return 1;
          if (a.time.includes('hour') && !b.time.includes('hour')) return -1;
          if (!a.time.includes('hour') && b.time.includes('hour')) return 1;
          return 0;
        });

        setDashboardData({
          totalWeight: totalWeight.toFixed(1),
          totalCollections,
          totalPoints,
          scheduledPickups,
          totalReports,
          verifiedReports,
          reportPoints,
          pendingReports,
          recentActivities: recentActivities.slice(0, 6), // Show 6 most recent
          loading: false
        });

      } catch (error) {
        console.error('Error loading dashboard data:', error);
        setDashboardData(prev => ({ ...prev, loading: false }));
      }
    };

    loadDashboardData();
  }, [user?.id]);

  // Helper function to calculate time ago
  const getTimeAgo = (date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minutes ago`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  };

  // Enhanced stats including waste reports
  const stats = [
    { 
      title: "Waste Collected", 
      value: dashboardData.loading ? "..." : `${dashboardData.totalWeight} kg`, 
      icon: <RecycleIcon />, 
      color: "#74c69d" 
    },
    { 
      title: "Reports Submitted", 
      value: dashboardData.loading ? "..." : dashboardData.totalReports, 
      icon: <ReportProblemIcon />, 
      color: "#ff9800" 
    },
    { 
      title: "Reports Verified", 
      value: dashboardData.loading ? "..." : dashboardData.verifiedReports, 
      icon: <VerifiedIcon />, 
      color: "#4caf50" 
    },
    { 
      title: "Total Points", 
      value: dashboardData.loading ? "..." : dashboardData.totalPoints, 
      icon: <StarIcon />, 
      color: "#ffe066" 
    },
  ];

  // Static leaderboard (you might want to make this dynamic too)
  const leaderboard = [
    { name: "Sophia", points: "450 pts" },
    { name: "Daniel", points: "380 pts" },
    { name: "Mia", points: "300 pts" },
  ];

  const getActivityIcon = (activity) => {
    switch (activity.type) {
      case 'collection':
        return <RecycleIcon />;
      case 'report':
        return activity.status === 'Verified' ? <VerifiedIcon /> : <ReportProblemIcon />;
      case 'pickup':
        return <PendingIcon />;
      default:
        return <ReportIcon />;
    }
  };

  const getStatusChip = (activity) => {
    if (activity.type === 'report' && activity.status) {
      return (
        <Chip 
          label={activity.status} 
          size="small" 
          color={activity.status === 'Verified' ? 'success' : 'warning'}
          sx={{ ml: 1 }}
        />
      );
    }
    if (activity.points > 0) {
      return (
        <Chip 
          label={`+${activity.points} pts`} 
          size="small" 
          color="primary"
          sx={{ ml: 1 }}
        />
      );
    }
    return null;
  };

  return (
    <Box
      sx={{
        backgroundColor: "#f9f9f9",
        minHeight: "100vh",
        p: 3,
        pt: 10,
        ml: { xs: 0, md: "40px" },
        mr: { xs: 0, md: "40px" },
      }}
    >
      <Paper 
        elevation={3} 
        sx={{ 
          p: 4, 
          borderRadius: 4, 
          background: "linear-gradient(135deg,rgb(8, 108, 31),rgb(54, 194, 147))", 
          mb: 4 
        }}
      >
        <Typography variant="h4" fontWeight="bold" color="white">
          Good Morning, {userName}! 
        </Typography>
        <Typography variant="subtitle1" color="white" mt={1}>
          Let's make the world cleaner today!
        </Typography>
        <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          {dashboardData.scheduledPickups > 0 && (
            <Typography variant="body2" color="white" sx={{ opacity: 0.9 }}>
              📋 {dashboardData.scheduledPickups} scheduled pickup{dashboardData.scheduledPickups > 1 ? 's' : ''}
            </Typography>
          )}
          {dashboardData.pendingReports > 0 && (
            <Typography variant="body2" color="white" sx={{ opacity: 0.9 }}>
              ⏳ {dashboardData.pendingReports} pending report{dashboardData.pendingReports > 1 ? 's' : ''}
            </Typography>
          )}
        </Box>
      </Paper>

      <Grid container spacing={2} mb={3}>
        {stats.map((item, idx) => (
          <Grid item xs={12} sm={6} md={3} key={idx}>
            <Card sx={{ borderRadius: 3, p: 2 }}>
              <CardContent sx={{ textAlign: "center" }}>
                <Avatar sx={{ bgcolor: item.color, width: 56, height: 56, margin: "0 auto" }}>
                  {item.icon}
                </Avatar>
                <Typography variant="body2" mt={2} color="textSecondary">
                  {item.title}
                </Typography>
                <Typography variant="h6" fontWeight="bold">
                  {dashboardData.loading ? (
                    <CircularProgress size={20} />
                  ) : (
                    item.value
                  )}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box display="flex" gap={2} mb={4}>
        <Button
          variant="contained"
          fullWidth
          sx={{ bgcolor: "#rgb(8, 108, 31)", fontWeight: "bold" }}
          href="/reportwaste"
        >
          Report Waste
        </Button>
        <Button
          variant="contained"
          fullWidth
          sx={{ bgcolor: "#2e7d32", fontWeight: "bold" }}
          href="/collect"
        >
          Collect Waste
        </Button>
        <Button
          variant="contained"
          fullWidth
          sx={{ bgcolor: "#green", fontWeight: "bold" }}
          href="/pickuprequest"
        >
          Schedule Pickup
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Typography variant="subtitle1" fontWeight="bold" mb={1}>
            Recent Activity
          </Typography>
          <Card sx={{ borderRadius: 3 }}>
            {dashboardData.loading ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <CircularProgress />
                <Typography variant="body2" mt={2} color="textSecondary">
                  Loading your activities...
                </Typography>
              </Box>
            ) : dashboardData.recentActivities.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="textSecondary">
                  No recent activities. Start collecting waste or reporting issues to see your activities here!
                </Typography>
              </Box>
            ) : (
              <List>
                {dashboardData.recentActivities.map((activity, index) => (
                  <React.Fragment key={activity.id}>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: activity.iconColor }}>
                          {getActivityIcon(activity)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText 
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                            <Typography variant="body1">
                              {activity.action}
                            </Typography>
                            {getStatusChip(activity)}
                          </Box>
                        }
                        secondary={activity.time} 
                      />
                    </ListItem>
                    {index < dashboardData.recentActivities.length - 1 && (
                      <Divider variant="inset" component="li" />
                    )}
                  </React.Fragment>
                ))}
              </List>
            )}
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Typography variant="subtitle1" fontWeight="bold" mb={1}>
            Top Contributors
          </Typography>
          <Card sx={{ borderRadius: 3 }}>
            <List>
              {leaderboard.map((user, idx) => (
                <ListItem key={idx}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: "#52b788" }}>
                      <StarIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText primary={user.name} secondary={user.points} />
                </ListItem>
              ))}
            </List>
          </Card>
        </Grid>
      </Grid>

      {/* Enhanced Impact Summary */}
      {!dashboardData.loading && (
        <Card sx={{ mt: 3, borderRadius: 3, p: 2 }}>
          <CardContent>
            <Typography variant="h6" fontWeight="bold" mb={2}>
              Your Environmental Impact
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="textSecondary">
                  Collections
                </Typography>
                <Typography variant="h6" fontWeight="bold">
                  {dashboardData.totalCollections}
                </Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="textSecondary">
                  Weight Collected
                </Typography>
                <Typography variant="h6" fontWeight="bold">
                  {dashboardData.totalWeight} kg
                </Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="textSecondary">
                  Verified Reports
                </Typography>
                <Typography variant="h6" fontWeight="bold">
                  {dashboardData.verifiedReports}/{dashboardData.totalReports}
                </Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="textSecondary">
                  Total Points
                </Typography>
                <Typography variant="h6" fontWeight="bold" color="primary">
                  {dashboardData.totalPoints}
                </Typography>
              </Grid>
            </Grid>
            
            {/* Points Breakdown */}
            <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
              <Typography variant="subtitle2" fontWeight="bold" mb={1}>
                Points Breakdown:
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    Collection Points: <strong>{dashboardData.totalPoints - dashboardData.reportPoints}</strong>
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    Report Points: <strong>{dashboardData.reportPoints}</strong>
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default Dashboard;