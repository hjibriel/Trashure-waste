import * as React from "react";
import { AppBar, Box, Toolbar, Tooltip, Typography } from "@mui/material";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import { UserButton, useUser } from "@clerk/clerk-react";

const drawerWidth = 240;
const collapsedWidth = 65;

export default function Navbar({ isSidebarOpen }) {
  const [totalPoints, setTotalPoints] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const { user } = useUser();

  const fetchTotalPoints = React.useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [collectionsRes, reportsRes] = await Promise.all([
        fetch('http://localhost:5000/api/collect'),
        fetch('http://localhost:5000/api/reportwaste')
      ]);

      if (!collectionsRes.ok || !reportsRes.ok) {
        throw new Error('Failed to fetch user data');
      }

      const [collectionsData, reportsData] = await Promise.all([
        collectionsRes.json(),
        reportsRes.json()
      ]);

      const userCollections = collectionsData.filter(c => c.user_id === user.id);
      const userReports = reportsData.filter(r => r.user_id === user.id);

      const collectionPoints = userCollections.reduce((sum, c) => sum + (c.points_earned || 0), 0);
      const reportingPoints = userReports
        .filter(report => report.verification_status === 'Verified')
        .reduce((sum, report) => sum + (report.points_awarded || 0), 0);

      const calculatedTotal = collectionPoints + reportingPoints;

      try {
        const rewardsRes = await fetch('http://localhost:5000/api/userRewards');
        if (rewardsRes.ok) {
          const rewardsData = await rewardsRes.json();
          const userReward = rewardsData.find(r => r.user_id === user.id);

          if (userReward && userReward.total_points !== undefined) {
            setTotalPoints(userReward.total_points);
          } else {
            setTotalPoints(calculatedTotal);
          }
        } else {
          setTotalPoints(calculatedTotal);
        }
      } catch (error) {
        console.error('Error fetching stored rewards, using calculated:', error);
        setTotalPoints(calculatedTotal);
      }
    } catch (error) {
      console.error("Failed to fetch total points:", error);
      setTotalPoints(0);
    } finally {
      setLoading(false);
    }
  }, [user]);

  React.useEffect(() => {
    fetchTotalPoints();
  }, [fetchTotalPoints]);

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar 
        position="fixed" 
        sx={{ 
          backgroundColor: "#C8E6C9", 
          color: "black", 
          minHeight: 50, 
          width: `calc(100% - ${isSidebarOpen ? drawerWidth : collapsedWidth}px)`, 
          ml: `${isSidebarOpen ? drawerWidth : collapsedWidth}px`, 
          zIndex: (theme) => theme.zIndex.drawer + 1 
        }}
      >
        <Toolbar sx={{ minHeight: 50, justifyContent: "flex-end" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box sx={{ 
              display: "flex", 
              alignItems: "center", 
              backgroundColor: "white", 
              borderRadius: 1, 
              px: 1.5, 
              py: 0.5,
              boxShadow: 1
            }}>
              <EmojiEventsIcon sx={{ color: "#2E7D32", fontSize: 20, mr: 0.5 }} />
              <Typography variant="body2" sx={{ color: "black", fontWeight: "bold" }}>
                {loading ? "..." : totalPoints}
              </Typography>
              <Typography variant="caption" sx={{ color: "#666", ml: 0.5 }}>
                pts
              </Typography>
            </Box>
            <Tooltip title="Profile">
              <UserButton />
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>
    </Box>
  );
}
