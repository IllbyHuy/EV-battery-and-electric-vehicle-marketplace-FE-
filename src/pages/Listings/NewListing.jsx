import React, { useState, useEffect } from "react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { createListing, api, setAuthToken } from "../../api/ListingApi";
import { useNavigate } from "react-router-dom";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../../config/firebase-config";

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
  const [batteryImgs, setBatteryImgs] = useState([]); // changed: array of urls

  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [vehicleOdometer, setVehicleOdometer] = useState(0);
  const [vehicleBatteryHealth, setVehicleBatteryHealth] = useState(0);
  const [vehicleColor, setVehicleColor] = useState("");
  const [vehicleVin, setVehicleVin] = useState("");
  const [vehicleLicensePlate, setVehicleLicensePlate] = useState("");
  const [vehiclePriceLocal, setVehiclePriceLocal] = useState(0);
  const [vehicleSuggestedPrice, setVehicleSuggestedPrice] = useState(0);
  const [vehicleImgs, setVehicleImgs] = useState([]); // changed: array of urls

  // arrays to send to API
  const [listingBatteries, setListingBatteries] = useState([]);
  const [listingVehicles, setListingVehicles] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showImagePanel, setShowImagePanel] = useState(true);
  const [uploadingBattery, setUploadingBattery] = useState(false);
  const [uploadingVehicle, setUploadingVehicle] = useState(false);
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
      imgs: batteryImgs.slice(), // attach current battery images (array)
    };
    setListingBatteries((s) => [...s, item]);
    // reset battery inputs + clear attached images
    setBatteryHealth(0);
    setBatteryPrice(0);
    setBatterySuggestedPrice(0);
    setBatteryImgs([]);
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
      imgs: vehicleImgs.slice(), // attach current vehicle images (array)
    };
    setListingVehicles((s) => [...s, item]);
    // reset vehicle inputs + clear attached images
    setVehicleOdometer(0);
    setVehicleBatteryHealth(0);
    setVehicleColor("");
    setVehicleVin("");
    setVehicleLicensePlate("");
    setVehiclePriceLocal(0);
    setVehicleSuggestedPrice(0);
    setVehicleImgs([]);
  };

  const removeBattery = (index) => {
    setListingBatteries((s) => s.filter((_, i) => i !== index));
  };
  const removeVehicle = (index) => {
    setListingVehicles((s) => s.filter((_, i) => i !== index));
  };
  const removeBatteryImg = (index) => {
    setBatteryImgs((s) => s.filter((_, i) => i !== index));
  };
  const removeVehicleImg = (index) => {
    setVehicleImgs((s) => s.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // build payload matching server sample (arrays for listingBatteries/vehicles)
    const payload = {
      title,
      description,
      address,
      itemType,
      listingBatteries,
      listingVehicles,
    };

    try {
      const res = await createListing([payload]);
      // try to extract created listing id from common shapes
      const created =
        Array.isArray(res) && res.length
          ? res[0]
          : res?.result?.[0] ?? res?.data ?? res;
      const id =
        created?.id ?? created?.listingId ?? created?._id ?? created?.result?.[0]?.id;
      if (id) {
        // navigate to detail of created listing
        navigate(`/product/${id}`);
      } else {
        navigate("/listings");
      }
    } catch (err) {
      setError(err?.response?.data?.errorMessage || err.message || "Failed to create listing");
    } finally {
      setLoading(false);
    }
  };

  // Function upload ảnh
  const uploadImage = async (file, path) => {
    const storageRef = ref(storage, `${path}/${file.name}-${Date.now()}`);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    return url;
  };

  // Handler cho battery image upload
  const handleBatteryImageUpload = async (e) => {
    try {
      setUploadingBattery(true);
      const file = e.target.files[0];
      if (!file) return;
      const url = await uploadImage(file, "battery-images");
      setBatteryImgs((s) => [...s, url]);
    } catch (error) {
      console.error("Error uploading battery image:", error);
    } finally {
      setUploadingBattery(false);
    }
  };

  // Handler cho vehicle image upload
  const handleVehicleImageUpload = async (e) => {
    try {
      setUploadingVehicle(true);
      const file = e.target.files[0];
      if (!file) return;
      const url = await uploadImage(file, "vehicle-images");
      setVehicleImgs((s) => [...s, url]);
    } catch (error) {
      console.error("Error uploading vehicle image:", error);
    } finally {
      setUploadingVehicle(false);
    }
  };

  // helper: parse imgs (kept for compatibility but now state is arrays)
  const parseImgs = (imgs) => {
    if (!imgs) return [];
    if (Array.isArray(imgs)) return imgs;
    return String(imgs).split(",").map((s) => s.trim()).filter(Boolean);
  };

  return (
    <div className="container py-10">
      <h1 className="text-2xl font-bold mb-6">Create New Listing</h1>
      {error && <p className="text-red-500">{error}</p>}

      <div className="flex gap-6">
        <form onSubmit={handleSubmit} className="space-y-4 max-w-3xl flex-1">
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

          {/* Battery section */}
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

                {/* Upload button (no free-form URL input) */}
                <div className="flex items-center gap-2">
                  <label className="w-12 h-12 flex items-center justify-center border-2 border-dashed rounded cursor-pointer hover:bg-gray-50">
                    <input type="file" accept="image/*" className="hidden" onChange={handleBatteryImageUpload} disabled={uploadingBattery} />
                    {uploadingBattery ? <div className="loading-spinner" /> : <span className="text-2xl">+</span>}
                  </label>
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

          {/* Vehicle section */}
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

                <div className="flex items-center gap-2">
                  <label className="w-12 h-12 flex items-center justify-center border-2 border-dashed rounded cursor-pointer hover:bg-gray-50">
                    <input type="file" accept="image/*" className="hidden" onChange={handleVehicleImageUpload} disabled={uploadingVehicle} />
                    {uploadingVehicle ? <div className="loading-spinner" /> : <span className="text-2xl">+</span>}
                  </label>
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
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Listing"}
            </Button>
          </div>
        </form>

        {/* Right side: small thumbnail preview for uploaded images */}
        <aside className="w-72">
          <div className="border rounded p-3 mb-4">
            <h4 className="font-medium text-sm mb-2">Battery images</h4>
            <div className="grid grid-cols-3 gap-2">
              {batteryImgs.map((url, i) => (
                <div key={i} className="relative w-20 h-20 rounded overflow-hidden">
                  <img src={url} alt={`bat-${i}`} className="w-full h-full object-cover" />
                  <button onClick={() => removeBatteryImg(i)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs">×</button>
                </div>
              ))}
              {batteryImgs.length === 0 && <div className="text-xs text-muted-foreground col-span-3">No battery images</div>}
            </div>
          </div>

          <div className="border rounded p-3">
            <h4 className="font-medium text-sm mb-2">Vehicle images</h4>
            <div className="grid grid-cols-3 gap-2">
              {vehicleImgs.map((url, i) => (
                <div key={i} className="relative w-20 h-20 rounded overflow-hidden">
                  <img src={url} alt={`veh-${i}`} className="w-full h-full object-cover" />
                  <button onClick={() => removeVehicleImg(i)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs">×</button>
                </div>
              ))}
              {vehicleImgs.length === 0 && <div className="text-xs text-muted-foreground col-span-3">No vehicle images</div>}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}