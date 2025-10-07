import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import HomePage from "../pages/Home/HomePage";
import LoginPage from "../pages/Login/LoginPage";
import RegisterPage from "../pages/Register/RegisterPage";
import NotFound from "../pages/NotFound/NotFound";
import ProfilePage from "../pages/Profile/ProfilePage";
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
import CheckoutPage from "../pages/Payment/CheckoutPage";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route index element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/listings/new" element={<NewListingPage />} />
          <Route path="/ai-price" element={<AiPricePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/compare" element={<ComparePage />} />
          <Route path="/product/:id" element={<ProductPage />} />
          <Route path="/reviews" element={<ReviewsPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/admin/transactions" element={<AdminTransactionsPage />} />
          <Route path="/admin/commissions" element={<AdminCommissionsPage />} />
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
          <Route path="/payment/checkout" element={<CheckoutPage />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}


