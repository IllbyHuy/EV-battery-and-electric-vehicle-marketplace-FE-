import { Link, NavLink } from "react-router-dom";
import { Zap, Search, Sparkles, Bolt, BatteryCharging } from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/button";

const navItems = [
  { to: "/search", label: "Search", icon: Search },
  { to: "/compare", label: "Compare", icon: Sparkles },
  { to: "/ai-price", label: "AI Pricing", icon: Bolt },
  { to: "/listings/new", label: "Post Listing", icon: BatteryCharging },
];

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-extrabold tracking-tight">
          <Zap className="h-6 w-6 text-primary" />
          <span className="text-lg">VoltMarket</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground ${isActive ? "text-primary" : "text-muted-foreground"}`
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link to="/login"><Button variant="ghost">Log in</Button></Link>
          <Link to="/register"><Button>Sign up</Button></Link>
        </div>

        <button
          className="inline-flex items-center justify-center rounded-md p-2 text-foreground md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {/* simple hamburger */}
          <span className="block h-0.5 w-5 bg-current mb-1" />
          <span className="block h-0.5 w-5 bg-current mb-1" />
          <span className="block h-0.5 w-5 bg-current" />
        </button>
      </div>

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
            <div className="mt-2 flex gap-2">
              <Link to="/login" onClick={() => setOpen(false)} className="flex-1"><Button variant="ghost" className="w-full">Log in</Button></Link>
              <Link to="/register" onClick={() => setOpen(false)} className="flex-1"><Button className="w-full">Sign up</Button></Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}


