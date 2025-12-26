import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../sidebar";
import Header from "../header";
import CommonFooter from "../footer/commonFooter";

const MainLayout = () => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
    document.body.classList.toggle("mini-sidebar");
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
    document.querySelector(".main-wrapper")?.classList.remove("slide-nav");
    document.querySelector(".sidebar-overlay")?.classList.remove("opened");
    document.querySelector("html")?.classList.remove("menu-opened");
  };

  // Close mobile sidebar when route changes
  useEffect(() => {
    closeSidebar();
  }, [location.pathname]);

  return (
    <div className="main-wrapper">
      <Sidebar onToggle={toggleSidebar} />
      <div className="page-wrapper">
        <Header onToggle={toggleSidebar} />
        <div className="content">
          <Outlet />
        </div>
        <CommonFooter />
      </div>
      <div className="sidebar-overlay" onClick={closeSidebar}></div>
    </div>
  );
};

export default MainLayout;

