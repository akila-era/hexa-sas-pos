import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { getStoredUser, authService } from "../../services/auth.service";
import logoPng from "../../assets/img/logo.png";
import logoWhitePng from "../../assets/img/logo-white.png";
import logoSmallPng from "../../assets/img/logo-small.png";

const Header = ({ onToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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

  const toggleFullscreen = () => {
    const elem = document.documentElement;
    if (!document.fullscreenElement) {
      elem.requestFullscreen?.() ||
        elem.mozRequestFullScreen?.() ||
        elem.webkitRequestFullscreen?.() ||
        elem.msRequestFullscreen?.();
    } else {
      document.exitFullscreen?.() ||
        document.mozCancelFullScreen?.() ||
        document.webkitExitFullscreen?.() ||
        document.msExitFullscreen?.();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(
        !!(
          document.fullscreenElement ||
          document.mozFullScreenElement ||
          document.webkitFullscreenElement ||
          document.msFullscreenElement
        )
      );
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("msfullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.removeEventListener("msfullscreenchange", handleFullscreenChange);
    };
  }, []);

  const sidebarOverlay = () => {
    document?.querySelector(".main-wrapper")?.classList?.toggle("slide-nav");
    document?.querySelector(".sidebar-overlay")?.classList?.toggle("opened");
    document?.querySelector("html")?.classList?.toggle("menu-opened");
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

  return (
    <div className="header">
      <div className="main-header">
        <div className="header-left">
          <Link to="/dashboard" className="logo logo-normal">
            <img src={logoPng} alt="Logo" />
          </Link>
          <Link to="/dashboard" className="logo logo-white">
            <img src={logoWhitePng} alt="Logo" />
          </Link>
          <Link to="/dashboard" className="logo-small">
            <img src={logoSmallPng} alt="Logo" />
          </Link>
          <Link to="#" id="toggle_btn" onClick={onToggle}>
            <i className="feather icon-chevrons-left feather-16" />
          </Link>
        </div>

        <Link
          id="mobile_btn"
          className="mobile_btn"
          to="#"
          onClick={sidebarOverlay}
        >
          <span className="bar-icon">
            <span></span>
            <span></span>
            <span></span>
          </span>
        </Link>

        <ul className="nav user-menu">
          {/* Search */}
          <li className="nav-item nav-searchinputs">
            <div className="top-nav-search">
              <Link to="#" className="responsive-search">
                <i className="feather icon-search" />
              </Link>
              <form action="#" className="dropdown">
                <div
                  className="searchinputs input-group dropdown-toggle"
                  id="dropdownMenuClickable"
                  data-bs-toggle="dropdown"
                  data-bs-auto-close="outside"
                >
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <div className="search-addon">
                    <span>
                      <i className="ti ti-search" />
                    </span>
                  </div>
                  <span className="input-group-text">
                    <kbd className="d-flex align-items-center">
                      <i className="ti ti-command me-1" />K
                    </kbd>
                  </span>
                </div>
                <div
                  className="dropdown-menu search-dropdown"
                  aria-labelledby="dropdownMenuClickable"
                >
                  <div className="search-info">
                    <h6>
                      <span>
                        <i className="feather icon-search feather-16" />
                      </span>
                      Recent Searches
                    </h6>
                    <ul className="search-tags">
                      <li>
                        <Link to="/companies">Companies</Link>
                      </li>
                      <li>
                        <Link to="/packages">Packages</Link>
                      </li>
                      <li>
                        <Link to="/subscription">Subscriptions</Link>
                      </li>
                    </ul>
                  </div>
                  <div className="search-info">
                    <h6>
                      <span>
                        <i className="feather-16 feather icon-help-circle" />
                      </span>
                      Quick Links
                    </h6>
                    <ul className="search-tags">
                      <li>
                        <Link to="/dashboard">Dashboard</Link>
                      </li>
                      <li>
                        <Link to="/domain">Domains</Link>
                      </li>
                      <li>
                        <Link to="/purchase-transaction">Transactions</Link>
                      </li>
                    </ul>
                  </div>
                </div>
              </form>
            </div>
          </li>
          {/* /Search */}

          {/* Add New */}
          <li className="nav-item dropdown link-nav">
            <Link
              to="#"
              className="btn btn-primary btn-md d-inline-flex align-items-center"
              data-bs-toggle="dropdown"
            >
              <i className="ti ti-circle-plus me-1" />
              Add New
            </Link>
            <div className="dropdown-menu dropdown-xl dropdown-menu-center">
              <div className="row g-2">
                <div className="col-md-6">
                  <Link to="/companies" className="link-item">
                    <span className="link-icon">
                      <i className="ti ti-building" />
                    </span>
                    <p>Company</p>
                  </Link>
                </div>
                <div className="col-md-6">
                  <Link to="/packages" className="link-item">
                    <span className="link-icon">
                      <i className="ti ti-package" />
                    </span>
                    <p>Package</p>
                  </Link>
                </div>
              </div>
            </div>
          </li>
          {/* /Add New */}

          {/* Fullscreen */}
          <li className="nav-item nav-item-box">
            <Link
              to="#"
              id="btnFullscreen"
              onClick={toggleFullscreen}
              title={isFullscreen ? "Exit Fullscreen" : "Go Fullscreen"}
            >
              <i className="ti ti-maximize"></i>
            </Link>
          </li>
          {/* /Fullscreen */}

          {/* Notifications */}
          <li className="nav-item dropdown nav-item-box">
            <Link
              to="#"
              className="dropdown-toggle nav-link"
              data-bs-toggle="dropdown"
            >
              <i className="ti ti-bell"></i>
              <span className="badge rounded-pill bg-danger">3</span>
            </Link>
            <div className="dropdown-menu notifications">
              <div className="topnav-dropdown-header">
                <h5 className="notification-title">Notifications</h5>
                <Link to="#" className="clear-noti">
                  Mark all as read
                </Link>
              </div>
              <div className="noti-content">
                <ul className="notification-list">
                  <li className="notification-message">
                    <Link to="/domain">
                      <div className="media d-flex">
                        <span className="avatar flex-shrink-0 bg-primary text-white d-flex align-items-center justify-content-center">
                          <i className="ti ti-world"></i>
                        </span>
                        <div className="flex-grow-1">
                          <p className="noti-details">
                            <span className="noti-title">New Domain Request</span>{" "}
                            pending approval
                          </p>
                          <p className="noti-time">4 mins ago</p>
                        </div>
                      </div>
                    </Link>
                  </li>
                  <li className="notification-message">
                    <Link to="/subscription">
                      <div className="media d-flex">
                        <span className="avatar flex-shrink-0 bg-warning text-white d-flex align-items-center justify-content-center">
                          <i className="ti ti-alert-triangle"></i>
                        </span>
                        <div className="flex-grow-1">
                          <p className="noti-details">
                            <span className="noti-title">Subscription Expiring</span>{" "}
                            soon - Action required
                          </p>
                          <p className="noti-time">10 mins ago</p>
                        </div>
                      </div>
                    </Link>
                  </li>
                  <li className="notification-message">
                    <Link to="/purchase-transaction">
                      <div className="media d-flex">
                        <span className="avatar flex-shrink-0 bg-success text-white d-flex align-items-center justify-content-center">
                          <i className="ti ti-check"></i>
                        </span>
                        <div className="flex-grow-1">
                          <p className="noti-details">
                            <span className="noti-title">Payment Received</span>{" "}
                            for subscription #12345
                          </p>
                          <p className="noti-time">1 hour ago</p>
                        </div>
                      </div>
                    </Link>
                  </li>
                </ul>
              </div>
              <div className="topnav-dropdown-footer d-flex align-items-center gap-3">
                <Link to="#" className="btn btn-secondary btn-md w-100">
                  Cancel
                </Link>
                <Link to="/dashboard" className="btn btn-primary btn-md w-100">
                  View all
                </Link>
              </div>
            </div>
          </li>
          {/* /Notifications */}

          {/* Settings */}
          <li className="nav-item nav-item-box">
            <Link to="/dashboard" title="Settings">
              <i className="feather icon-settings"></i>
            </Link>
          </li>
          {/* /Settings */}

          {/* User Profile */}
          <li className="nav-item dropdown has-arrow main-drop profile-nav">
            <Link
              to="#"
              className="nav-link userset"
              data-bs-toggle="dropdown"
            >
              <span className="user-info p-0">
                <span
                  className="user-letter bg-primary text-white rounded-circle d-flex align-items-center justify-content-center"
                  style={{
                    width: "36px",
                    height: "36px",
                    fontSize: "14px",
                    fontWeight: "bold",
                  }}
                >
                  {getUserInitials()}
                </span>
              </span>
            </Link>
            <div className="dropdown-menu menu-drop-user">
              <div className="profileset d-flex align-items-center">
                <span className="user-img me-2">
                  <span
                    className="user-letter bg-primary text-white rounded-circle d-flex align-items-center justify-content-center"
                    style={{
                      width: "50px",
                      height: "50px",
                      fontSize: "18px",
                      fontWeight: "bold",
                    }}
                  >
                    {getUserInitials()}
                  </span>
                </span>
                <div>
                  <h6 className="fw-medium mb-0">{getUserName()}</h6>
                  <p className="mb-0 fs-12">{user?.role?.name || "Super Admin"}</p>
                </div>
              </div>
              <Link className="dropdown-item" to="/dashboard">
                <i className="ti ti-user-circle me-2" />
                My Profile
              </Link>
              <Link className="dropdown-item" to="/dashboard">
                <i className="ti ti-settings-2 me-2" />
                Settings
              </Link>
              <hr className="my-2" />
              <Link
                className="dropdown-item logout pb-0"
                to="#"
                onClick={handleLogout}
              >
                <i className="ti ti-logout me-2" />
                Logout
              </Link>
            </div>
          </li>
          {/* /User Profile */}
        </ul>

        {/* Mobile Menu */}
        <div className="dropdown mobile-user-menu">
          <Link
            to="#"
            className="nav-link dropdown-toggle"
            data-bs-toggle="dropdown"
            aria-expanded="false"
          >
            <i className="fa fa-ellipsis-v" />
          </Link>
          <div className="dropdown-menu dropdown-menu-right">
            <Link className="dropdown-item" to="/dashboard">
              Dashboard
            </Link>
            <Link className="dropdown-item" to="/dashboard">
              Settings
            </Link>
            <Link className="dropdown-item" to="#" onClick={handleLogout}>
              Logout
            </Link>
          </div>
        </div>
        {/* /Mobile Menu */}
      </div>
    </div>
  );
};

export default Header;

