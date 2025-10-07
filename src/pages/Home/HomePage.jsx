import * as React from "react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { SelectTrigger, SelectContent, SelectItem } from "../../components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Link } from "react-router-dom";
import { BatteryCharging, Car, ChevronRight, Star, Zap } from "lucide-react";

const listings = [
  { id: "1", type: "car", title: "Tesla Model 3 Long Range", price: 38490, spec: "358 mi • 2022 • AWD", rating: 4.8, image: "/placeholder.svg", tag: "Trending" },
  { id: "2", type: "car", title: "Hyundai IONIQ 5 Limited", price: 32950, spec: "303 mi • 2023 • RWD", rating: 4.6, image: "/placeholder.svg", tag: "Great value" },
  { id: "3", type: "battery", title: "LG Chem EV Battery 64kWh", price: 6200, spec: "64 kWh • Grade A • 98% SOH", rating: 4.7, image: "/placeholder.svg", tag: "Refurbished" },
  { id: "4", type: "battery", title: "CATL LFP Pack 75kWh", price: 7100, spec: "75 kWh • New • 0 cycles", rating: 4.9, image: "/placeholder.svg", tag: "New" },
];

// Use native selects for reliability

export default function HomePage() {
  const [type, setType] = React.useState("Cars");
  const [brand, setBrand] = React.useState("Brand / Manufacturer");
  const [price, setPrice] = React.useState("Price range");
  const [rangeVal, setRangeVal] = React.useState("Range / kWh");
  const [condition, setCondition] = React.useState("Condition");

  const [openType, setOpenType] = React.useState(false);
  const [openBrand, setOpenBrand] = React.useState(false);
  const [openPrice, setOpenPrice] = React.useState(false);
  const [openRange, setOpenRange] = React.useState(false);
  const [openCondition, setOpenCondition] = React.useState(false);

  return (
    <div className="bg-[radial-gradient(60%_60%_at_50%_-10%,hsl(var(--primary)/0.12),transparent),_linear-gradient(to_bottom,white,white)]">
      {/* Hero */}
      <section className="container pb-10 pt-10 md:pb-16 md:pt-16">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs text-muted-foreground">
              <Zap className="h-3.5 w-3.5 text-primary" />
              Data‑driven pricing for EVs & batteries
            </div>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight md:text-5xl">Buy, sell, and compare electric vehicles and batteries</h1>
            <p className="mt-4 text-muted-foreground md:text-lg">VoltMarket mang lại trải nghiệm marketplace hiện đại. Tìm EV/battery đúng giá theo dữ liệu realtime.</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link to="/listings/new"><Button>Post a Listing</Button></Link>
              <Link to="/ai-price"><Button variant="secondary">Get AI Price Suggestion</Button></Link>
            </div>

            {/* Quick features */}
            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { icon: Car, label: "Verified sellers" },
                { icon: BatteryCharging, label: "Battery health" },
                { icon: Star, label: "Ratings & reviews" },
                { icon: Zap, label: "Secure payments" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="rounded-lg border bg-card p-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2 text-foreground"><Icon className="h-4 w-4 text-primary" /> {label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Search panel */}
          <Card className="border-primary/20 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">Search Marketplace</CardTitle>
              <CardDescription>Find EVs and batteries with advanced filters</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="relative">
                  <SelectTrigger placeholder="Cars" value={type} onToggle={() => setOpenType(!openType)} />
                  <SelectContent open={openType} onClose={() => setOpenType(false)}>
                    <SelectItem onSelect={() => { setType("Cars"); setOpenType(false); }}>Cars</SelectItem>
                    <SelectItem onSelect={() => { setType("Batteries"); setOpenType(false); }}>Batteries</SelectItem>
                  </SelectContent>
                </div>
                <div className="relative">
                  <SelectTrigger placeholder="Brand / Manufacturer" value={brand} onToggle={() => setOpenBrand(!openBrand)} />
                  <SelectContent open={openBrand} onClose={() => setOpenBrand(false)}>
                    <SelectItem onSelect={() => { setBrand("Tesla"); setOpenBrand(false); }}>Tesla</SelectItem>
                    <SelectItem onSelect={() => { setBrand("Hyundai"); setOpenBrand(false); }}>Hyundai</SelectItem>
                    <SelectItem onSelect={() => { setBrand("LG Chem"); setOpenBrand(false); }}>LG Chem</SelectItem>
                    <SelectItem onSelect={() => { setBrand("CATL"); setOpenBrand(false); }}>CATL</SelectItem>
                  </SelectContent>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input placeholder="Model / Capacity" />
                <div className="relative">
                  <SelectTrigger placeholder="Price range" value={price} onToggle={() => setOpenPrice(!openPrice)} />
                  <SelectContent open={openPrice} onClose={() => setOpenPrice(false)}>
                    <SelectItem onSelect={() => { setPrice("$0–10k"); setOpenPrice(false); }}>$0–10k</SelectItem>
                    <SelectItem onSelect={() => { setPrice("$10k–25k"); setOpenPrice(false); }}>$10k–25k</SelectItem>
                    <SelectItem onSelect={() => { setPrice("$25k–50k"); setOpenPrice(false); }}>$25k–50k</SelectItem>
                    <SelectItem onSelect={() => { setPrice("$50k+"); setOpenPrice(false); }}>$50k+</SelectItem>
                  </SelectContent>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="relative">
                  <SelectTrigger placeholder="Range / kWh" value={rangeVal} onToggle={() => setOpenRange(!openRange)} />
                  <SelectContent open={openRange} onClose={() => setOpenRange(false)}>
                    <SelectItem onSelect={() => { setRangeVal("200+ mi / 50+ kWh"); setOpenRange(false); }}>200+ mi / 50+ kWh</SelectItem>
                    <SelectItem onSelect={() => { setRangeVal("300+ mi / 60+ kWh"); setOpenRange(false); }}>300+ mi / 60+ kWh</SelectItem>
                    <SelectItem onSelect={() => { setRangeVal("400+ mi / 70+ kWh"); setOpenRange(false); }}>400+ mi / 70+ kWh</SelectItem>
                  </SelectContent>
                </div>
                <div className="relative">
                  <SelectTrigger placeholder="Condition" value={condition} onToggle={() => setOpenCondition(!openCondition)} />
                  <SelectContent open={openCondition} onClose={() => setOpenCondition(false)}>
                    <SelectItem onSelect={() => { setCondition("New"); setOpenCondition(false); }}>New</SelectItem>
                    <SelectItem onSelect={() => { setCondition("Used"); setOpenCondition(false); }}>Used</SelectItem>
                    <SelectItem onSelect={() => { setCondition("Refurbished"); setOpenCondition(false); }}>Refurbished</SelectItem>
                  </SelectContent>
                </div>
              </div>
              <div className="flex gap-3">
                <Link to="/search" className="flex-1"><Button className="w-full">Search</Button></Link>
                <Link to="/compare" className="flex-1"><Button variant="secondary" className="w-full">Compare</Button></Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Trending listings */}
      <section className="container py-12">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Trending now</h2>
            <p className="text-sm text-muted-foreground">Popular EVs and battery packs priced by market data</p>
          </div>
          <Link to="/search" className="inline-flex items-center text-sm text-primary hover:underline">
            View all <ChevronRight className="ml-1 h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {listings.map((item) => (
            <Card key={item.id} className="group overflow-hidden transition-shadow hover:shadow-md">
              <div className="relative aspect-[4/3] bg-muted/40">
                <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
                <div className="absolute left-3 top-3">
                  <Badge className="shadow-sm">{item.tag}</Badge>
                </div>
              </div>
              <CardContent className="space-y-2 pt-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {item.type === "car" ? <Car className="h-3.5 w-3.5" /> : <BatteryCharging className="h-3.5 w-3.5" />}
                      {item.type === "car" ? "EV" : "Battery"}
                    </div>
                    <h3 className="line-clamp-2 font-semibold leading-tight">{item.title}</h3>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold">{item.price.toLocaleString("en-US", { style: "currency", currency: "USD" })}</div>
                    <div className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
                      <Star className="h-3 w-3 text-yellow-500" /> {item.rating}
                    </div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{item.spec}</p>
                <div className="pt-1">
                  <Link to={`/product/${item.id}`} className="text-sm text-primary hover:underline">View details</Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Callout */}
      <section className="container pb-16">
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader>
            <CardTitle>Not sure how to price your EV or battery?</CardTitle>
            <CardDescription>Use our AI to estimate market value based on specs, condition, and live comparables.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/ai-price"><Button>Get AI Price Suggestion</Button></Link>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}


