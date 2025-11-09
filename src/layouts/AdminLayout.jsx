import { Outlet } from "react-router-dom";
import AdminHeader from "../components/layout/AdminHeader";

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <AdminHeader />
      <main className="container py-6">
        <Outlet />
      </main>
    </div>
  );
}
