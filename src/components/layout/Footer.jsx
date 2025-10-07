import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container grid gap-6 py-10 md:grid-cols-3">
        <div className="space-y-2">
          <div className="text-xl font-bold">VoltMarket</div>
          <p className="text-sm text-muted-foreground">EVs and batteries, priced by data. Buy, sell, compare.</p>
        </div>
        <nav className="grid grid-cols-2 gap-3 text-sm md:grid-cols-3">
          <Link to="/search" className="text-muted-foreground hover:text-foreground">Search</Link>
          <Link to="/compare" className="text-muted-foreground hover:text-foreground">Compare</Link>
          <Link to="/ai-price" className="text-muted-foreground hover:text-foreground">AI Pricing</Link>
          <Link to="/listings/new" className="text-muted-foreground hover:text-foreground">Post Listing</Link>
          <Link to="/history" className="text-muted-foreground hover:text-foreground">Transactions</Link>
          <Link to="/payment/checkout" className="text-muted-foreground hover:text-foreground">Payment</Link>
        </nav>
        <div className="flex items-center gap-4 md:justify-end">
          <a href="#" aria-label="Twitter" className="text-muted-foreground hover:text-foreground">Tw</a>
          <a href="#" aria-label="LinkedIn" className="text-muted-foreground hover:text-foreground">In</a>
          <a href="#" aria-label="GitHub" className="text-muted-foreground hover:text-foreground">GH</a>
        </div>
      </div>
      <div className="border-t py-4 text-center text-xs text-muted-foreground">© {new Date().getFullYear()} VoltMarket. All rights reserved.</div>
    </footer>
  );
}


