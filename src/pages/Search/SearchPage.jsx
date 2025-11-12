import * as React from "react";
import { Link } from "react-router-dom";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { BatteryCharging, Car, MapPin, User } from "lucide-react";
import { setAuthToken } from "../../api/userApi";
import { api } from "../../api/ListingApi";

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
        
        // Gọi cả 3 API: Battery, Vehicle, Listing
        const [bRes, vRes, lRes] = await Promise.allSettled([
          api.get("/api/Battery/all"),
          api.get("/api/Vehicle/GetAll"),
          api.get("/api/Listing/all")
        ]);
        
        if (!mounted) return;
        
        let allItems = [];

        // Xử lý Battery
        if (bRes.status === "fulfilled") {
          const batteries = Array.isArray(bRes.value?.data?.result) ? bRes.value.data.result : 
                           Array.isArray(bRes.value?.data) ? bRes.value.data : 
                           Array.isArray(bRes.value) ? bRes.value : [];
          
          batteries.forEach(battery => {
            const id = battery?.id ?? battery?.batteryId;
            const brand = battery?.brand ?? battery?.manufacturer ?? "Unknown";
            const model = battery?.model ?? battery?.name ?? "";
            const title = [brand, model].filter(Boolean).join(" ") || `Battery`;
            
            allItems.push({
              id: String(id),
              type: "battery",
              title,
              image: battery?.imgs ?? "/placeholder.svg",
              price: battery?.price ?? 0,
              spec: `${battery?.capacity || ''} ${battery?.capacityUnit || 'kWh'}`,
              tag: "Battery",
              relatedId: id,
              relatedKind: "battery"
            });
          });
        }

        // Xử lý Vehicle - THÊM LẠI
        if (vRes.status === "fulfilled") {
          const vehicles = Array.isArray(vRes.value?.data?.result) ? vRes.value.data.result : 
                          Array.isArray(vRes.value?.data) ? vRes.value.data : 
                          Array.isArray(vRes.value) ? vRes.value : [];
          
          vehicles.forEach(vehicle => {
            const id = vehicle?.id ?? vehicle?.vehicleId;
            const brand = vehicle?.brand ?? vehicle?.manufacturer ?? "Unknown";
            const model = vehicle?.model ?? vehicle?.name ?? "";
            const title = [brand, model].filter(Boolean).join(" ") || `Vehicle`;
            
            allItems.push({
              id: String(id),
              type: "vehicle",
              title,
              image: vehicle?.imgs ?? "/placeholder.svg",
              price: vehicle?.price ?? 0,
              spec: `${vehicle?.year || ''} • ${vehicle?.range || ''} mi`,
              tag: "Vehicle",
              relatedId: id,
              relatedKind: "vehicle"
            });
          });
        } else {
          console.log("Vehicle API not available, skipping...");
        }

        // Xử lý Listing
        if (lRes.status === "fulfilled") {
          const listings = Array.isArray(lRes.value?.data?.result) ? lRes.value.data.result : 
                          Array.isArray(lRes.value?.data) ? lRes.value.data : 
                          Array.isArray(lRes.value) ? lRes.value : [];
          
          listings.forEach(listing => {
            const id = listing?.id ?? listing?.listingId;
            const firstBattery = listing?.listingBatteries?.[0];
            const firstVehicle = listing?.listingVehicles?.[0];
            
            // Lấy ảnh
            let image = "/placeholder.svg";
            if (firstBattery?.imgs) {
              image = Array.isArray(firstBattery.imgs) ? firstBattery.imgs[0] : firstBattery.imgs.split(',')[0];
            } else if (firstVehicle?.imgs) {
              image = Array.isArray(firstVehicle.imgs) ? firstVehicle.imgs[0] : firstVehicle.imgs.split(',')[0];
            }
            
            // Xác định loại
            let listingType = "Listing";
            if (listing?.itemType === "Battery") listingType = "Battery Listing";
            else if (listing?.itemType === "Vehicle") listingType = "Vehicle Listing";
            else if (listing?.itemType === "FullSet") listingType = "Full Set Listing";
            
            allItems.push({
              id: String(id),
              type: "listing",
              title: listing?.title || "Untitled Listing",
              description: listing?.description,
              address: listing?.address,
              image,
              price: firstBattery?.price || firstVehicle?.price || 0,
              spec: `${listing?.listingBatteries?.length || 0} batteries, ${listing?.listingVehicles?.length || 0} vehicles`,
              tag: listingType,
              relatedId: id,
              relatedKind: "listing",
              userName: listing?.user?.username || "Unknown User"
            });
          });
        }

        setItems(allItems);
        console.log("Total items loaded:", allItems.length);
        
      } catch (err) {
        console.error("Error loading data:", err);
        setError(err?.message || "Failed to load data");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => (mounted = false);
  }, []);

  const filtered = React.useMemo(() => {
    let out = items.slice();
    
    // Filter đơn giản
    if (tab === "Batteries") {
      out = out.filter(item => item.relatedKind === "battery");
    } else if (tab === "Vehicles") {
      out = out.filter(item => item.relatedKind === "vehicle");
    } else if (tab === "Listings") {
      out = out.filter(item => item.relatedKind === "listing");
    }
    // Tab "All" thì giữ nguyên tất cả
    
    // Search
    if (query) {
      const q = query.toLowerCase();
      out = out.filter(item => 
        item.title.toLowerCase().includes(q) ||
        (item.description || "").toLowerCase().includes(q) ||
        (item.spec || "").toLowerCase().includes(q)
      );
    }
    
    // Sort
    if (sort === "price_asc") out.sort((a, b) => a.price - b.price);
    else if (sort === "price_desc") out.sort((a, b) => b.price - a.price);
    
    return out;
  }, [items, tab, query, sort]);

  // Hàm render icon
  const renderIcon = (relatedKind) => {
    switch (relatedKind) {
      case "battery":
        return <BatteryCharging className="h-3.5 w-3.5" />;
      case "vehicle":
        return <Car className="h-3.5 w-3.5" />;
      case "listing":
        return <MapPin className="h-3.5 w-3.5" />;
      default:
        return <MapPin className="h-3.5 w-3.5" />;
    }
  };

  // Hàm render label
  const renderLabel = (relatedKind) => {
    switch (relatedKind) {
      case "battery":
        return "Battery";
      case "vehicle":
        return "Vehicle";
      case "listing":
        return "Listing";
      default:
        return "Item";
    }
  };

  return (
    <div className="container py-12">
      <div className="mb-6 grid gap-4 md:grid-cols-3 items-center">
        <div className="md:col-span-2">
          <h1 className="text-2xl font-bold">Search</h1>
          <p className="text-sm text-muted-foreground">Browse all batteries, vehicles and listings</p>
        </div>
        <div className="flex gap-2 justify-end">
          <Input 
            placeholder="Search..." 
            value={query} 
            onChange={(e) => setQuery(e.target.value)} 
          />
          <select 
            value={sort} 
            onChange={(e) => setSort(e.target.value)} 
            className="rounded border bg-card p-2 text-sm"
          >
            <option value="relevance">Relevance</option>
            <option value="price_asc">Price: Low → High</option>
            <option value="price_desc">Price: High → Low</option>
          </select>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-2">
        {/* THÊM TAB Vehicles */}
        {["All", "Batteries", "Vehicles", "Listings"].map((t) => (
          <button 
            key={t} 
            onClick={() => setTab(t)} 
            className={`px-3 py-1 rounded-full text-sm ${
              tab === t ? "bg-primary text-white" : "bg-muted/20 text-white/80"
            }`}
          >
            {t}
          </button>
        ))}
        <div className="ml-auto text-sm text-muted-foreground">
          {filtered.length} items
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="text-sm text-muted-foreground">Loading...</div>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <div className="text-sm text-red-400 mb-2">{error}</div>
          <Button onClick={() => window.location.reload()} variant="outline">
            Retry
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <Link key={item.id} to={`/product/${item.relatedId}`} className="no-underline">
              <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 h-full flex flex-col">
                <div className="relative aspect-[4/3] bg-muted/40">
                  <img 
                    src={item.image} 
                    alt={item.title} 
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.target.src = "/placeholder.svg";
                    }}
                  />
                  <div className="absolute left-3 top-3">
                    <Badge>
                      {item.tag}
                    </Badge>
                  </div>
                </div>
                
                <CardContent className="space-y-3 pt-4 flex-1 flex flex-col">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                      {renderIcon(item.relatedKind)}
                      {renderLabel(item.relatedKind)}
                    </div>
                    <h3 className="font-semibold text-lg line-clamp-1">{item.title}</h3>
                    
                    {item.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {item.description}
                      </p>
                    )}
                    
                    {item.spec && (
                      <p className="text-sm text-muted-foreground mt-1">{item.spec}</p>
                    )}
                    
                    {item.address && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <MapPin className="h-3 w-3" />
                        {item.address}
                      </div>
                    )}
                    
                    {item.userName && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                        <User className="h-3 w-3" />
                        {item.userName}
                      </div>
                    )}
                  </div>
                  
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">
                      {Number(item.price).toLocaleString("vi-VN", { 
                        style: "currency", 
                        currency: "VND" 
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
      
      {!loading && filtered.length === 0 && (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-4">
            No {tab.toLowerCase()} found
          </div>
          <Button 
            onClick={() => {
              setQuery("");
              setTab("All");
            }}
            variant="outline"
          >
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
}