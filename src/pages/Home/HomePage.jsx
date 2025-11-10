import * as React from "react";
import Reveal from "../../components/ui/Reveal";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "../../components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Link, useNavigate } from "react-router-dom";
import { BatteryCharging, Car, ChevronRight, Star, Zap } from "lucide-react";
import { getAllVehicles, getAllBatteries, setAuthToken } from "../../api/userApi";

// Use native selects for reliability

export default function HomePage() {
  const navigate = useNavigate();
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

  // AI price estimator demo (hard-coded UI)
  const [aiModel, setAiModel] = React.useState("");
  const [aiMileage, setAiMileage] = React.useState(0);
  const [aiCondition, setAiCondition] = React.useState("Good");
  const [aiEstimate, setAiEstimate] = React.useState(null);

  // Items from API (vehicles + batteries)
  const [items, setItems] = React.useState([]);
  const [loadingListings, setLoadingListings] = React.useState(true);
  const [listingsError, setListingsError] = React.useState(null);
  const [listingTab, setListingTab] = React.useState("All");

  function unwrapApiCollection(response) {
    if (!response) {
      return { items: [], error: "Không nhận được phản hồi từ máy chủ." };
    }

    if (response?.isSuccess === false) {
      const items = Array.isArray(response?.result) ? response.result : [];
      return {
        items,
        error: response?.errorMessage ?? "Không thể tải dữ liệu.",
      };
    }

    if (response?.isSuccess === true && Array.isArray(response?.result)) {
      return { items: response.result };
    }

    if (Array.isArray(response?.result)) {
      return { items: response.result };
    }

    if (Array.isArray(response?.data?.result)) {
      return { items: response.data.result };
    }

    if (Array.isArray(response?.data)) {
      return { items: response.data };
    }

    if (Array.isArray(response)) {
      return { items: response };
    }

    return {
      items: [],
      error: response?.errorMessage ?? response?.message ?? null,
    };
  }

  function normalizeVehicleForHome(vehicle, index) {
    const id = vehicle?.id ?? vehicle?.vehicleId ?? vehicle?.vehicleID ?? `vehicle-${index}`;
    const brand = vehicle?.brand ?? vehicle?.vehicleBrand ?? vehicle?.make ?? vehicle?.manufacturer ?? "Unknown";
    const model = vehicle?.model ?? vehicle?.vehicleModel ?? vehicle?.name ?? vehicle?.title ?? "";
    const name = [brand, model].filter(Boolean).join(" ") || `Vehicle ${index + 1}`;

    const startYear = vehicle?.startYear ?? vehicle?.yearStart ?? vehicle?.year ?? vehicle?.beginYear ?? null;
    const endYear = vehicle?.endYear ?? vehicle?.yearEnd ?? vehicle?.year ?? vehicle?.finishYear ?? null;
    let yearRange = "—";
    if (startYear && endYear) {
      yearRange = startYear === endYear ? `${startYear}` : `${startYear}–${endYear}`;
    } else if (startYear) {
      yearRange = `${startYear}`;
    } else if (endYear) {
      yearRange = `${endYear}`;
    }

    const range = vehicle?.range ?? vehicle?.estimatedRange ?? vehicle?.rangeMi ?? vehicle?.rangeKm ?? null;
    const drivetrain = vehicle?.drivetrain ?? vehicle?.drive ?? vehicle?.driveType ?? vehicle?.driveTrain ?? null;

    const image =
      vehicle?.imgs ??
      (Array.isArray(vehicle?.images) && vehicle.images[0]) ??
      vehicle?.imageUrl ??
      vehicle?.image ??
      "/placeholder.svg";

    const price = vehicle?.price ?? vehicle?.suggestedPrice ?? vehicle?.marketPrice ?? null;

    const specParts = [];
    if (yearRange !== "—") specParts.push(yearRange);
    if (range != null) specParts.push(`${range} mi`);
    if (drivetrain) specParts.push(drivetrain);
    const spec = specParts.filter(Boolean).join(" • ") || "";

    return {
      id: String(id),
      type: "car",
      title: name,
      price: price ?? 0,
      spec,
      rating: vehicle?.rating ?? 0,
      image,
      tag: vehicle?.isAproved ? "Approved" : vehicle?.status ?? "Pending",
      relatedId: id,
      relatedKind: "vehicle",
    };
  }

  function normalizeBatteryForHome(battery, index) {
    const id = battery?.id ?? battery?.batteryId ?? battery?.batteryID ?? `battery-${index}`;
    const brand = battery?.brand ?? battery?.manufacturer ?? battery?.maker ?? "Unknown";
    const model = battery?.model ?? battery?.batteryModel ?? battery?.name ?? "";
    const name = [brand, model].filter(Boolean).join(" ") || `Battery ${index + 1}`;

    const capacity = battery?.capacity ?? battery?.capacityKWh ?? battery?.capacityAh ?? null;
    const capacityUnit = battery?.capacityUnit ?? (battery?.capacityAh != null ? "Ah" : null) ?? (capacity != null ? "kWh" : null);
    const voltage = battery?.voltage ?? battery?.voltageV ?? battery?.nominalVoltage ?? battery?.voltageRating ?? null;
    const health = battery?.health ?? battery?.stateOfHealth ?? battery?.soh ?? battery?.healthPercent ?? null;

    const image =
      battery?.imgs ??
      (Array.isArray(battery?.images) && battery.images[0]) ??
      battery?.imageUrl ??
      battery?.image ??
      "/placeholder.svg";

    const price = battery?.price ?? battery?.suggestedPrice ?? battery?.marketPrice ?? null;

    const specParts = [];
    if (capacity != null) {
      const capacityStr = capacityUnit ? `${capacity} ${capacityUnit}` : String(capacity);
      specParts.push(capacityStr);
    }
    if (voltage != null) specParts.push(`${voltage}V`);
    if (health != null) specParts.push(`Health: ${health}%`);
    const spec = specParts.filter(Boolean).join(" • ") || "";

    return {
      id: String(id),
      type: "battery",
      title: name,
      price: price ?? 0,
      spec,
      rating: battery?.rating ?? 0,
      image,
      tag: battery?.isAproved ? "Approved" : battery?.status ?? "Pending",
      relatedId: id,
      relatedKind: "battery",
    };
  }

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoadingListings(true);
        setListingsError(null);
        // set Authorization header if token exists in storage
        const token =
          localStorage.getItem("authToken") ||
          localStorage.getItem("token") ||
          sessionStorage.getItem("authToken");
        if (token) setAuthToken(token);

        const [vehicleResponse, batteryResponse] = await Promise.all([
          getAllVehicles(),
          getAllBatteries(),
        ]);
        if (!mounted) return;

        const { items: vehicleItems, error: vehicleError } = unwrapApiCollection(vehicleResponse);
        const { items: batteryItems, error: batteryError } = unwrapApiCollection(batteryResponse);

        const normalizedVehicles = (Array.isArray(vehicleItems) ? vehicleItems : []).map((vehicle, index) =>
          normalizeVehicleForHome(vehicle, index),
        );
        const normalizedBatteries = (Array.isArray(batteryItems) ? batteryItems : []).map((battery, index) =>
          normalizeBatteryForHome(battery, index),
        );

        const allItems = [...normalizedVehicles, ...normalizedBatteries];

        setItems(allItems);

        const errorMessages = [vehicleError, batteryError].filter(Boolean);
        if (errorMessages.length > 0) {
          setListingsError(errorMessages.join(" | "));
        }
      } catch (err) {
        if (!mounted) return;
        const status = err?.response?.status;
        if (status === 401) {
          // unauthorized: show message and optionally redirect to login
          setListingsError("Unauthorized. Please log in.");
          navigate("/login");
        } else {
          setListingsError(err?.message || "Failed to load items");
        }
      } finally {
        if (mounted) setLoadingListings(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [navigate]);

  // Filtered items for current tab view
  const filteredItems = React.useMemo(() => {
    if (!Array.isArray(items)) return [];
    if (listingTab === "All") return items;
    if (listingTab === "EVs") return items.filter((it) => it.type === "car");
    if (listingTab === "Batteries") return items.filter((it) => it.type === "battery");
    return items;
  }, [items, listingTab]);

  return (
    <div className="obys-hero min-h-screen">
      {/* Hero */}
      <section className="container pb-10 pt-10 md:pb-16 md:pt-16 fade-in-slow">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs text-muted-foreground">
              <Zap className="h-3.5 w-3.5 text-primary" />
              Data‑driven pricing for EVs & batteries
            </div>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight md:text-5xl text-white">
              Buy, sell, and compare electric vehicles and batteries
            </h1>
            <p className="mt-4 text-white/80 md:text-lg">
              VoltMarket mang lại trải nghiệm marketplace hiện đại. Tìm
              EV/battery đúng giá theo dữ liệu realtime.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link to="/listings/new">
                <Button>Post a Listing</Button>
              </Link>
              <Link to="/ai-price">
                <Button variant="secondary">Get AI Price Suggestion</Button>
              </Link>
            </div>

            {/* Quick features */}
            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[

                { icon: Car, label: "Verified sellers" },
                { icon: BatteryCharging, label: "Battery health" },
                { icon: Star, label: "Ratings & reviews" },
                { icon: Zap, label: "Secure payments" },
              ].map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="rounded-lg border bg-card p-3 text-sm text-muted-foreground"
                >
                  <div className="flex items-center gap-2 text-foreground">
                    <Icon className="h-4 w-4 text-primary" /> {label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Search panel */}
          <Card className="obys-card text-white border-primary/20 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">Search Marketplace</CardTitle>
              <CardDescription>
                Find EVs and batteries with advanced filters
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="relative">
                  <SelectTrigger
                    placeholder="Cars"
                    value={type}
                    onToggle={() => setOpenType(!openType)}
                  />
                  <SelectContent
                    open={openType}
                    onClose={() => setOpenType(false)}
                  >
                    <SelectItem
                      onSelect={() => {
                        setType("Cars");
                        setOpenType(false);
                      }}
                    >
                      Cars
                    </SelectItem>
                    <SelectItem
                      onSelect={() => {
                        setType("Batteries");
                        setOpenType(false);
                      }}
                    >
                      Batteries
                    </SelectItem>
                  </SelectContent>
                </div>
                <div className="relative">
                  <SelectTrigger
                    placeholder="Brand / Manufacturer"
                    value={brand}
                    onToggle={() => setOpenBrand(!openBrand)}
                  />
                  <SelectContent
                    open={openBrand}
                    onClose={() => setOpenBrand(false)}
                  >
                    <SelectItem
                      onSelect={() => {
                        setBrand("Tesla");
                        setOpenBrand(false);
                      }}
                    >
                      Tesla
                    </SelectItem>
                    <SelectItem
                      onSelect={() => {
                        setBrand("Hyundai");
                        setOpenBrand(false);
                      }}
                    >
                      Hyundai
                    </SelectItem>
                    <SelectItem
                      onSelect={() => {
                        setBrand("LG Chem");
                        setOpenBrand(false);
                      }}
                    >
                      LG Chem
                    </SelectItem>
                    <SelectItem
                      onSelect={() => {
                        setBrand("CATL");
                        setOpenBrand(false);
                      }}
                    >
                      CATL
                    </SelectItem>
                  </SelectContent>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input placeholder="Model / Capacity" />
                <div className="relative">
                  <SelectTrigger
                    placeholder="Price range"
                    value={price}
                    onToggle={() => setOpenPrice(!openPrice)}
                  />
                  <SelectContent
                    open={openPrice}
                    onClose={() => setOpenPrice(false)}
                  >
                    <SelectItem
                      onSelect={() => {
                        setPrice("$0–10k");
                        setOpenPrice(false);
                      }}
                    >
                      $0–10k
                    </SelectItem>
                    <SelectItem
                      onSelect={() => {
                        setPrice("$10k–25k");
                        setOpenPrice(false);
                      }}
                    >
                      $10k–25k
                    </SelectItem>
                    <SelectItem
                      onSelect={() => {
                        setPrice("$25k–50k");
                        setOpenPrice(false);
                      }}
                    >
                      $25k–50k
                    </SelectItem>
                    <SelectItem
                      onSelect={() => {
                        setPrice("$50k+");
                        setOpenPrice(false);
                      }}
                    >
                      $50k+
                    </SelectItem>
                  </SelectContent>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="relative">
                  <SelectTrigger
                    placeholder="Range / kWh"
                    value={rangeVal}
                    onToggle={() => setOpenRange(!openRange)}
                  />
                  <SelectContent
                    open={openRange}
                    onClose={() => setOpenRange(false)}
                  >
                    <SelectItem
                      onSelect={() => {
                        setRangeVal("200+ mi / 50+ kWh");
                        setOpenRange(false);
                      }}
                    >
                      200+ mi / 50+ kWh
                    </SelectItem>
                    <SelectItem
                      onSelect={() => {
                        setRangeVal("300+ mi / 60+ kWh");
                        setOpenRange(false);
                      }}
                    >
                      300+ mi / 60+ kWh
                    </SelectItem>
                    <SelectItem
                      onSelect={() => {
                        setRangeVal("400+ mi / 70+ kWh");
                        setOpenRange(false);
                      }}
                    >
                      400+ mi / 70+ kWh
                    </SelectItem>
                  </SelectContent>
                </div>
                <div className="relative">
                  <SelectTrigger
                    placeholder="Condition"
                    value={condition}
                    onToggle={() => setOpenCondition(!openCondition)}
                  />
                  <SelectContent
                    open={openCondition}
                    onClose={() => setOpenCondition(false)}
                  >
                    <SelectItem
                      onSelect={() => {
                        setCondition("New");
                        setOpenCondition(false);
                      }}
                    >
                      New
                    </SelectItem>
                    <SelectItem
                      onSelect={() => {
                        setCondition("Used");
                        setOpenCondition(false);
                      }}
                    >
                      Used
                    </SelectItem>
                    <SelectItem
                      onSelect={() => {
                        setCondition("Refurbished");
                        setOpenCondition(false);
                      }}
                    >
                      Refurbished
                    </SelectItem>
                  </SelectContent>
                </div>
              </div>
              <div className="flex gap-3">
                <Link to="/search" className="flex-1">
                  <Button className="w-full">Search</Button>
                </Link>
                <Link to="/compare" className="flex-1">
                  <Button variant="secondary" className="w-full">
                    Compare
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Trending listings */}
      <Reveal>
        <section className="container py-12">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                Trending now
              </h2>
              <p className="text-sm text-muted-foreground">
                Popular EVs and battery packs priced by market data
              </p>
            </div>
            <Link
              to="/search"
              className="inline-flex items-center text-sm text-primary hover:underline"
            >
              View all <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </div>

          {/* replaced static grid with API-driven render */}
          {loadingListings ? (
            <div className="text-center text-sm text-muted-foreground">Loading items…</div>
          ) : listingsError ? (
            <div className="text-center text-sm text-red-400">{listingsError}</div>
          ) : (
            <>
              {/* Tabs: All / EVs / Batteries */}
              <div className="mb-4 flex flex-wrap items-center gap-2">
                {["All", "EVs", "Batteries"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setListingTab(tab)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors focus:outline-none ${
                      listingTab === tab
                        ? "bg-primary text-white"
                        : "bg-muted/20 text-white/80 hover:bg-muted/30"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
                <div className="ml-auto text-sm text-muted-foreground">Showing: {items.length} total</div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {filteredItems.map((item) => (
                  <Link
                    to={item.relatedKind === "vehicle" ? `/product/${item.relatedId}` : `/product/${item.relatedId}`}
                    key={item.id}
                    className="no-underline"
                  >
                    <Card className="group overflow-hidden transition-shadow hover:shadow-md">
                      <div className="relative aspect-[4/3] bg-muted/40">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute left-3 top-3">
                          <Badge className="shadow-sm">{item.tag}</Badge>
                        </div>
                      </div>
                      <CardContent className="space-y-2 pt-4">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              {item.type === "car" ? (
                                <Car className="h-3.5 w-3.5" />
                              ) : (
                                <BatteryCharging className="h-3.5 w-3.5" />
                              )}
                              {item.type === "car" ? "EV" : "Battery"}
                            </div>
                            <h3 className="line-clamp-2 font-semibold leading-tight">
                              {item.title}
                            </h3>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold">
                              {Number(item.price).toLocaleString("en-US", {
                                style: "currency",
                                currency: "USD",
                              })}
                            </div>
                            <div className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
                              <Star className="h-3 w-3 text-yellow-500" />{" "}
                              {item.rating}
                            </div>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">{item.spec}</p>
                        <div className="pt-1">
                          <span className="text-sm text-primary hover:underline">View details</span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </>
          )}
        </section>
      </Reveal>

      {/* Callout */}
      <Reveal>
        <section className="container pb-16">
          <Card className="obys-card border-primary/20 bg-gradient-to-br from-transparent to-transparent">
            <CardHeader>
              <CardTitle>Not sure how to price your EV or battery?</CardTitle>
              <CardDescription>
                Use our AI to estimate market value based on specs, condition,
                and live comparables.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/ai-price">
                <Button>Get AI Price Suggestion</Button>
              </Link>
            </CardContent>
          </Card>
        </section>
      </Reveal>

      {/* AI Price Estimator (demo UI, client-side mock) */}
      <Reveal>
        <section className="container pb-16">
          <div className="grid md:grid-cols-2 gap-6 items-start">
            <div className="obys-card p-6">
              <h3 className="text-lg font-semibold text-white mb-2">
                AI Price Estimator (Demo)
              </h3>
              <p className="text-white/80 text-sm mb-4">
                Enter basic specs and get a quick estimated market price (mock)
              </p>
              <div className="space-y-3">
                <Input
                  placeholder="Model (e.g. Tesla Model 3)"
                  value={aiModel}
                  onChange={(e) => setAiModel(e.target.value)}
                />
                <Input
                  placeholder="Mileage (miles)"
                  type="number"
                  value={aiMileage}
                  onChange={(e) => setAiMileage(Number(e.target.value))}
                />
                <div>
                  <label className="block text-sm text-white/80">
                    Condition
                  </label>
                  <select
                    className="w-full border p-2 rounded mt-1 bg-transparent text-white/90"
                    value={aiCondition}
                    onChange={(e) => setAiCondition(e.target.value)}
                  >
                    <option>Excellent</option>
                    <option>Good</option>
                    <option>Fair</option>
                    <option>Poor</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      // Mock estimate: base price + adjustments
                      const base = aiModel.toLowerCase().includes("tesla")
                        ? 40000
                        : aiModel
                          ? 25000
                          : 20000;
                      const mileageAdj = Math.max(0, 1 - aiMileage / 200000);
                      const condMult =
                        aiCondition === "Excellent"
                          ? 1.08
                          : aiCondition === "Good"
                            ? 1.0
                            : aiCondition === "Fair"
                              ? 0.86
                              : 0.7;
                      const est =
                        Math.round((base * mileageAdj * condMult) / 100) * 100;
                      setAiEstimate(est);
                    }}
                  >
                    Get estimate
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setAiModel("");
                      setAiMileage(0);
                      setAiCondition("Good");
                      setAiEstimate(null);
                    }}
                  >
                    Reset
                  </Button>
                </div>
              </div>
            </div>

            <div className="obys-card p-6">
              <h3 className="text-lg font-semibold text-white mb-2">
                Estimate result
              </h3>
              {aiEstimate == null ? (
                <div className="text-white/80">
                  No estimate yet. Enter model and mileage, then click{" "}
                  <strong>Get estimate</strong>.
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-3xl font-bold text-white">
                    {aiEstimate.toLocaleString("en-US", {
                      style: "currency",
                      currency: "USD",
                    })}
                  </div>
                  <div className="text-sm text-white/80">
                    Model: {aiModel || "—"}
                  </div>
                  <div className="text-sm text-white/80">
                    Mileage: {aiMileage} mi
                  </div>
                  <div className="text-sm text-white/80">
                    Condition: {aiCondition}
                  </div>
                  <div className="pt-2">
                    <Button>Post a listing like this</Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </Reveal>
    </div>
  );
}
