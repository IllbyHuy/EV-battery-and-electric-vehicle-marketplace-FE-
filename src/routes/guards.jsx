import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

// Strict role mapping: 1 = admin, 2 = user (numeric semantics)
// Also support string "User" for role 2
function getRoleNum(user) {
  if (!user) return Number.NaN;
  // Support both numeric and string roles
  if (user.role === "User" || user.role === "user") return 2;
  if (user.role === "Admin" || user.role === "admin") return 1;
  const n = Number(user.role);
  return Number.isNaN(n) ? Number.NaN : n;
}

function isAdmin(user) {
  return getRoleNum(user) === 1;
}

function isUser(user) {
  const roleNum = getRoleNum(user);
  return roleNum === 2 || user?.role === "User" || user?.role === "user";
}

// Loading component while checking auth
function LoadingAuth() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center text-sm text-muted-foreground">
      Loading...
    </div>
  );
}

// Protected route for authenticated users (both admin and user)
export function RequireAuth({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  const hasToken = typeof globalThis !== "undefined" && globalThis.localStorage?.getItem("token");

  // If we have a token but user not hydrated yet, show loading
  if (!user && hasToken) {
    return <LoadingAuth />;
  }

  // If no user, redirect to login
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}

// Protected route for admin only (role 1 or "Admin")
export function RequireAdmin() {
  const { user } = useAuth();
  const location = useLocation();
  const hasToken = typeof globalThis !== "undefined" && globalThis.localStorage?.getItem("token");

  // If we have a token but user not hydrated yet, show loading
  if (!user && hasToken) {
    return <LoadingAuth />;
  }

  // If no user, redirect to login
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // If not admin, redirect to home
  if (!isAdmin(user)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

// Protected route for regular users only (role 2 or "User")
// Can be used as Outlet (for nested routes) or wrapper component (for single routes)
export function RequireUser({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  const hasToken = typeof globalThis !== "undefined" && globalThis.localStorage?.getItem("token");

  // If we have a token but user not hydrated yet, show loading
  if (!user && hasToken) {
    return <LoadingAuth />;
  }

  // If no user, redirect to login
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // If admin tries to access user-only route, redirect to admin dashboard
  if (isAdmin(user)) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  // If not a regular user, redirect to home
  if (!isUser(user)) {
    return <Navigate to="/" replace />;
  }

  // If children provided, render children (wrapper mode)
  // Otherwise, render Outlet (nested route mode)
  return children ? children : <Outlet />;
}

// After login redirect user based on role
export function RoleRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  
  const roleNum = getRoleNum(user);
  
  // Role 1 or "Admin" → Admin dashboard
  if (roleNum === 1 || user.role === "Admin" || user.role === "admin") {
    return <Navigate to="/admin/dashboard" replace />;
  }
  
  // Role 2 or "User" → Home page
  if (roleNum === 2 || user.role === "User" || user.role === "user") {
    return <Navigate to="/" replace />;
  }
  
  // Unknown role: default to home
  return <Navigate to="/" replace />;
}
