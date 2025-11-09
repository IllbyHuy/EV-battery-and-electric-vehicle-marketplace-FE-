import { NavLink } from "react-router-dom";
import { Gauge, Users, DollarSign, Clipboard, BatteryCharging, Car } from "lucide-react";

export default function AdminHeader() {
  const items = [
    { to: "/admin/dashboard", label: "Dashboard", icon: Gauge },
    { to: "/admin/batteries", label: "Batteries", icon: BatteryCharging },
    { to: "/admin/vehicles", label: "Vehicles", icon: Car },
    { to: "/admin/commissions", label: "Commissions", icon: DollarSign },
    { to: "/admin/transactions", label: "Transactions", icon: Clipboard },
    { to: "/admin/accounts", label: "Accounts", icon: Users },
  ];

  return (
    <header className="sticky top-0 z-40 bg-card border-b border-white/5">
      <div className="container flex items-center justify-between h-16">
        <div className="flex items-center gap-3">
          <div className="font-extrabold text-lg">Admin Panel</div>
        </div>

        <nav className="flex items-center gap-2">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-white/3 ${
                  isActive ? "bg-accent text-accent-foreground" : "text-muted"
                }`
              }
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
