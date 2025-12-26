import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService, isSuperAdmin, getStoredUser } from "../services/auth.service";

const Login = () => {
  const navigate = useNavigate();
  const [isPasswordVisible, setPasswordVisible] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const togglePasswordVisibility = () => {
    setPasswordVisible((prevState) => !prevState);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.email || !formData.password) {
      setError("Please fill in all fields");
      return;
    }

    setIsLoading(true);

    try {
      const response = await authService.login(formData.email, formData.password);
      
      // Check if response indicates an error
      if (response && response.success === false) {
        const errorMessage = response?.error?.message || response?.message || "Login failed. Please try again.";
        setError(errorMessage);
        return;
      }
      
      if (response && response.success) {
        const user = response.data?.user || response.data || getStoredUser();
        
        // Debug: Log user data
        console.log('Login response user:', user);
        console.log('User role:', user?.role);
        
        // Ensure user is saved to localStorage with role
        if (user && !getStoredUser()) {
          localStorage.setItem('user', JSON.stringify(user));
        }
        
        const roleName = user?.role?.name?.toLowerCase() || "";
        
        const userIsSuperAdmin = 
          roleName.includes("super admin") || 
          roleName.includes("superadmin") || 
          roleName === "admin" ||
          roleName.includes("super");
        
        console.log('Super Admin check:', { roleName, userIsSuperAdmin });
        
        if (userIsSuperAdmin) {
          navigate("/dashboard");
        } else {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          setError(`Access denied. Super admin credentials required. Your role: ${user?.role?.name || 'Unknown'}`);
        }
      } else {
        setError(response?.error?.message || response?.message || "Login failed. Please try again.");
      }
    } catch (err) {
      // Log full error for debugging
      console.error('Login catch error:', err);
      console.error('Error type:', typeof err);
      console.error('Error keys:', err ? Object.keys(err) : 'null');
      
      // Extract error message from various possible error structures
      // Backend error format: {success: false, error: {message: "...", code: "..."}}
      // Error from API interceptor rejects with: {success: false, error: {message: "...", code: "..."}}
      // Error from axios: {response: {data: {error: {message: "..."}}}}
      let errorMessage = "Invalid email or password. Please try again.";
      let errorCode = null;
      
      if (err) {
        // Primary check: {success: false, error: {message: "...", code: "..."}}
        if (err.error?.message) {
          errorMessage = err.error.message;
          errorCode = err.error.code;
          console.log('✅ Extracted from err.error:', { message: errorMessage, code: errorCode });
        } 
        // Check for axios response structure (shouldn't happen with interceptor, but just in case)
        else if (err.response?.data?.error?.message) {
          errorMessage = err.response.data.error.message;
          errorCode = err.response.data.error.code;
          console.log('✅ Extracted from err.response.data.error:', { message: errorMessage, code: errorCode });
        }
        // Check for direct message property
        else if (err.message) {
          errorMessage = err.message;
          console.log('✅ Extracted from err.message:', errorMessage);
        } 
        // Check if error itself is a string
        else if (typeof err === 'string') {
          errorMessage = err;
          console.log('✅ Error is string:', errorMessage);
        } else {
          console.log('❌ Could not extract error message, using default');
          console.log('Full error object:', JSON.stringify(err, null, 2));
        }
      }
      
      // Provide more helpful messages for specific error codes
      if (errorCode === 'TENANT_INACTIVE') {
        errorMessage = "Tenant account is inactive. Please contact your system administrator to activate your tenant account, or use a Super Admin account to log in.";
      } else if (errorCode === 'ACCOUNT_INACTIVE') {
        errorMessage = "Your account is inactive. Please contact your system administrator to activate your account.";
      } else if (errorCode === 'INVALID_CREDENTIALS') {
        errorMessage = "Invalid email or password. Please check your credentials and try again.";
      }
      
      console.log('🎯 Final error message to display:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="main-wrapper" style={{ 
      minHeight: "100vh",
      background: "linear-gradient(135deg, #1e3c72 0%, #2a5298 50%, #7e22ce 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
      position: "relative",
      overflow: "hidden"
    }}>
      {/* Animated Background Elements */}
      <div style={{
        position: "absolute",
        width: "500px",
        height: "500px",
        background: "radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)",
        borderRadius: "50%",
        top: "-250px",
        right: "-250px",
        animation: "pulse 8s ease-in-out infinite"
      }}></div>
      <div style={{
        position: "absolute",
        width: "400px",
        height: "400px",
        background: "radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)",
        borderRadius: "50%",
        bottom: "-200px",
        left: "-200px",
        animation: "pulse 10s ease-in-out infinite"
      }}></div>

      <div className="account-content" style={{ width: "100%", maxWidth: "1100px", position: "relative", zIndex: "1" }}>
        <div className="row login-wrapper m-0" style={{
          borderRadius: "24px",
          overflow: "hidden",
          boxShadow: "0 25px 80px rgba(0, 0, 0, 0.4)",
          background: "#ffffff",
          backdropFilter: "blur(10px)"
        }}>
          <div className="col-lg-5 p-0">
            <div className="login-content" style={{
              padding: "80px 60px",
              display: "flex",
              alignItems: "center",
              minHeight: "100%",
              background: "#ffffff"
            }}>
              <div style={{ width: "100%" }}>
                <form onSubmit={handleSubmit}>
                  <div className="login-userset">
                    {/* Logo Section */}
                    <div className="login-logo logo-normal" style={{ 
                      textAlign: "left",
                      marginBottom: "50px"
                    }}>
                      <div style={{
                        width: "70px",
                        height: "70px",
                        marginBottom: "24px",
                        background: "linear-gradient(135deg, #1e3c72 0%, #7e22ce 100%)",
                        borderRadius: "16px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 8px 24px rgba(30, 60, 114, 0.25)"
                      }}>
                        <i className="ti ti-shield-lock" style={{ 
                          fontSize: "36px", 
                          color: "#ffffff" 
                        }} />
                      </div>
                      <h1 style={{
                        fontSize: "36px",
                        fontWeight: "800",
                        color: "#0f172a",
                        marginBottom: "12px",
                        letterSpacing: "-0.5px",
                        lineHeight: "1.2"
                      }}>
                        Super Admin
                      </h1>
                      <p style={{
                        fontSize: "16px",
                        fontWeight: "400",
                        color: "#64748b",
                        margin: "0",
                        lineHeight: "1.6"
                      }}>
                        Sign in to manage your system
                      </p>
                    </div>

                    {/* Error Message */}
                    {error && (
                      <div className="alert alert-danger" role="alert" style={{
                        borderRadius: "12px",
                        padding: "16px 20px",
                        marginBottom: "32px",
                        border: "1px solid #fecaca",
                        background: "linear-gradient(to right, #fef2f2, #fee2e2)",
                        color: "#991b1b",
                        fontSize: "14px",
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        animation: "shake 0.5s ease-in-out",
                        fontWeight: "500"
                      }}>
                        <i className="ti ti-alert-circle" style={{ fontSize: "20px", flexShrink: "0" }} />
                        <span>{error}</span>
                      </div>
                    )}

                    {/* Email Input */}
                    <div className="mb-4">
                      <label className="form-label" style={{
                        fontSize: "14px",
                        fontWeight: "600",
                        color: "#1e293b",
                        marginBottom: "12px",
                        display: "block",
                        letterSpacing: "0.3px"
                      }}>
                        Email Address
                      </label>
                      <div className="input-group" style={{
                        position: "relative",
                        borderRadius: "14px",
                        overflow: "hidden",
                        border: "2px solid #e2e8f0",
                        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                        background: "#f8fafc"
                      }}>
                        <span className="input-group-text border-start-0" style={{
                          background: "transparent",
                          border: "none",
                          padding: "16px 20px",
                          color: "#64748b"
                        }}>
                          <i className="ti ti-mail" style={{ fontSize: "20px" }} />
                        </span>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="form-control border-end-0"
                          required
                          disabled={isLoading}
                          placeholder="admin@example.com"
                          style={{
                            border: "none",
                            padding: "16px 20px",
                            fontSize: "15px",
                            background: "transparent",
                            color: "#1e293b",
                            fontWeight: "500"
                          }}
                          onFocus={(e) => {
                            e.target.parentElement.style.borderColor = "#1e3c72";
                            e.target.parentElement.style.boxShadow = "0 0 0 4px rgba(30, 60, 114, 0.1)";
                            e.target.parentElement.style.background = "#ffffff";
                          }}
                          onBlur={(e) => {
                            e.target.parentElement.style.borderColor = "#e2e8f0";
                            e.target.parentElement.style.boxShadow = "none";
                            e.target.parentElement.style.background = "#f8fafc";
                          }}
                        />
                      </div>
                    </div>

                    {/* Password Input */}
                    <div className="mb-5">
                      <label className="form-label" style={{
                        fontSize: "14px",
                        fontWeight: "600",
                        color: "#1e293b",
                        marginBottom: "12px",
                        display: "block",
                        letterSpacing: "0.3px"
                      }}>
                        Password
                      </label>
                      <div className="pass-group" style={{
                        position: "relative",
                        borderRadius: "14px",
                        overflow: "hidden",
                        border: "2px solid #e2e8f0",
                        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                        display: "flex",
                        alignItems: "center",
                        background: "#f8fafc"
                      }}>
                        <span className="input-group-text border-start-0" style={{
                          background: "transparent",
                          border: "none",
                          padding: "16px 20px",
                          color: "#64748b"
                        }}>
                          <i className="ti ti-lock" style={{ fontSize: "20px" }} />
                        </span>
                        <input
                          type={isPasswordVisible ? "text" : "password"}
                          name="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          className="pass-input form-control"
                          required
                          disabled={isLoading}
                          placeholder="Enter your password"
                          style={{
                            border: "none",
                            padding: "16px 20px",
                            fontSize: "15px",
                            background: "transparent",
                            color: "#1e293b",
                            flex: "1",
                            fontWeight: "500"
                          }}
                          onFocus={(e) => {
                            e.target.parentElement.style.borderColor = "#1e3c72";
                            e.target.parentElement.style.boxShadow = "0 0 0 4px rgba(30, 60, 114, 0.1)";
                            e.target.parentElement.style.background = "#ffffff";
                          }}
                          onBlur={(e) => {
                            e.target.parentElement.style.borderColor = "#e2e8f0";
                            e.target.parentElement.style.boxShadow = "none";
                            e.target.parentElement.style.background = "#f8fafc";
                          }}
                        />
                        <span
                          className={`ti toggle-password text-gray-9 ${
                            isPasswordVisible ? "ti-eye" : "ti-eye-off"
                          }`}
                          onClick={togglePasswordVisibility}
                          style={{
                            padding: "16px 20px",
                            cursor: "pointer",
                            color: "#64748b",
                            fontSize: "20px",
                            transition: "all 0.2s ease",
                            display: "flex",
                            alignItems: "center"
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.color = "#1e3c72";
                            e.target.style.transform = "scale(1.1)";
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.color = "#64748b";
                            e.target.style.transform = "scale(1)";
                          }}
                        ></span>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div className="form-login" style={{ marginTop: "40px" }}>
                      <button 
                        type="submit" 
                        className="btn btn-login"
                        disabled={isLoading}
                        style={{
                          width: "100%",
                          padding: "18px 24px",
                          fontSize: "16px",
                          fontWeight: "700",
                          borderRadius: "14px",
                          border: "none",
                          background: isLoading 
                            ? "#cbd5e1" 
                            : "linear-gradient(135deg, #1e3c72 0%, #2a5298 50%, #7e22ce 100%)",
                          color: "#ffffff",
                          cursor: isLoading ? "not-allowed" : "pointer",
                          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                          boxShadow: isLoading 
                            ? "none" 
                            : "0 12px 32px rgba(30, 60, 114, 0.35)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "12px",
                          letterSpacing: "0.5px",
                          textTransform: "uppercase"
                        }}
                        onMouseEnter={(e) => {
                          if (!isLoading) {
                            e.target.style.transform = "translateY(-3px)";
                            e.target.style.boxShadow = "0 16px 40px rgba(30, 60, 114, 0.45)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isLoading) {
                            e.target.style.transform = "translateY(0)";
                            e.target.style.boxShadow = "0 12px 32px rgba(30, 60, 114, 0.35)";
                          }
                        }}
                      >
                        {isLoading ? (
                          <>
                            <span className="spinner-border spinner-border-sm" 
                              style={{ width: "20px", height: "20px", borderWidth: "2.5px" }} 
                            />
                            <span>Signing In...</span>
                          </>
                        ) : (
                          <>
                            <i className="ti ti-login-2" style={{ fontSize: "20px" }} />
                            <span>Sign In</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
          
          {/* Right Side Panel */}
          <div className="col-lg-7 p-0">
            <div className="login-img" style={{ 
              background: "linear-gradient(135deg, #1e3c72 0%, #2a5298 50%, #7e22ce 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              minHeight: "100%",
              padding: "80px 60px",
              position: "relative",
              overflow: "hidden"
            }}>
              {/* Decorative Pattern */}
              <div style={{
                position: "absolute",
                top: "0",
                left: "0",
                width: "100%",
                height: "100%",
                backgroundImage: "radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)",
                backgroundSize: "40px 40px",
                opacity: "0.5"
              }}></div>
              
              {/* Floating Orbs */}
              <div style={{
                position: "absolute",
                width: "200px",
                height: "200px",
                background: "rgba(255, 255, 255, 0.1)",
                borderRadius: "50%",
                top: "10%",
                right: "10%",
                filter: "blur(40px)",
                animation: "floatUp 6s ease-in-out infinite"
              }}></div>
              <div style={{
                position: "absolute",
                width: "150px",
                height: "150px",
                background: "rgba(255, 255, 255, 0.08)",
                borderRadius: "50%",
                bottom: "15%",
                left: "15%",
                filter: "blur(30px)",
                animation: "floatDown 8s ease-in-out infinite"
              }}></div>

              <div style={{ 
                position: "relative",
                zIndex: "1",
                textAlign: "center",
                width: "100%"
              }}>
                <div style={{
                  width: "140px",
                  height: "140px",
                  margin: "0 auto 40px",
                  background: "rgba(255, 255, 255, 0.15)",
                  borderRadius: "28px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backdropFilter: "blur(20px)",
                  border: "2px solid rgba(255, 255, 255, 0.2)",
                  boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
                  animation: "scaleIn 1s ease-out"
                }}>
                  <i className="ti ti-shield-check" style={{ 
                    fontSize: "70px", 
                    color: "#ffffff" 
                  }} />
                </div>
                <h2 style={{
                  fontSize: "42px",
                  fontWeight: "800",
                  marginBottom: "20px",
                  textShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
                  letterSpacing: "-0.5px",
                  lineHeight: "1.2"
                }}>
                  Admin Dashboard
                </h2>
                <p style={{
                  fontSize: "18px",
                  fontWeight: "400",
                  opacity: "0.95",
                  lineHeight: "1.8",
                  marginBottom: "50px",
                  maxWidth: "400px",
                  margin: "0 auto 50px"
                }}>
                  Complete control over your system with advanced management tools and analytics
                </p>
                <div style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                  marginTop: "50px"
                }}>
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "18px",
                    background: "rgba(255, 255, 255, 0.12)",
                    padding: "20px 24px",
                    borderRadius: "16px",
                    backdropFilter: "blur(20px)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    transition: "all 0.3s ease"
                  }}>
                    <div style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "12px",
                      background: "rgba(255, 255, 255, 0.2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: "0"
                    }}>
                      <i className="ti ti-shield" style={{ fontSize: "24px" }} />
                    </div>
                    <div style={{ textAlign: "left", flex: "1" }}>
                      <div style={{ fontSize: "16px", fontWeight: "600", marginBottom: "4px" }}>
                        Secure Authentication
                      </div>
                      <div style={{ fontSize: "13px", opacity: "0.8" }}>
                        Enterprise-grade security
                      </div>
                    </div>
                  </div>
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "18px",
                    background: "rgba(255, 255, 255, 0.12)",
                    padding: "20px 24px",
                    borderRadius: "16px",
                    backdropFilter: "blur(20px)",
                    border: "1px solid rgba(255, 255, 255, 0.2)"
                  }}>
                    <div style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "12px",
                      background: "rgba(255, 255, 255, 0.2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: "0"
                    }}>
                      <i className="ti ti-settings" style={{ fontSize: "24px" }} />
                    </div>
                    <div style={{ textAlign: "left", flex: "1" }}>
                      <div style={{ fontSize: "16px", fontWeight: "600", marginBottom: "4px" }}>
                        System Management
                      </div>
                      <div style={{ fontSize: "13px", opacity: "0.8" }}>
                        Full administrative control
                      </div>
                    </div>
                  </div>
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "18px",
                    background: "rgba(255, 255, 255, 0.12)",
                    padding: "20px 24px",
                    borderRadius: "16px",
                    backdropFilter: "blur(20px)",
                    border: "1px solid rgba(255, 255, 255, 0.2)"
                  }}>
                    <div style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "12px",
                      background: "rgba(255, 255, 255, 0.2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: "0"
                    }}>
                      <i className="ti ti-chart-bar" style={{ fontSize: "24px" }} />
                    </div>
                    <div style={{ textAlign: "left", flex: "1" }}>
                      <div style={{ fontSize: "16px", fontWeight: "600", marginBottom: "4px" }}>
                        Analytics & Reports
                      </div>
                      <div style={{ fontSize: "13px", opacity: "0.8" }}>
                        Real-time insights and data
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }
        @keyframes floatUp {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        @keyframes floatDown {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(20px); }
        }
        @keyframes scaleIn {
          0% { transform: scale(0.8); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @media (max-width: 991px) {
          .login-img {
            display: none !important;
          }
          .login-content {
            padding: 60px 40px !important;
          }
        }
        @media (max-width: 576px) {
          .login-content {
            padding: 40px 30px !important;
          }
        }
        .form-control:focus {
          outline: none;
          box-shadow: none;
        }
        .form-control::placeholder {
          color: #94a3b8;
          font-weight: 400;
        }
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0px 1000px #f8fafc inset;
          transition: background-color 5000s ease-in-out 0s;
        }
      `}</style>
    </div>
  );
};

export default Login;

