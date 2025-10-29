import { Link, NavLink } from "react-router-dom";
import {
  Zap,
  Search,
  Sparkles,
  Bolt,
  BatteryCharging,
  User,
} from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/button";
import { useAuth } from "../../contexts/AuthContext";
// simple dropdown implemented inline to avoid external dependency

const navItems = [
  { to: "/search", label: "Search", icon: Search },
  { to: "/compare", label: "Compare", icon: Sparkles },
  { to: "/ai-price", label: "AI Pricing", icon: Bolt },
  { to: "/listings/new", label: "Post Listing", icon: BatteryCharging },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full bg-transparent">
      <div className="container flex h-16 items-center justify-between text-white">
        <Link
          to="/"
          className="flex items-center gap-3 font-extrabold tracking-tight"
        >
          <Zap className="h-6 w-6 text-[#7c5cff]" />
          <span className="text-lg text-white">VoltMarket</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-white/5 hover:text-white ${isActive ? "text-[#7c5cff]" : "text-white/70"}`
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Right Side (User / Auth) */}
        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setOpen((v) => !v)}
                className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-accent hover:text-accent-foreground transition-colors"
                aria-haspopup="true"
                aria-expanded={open}
              >
                <User className="h-4 w-4" />
                <span className="font-semibold">
                  {user.username || user.email || "User"}
                </span>
              </button>

              {open && (
                <div className="absolute right-0 mt-2 w-52 bg-[#071226] border border-white/5 rounded-md shadow-lg z-40 text-white">
                  <div className="px-4 py-2 text-sm font-medium">
                    My Account
                  </div>
                  <div className="border-t border-white/5" />
                  <Link
                    to="/profile"
                    onClick={() => setOpen(false)}
                    className="block px-4 py-2 hover:bg-white/5"
                  >
                    Profile
                  </Link>
                  <Link
                    to="/settings"
                    onClick={() => setOpen(false)}
                    className="block px-4 py-2 hover:bg-white/5"
                  >
                    Settings
                  </Link>
                  {user.role === "Admin" && (
                    <Link
                      to="/admin"
                      onClick={() => setOpen(false)}
                      className="block px-4 py-2 hover:bg-white/5"
                    >
                      Admin Panel
                    </Link>
                  )}
                  <div className="border-t border-white/5" />
                  <button
                    onClick={() => {
                      setOpen(false);
                      logout();
                    }}
                    className="w-full text-left px-4 py-2 text-red-400 hover:bg-white/5"
                  >
                    Log out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost">Log in</Button>
              </Link>
              <Link to="/register">
                <Button>Sign up</Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Toggle */}
        <button
          className="inline-flex items-center justify-center rounded-md p-2 text-foreground md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          <span className="block h-0.5 w-5 bg-current mb-1" />
          <span className="block h-0.5 w-5 bg-current mb-1" />
          <span className="block h-0.5 w-5 bg-current" />
        </button>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="border-t md:hidden">
          <div className="container flex flex-col gap-1 py-2">
            {navItems.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
            <div className="mt-2 flex flex-col gap-1">
              {user ? (
                <>
                  <Link
                    to="/profile"
                    onClick={() => setOpen(false)}
                    className="rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                  >
                    Profile
                  </Link>
                  <Link
                    to="/settings"
                    onClick={() => setOpen(false)}
                    className="rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                  >
                    Settings
                  </Link>
                  {user.role === "Admin" && (
                    <Link
                      to="/admin"
                      onClick={() => setOpen(false)}
                      className="rounded-md px-3 py-2 text-sm bg-red-50 text-red-700 font-medium"
                    >
                      Admin Panel
                    </Link>
                  )}
                  <Button
                    variant="ghost"
                    className="w-full text-red-600"
                    onClick={() => {
                      setOpen(false);
                      logout();
                    }}
                  >
                    Log out
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setOpen(false)}>
                    <Button variant="ghost" className="w-full">
                      Log in
                    </Button>
                  </Link>
                  <Link to="/register" onClick={() => setOpen(false)}>
                    <Button className="w-full">Sign up</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
