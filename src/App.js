import './App.css';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Signup from './Authentication/signup';
import LogIn from './Authentication/login';
import Home from './Home/home';
import Layout from './Layout';
import Rcontent from './reward/rewardcontent';
import Articles from './community/communitycontent'
import Waste from './reportwaste/report';
import Account from './setting/Asetting';
import Collection from './collect/collectwaste';
import Asettings from './setting/Asetting';
import Dashboard from './dashboard/dashboard';
import AboutUs from './aboutus/AboutUs';
import Googlecallback from './Authentication/googleCallback';
import ProtectedRoute from './protect';
import Verify from './Authentication/verify';

function App() {
  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<LogIn/>} />
          <Route path="/community" element={<Articles/>} />
          <Route path="/aboutus" element={<AboutUs/>} />
          <Route path="/" element={<Home/>} />
          <Route path="/googlecallback" element={<Googlecallback/>} />
          <Route path="/verify" element={<Verify/>} />

          <Route element={<ProtectedRoute/>}>
          
          <Route element= {<Layout/>}>
          <Route path="/dashboard" element={<Dashboard/>} />
          <Route path="/reward" element={<Rcontent/>} />
          <Route path="/reportwaste" element={<Waste/>} />
          <Route path="/setting" element={<Account/>} />
          <Route path="/collect" element={<Collection/>} />
          <Route path="/setting" element={<Asettings/>} />

          </Route>
          </Route>
          
        </Routes>
      </Router>
    </div>
  );
}

export default App;