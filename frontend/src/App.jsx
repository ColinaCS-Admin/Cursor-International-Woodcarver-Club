import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import ForgotPasswordPage from "./pages/ForgotPasswordPage.jsx";
import ResetPasswordPage from "./pages/ResetPasswordPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import HomePage from "./pages/HomePage.jsx";
import AccountPage from "./pages/AccountPage.jsx";
import MemberListingPage from "./pages/MemberListingPage.jsx";
import Layout from "./components/Layout.jsx";

function Guard({ children, admin }) {
  const { member, loading, isAdmin } = useAuth();
  if (loading) return <div className="page">Loading membership…</div>;
  if (!member) return <Navigate to="/login" replace />;
  if (admin && !isAdmin) return <Navigate to="/home" replace />;
  return children;
}

function Guest({ children }) {
  const { member, loading } = useAuth();
  if (loading) return <div className="page">Loading membership…</div>;
  if (member) return <Navigate to="/home" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <Guest>
            <LoginPage />
          </Guest>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <Guest>
            <ForgotPasswordPage />
          </Guest>
        }
      />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route
        path="/register"
        element={
          <Guest>
            <RegisterPage />
          </Guest>
        }
      />
      <Route
        element={
          <Guard>
            <Layout />
          </Guard>
        }
      >
        <Route path="/home" element={<HomePage />} />
        <Route path="/account" element={<AccountPage />} />
        <Route
          path="/members"
          element={
            <Guard admin>
              <MemberListingPage />
            </Guard>
          }
        />
      </Route>
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}
