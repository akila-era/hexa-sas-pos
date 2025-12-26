import { useState } from "react";

import { Link, useNavigate } from "react-router-dom";
import { all_routes } from "../../../../routes/all_routes";
import {
  appleLogo,
  authentication01,
  facebook,
  googleLogo,
  logoPng,
  logoWhite } from
"../../../../utils/imagepath";
import { authService } from "../../../../services/auth.service";

const RegisterTwo = () => {
  const route = all_routes;
  const navigate = useNavigate();
  const [passwordVisibility, setPasswordVisibility] = useState({
    password: false,
    confirmPassword: false
  });
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    companyId: "",
    phone: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  const togglePasswordVisibility = (field) => {
    setPasswordVisibility((prevState) => ({
      ...prevState,
      [field]: !prevState[field]
    }));
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
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setError("Please fill in all required fields");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    // Validate UUID format for companyId
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (formData.companyId && !uuidRegex.test(formData.companyId)) {
      setError("Company ID must be a valid UUID format");
      return;
    }

    if (!agreeToTerms) {
      setError("Please agree to the Terms & Privacy");
      return;
    }

    // Split name into firstName and lastName
    const nameParts = formData.name.trim().split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || firstName;

    setIsLoading(true);

    try {
      const registerData = {
        email: formData.email,
        password: formData.password,
        firstName: firstName,
        lastName: lastName,
        companyId: formData.companyId || undefined,
        phone: formData.phone || undefined,
      };

      const response = await authService.register(registerData);
      
      if (response.success) {
        // Navigate to dashboard on success
        navigate(route.dashboard);
      } else {
        setError(response.message || "Registration failed. Please try again.");
      }
    } catch (err) {
      setError(
        err.message || 
        err.error?.message || 
        "Registration failed. Please try again."
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
                      <img src={logoPng} alt="img" />
                    </div>
                    <Link
                      to={route.dashboard}
                      className="login-logo logo-white">
                      
                      <img src={logoWhite} alt="Img" />
                    </Link>
                    <div className="login-userheading">
                      <h3>Register</h3>
                      <h4>Create New Dreamspos Account</h4>
                    </div>
                    {error && (
                      <div className="alert alert-danger" role="alert">
                        {error}
                      </div>
                    )}
                    <div className="mb-3">
                      <label className="form-label">
                        Name <span className="text-danger"> *</span>
                      </label>
                      <div className="input-group">
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          className="form-control border-end-0"
                          required
                          disabled={isLoading}
                        />
                        
                        <span className="input-group-text border-start-0">
                          <i className="ti ti-user" />
                        </span>
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">
                        Email <span className="text-danger"> *</span>
                      </label>
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
                      <label className="form-label">
                        Company ID (UUID) <span className="text-danger"> *</span>
                      </label>
                      <div className="input-group">
                        <input
                          type="text"
                          name="companyId"
                          value={formData.companyId}
                          onChange={handleInputChange}
                          className="form-control border-end-0"
                          required
                          disabled={isLoading}
                          placeholder="Enter your company UUID"
                          pattern="[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"
                        />
                        
                        <span className="input-group-text border-start-0">
                          <i className="ti ti-building" />
                        </span>
                      </div>
                      <small className="text-muted">Contact your administrator for the Company ID (Required UUID format)</small>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">
                        Phone (Optional)
                      </label>
                      <div className="input-group">
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="form-control border-end-0"
                          disabled={isLoading}
                        />
                        
                        <span className="input-group-text border-start-0">
                          <i className="ti ti-phone" />
                        </span>
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">
                        Password <span className="text-danger"> *</span>
                      </label>
                      <div className="pass-group">
                        <input
                          type={passwordVisibility.password ? "text" : "password"}
                          name="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          className="pass-input form-control"
                          required
                          disabled={isLoading}
                          minLength={8}
                        />
                        
                        <span
                          className={`ti toggle-password text-gray-9 ${
                          passwordVisibility.password ? "ti-eye" : "ti-eye-off"}`
                          }
                          onClick={() =>
                          togglePasswordVisibility("password")
                          }>
                        </span>
                      </div>
                      <small className="text-muted">Password must be at least 8 characters</small>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">
                        Confirm Password <span className="text-danger"> *</span>
                      </label>
                      <div className="pass-group">
                        <input
                          type={
                          passwordVisibility.confirmPassword ?
                          "text" :
                          "password"
                          }
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          className="pass-input form-control"
                          required
                          disabled={isLoading}
                        />
                        
                        <span
                          className={`ti toggle-passwords text-gray-9 ${
                          passwordVisibility.confirmPassword ?
                          "ti-eye" :
                          "ti-eye-off"}`
                          }
                          onClick={() =>
                          togglePasswordVisibility("confirmPassword")
                          }>
                        </span>
                      </div>
                    </div>
                    <div className="form-login authentication-check">
                      <div className="row">
                        <div className="col-sm-8">
                          <div className="custom-control custom-checkbox justify-content-start">
                            <div className="custom-control custom-checkbox">
                              <label className="checkboxs ps-4 mb-0 pb-0 line-height-1">
                                <input 
                                  type="checkbox" 
                                  checked={agreeToTerms}
                                  onChange={(e) => setAgreeToTerms(e.target.checked)}
                                  required
                                />
                                <span className="checkmarks" />I agree to the{" "}
                                <Link to="#" className="text-primary">
                                  Terms &amp; Privacy
                                </Link>
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="form-login">
                      <button 
                        type="submit" 
                        className="btn btn-login"
                        disabled={isLoading}
                      >
                        {isLoading ? "Signing Up..." : "Sign Up"}
                      </button>
                    </div>
                    <div className="signinform">
                      <h4>
                        Already have an account ?{" "}
                        <Link to={route.signintwo} className="hover-a">
                          Sign In Instead
                        </Link>
                      </h4>
                    </div>
                    <div className="form-setlogin or-text">
                      <h4>OR</h4>
                    </div>
                    <div className="mt-2">
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
                              alt="Facebook" />
                            
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
                    </div>
                    <div className="my-4 d-flex justify-content-center align-items-center copyright-text">
                      <p>Copyright © 2025 DreamsPOS</p>
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

export default RegisterTwo;