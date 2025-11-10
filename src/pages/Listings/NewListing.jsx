import React, { useState, useEffect } from "react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { createListing, api, setAuthToken } from "../../api/ListingApi"; // use api directly to fetch batteries/vehicles
import { useNavigate } from "react-router-dom";

export default function NewListing() {
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [itemType, setItemType] = useState("Battery"); // "Battery" or "Vehicle"

  const [availableBatteries, setAvailableBatteries] = useState([]);
  const [availableVehicles, setAvailableVehicles] = useState([]);

  // fields for adding a battery/vehicle to the listing
  const [selectedBatteryId, setSelectedBatteryId] = useState("");
  const [batteryHealth, setBatteryHealth] = useState(0);
  const [batteryPrice, setBatteryPrice] = useState(0);
  const [batterySuggestedPrice, setBatterySuggestedPrice] = useState(0);
  const [batteryImgs, setBatteryImgs] = useState("");

  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [vehicleOdometer, setVehicleOdometer] = useState(0);
  const [vehicleBatteryHealth, setVehicleBatteryHealth] = useState(0);
  const [vehicleColor, setVehicleColor] = useState("");
  const [vehicleVin, setVehicleVin] = useState("");
  const [vehicleLicensePlate, setVehicleLicensePlate] = useState("");
  const [vehiclePriceLocal, setVehiclePriceLocal] = useState(0);
  const [vehicleSuggestedPrice, setVehicleSuggestedPrice] = useState(0);
  const [vehicleImgs, setVehicleImgs] = useState("");

  // arrays to send to API
  const [listingBatteries, setListingBatteries] = useState([]);
  const [listingVehicles, setListingVehicles] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showImagePanel, setShowImagePanel] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // set auth header if token present
    const token = localStorage.getItem("authToken") || localStorage.getItem("token") || sessionStorage.getItem("authToken");
    if (token) setAuthToken(token);

    let mounted = true;
    (async () => {
      try {
        // Try common "all" endpoints; backend naming may vary — fail quietly.
        const [bRes, vRes] = await Promise.allSettled([
          api.get("/api/Battery/all"),
          api.get("/api/Vehicle/Getall"),
        ]);

        if (!mounted) return;

        if (bRes.status === "fulfilled") {
          setAvailableBatteries(Array.isArray(bRes.value.data) ? bRes.value.data : bRes.value.data?.result ?? []);
          if ((Array.isArray(bRes.value.data) ? bRes.value.data : bRes.value.data?.result ?? []).length) {
            setSelectedBatteryId(((Array.isArray(bRes.value.data) ? bRes.value.data : bRes.value.data?.result ?? [])[0]?.id) || "");
          }
        }

        if (vRes.status === "fulfilled") {
          setAvailableVehicles(Array.isArray(vRes.value.data) ? vRes.value.data : vRes.value.data?.result ?? []);
          if ((Array.isArray(vRes.value.data) ? vRes.value.data : vRes.value.data?.result ?? []).length) {
            setSelectedVehicleId(((Array.isArray(vRes.value.data) ? vRes.value.data : vRes.value.data?.result ?? [])[0]?.id) || "");
          }
        }
      } catch (err) {
        // ignore — we'll show when submitting
        console.error("Failed to load batteries/vehicles", err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const addBatteryToListing = () => {
    if (!selectedBatteryId) return;
    const item = {
      batteryId: selectedBatteryId,
      health: Number(batteryHealth),
      price: Number(batteryPrice),
      suggestedPrice: Number(batterySuggestedPrice),
      imgs: batteryImgs || "",
    };
    setListingBatteries((s) => [...s, item]);
    // reset battery inputs
    setBatteryHealth(0);
    setBatteryPrice(0);
    setBatterySuggestedPrice(0);
    setBatteryImgs("");
  };

  const addVehicleToListing = () => {
    if (!selectedVehicleId) return;
    const item = {
      vehicleId: selectedVehicleId,
      odometer: Number(vehicleOdometer),
      batteryHealth: Number(vehicleBatteryHealth),
      color: vehicleColor || "",
      vin: vehicleVin || "",
      licensePlate: vehicleLicensePlate || "",
      price: Number(vehiclePriceLocal),
      suggestedPrice: Number(vehicleSuggestedPrice),
      imgs: vehicleImgs || "",
    };
    setListingVehicles((s) => [...s, item]);
    // reset vehicle inputs
    setVehicleOdometer(0);
    setVehicleBatteryHealth(0);
    setVehicleColor("");
    setVehicleVin("");
    setVehicleLicensePlate("");
    setVehiclePriceLocal(0);
    setVehicleSuggestedPrice(0);
    setVehicleImgs("");
  };

  const removeBattery = (index) => {
    setListingBatteries((s) => s.filter((_, i) => i !== index));
  };
  const removeVehicle = (index) => {
    setListingVehicles((s) => s.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload = {
      title,
      description,
      address,
      itemType,
      listingBatteries,
      listingVehicles,
    };

    try {
      // API expects an array body in some deployments — wrap payload in array
      await createListing([payload]);
      navigate("/listings");
    } catch (err) {
      setError(err?.response?.data?.errorMessage || err.message || "Failed to create listing");
    } finally {
      setLoading(false);
    }
  };

  // helper: lấy mảng url từ field imgs (có thể là csv hoặc array)
  const parseImgs = (imgs) => {
    if (!imgs) return [];
    if (Array.isArray(imgs)) return imgs;
    return String(imgs).split(",").map(s => s.trim()).filter(Boolean);
  };

  return (
    <div className="container py-10">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Create New Listing</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 text-sm"
            onClick={() => setShowImagePanel(v => !v)}
          >
            {showImagePanel ? "Collapse" : "Expand"}
          </button>
        </div>
      </div>

      {error && <p className="text-red-500">{error}</p>}

      <div className="flex gap-6">
        {/* Left: form - sẽ co/giãn tùy showImagePanel */}
        <div className={`${showImagePanel ? "w-1/2" : "w-full"} transition-all`}>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>

            <div>
              <Input placeholder="Address" value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Item type</label>
              <select
                className="border rounded p-2 w-full bg-black text-white"
                value={itemType}
                onChange={(e) => setItemType(e.target.value)}
              >
                <option value="Battery">Battery</option>
                <option value="Vehicle">Vehicle</option>
                <option value="Fullset">Fullset</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Price (optional)</label>
              <Input type="number" placeholder="Price" value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <Input placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>

            {(itemType === "Battery" || itemType === "Fullset") && (
              <div className="border rounded p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">Listing Batteries</h3>
                  <div className="text-xs text-muted-foreground">{listingBatteries.length} added</div>
                </div>

                <div className="grid gap-2">
                  <label className="text-sm">Choose existing battery</label>
                  <select
                    className="border rounded p-2 bg-black text-white"
                    value={selectedBatteryId}
                    onChange={(e) => setSelectedBatteryId(e.target.value)}
                  >
                    <option value="">-- select battery --</option>
                    {availableBatteries.map((b) => (
                      <option key={b.id ?? b.batteryId ?? b._id} value={b.id ?? b.batteryId ?? b._id}>
                        {b.title ?? b.name ?? b.model ?? (b.batteryId ?? b.id)}
                      </option>
                    ))}
                  </select>

                  <div className="grid sm:grid-cols-3 gap-2">
                    <Input placeholder="Health (%)" type="number" value={batteryHealth} onChange={(e) => setBatteryHealth(e.target.value)} />
                    <Input placeholder="Price" type="number" value={batteryPrice} onChange={(e) => setBatteryPrice(e.target.value)} />
                    <Input placeholder="Suggested price" type="number" value={batterySuggestedPrice} onChange={(e) => setBatterySuggestedPrice(e.target.value)} />
                  </div>

                  <Input placeholder="Images (comma separated urls)" value={batteryImgs} onChange={(e) => setBatteryImgs(e.target.value)} />

                  <div className="flex gap-2">
                    <Button type="button" onClick={addBatteryToListing}>Add battery</Button>
                  </div>

                  {listingBatteries.length > 0 && (
                    <div className="mt-2">
                      {listingBatteries.map((b, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-muted/10 p-2 rounded mb-1">
                          <div className="text-sm">
                            <div>{b.batteryId}</div>
                            <div className="text-xs text-muted-foreground">Health: {b.health} • Price: {b.price}</div>
                          </div>
                          <Button type="button" onClick={() => removeBattery(idx)}>Remove</Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {(itemType === "Vehicle" || itemType === "Fullset") && (
              <div className="border rounded p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">Listing Vehicles</h3>
                  <div className="text-xs text-muted-foreground">{listingVehicles.length} added</div>
                </div>

                <div className="grid gap-2">
                  <label className="text-sm">Choose existing vehicle</label>
                  <select
                    className="border rounded p-2 bg-black text-white"
                    value={selectedVehicleId}
                    onChange={(e) => setSelectedVehicleId(e.target.value)}
                  >
                    <option value="">-- select vehicle --</option>
                    {availableVehicles.map((v) => (
                      <option key={v.id ?? v.vehicleId ?? v._id} value={v.id ?? v.vehicleId ?? v._id}>
                        {v.title ?? v.name ?? v.model ?? (v.vehicleId ?? v.id)}
                      </option>
                    ))}
                  </select>

                  <div className="grid sm:grid-cols-3 gap-2">
                    <Input placeholder="Odometer" type="number" value={vehicleOdometer} onChange={(e) => setVehicleOdometer(e.target.value)} />
                    <Input placeholder="Battery health (%)" type="number" value={vehicleBatteryHealth} onChange={(e) => setVehicleBatteryHealth(e.target.value)} />
                    <Input placeholder="Color" value={vehicleColor} onChange={(e) => setVehicleColor(e.target.value)} />
                  </div>

                  <div className="grid sm:grid-cols-3 gap-2">
                    <Input placeholder="VIN" value={vehicleVin} onChange={(e) => setVehicleVin(e.target.value)} />
                    <Input placeholder="License plate" value={vehicleLicensePlate} onChange={(e) => setVehicleLicensePlate(e.target.value)} />
                    <Input placeholder="Price" type="number" value={vehiclePriceLocal} onChange={(e) => setVehiclePriceLocal(e.target.value)} />
                  </div>

                  <Input placeholder="Suggested price" type="number" value={vehicleSuggestedPrice} onChange={(e) => setVehicleSuggestedPrice(e.target.value)} />
                  <Input placeholder="Images (comma separated urls)" value={vehicleImgs} onChange={(e) => setVehicleImgs(e.target.value)} />

                  <div className="flex gap-2">
                    <Button type="button" onClick={addVehicleToListing}>Add vehicle</Button>
                  </div>

                  {listingVehicles.length > 0 && (
                    <div className="mt-2">
                      {listingVehicles.map((v, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-muted/10 p-2 rounded mb-1">
                          <div className="text-sm">
                            <div>{v.vehicleId}</div>
                            <div className="text-xs text-muted-foreground">Odo: {v.odometer} • Battery: {v.batteryHealth}</div>
                          </div>
                          <Button type="button" onClick={() => removeVehicle(idx)}>Remove</Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="pt-4">
              <Button type="submit" disabled={loading}>{loading ? "Creating..." : "Create Listing"}</Button>
            </div>
          </form>
        </div>

        {/* Right: image selector / preview panel (Firebase-like) */}
        {showImagePanel && (
          <div className="w-1/2 border rounded p-4 bg-white/60">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Image selector (Firebase)</h3>
              <p className="text-xs text-muted-foreground">Click an image to paste into the input</p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Battery images from available batteries</label>
              <div className="grid grid-cols-3 gap-2">
                {availableBatteries.flatMap(b => parseImgs(b.imgs || b.images || []).map((url, i) => ({ url, key: `${b.id ?? b.batteryId}-${i}` }))).map(img => (
                  <button
                    key={img.key}
                    type="button"
                    onClick={() => setBatteryImgs(img.url)}
                    className="h-24 w-full overflow-hidden rounded bg-gray-100"
                  >
                    <img src={img.url} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Vehicle images from available vehicles</label>
              <div className="grid grid-cols-3 gap-2">
                {availableVehicles.flatMap(v => parseImgs(v.imgs || v.images || []).map((url, i) => ({ url, key: `${v.id ?? v.vehicleId}-${i}` }))).map(img => (
                  <button
                    key={img.key}
                    type="button"
                    onClick={() => setVehicleImgs(img.url)}
                    className="h-24 w-full overflow-hidden rounded bg-gray-100"
                  >
                    <img src={img.url} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium mb-1">Selected battery image</label>
              <div className="h-32 w-full rounded bg-gray-50 overflow-hidden flex items-center justify-center">
                {batteryImgs ? <img src={parseImgs(batteryImgs)[0]} className="h-full w-full object-contain" alt="" /> : <span className="text-sm text-muted-foreground">No battery image selected</span>}
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium mb-1">Selected vehicle image</label>
              <div className="h-32 w-full rounded bg-gray-50 overflow-hidden flex items-center justify-center">
                {vehicleImgs ? <img src={parseImgs(vehicleImgs)[0]} className="h-full w-full object-contain" alt="" /> : <span className="text-sm text-muted-foreground">No vehicle image selected</span>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}