import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Companies from "./pages/Companies";
import Subscription from "./pages/Subscription";
import Packages from "./pages/Packages";
import Domain from "./pages/Domain";
import PurchaseTransaction from "./pages/PurchaseTransaction";
import SuperAdminUsers from "./pages/SuperAdminUsers";
import MainLayout from "./components/layout/MainLayout";
import { isAuthenticated, isSuperAdmin, getStoredUser } from "./services/auth.service";

const ProtectedRoute = ({ children }) => {
  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const authenticated = isAuthenticated();
      const superAdmin = isSuperAdmin();
      
      console.log('ProtectedRoute check:', { authenticated, superAdmin });
      
      if (authenticated && superAdmin) {
        setAuthorized(true);
      } else {
        console.log('Auth failed:', { 
          authenticated, 
          superAdmin,
          user: getStoredUser(),
          role: getStoredUser()?.role 
        });
        setAuthorized(false);
      }
      setChecking(false);
    };
    
    checkAuth();
  }, []);

  if (checking) {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ minHeight: "100vh" }}>
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading...</p>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/companies" element={<Companies />} />
          <Route path="/subscription" element={<Subscription />} />
          <Route path="/packages" element={<Packages />} />
          <Route path="/domain" element={<Domain />} />
          <Route path="/purchase-transaction" element={<PurchaseTransaction />} />
          <Route path="/super-admin-users" element={<SuperAdminUsers />} />
        </Route>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

