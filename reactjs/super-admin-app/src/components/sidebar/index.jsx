import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getStoredUser, authService } from "../../services/auth.service";
import logo from "../../assets/img/logo.png";
import logoWhite from "../../assets/img/logo-white.png";
import logoSmall from "../../assets/img/logo-small.png";

const Sidebar = ({ onToggle }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [toggle, setToggle] = useState(false);

  useEffect(() => {
    const storedUser = getStoredUser();
    setUser(storedUser);
  }, []);

  const handleLogout = async () => {
    try {
      await authService.logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      navigate("/login");
    }
  };

  const handlesidebar = () => {
    document.body.classList.toggle("mini-sidebar");
    setToggle((current) => !current);
  };

  const getUserInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return "A";
  };

  const getUserName = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user?.email) {
      return user.email;
    }
    return "Admin";
  };

  const menuItems = [
    {
      label: "Main",
      submenuItems: [
        {
          label: "Dashboard",
          icon: "layout-dashboard",
          link: "/dashboard",
          submenu: false
        },
        {
          label: "Companies",
          icon: "building",
          link: "/companies",
          submenu: false
        },
        {
          label: "Packages",
          icon: "package",
          link: "/packages",
          submenu: false
        },
        {
          label: "Subscriptions",
          icon: "credit-card",
          link: "/subscription",
          submenu: false
        },
        {
          label: "Domains",
          icon: "world",
          link: "/domain",
          submenu: false
        },
        {
          label: "Purchase Transactions",
          icon: "receipt",
          link: "/purchase-transaction",
          submenu: false
        },
        {
          label: "Super Admin Users",
          icon: "user-shield",
          link: "/super-admin-users",
          submenu: false
        }
      ]
    }
  ];

  const isItemActive = (item) => {
    return location.pathname === item.link;
  };

  return (
    <div className={`sidebar ${toggle ? "" : "active"} d-flex flex-column`} id="sidebar" style={{ height: "100vh" }}>
      {/* Logo */}
      <div className="sidebar-logo">
        <Link to="/dashboard" className="logo logo-normal">
          <img src={logo} alt="Logo" />
        </Link>
        <Link to="/dashboard" className="logo logo-white">
          <img src={logoWhite} alt="Logo" />
        </Link>
        <Link to="/dashboard" className="logo-small">
          <img src={logoSmall} alt="Logo" />
        </Link>
        <Link id="toggle_btn" to="#" onClick={handlesidebar}>
          <i className="feather icon-chevrons-left feather-16" />
        </Link>
      </div>
      {/* /Logo */}

      {/* Modern Profile */}
      <div className="modern-profile p-3 pb-0">
        <div className="text-center rounded bg-light p-3 mb-4 border">
          <div className="avatar avatar-lg online mb-3">
            <span
              className="user-letter bg-primary text-white rounded-circle d-flex align-items-center justify-content-center mx-auto"
              style={{
                width: "60px",
                height: "60px",
                fontSize: "24px",
                fontWeight: "bold"
              }}
            >
              {getUserInitials()}
            </span>
          </div>
          <h6 className="fs-14 fw-bold mb-1">{getUserName()}</h6>
          <p className="fs-12 mb-0">{user?.role?.name || "Super Admin"}</p>
        </div>
      </div>
      {/* /Modern Profile */}

      {/* Sidebar Header with Quick Actions */}
      <div className="sidebar-header p-3 pb-0 pt-2">
        <div className="text-center rounded bg-light p-2 mb-4 sidebar-profile d-flex align-items-center">
          <div className="avatar avatar-md online">
            <span
              className="user-letter bg-primary text-white rounded-circle d-flex align-items-center justify-content-center"
              style={{
                width: "40px",
                height: "40px",
                fontSize: "16px",
                fontWeight: "bold"
              }}
            >
              {getUserInitials()}
            </span>
          </div>
          <div className="text-start sidebar-profile-info ms-2">
            <h6 className="fs-14 fw-bold mb-1">{getUserName()}</h6>
            <p className="fs-12 mb-0">{user?.role?.name || "Super Admin"}</p>
          </div>
        </div>
        <div className="d-flex align-items-center justify-content-between menu-item mb-3">
          <div>
            <Link to="/dashboard" className="btn btn-sm btn-icon bg-light" title="Dashboard">
              <i className="ti ti-layout-grid-remove" />
            </Link>
          </div>
          <div>
            <Link to="/dashboard" className="btn btn-sm btn-icon bg-light" title="Notifications">
              <i className="ti ti-bell" />
              <span className="notification-status-dot" />
            </Link>
          </div>
          <div>
            <Link to="/dashboard" className="btn btn-sm btn-icon bg-light" title="Settings">
              <i className="ti ti-settings" />
            </Link>
          </div>
          <div className="me-0">
            <Link
              to="#"
              className="btn btn-sm btn-icon bg-light"
              onClick={handleLogout}
              title="Logout"
            >
              <i className="ti ti-logout" />
            </Link>
          </div>
        </div>
      </div>
      {/* /Sidebar Header */}

      {/* Sidebar Menu */}
      <div data-simplebar="" className="flex-grow-1">
        <div className="sidebar-inner">
          <div id="sidebar-menu" className="sidebar-menu">
            <ul>
              {menuItems.map((mainLabel, mainIndex) => (
                <li className="submenu-open" key={mainIndex}>
                  <h6 className="submenu-hdr">{mainLabel.label}</h6>
                  <ul>
                    {mainLabel.submenuItems.map((item, index) => {
                      const isActive = isItemActive(item);
                      return (
                        <li
                          key={index}
                          className={isActive ? "active" : ""}
                        >
                          <Link
                            to={item.link}
                            className={isActive ? "active" : ""}
                          >
                            <i className={`ti ti-${item.icon} me-2`}></i>
                            <span>{item.label}</span>
                            {item.submenu && <span className="menu-arrow" />}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      {/* /Sidebar Menu */}

      {/* Logout Button Footer */}
      <div className="sidebar-footer p-3 border-top">
        <button
          type="button"
          className="btn btn-danger w-100 d-flex align-items-center justify-content-center"
          onClick={handleLogout}
        >
          <i className="ti ti-logout me-2"></i>
          <span>Logout</span>
        </button>
      </div>
      {/* /Logout Button Footer */}
    </div>
  );
};

export default Sidebar;

