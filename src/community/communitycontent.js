import React from "react";
import { useNavigate } from "react-router-dom";

import {AppBar,Toolbar, Button,Box,Container,Typography,Grid, Card,CardContent,LinearProgress,Link ,} from "@mui/material";


function Navbar() {
  const navigate = useNavigate();

  return (
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
          <Button sx={{ color: "#2E7D32", fontWeight: "bold" }} onClick={() => navigate("/dashboard")}>dashboard</Button>
          <Button sx={{ color: "#2E7D32", fontWeight: "bold" }} onClick={() => navigate("/aboutus")}>About</Button>
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
  );
}


function CommunityHero() {
  return (
    <Box
      sx={{
        backgroundImage: "url('/earth.jpeg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        height: "105vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        textAlign: "center",
        px: 3,
      }}
    >
      <Box
        sx={{
          backgroundColor: "rgba(0, 100, 0, 0.75)",
          p: { xs: 4, md: 6 },
          borderRadius: "16px",
          maxWidth: "800px",
        }}
      >
        <Typography variant="h3" fontWeight="bold" gutterBottom>
          Together, We Make a Difference 🌍
        </Typography>
        <Typography variant="h6">
          Discover community efforts and grow your knowledge about sustainable waste management.
        </Typography>
      </Box>
    </Box>
  );
}

function ArticlesSection() {
  const articles = [
    {
      title: "How to Sort and Dispose of Household Waste Properly",
      summary:
        "A beginner-friendly guide on separating biodegradable, recyclable, and hazardous waste for proper disposal.",
      tag: "Education",
      image: "/sort.png", 
      link: "https://www.epa.gov/recycle/how-do-i-recycle-common-recyclables",
    },
    {
      title: "Understanding the Different Types of Waste",
      summary:
        "From organic and plastic to electronic and industrial — learn the categories of waste and how each should be handled.",
      tag: "Awareness",
      image: "/types.png",
      link: "https://takanimali.org/blog/?read=understanding-the-different-types-of-waste-and-their-impact-on-the-environment",
    },
    {
      title: "Safe Disposal of Electronic Waste (E-Waste)",
      summary:
        "Tips on how to dispose of batteries, phones, and other electronics without harming the environment.",
      tag: "E-Waste",
      image: "/ewaste.png",
      link: "https://www.who.int/news-room/fact-sheets/detail/electronic-waste-e-waste",
    },
    {
      title: "Zero Waste: A Lifestyle Guide",
      summary:
        "Learn how to embrace a zero-waste lifestyle through practical tips and sustainable daily habits.",
      tag: "Lifestyle",
      image: "/zero.png",
      link: "https://www.nature.org/en-us/about-us/where-we-work/united-states/delaware/stories-in-delaware/delaware-eight-ways-to-reduce-waste/",
    }
  ];

  return (
    <Box sx={{ py: 10, backgroundColor: "#ffffff" }}>
      <Container>
        <Typography
          variant="h4"
          fontWeight="bold"
          textAlign="center"
          gutterBottom
        >
          Kenyan Waste Management Initiatives
        </Typography>

        <Grid container spacing={4}>
          {articles.map((article, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card
                elevation={3}
                sx={{
                  borderRadius: "16px",
                  overflow: "hidden",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <Box
                  component="img"
                  src={article.image}
                  alt={article.title}
                  sx={{
                    width: "100%",
                    height: 160,
                    objectFit: "cover",
                  }}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box
                    sx={{
                      display: "inline-block",
                      backgroundColor: "#E0F2F1",
                      color: "#00695C",
                      fontSize: "12px",
                      px: 1.5,
                      py: 0.5,
                      borderRadius: "12px",
                      mb: 1,
                    }}
                  >
                    {article.tag}
                  </Box>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {article.title}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {article.summary}
                  </Typography>
                </CardContent>
                <Box sx={{ px: 2, pb: 2 }}>
                  <Button
                    variant="outlined"
                    href={article.link}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Learn More
                  </Button>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}

function ImpactStats() {
  const stats = [
    { label: "Waste Reported", value: "8,560+" },
    { label: "Total Cleanups", value: "3,210+" },
    { label: "Rewards Claimed", value: "2,450+" },
    { label: "Active Volunteers", value: "980+" },
  ];

  return (
    <Box sx={{ py: 10, backgroundColor: "#f5fff5", textAlign: "center" }}>
      <Container>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Community Impact 📈
        </Typography>
        <Grid container spacing={4} justifyContent="center">
          {stats.map((stat, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card
                elevation={3}
                sx={{
                  py: 4,
                  px: 2,
                  borderRadius: "16px",
                  transition: "0.3s",
                  "&:hover": { transform: "scale(1.05)" },
                }}
              >
                <CardContent>
                  <Typography variant="h5" fontWeight="bold" color="#2E7D32">
                    {stat.value}
                  </Typography>
                  <Typography variant="subtitle1">{stat.label}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}

function CommunityProgress() {
  return (
    <Box sx={{ py: 8, backgroundColor: "#ffffff" }}>
      <Container>
        <Typography
          variant="h4"
          fontWeight="bold"
          textAlign="center"
          gutterBottom
        >
          Our Mission in Progress 🚀
        </Typography>
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Plastic Waste Cleanup
            </Typography>
            <LinearProgress
              variant="determinate"
              value={75}
              sx={{ height: 12, borderRadius: 5 }}
            />
            <Typography variant="body2" sx={{ mt: 1 }}>
              75% of this year's goal
            </Typography>

            <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
              Volunteer Growth
            </Typography>
            <LinearProgress
              variant="determinate"
              value={60}
              sx={{ height: 12, borderRadius: 5 }}
            />
            <Typography variant="body2" sx={{ mt: 1 }}>
              60% growth this quarter
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Our Vision
            </Typography>
            <Typography variant="body1" color="text.secondary">
              We believe in a world where every piece of waste is accounted for,
              and every hand can help clean. Our app connects individuals,
              communities, and organizations to take real action for a greener,
              healthier planet.
            </Typography>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

function Footer() {
  return (
    <Box sx={{ backgroundColor: "#2E7D32", color: "white", py: 3, mt: 6 }}>
      <Container maxWidth="lg">
        <Grid container spacing={2} justifyContent="center" alignItems="center">
          <Grid item xs={12} sm={6} md={4} textAlign="center">
            <Typography variant="h6" gutterBottom sx={{ fontSize: '1.1rem' }}>
              Contact Us
            </Typography>
            <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
              📍 123 Green Street, Eco City, Planet Earth
            </Typography>
            <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
              📞 +123 456 7890
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




export default function Community() {
  return (
    <div>
      <Navbar />
      <CommunityHero />
      <ArticlesSection />  
      <ImpactStats />
      <CommunityProgress />
      <Footer />
    </div>
  );
}
