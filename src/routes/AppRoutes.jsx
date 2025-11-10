import { BrowserRouter, Routes, Route } from "react-router-dom";
import { RequireAdmin, RequireUser, RequireAuth, RoleRedirect } from "./guards";
import MainLayout from "../layouts/MainLayout";
import HomePage from "../pages/Home/HomePage";
import LoginPage from "../pages/Login/LoginPage";
import RegisterPage from "../pages/Register/RegisterPage";
import NotFound from "../pages/NotFound/NotFound";
import ProfilePage from "../pages/Profile/ProfilePage";
import SettingsPage from "../pages/Profile/SettingsPage";
import NewListingPage from "../pages/Listings/NewListingPage";
import AiPricePage from "../pages/AiPrice/AiPricePage";
import SearchPage from "../pages/Search/SearchPage";
import ComparePage from "../pages/Compare/ComparePage";
import ProductPage from "../pages/Product/ProductPage";
import ReviewsPage from "../pages/Reviews/ReviewsPage";
import HistoryPage from "../pages/History/HistoryPage";
import AdminTransactionsPage from "../pages/Admin/AdminTransactionsPage";
import AdminCommissionsPage from "../pages/Admin/AdminCommissionsPage";
import AdminDashboardPage from "../pages/Admin/AdminDashboardPage";
import AdminAccountsPage from "../pages/Admin/AdminAccountsPage";
import AdminBatteriesPage from "../pages/Admin/AdminBatteriesPage";
import AdminVehiclesPage from "../pages/Admin/AdminVehiclesPage";
import AdminLayout from "../layouts/AdminLayout";
import CheckoutPage from "../pages/Payment/CheckoutPage";
import NewListing from "../pages/Listings/NewListing";
export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public / main site routes use MainLayout */}
        <Route element={<MainLayout />}>
          {/* Public routes - no authentication required */}
          <Route index element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/compare" element={<ComparePage />} />
          <Route path="/product/:id" element={<ProductPage />} />
          
          {/* Role-based redirect utility route */}
          <Route path="/go" element={<RoleRedirect />} />

          {/* Protected routes - require authentication (any authenticated user) */}
          <Route
            path="/profile"
            element={
              <RequireAuth>
                <ProfilePage />
              </RequireAuth>
            }
          />
          <Route
            path="/settings"
            element={
              <RequireAuth>
                <SettingsPage />
              </RequireAuth>
            }
          />
          <Route
            path="/reviews"
            element={
              <RequireAuth>
                <ReviewsPage />
              </RequireAuth>
            }
          />
          <Route
            path="/history"
            element={
              <RequireAuth>
                <HistoryPage />
              </RequireAuth>
            }
          />

          {/* User-only routes - require role 2 or "User" */}
          <Route path="/listings" element={<RequireUser />}>
            <Route path="new" element={<NewListing />} />
          </Route>
          <Route
            path="/ai-price"
            element={
              <RequireUser>
                <AiPricePage />
              </RequireUser>
            }
          />
          <Route
            path="/payment/checkout"
            element={
              <RequireUser>
                <CheckoutPage />
              </RequireUser>
            }
          />

          <Route path="*" element={<NotFound />} />
        </Route>

        {/* Admin routes - require role 1 or "Admin" */}
        <Route path="/admin" element={<RequireAdmin />}>
          <Route element={<AdminLayout />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="dashboard" element={<AdminDashboardPage />} />
            <Route path="batteries" element={<AdminBatteriesPage />} />
            <Route path="vehicles" element={<AdminVehiclesPage />} />
            <Route path="commissions" element={<AdminCommissionsPage />} />
            <Route path="transactions" element={<AdminTransactionsPage />} />
            <Route path="accounts" element={<AdminAccountsPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
