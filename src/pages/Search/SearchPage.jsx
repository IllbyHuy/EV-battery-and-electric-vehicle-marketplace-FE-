import * as React from "react";
import { Link } from "react-router-dom";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { BatteryCharging, Car, Star } from "lucide-react";
import { getAllVehicles, getAllBatteries, setAuthToken } from "../../api/userApi";

function normalizeVehicleForList(vehicle, index) {
  const id = vehicle?.id ?? vehicle?.vehicleId ?? `vehicle-${index}`;
  const brand = vehicle?.brand ?? vehicle?.make ?? vehicle?.manufacturer ?? "Unknown";
  const model = vehicle?.model ?? vehicle?.name ?? "";
  const title = [brand, model].filter(Boolean).join(" ") || `Vehicle ${index + 1}`;
  const image = vehicle?.imgs ?? (Array.isArray(vehicle?.images) && vehicle.images[0]) ?? vehicle?.imageUrl ?? "/placeholder.svg";
  const price = vehicle?.price ?? vehicle?.marketPrice ?? 0;
  const rating = vehicle?.rating ?? 0;
  const spec = `${vehicle?.startYear ?? vehicle?.year ?? ""}${vehicle?.range ? ` • ${vehicle.range} mi` : ""}`;
  return { id: String(id), type: "car", title, image, price, rating, spec, tag: vehicle?.isAproved ? "Approved" : vehicle?.status ?? "Pending", relatedId: id, relatedKind: "vehicle" };
}

function normalizeBatteryForList(battery, index) {
  const id = battery?.id ?? battery?.batteryId ?? `battery-${index}`;
  const brand = battery?.brand ?? battery?.manufacturer ?? "Unknown";
  const model = battery?.model ?? battery?.name ?? "";
  const title = [brand, model].filter(Boolean).join(" ") || `Battery ${index + 1}`;
  const image = battery?.imgs ?? (Array.isArray(battery?.images) && battery.images[0]) ?? battery?.imageUrl ?? "/placeholder.svg";
  const price = battery?.price ?? battery?.marketPrice ?? 0;
  const rating = battery?.rating ?? 0;
  const specParts = [];
  if (battery?.capacity) specParts.push(`${battery.capacity} ${battery.capacityUnit ?? "kWh"}`);
  if (battery?.voltage) specParts.push(`${battery.voltage}V`);
  const spec = specParts.join(" • ");
  return { id: String(id), type: "battery", title, image, price, rating, spec, tag: battery?.isAproved ? "Approved" : battery?.status ?? "Pending", relatedId: id, relatedKind: "battery" };
}

export default function SearchPage() {
  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [query, setQuery] = React.useState("");
  const [tab, setTab] = React.useState("All");
  const [sort, setSort] = React.useState("relevance");

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem("authToken") || localStorage.getItem("token") || sessionStorage.getItem("authToken");
        if (token) setAuthToken(token);
        const [vRes, bRes] = await Promise.all([getAllVehicles(), getAllBatteries()]);
        if (!mounted) return;
        const vehicles = Array.isArray(vRes?.result) ? vRes.result : Array.isArray(vRes) ? vRes : [];
        const batteries = Array.isArray(bRes?.result) ? bRes.result : Array.isArray(bRes) ? bRes : [];
        const nv = vehicles.map(normalizeVehicleForList);
        const nb = batteries.map(normalizeBatteryForList);
        setItems([...nv, ...nb]);
      } catch (err) {
        setError(err?.message || "Failed to load listings");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => (mounted = false);
  }, []);

  const filtered = React.useMemo(() => {
    let out = items.slice();
    if (tab === "EVs") out = out.filter((i) => i.type === "car");
    if (tab === "Batteries") out = out.filter((i) => i.type === "battery");
    if (query) {
      const q = query.toLowerCase();
      out = out.filter((i) => i.title.toLowerCase().includes(q) || (i.spec || "").toLowerCase().includes(q));
    }
    if (sort === "price_asc") out.sort((a, b) => a.price - b.price);
    else if (sort === "price_desc") out.sort((a, b) => b.price - a.price);
    else if (sort === "rating") out.sort((a, b) => b.rating - a.rating);
    return out;
  }, [items, tab, query, sort]);

  return (
    <div className="container py-12">
      <div className="mb-6 grid gap-4 md:grid-cols-3 items-center">
        <div className="md:col-span-2">
          <h1 className="text-2xl font-bold">Search listings</h1>
          <p className="text-sm text-muted-foreground">Browse all EVs and battery packs. Use the search and sorting to narrow results.</p>
        </div>
        <div className="flex gap-2 justify-end">
          <Input placeholder="Search by model, brand or spec" value={query} onChange={(e) => setQuery(e.target.value)} />
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="rounded border bg-card p-2 text-sm">
            <option value="relevance">Relevance</option>
            <option value="price_asc">Price: Low → High</option>
            <option value="price_desc">Price: High → Low</option>
            <option value="rating">Top rated</option>
          </select>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-2">
        {["All", "EVs", "Batteries"].map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-3 py-1 rounded-full text-sm ${tab === t ? "bg-primary text-white" : "bg-muted/20 text-white/80"}`}>
            {t}
          </button>
        ))}
        <div className="ml-auto text-sm text-muted-foreground">Results: {filtered.length}</div>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading listings…</div>
      ) : error ? (
        <div className="text-sm text-red-400">{error}</div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <Link key={item.id} to={`/product/${item.relatedId}`} className="no-underline">
              <Card className="group overflow-hidden">
                <div className="relative aspect-[4/3] bg-muted/40">
                  <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
                  <div className="absolute left-3 top-3"><Badge>{item.tag}</Badge></div>
                </div>
                <CardContent className="space-y-2 pt-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {item.type === "car" ? <Car className="h-3.5 w-3.5" /> : <BatteryCharging className="h-3.5 w-3.5" />}
                        {item.type === "car" ? "EV" : "Battery"}
                      </div>
                      <h3 className="font-semibold">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.spec}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">{Number(item.price).toLocaleString("en-US", { style: "currency", currency: "USD" })}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1"><Star className="h-3 w-3 text-yellow-500" />{item.rating}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}


