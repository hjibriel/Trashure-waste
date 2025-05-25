import '../App.css'
/* import { useState } from 'react'; */
import { styled } from '@mui/material/styles';
import MuiDrawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import HomeIcon from '@mui/icons-material/Home';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import DeleteIcon from '@mui/icons-material/Delete';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
/* import Groups2Icon from '@mui/icons-material/Groups2'; */
import SettingsIcon from '@mui/icons-material/Settings';
import Typography from '@mui/material/Typography';

const drawerWidth = 240;
const collapsedWidth = 65;

const openedMixin = (theme) => ({
  width: drawerWidth,
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: 'hidden',
  backgroundColor: '#2E7D32', 
  flexShrink: '0'
});

const closedMixin = (theme) => ({
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: 'hidden',
  backgroundColor: '#FFFFFF', 
  width: `calc(${theme.spacing(7)} + 1px)`,
  [theme.breakpoints.up('sm')]: {
    width: `calc(${theme.spacing(8)} + 1px)`,
  },
});

const DrawerHeader = styled('div')(({ theme, open }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: open ? 'flex-start' : 'center',
  padding: theme.spacing(2),
  ...theme.mixins.toolbar,
}));

const Drawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme }) => ({
    width: drawerWidth,
    flexShrink: 0,
    whiteSpace: 'nowrap',
    boxSizing: 'border-box',
    variants: [
      {
        props: ({ open }) => open,
        style: {
          ...openedMixin(theme),
          '& .MuiDrawer-paper': openedMixin(theme),
        },
      },
      {
        props: ({ open }) => !open,
        style: {
          ...closedMixin(theme),
          '& .MuiDrawer-paper': closedMixin(theme),
        },
      },
    ],
  }),
);

function Sidenav({isSidebarOpen, setIsSidebarOpen}) {

  const handleDrawerToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const menuItems = [
    { text: 'Dashboard', icon: <HomeIcon />,path: "/dashboard" },
    { text: 'Report Waste', icon: <LocationOnIcon />, path:"/reportwaste"},
    { text: 'Collect Waste', icon: <DeleteIcon />, path :"/collect"},
    { text: 'Reward', icon: <MonetizationOnIcon />,path: "/reward"},
    /* { text: 'Community', icon: <Groups2Icon /> , path :"/community"}, */
  
  ];

  return (
    <div>
      <Drawer variant="permanent" open={isSidebarOpen} sx={{
      width: isSidebarOpen ? drawerWidth : collapsedWidth,
      flexShrink: 0,
      transition: "width 0.3s ease",
      "& .MuiDrawer-paper": {
          width: isSidebarOpen ? drawerWidth : collapsedWidth,
          transition: "width 0.3s ease",
          position: "fixed",
        },
  }}>
       
        <DrawerHeader open={isSidebarOpen}>
          <img src="/2.png" alt="Trashure Logo" style={{ width: 40, height: 40, marginRight: isSidebarOpen ? 10 : 0 }} />
          {isSidebarOpen && (
            <Typography variant="h6" sx={{ color: 'black', fontWeight: 'bold' }}>
              Trashure
            </Typography>
          )}
          <IconButton onClick={handleDrawerToggle} sx={{ marginLeft: 'auto', color: 'black' }}>
            {isSidebarOpen ? <ChevronLeftIcon /> : <ChevronRightIcon />}
          </IconButton>
        </DrawerHeader>

        <Divider />
        
        
        <List>
          {menuItems.map(({ text, icon, path }) => (
            <ListItem key={text} disablePadding sx={{ display: 'block', transition: '0.1s' }}>
              <ListItemButton
              href={path}
                sx={{
                  minHeight: 48,
                  px: 2.5,
                  justifyContent: isSidebarOpen ? 'initial' : 'center',
                }}
              >
                <ListItemIcon sx={{ minWidth: 0, justifyContent: 'center', mr: isSidebarOpen ? 3 : 'auto', color: 'black' }}>
                  {icon}
                </ListItemIcon>
                <ListItemText primary={text} sx={{ color: 'black', opacity: isSidebarOpen ? 1 : 0 }} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>

        <Divider sx={{ marginTop: 'auto' }} />

        
        <List>
          <ListItem disablePadding sx={{ display: 'block' }}>
            <ListItemButton
            href='/setting'
              sx={{
                minHeight: 48,
                px: 2.5,
                justifyContent: isSidebarOpen ? 'initial' : 'center',
              }}
            >
              <ListItemIcon sx={{ minWidth: 0, justifyContent: 'center', mr: isSidebarOpen ? 3 : 'auto', color: 'black' }}>
                <SettingsIcon />
              </ListItemIcon>
              <ListItemText primary="Settings" sx={{ color: 'black', opacity: isSidebarOpen ? 1 : 0 }} />
            </ListItemButton>
          </ListItem>
        </List>
      </Drawer>
    </div>
  );
}

export default Sidenav;
