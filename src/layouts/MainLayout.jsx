import React, { useState } from "react";
import Header from "../components/_Header";
import Sidebar from "../components/_Sidebar";
import { Outlet } from "react-router-dom"; 
import useAuth from '../hooks/useAuth'; 

const MainLayout = () => { 
  const [sidebar, setSidebar] = useState(false);
  const { role } = useAuth(); 

  return (
    <div className="flex h-screen bg-white dark:bg-gray-950 text-gray-800 dark:text-white transition-colors duration-300">            
      <Sidebar sidebar={sidebar} setSidebar={setSidebar} role={role} />
        <main className="flex-1 flex flex-col overflow-hidden">
          <Header sidebar={sidebar} setSidebar={setSidebar}/>
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50 dark:bg-gray-950 transition-colors duration-300">
            <Outlet />
          </div>
        </main>
    </div>
  );
};

export default MainLayout;
