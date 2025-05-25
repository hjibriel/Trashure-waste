import React from "react";
import { useNavigate } from "react-router-dom";
import { AppBar, Toolbar, Button, Typography, Grid, Container, Box, Card, CardContent,Link } from "@mui/material";

function Navbar() {
  const navigate = useNavigate();

  return (
    <AppBar position="sticky" elevation={0} sx={{ backgroundColor: "#ffffff" }}>
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ justifyContent: "space-between" }}>
          <Typography
            variant="h5"
            sx={{ color: "#2E7D32", fontWeight: "bold", cursor: "pointer" }}
            onClick={() => navigate("/")}
          >
            Trashure
          </Typography>
          <Box sx={{ display: "flex", gap: 3 }}>
            <Button onClick={() => navigate("/")} sx={{ color: "#2E7D32", fontWeight: "bold" }}>Home</Button>
            <Button onClick={() => navigate("/community")} sx={{ color: "#2E7D32", fontWeight: "bold" }}>Community</Button>
            <Button onClick={() => navigate("/dashboard")} sx={{ color: "#2E7D32", fontWeight: "bold" }}>Dashboard</Button>
            <Button onClick={() => navigate("/aboutus")} sx={{ color: "#2E7D32", fontWeight: "bold" }}>About Us</Button>
          </Box>
          <Button
            variant="contained"
            onClick={() => navigate("/signup")}
            sx={{
              backgroundColor: "#2E7D32",
              borderRadius: "30px",
              textTransform: "none",
              fontWeight: "bold",
              px: 4,
              py: 1,
              "&:hover": { backgroundColor: "#1B5E20" },
            }}
          >
            Sign Up
          </Button>
        </Toolbar>
      </Container>
    </AppBar>
  );
}

function Hero() {
  const navigate = useNavigate();
  return (
    <Box
      sx={{
        backgroundImage: "url('/back.jpeg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        minHeight: "90vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        textAlign: "center",
        px: 2,
      }}
    >
      <Box sx={{ backgroundColor: "rgba(46,125,50,0.8)", p: 6, borderRadius: "20px", maxWidth: "700px" }}>
        <Typography variant="h2" fontWeight="bold" gutterBottom>
          Empowering Waste Warriors
        </Typography>
        <Typography variant="h6" sx={{ my: 3 }}>
          Join Trashure to report, collect, and transform waste into community rewards.
        </Typography>
        <Button
          variant="contained"
          size="large"
          sx={{
            backgroundColor: "#ffffff",
            color: "#2E7D32",
            borderRadius: "30px",
            fontWeight: "bold",
            px: 5,
            py: 1.5,
            "&:hover": { backgroundColor: "#e0e0e0" },
          }}
          onClick={() => navigate("/community")}
        >
          Learn More
        </Button>
      </Box>
    </Box>
  );
}

function Features() {
  const navigate = useNavigate();
  const features = [
    { emoji: "📍", title: "Report Waste", description: "Snap a picture, upload it, and clean your surroundings." },
    { emoji: "🧹", title: "Collect Waste", description: "Complete tasks and earn rewards for cleaning efforts." },
    { emoji: "🎁", title: "Earn Rewards", description: "Redeem points for exciting eco-friendly prizes." },
    { emoji: "📚", title: "Learn & Educate", description: "Access sustainable living tips and waste management articles." },
  ];

  return (
    <Box sx={{ py: 12, backgroundColor: "#f9fdf9" }}>
      <Container maxWidth="lg">
        <Typography variant="h4" fontWeight="bold" textAlign="center" gutterBottom>
          How It Works
        </Typography>
        <Grid container spacing={4} sx={{ mt: 6 }}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card
                elevation={6}
                sx={{
                  py: 5,
                  px: 3,
                  textAlign: "center",
                  borderRadius: "20px",
                }}
              >
                <Box fontSize="50px" mb={2}>
                  {feature.emoji}
                </Box>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  {feature.title}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {feature.description}
                </Typography>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Box textAlign="center" sx={{ mt: 8 }}>
          <Button
            variant="contained"
            size="large"
            sx={{
              backgroundColor: "#2E7D32",
              borderRadius: "30px",
              fontWeight: "bold",
              px: 6,
              py: 2,
              "&:hover": { backgroundColor: "#1B5E20" },
            }}
            onClick={() => navigate("/signup")}
          >
            Get Started
          </Button>
        </Box>
      </Container>
    </Box>
  );
}

function Testimonials() {
  const testimonials = [
    { quote: "Trashure made our community cleaner and stronger!", author: "Eco Warriors" },
    { quote: "I earned rewards while helping the planet.", author: "Green Future Org" },
    { quote: "An inspiring movement that everyone should join!", author: "Planet Protectors" },
  ];

  return (
    <Box sx={{ backgroundColor: "#f1f8e9", py: 12 }}>
      <Container maxWidth="md">
        <Typography variant="h4" fontWeight="bold" textAlign="center" gutterBottom>
          What Our Users Say
        </Typography>
        <Grid container spacing={4} sx={{ mt: 6 }}>
          {testimonials.map((t, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Card elevation={3} sx={{ py: 5, px: 4, borderRadius: "16px", height: "100%" }}>
                <CardContent sx={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%" }}>
                  <Typography variant="body1" fontStyle="italic" sx={{ mb: 3 }}>
                    "{t.quote}"
                  </Typography>
                  <Typography variant="subtitle1" fontWeight="bold">
                    - {t.author}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}

function Footer() {
  return (
    <Box sx={{ backgroundColor: "#2E7D32", color: "white", py: 3 }}>
      <Container maxWidth="lg">
        <Grid container spacing={2} justifyContent="center">
          <Grid item xs={12} sm={6} md={4} textAlign="center">
            <Typography variant="h6" gutterBottom sx={{ fontSize: '1.1rem' }}>
              Contact Us
            </Typography>
            <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
              📍 123 Green Street, Eco City, Planet Earth
            </Typography>
            <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
              📞 +254719876756
            </Typography>
            <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
              ✉️ <Link href="mailto:support@trashure.com" underline="hover" color="inherit">
                support@trashure.com
              </Link>
            </Typography>
          </Grid>
        </Grid>

        <Typography variant="caption" display="block" textAlign="center" sx={{ mt: 2, fontSize: '0.75rem' }}>
          © 2025 Trashure. All rights reserved.
        </Typography>
      </Container>
    </Box>
  );
}


export default function Home() {
  return (
    <Box>
      <Navbar />
      <Hero />
      <Features />
      <Testimonials />
      <Footer />
    </Box>
  );
}
