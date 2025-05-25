import React from "react";
import { AppBar, Toolbar, Typography, Button, Box, Container, Grid, Link } from "@mui/material";
import { useNavigate } from "react-router-dom";

function AboutUs() {
  const navigate = useNavigate();

  return (
    <Box>
      {/* Navbar */}
      <AppBar position="static" sx={{ backgroundColor: "#ffffff", boxShadow: "0px 2px 8px rgba(0,0,0,0.1)" }}>
        <Toolbar sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography
            variant="h6"
            sx={{ color: "#2E7D32", fontWeight: "bold", cursor: "pointer" }}
            onClick={() => navigate("/")}
          >
            Trashure
          </Typography>

          <Box sx={{ display: "flex", gap: 4 }}>
            <Button sx={{ color: "#2E7D32", fontWeight: "bold" }} onClick={() => navigate("/")}>Home</Button>
            <Button sx={{ color: "#2E7D32", fontWeight: "bold" }} onClick={() => navigate("/community")}>Community</Button>
            <Button sx={{ color: "#2E7D32", fontWeight: "bold" }} onClick={() => navigate("/dashboard")}>Dashboard</Button>
            <Button sx={{ color: "#2E7D32", fontWeight: "bold" }} onClick={() => navigate("/aboutus")}>About Us</Button>
          </Box>

          <Button
            variant="contained"
            sx={{
              backgroundColor: "#2E7D32",
              color: "white",
              borderRadius: "20px",
              px: 4,
              py: 1,
              fontWeight: "bold",
              "&:hover": { backgroundColor: "#1B5E20" },
            }}
            onClick={() => navigate("/signup")}
          >
            Sign Up
          </Button>
        </Toolbar>
      </AppBar>

      {/* About Us Content */}
      <Container sx={{ mt: 8, mb: 8 }}>
        <Grid container spacing={6} alignItems="center">
          <Grid item xs={12} md={6}>
            <Box
              component="img"
              src="mission.jpeg"
              alt="Mission"
              sx={{ width: "100%", borderRadius: 1, boxShadow: 2 }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="h4" sx={{ color: "#2E7D32", fontWeight: "bold", mb: 2 }}>
              Our Mission
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Trashure is on a mission to transform waste management into a rewarding and sustainable community effort.
              We connect individuals with services that promote recycling, proper disposal, and environmental responsibility.
            </Typography>
          </Grid>
        </Grid>

        {/* Vision */}
        <Grid container spacing={6} alignItems="center" direction={{ xs: "column-reverse", md: "row" }} sx={{ mt: 8 }}>
          <Grid item xs={12} md={6}>
            <Typography variant="h4" sx={{ color: "#2E7D32", fontWeight: "bold", mb: 2 }}>
              Our Vision
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              We see a future where communities thrive through conscious waste management and where individuals
              are rewarded for their contributions to a cleaner planet.
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box
              component="img"
              src="vission.jpeg"
              alt="Vision"
              sx={{ width: "100%", borderRadius: 4, boxShadow: 3 }}
            />
          </Grid>
        </Grid>

        {/* Call to Action */}
        <Box sx={{ textAlign: "center", mt: 10 }}>
          <Typography variant="h5" sx={{ fontWeight: "bold", mb: 2 }}>
            Be a part of the change.
          </Typography>
          <Button
            variant="contained"
            size="large"
            sx={{
              backgroundColor: "#2E7D32",
              "&:hover": { backgroundColor: "#27642b" },
              px: 6,
              py: 1.5,
              fontWeight: "bold",
            }}
            href="/community"
          >
            Join Our Community
          </Button>
        </Box>
      </Container>

      {/* Footer */}
      <Box sx={{ backgroundColor: "#2E7D32", color: "white", textAlign: "center", py: 3 }}>
        <Container maxWidth="md">
          <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1 }}>
            Contact Us
          </Typography>
          <Grid container spacing={1} justifyContent="center">
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                📍 123 Green Street, Eco City, Planet Earth
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                📞 +123 456 7890
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2">
                ✉️ <Link href="mailto:support@trashure.com" underline="hover" color="inherit">
                  support@trashure.com
                </Link>
              </Typography>
            </Grid>
          </Grid>

          <Typography variant="caption" display="block" sx={{ mt: 2, opacity: 0.8 }}>
            © 2025 Trashure. All rights reserved.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}

export default AboutUs;
