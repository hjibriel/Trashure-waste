import React, { useState } from 'react';
import Sidenav from "./components/sidenav";
import Navbar from "./components/navbar";
import { Outlet } from "react-router-dom";

function Layout () {
    const [availablePoints, setAvailablePoints] = useState(0);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const drawerWidth = 240;
    const collapsedWidth = 65;
    return (

        <div>
            <Sidenav isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen}/>
            <div style={{ marginLeft: `${isSidebarOpen ? drawerWidth : collapsedWidth}px`, width: `calc(100% - ${isSidebarOpen ? drawerWidth : collapsedWidth}px)`, transition: "margin-left 0.3s ease, width 0.3s ease" }}>
            <   Navbar  availablePoints={availablePoints} isSidebarOpen={isSidebarOpen}/>
                <Outlet context={{ availablePoints, setAvailablePoints }} />
            </div>
        </div>
    )
}
export default Layout