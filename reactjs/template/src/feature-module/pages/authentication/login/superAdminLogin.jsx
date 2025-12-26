import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { all_routes } from "../../../../routes/all_routes";
import {
  appleLogo,
  authentication01,
  facebook,
  googleLogo,
  logo,
  logoWhite } from
"../../../../utils/imagepath";
import { authService, isSuperAdmin, getStoredUser } from "../../../../services/auth.service";

const SuperAdminLogin = () => {
  const route = all_routes;
  const navigate = useNavigate();
  const [isPasswordVisible, setPasswordVisible] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const togglePasswordVisibility = () => {
    setPasswordVisible((prevState) => !prevState);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError(""); // Clear error when user types
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Basic validation
    if (!formData.email || !formData.password) {
      setError("Please fill in all fields");
      return;
    }

    setIsLoading(true);

    try {
      const response = await authService.login(formData.email, formData.password);
      
      // Debug: Log full response
      console.log("Login response:", response);
      
      if (response && response.success) {
        // Get user from response (localStorage is already updated by authService)
        const user = response.data?.user || response.data || getStoredUser();
        const roleName = user?.role?.name?.toLowerCase() || "";
        
        console.log("User data:", user);
        console.log("Role name:", roleName);
        
        // Check if role is super admin (flexible check)
        const userIsSuperAdmin = 
          roleName.includes("super admin") || 
          roleName.includes("superadmin") || 
          roleName === "admin" ||
          roleName.includes("super");
        
        console.log("Is Super Admin:", userIsSuperAdmin);
        
        if (userIsSuperAdmin) {
          // Navigate to super admin dashboard
          navigate(route.superadmindashboard);
        } else {
          // Clear tokens if not super admin
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          setError(`Access denied. Super admin credentials required. Your role: ${user?.role?.name || 'Unknown'}`);
        }
      } else {
        setError(response?.message || response?.error?.message || "Login failed. Please try again.");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(
        err?.response?.data?.error?.message ||
        err?.message || 
        err?.error?.message || 
        "Invalid email or password. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Main Wrapper */}
      <div className="main-wrapper">
        <div className="account-content">
          <div className="row login-wrapper m-0">
            <div className="col-lg-6 p-0">
              <div className="login-content">
                <form onSubmit={handleSubmit}>
                  <div className="login-userset">
                    <div className="login-logo logo-normal">
                      <img src={logo} alt="img" />
                    </div>
                    <Link
                      to={route.superadmindashboard}
                      className="login-logo logo-white">
                      
                      <img src={logoWhite} alt="Img" />
                    </Link>
                    <div className="login-userheading">
                      <h3>Super Admin Sign In</h3>
                      <h4>
                        Access the Super Admin panel using your email and
                        passcode.
                      </h4>
                    </div>
                    {error && (
                      <div className="alert alert-danger" role="alert">
                        {error}
                      </div>
                    )}
                    <div className="mb-3">
                      <label className="form-label">Email Address</label>
                      <div className="input-group">
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="form-control border-end-0"
                          required
                          disabled={isLoading}
                        />
                        
                        <span className="input-group-text border-start-0">
                          <i className="ti ti-mail" />
                        </span>
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Password</label>
                      <div className="pass-group">
                        <input
                          type={isPasswordVisible ? "text" : "password"}
                          name="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          className="pass-input form-control"
                          required
                          disabled={isLoading}
                        />
                        
                        <span
                          className={`ti toggle-password text-gray-9 ${
                          isPasswordVisible ? "ti-eye" : "ti-eye-off"}`
                          }
                          onClick={togglePasswordVisibility}>
                        </span>
                      </div>
                    </div>
                    <div className="form-login authentication-check">
                      <div className="row">
                        <div className="col-6">
                          <div className="custom-control custom-checkbox">
                            <label className="checkboxs ps-4 mb-0 pb-0 line-height-1">
                              <input 
                                type="checkbox" 
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                              />
                              <span className="checkmarks" />
                              Remember me
                            </label>
                          </div>
                        </div>
                        <div className="col-6 text-end">
                          <Link
                            className="forgot-link"
                            to={route.forgotPasswordTwo}>
                            
                            Forgot Password?
                          </Link>
                        </div>
                      </div>
                    </div>
                    <div className="form-login">
                      <button 
                        type="submit" 
                        className="btn btn-login"
                        disabled={isLoading}
                      >
                        {isLoading ? "Signing In..." : "Sign In"}
                      </button>
                    </div>
                    <div className="signinform">
                      <h4>
                        Regular user?
                        <Link to={route.signintwo} className="hover-a">
                          {" "}
                          Sign In Here
                        </Link>
                      </h4>
                    </div>
                    <div className="form-setlogin or-text">
                      <h4>OR</h4>
                    </div>
                    <div className="form-sociallink">
                      <div className="d-flex align-items-center justify-content-center flex-wrap">
                        <div className="text-center me-2 flex-fill">
                          <Link
                            to="#"
                            className="br-10 p-2 btn btn-info d-flex align-items-center justify-content-center">
                            
                            <img
                              className="img-fluid m-1"
                              src={facebook}
                              alt="Facebook" />
                            
                          </Link>
                        </div>
                        <div className="text-center me-2 flex-fill">
                          <Link
                            to="#"
                            className="btn btn-white br-10 p-2  border d-flex align-items-center justify-content-center">
                            
                            <img
                              className="img-fluid m-1"
                              src={googleLogo}
                              alt="Google" />
                            
                          </Link>
                        </div>
                        <div className="text-center flex-fill">
                          <Link
                            to="#"
                            className="bg-dark br-10 p-2 btn btn-dark d-flex align-items-center justify-content-center">
                            
                            <img
                              className="img-fluid m-1"
                              src={appleLogo}
                              alt="Apple" />
                            
                          </Link>
                        </div>
                      </div>
                      <div className="my-4 d-flex justify-content-center align-items-center copyright-text">
                        <p>Copyright © 2025 DreamsPOS</p>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            </div>
            <div className="col-lg-6 p-0">
              <div className="login-img">
                <img src={authentication01} alt="img" />
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* /Main Wrapper */}
    </>);

};

export default SuperAdminLogin;

