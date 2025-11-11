import React, { useState, useEffect } from "react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { createListing, api, setAuthToken } from "../../api/ListingApi";
import { useNavigate } from "react-router-dom";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../../config/firebase-config";

// Hàm upload nhiều ảnh và trả về URLs
const uploadImagesAndGetUrls = async (files, folder = "battery-images") => {
  if (!files || files.length === 0) return [];
  const tasks = files.map(async (file) => {
    const fileRef = ref(storage, `${folder}/${Date.now()}_${file.name}`);
    await uploadBytes(fileRef, file);
    return await getDownloadURL(fileRef);
  });
  return Promise.all(tasks);
};

export default function NewListing() {
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [itemType, setItemType] = useState("Battery");

  const [availableBatteries, setAvailableBatteries] = useState([]);
  const [availableVehicles, setAvailableVehicles] = useState([]);

  // fields for adding a battery/vehicle to the listing
  const [selectedBatteryId, setSelectedBatteryId] = useState("");
  const [batteryHealth, setBatteryHealth] = useState("");
  const [batteryPrice, setBatteryPrice] = useState("");
  const [batterySuggestedPrice, setBatterySuggestedPrice] = useState("");
  const [batteryImgs, setBatteryImgs] = useState([]);
  const [loadingBatterySuggestion, setLoadingBatterySuggestion] = useState(false);

  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [vehicleOdometer, setVehicleOdometer] = useState("");
  const [vehicleBatteryHealth, setVehicleBatteryHealth] = useState("");
  const [vehicleColor, setVehicleColor] = useState("");
  const [vehicleVin, setVehicleVin] = useState("");
  const [vehicleLicensePlate, setVehicleLicensePlate] = useState("");
  const [vehiclePriceLocal, setVehiclePriceLocal] = useState("");
  const [vehicleSuggestedPrice, setVehicleSuggestedPrice] = useState("");
  const [vehicleImgs, setVehicleImgs] = useState([]);
  const [loadingVehicleSuggestion, setLoadingVehicleSuggestion] = useState(false);

  // arrays to send to API
  const [listingBatteries, setListingBatteries] = useState([]);
  const [listingVehicles, setListingVehicles] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadingBattery, setUploadingBattery] = useState(false);
  const [uploadingVehicle, setUploadingVehicle] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("authToken") || localStorage.getItem("token") || sessionStorage.getItem("authToken");
    if (token) setAuthToken(token);

    let mounted = true;
    (async () => {
      try {
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
        console.error("Failed to load batteries/vehicles", err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Clear data khi itemType thay đổi
  useEffect(() => {
    // Clear batteries khi itemType không phải Battery hoặc Fullset
    if (itemType !== "Battery" && itemType !== "Fullset") {
      setListingBatteries([]);
    }
    
    // Clear vehicles khi itemType không phải Vehicle hoặc Fullset
    if (itemType !== "Vehicle" && itemType !== "Fullset") {
      setListingVehicles([]);
    }
  }, [itemType]);

  // AI Price Suggestion for Battery
  const getBatterySuggestion = async () => {
    if (!selectedBatteryId) {
      alert("Please select a battery first");
      return;
    }

    setLoadingBatterySuggestion(true);
    try {
      const selectedBattery = availableBatteries.find(
        b => (b.id ?? b.batteryId ?? b._id) === selectedBatteryId
      );

      if (!selectedBattery) {
        alert("Battery not found");
        return;
      }

      const payload = {
        brand: selectedBattery.brand ?? selectedBattery.manufacturer ?? "Unknown",
        model: selectedBattery.model ?? selectedBattery.title ?? selectedBattery.name ?? "",
        capacity: selectedBattery.capacity ?? 0,
        voltage: selectedBattery.voltage ?? selectedBattery.nominalVoltage ?? "",
        imgs: batteryImgs.join(",") || ""
      };
      console.log("AI Payload:", payload);
      const response = await api.post("/Battery_Price_Suggestion", payload);
      
      let suggestedPrice = response.data?.choices?.[0]?.message?.content;
      
      if (!suggestedPrice) {
        suggestedPrice = response.data?.content || 
                        response.data?.suggestedPrice || 
                        response.data?.price || 
                        response.data;
      }

      console.log("Raw AI suggestion:", suggestedPrice);

      if (suggestedPrice) {
        if (typeof suggestedPrice === 'object') {
          suggestedPrice = JSON.stringify(suggestedPrice);
        }
        
        if (typeof suggestedPrice === 'string') {
          // Remove "VND" and any non-digit characters except numbers
          suggestedPrice = suggestedPrice.replace(/VND/gi, '')
                                       .replace(/[^\d]/g, '')
                                       .trim();
        }
        
        const priceNumber = parseInt(suggestedPrice);
        if (!isNaN(priceNumber)) {
          setBatterySuggestedPrice(priceNumber.toString());
          // Cập nhật luôn cả batteryPrice nếu chưa có giá
          if (!batteryPrice) {
            setBatteryPrice(priceNumber.toString());
          }
          alert(`AI Suggested Price: ${priceNumber.toLocaleString('vi-VN')} VND`);
        } else {
          console.error("Parsed NaN from:", suggestedPrice);
          alert("Could not parse price suggestion - invalid number format");
        }
      } else {
        alert("Could not get price suggestion - no price data found in response");
      }
    } catch (error) {
      console.error("Error getting battery price suggestion:", error);
      alert(error?.response?.data?.message || "Failed to get price suggestion");
    } finally {
      setLoadingBatterySuggestion(false);
    }
  };

  // AI Price Suggestion for Vehicle
  const getVehicleSuggestion = async () => {
    if (!selectedVehicleId) {
      alert("Please select a vehicle first");
      return;
    }

    if (!vehicleOdometer || !vehicleBatteryHealth) {
      alert("Please enter odometer and battery health");
      return;
    }

    setLoadingVehicleSuggestion(true);
    try {
      const selectedVehicle = availableVehicles.find(
        v => (v.id ?? v.vehicleId ?? v._id) === selectedVehicleId
      );

      if (!selectedVehicle) {
        alert("Vehicle not found");
        return;
      }

      const payload = {
        brand: selectedVehicle.brand ?? selectedVehicle.manufacturer ?? "Unknown",
        model: selectedVehicle.model ?? selectedVehicle.title ?? selectedVehicle.name ?? "",
        startYear: selectedVehicle.year ?? selectedVehicle.startYear ?? 2020,
        endYear: selectedVehicle.year ?? selectedVehicle.endYear ?? 2023,
        odometer: Number(vehicleOdometer),
        batteryHealth: Number(vehicleBatteryHealth),
        color: vehicleColor || "Unknown"
      };

      const response = await api.post("/Vehicle_Price_Suggestion", payload);
      
      let suggestedPrice = response.data?.choices?.[0]?.message?.content;
      
      if (!suggestedPrice) {
        suggestedPrice = response.data?.content || 
                        response.data?.suggestedPrice || 
                        response.data?.price || 
                        response.data;
      }

      console.log("Raw AI suggestion:", suggestedPrice);

      if (suggestedPrice) {
        if (typeof suggestedPrice === 'object') {
          suggestedPrice = JSON.stringify(suggestedPrice);
        }
        
        if (typeof suggestedPrice === 'string') {
          // Remove "VND" and any non-digit characters except numbers
          suggestedPrice = suggestedPrice.replace(/VND/gi, '')
                                       .replace(/[^\d]/g, '')
                                       .trim();
        }
        
        const priceNumber = parseInt(suggestedPrice);
        if (!isNaN(priceNumber)) {
          setVehicleSuggestedPrice(priceNumber.toString());
          // Cập nhật luôn cả vehiclePriceLocal nếu chưa có giá
          if (!vehiclePriceLocal) {
            setVehiclePriceLocal(priceNumber.toString());
          }
          alert(`AI Suggested Price: ${priceNumber.toLocaleString('vi-VN')} VND`);
        } else {
          console.error("Parsed NaN from:", suggestedPrice);
          alert("Could not parse price suggestion - invalid number format");
        }
      } else {
        alert("Could not get price suggestion - no price data found in response");
      }
    } catch (error) {
      console.error("Error getting vehicle price suggestion:", error);
      alert(error?.response?.data?.message || "Failed to get price suggestion");
    } finally {
      setLoadingVehicleSuggestion(false);
    }
  };

  const addBatteryToListing = () => {
    if (!selectedBatteryId) {
      alert("Please select a battery");
      return;
    }

    if (!batteryHealth) {
      alert("Please enter battery health");
      return;
    }

    // Kiểm tra itemType
    if (itemType !== "Battery" && itemType !== "Fullset") {
      alert("Cannot add battery when item type is not Battery or Fullset");
      return;
    }

    const item = {
      batteryId: selectedBatteryId,
      health: Number(batteryHealth) || 0,
      price: Number(batteryPrice) || 0,
      suggestedPrice: Number(batterySuggestedPrice) || 0,
      imgs: Array.isArray(batteryImgs) ? batteryImgs : [],
    };
    
    setListingBatteries((s) => [...s, item]);
    setBatteryHealth("");
    setBatteryPrice("");
    setBatterySuggestedPrice("");
    setBatteryImgs([]);
  };

  const addVehicleToListing = () => {
    if (!selectedVehicleId) {
      alert("Please select a vehicle");
      return;
    }

    if (!vehicleOdometer || !vehicleBatteryHealth) {
      alert("Please enter odometer and battery health");
      return;
    }

    // Kiểm tra itemType
    if (itemType !== "Vehicle" && itemType !== "Fullset") {
      alert("Cannot add vehicle when item type is not Vehicle or Fullset");
      return;
    }

    const item = {
      vehicleId: selectedVehicleId,
      odometer: Number(vehicleOdometer) || 0,
      batteryHealth: Number(vehicleBatteryHealth) || 0,
      color: vehicleColor || "",
      vin: vehicleVin || "",
      licensePlate: vehicleLicensePlate || "",
      price: Number(vehiclePriceLocal) || 0,
      suggestedPrice: Number(vehicleSuggestedPrice) || 0,
      imgs: Array.isArray(vehicleImgs) ? vehicleImgs : [],
    };
    
    setListingVehicles((s) => [...s, item]);
    setVehicleOdometer("");
    setVehicleBatteryHealth("");
    setVehicleColor("");
    setVehicleVin("");
    setVehicleLicensePlate("");
    setVehiclePriceLocal("");
    setVehicleSuggestedPrice("");
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

  // Hàm upload nhiều ảnh cho battery
  const handleBatteryImageUpload = async (e) => {
    try {
      setUploadingBattery(true);
      const files = Array.from(e.target.files);
      if (files.length === 0) return;
      
      const imageUrls = await uploadImagesAndGetUrls(files, "battery-images");
      setBatteryImgs((s) => [...s, ...imageUrls]);
    } catch (error) {
      console.error("Error uploading battery images:", error);
      alert("Failed to upload battery images");
    } finally {
      setUploadingBattery(false);
    }
  };

  // Hàm upload nhiều ảnh cho vehicle
  const handleVehicleImageUpload = async (e) => {
    try {
      setUploadingVehicle(true);
      const files = Array.from(e.target.files);
      if (files.length === 0) return;
      
      const imageUrls = await uploadImagesAndGetUrls(files, "vehicle-images");
      setVehicleImgs((s) => [...s, ...imageUrls]);
    } catch (error) {
      console.error("Error uploading vehicle images:", error);
      alert("Failed to upload vehicle images");
    } finally {
      setUploadingVehicle(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!title.trim()) {
      setError("Title is required");
      setLoading(false);
      return;
    }

    // Validate based on itemType
    if (itemType === "Battery" && listingBatteries.length === 0) {
      setError("Please add at least one battery for Battery type listing");
      setLoading(false);
      return;
    }

    if (itemType === "Vehicle" && listingVehicles.length === 0) {
      setError("Please add at least one vehicle for Vehicle type listing");
      setLoading(false);
      return;
    }

    if (itemType === "Fullset" && listingBatteries.length === 0 && listingVehicles.length === 0) {
      setError("Please add at least one battery or vehicle for Fullset type listing");
      setLoading(false);
      return;
    }

    // Chuẩn bị listingBatteries dựa trên itemType
    let listingBatteriesData = [];
    if (itemType === "Battery" || itemType === "Fullset") {
      listingBatteriesData = listingBatteries.map(battery => ({
        batteryId: battery.batteryId,
        health: battery.health || 0,
        price: battery.price || 0,
        suggestedPrice: battery.suggestedPrice || 0,
        imgs: Array.isArray(battery.imgs) ? battery.imgs.join(",") : "" // Chuyển array thành string
      }));
    }

    // Chuẩn bị listingVehicles dựa trên itemType
    let listingVehiclesData = [];
    if (itemType === "Vehicle" || itemType === "Fullset") {
      listingVehiclesData = listingVehicles.map(vehicle => ({
        vehicleId: vehicle.vehicleId,
        odometer: vehicle.odometer || 0,
        batteryHealth: vehicle.batteryHealth || 0,
        color: vehicle.color || "",
        vin: vehicle.vin || "",
        licensePlate: vehicle.licensePlate || "",
        price: vehicle.price || 0,
        suggestedPrice: vehicle.suggestedPrice || 0,
        imgs: Array.isArray(vehicle.imgs) ? vehicle.imgs.join(",") : "" // Chuyển array thành string
      }));
    }

    // Tạo payload theo đúng schema API
    const payload = [
      {
        title: title.trim(),
        description: description?.trim() || "",
        address: address?.trim() || "",
        listingBatteries: listingBatteriesData,
        listingVehicles: listingVehiclesData
      }
    ];
    
    console.log("Final payload:", JSON.stringify(payload, null, 2));

    try {
      const res = await createListing(payload);
      console.log("API Response:", res);

      // Xử lý response
      let created;
      if (Array.isArray(res)) {
        created = res[0];
      } else if (Array.isArray(res.data)) {
        created = res.data[0];
      } else {
        created = res?.result?.[0] ?? res?.data ?? res;
      }

      const id = created?.id ?? created?.listingId ?? created?._id;
      
      if (id) {
        navigate(`/listing/${id}`);
      } else {
        navigate("/");
        alert("Listing created successfully!");
      }
    } catch (err) {
      console.error("Error creating listing:", err);
      console.error("Error response data:", err.response?.data);
      
      let errorMessage = "Failed to create listing";
      if (err.response?.data) {
        errorMessage = err.response.data?.title || 
                      err.response.data?.errorMessage || 
                      err.response.data?.message ||
                      JSON.stringify(err.response.data);
      }
      
      setError(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-10">
      <h1 className="text-2xl font-bold mb-6">Create New Listing</h1>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="flex gap-6">
        <form onSubmit={handleSubmit} className="space-y-4 max-w-3xl flex-1">
          <div>
            <Input 
              placeholder="Title *" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              required 
            />
          </div>

          <div>
            <Input 
              placeholder="Address" 
              value={address} 
              onChange={(e) => setAddress(e.target.value)} 
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Item type *</label>
            <select
              className="border rounded p-2 w-full bg-black text-white"
              value={itemType}
              onChange={(e) => setItemType(e.target.value)}
              required
            >
              <option value="Battery">Battery</option>
              <option value="Vehicle">Vehicle</option>
              <option value="Fullset">Fullset</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <Input 
              placeholder="Description" 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
            />
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
                  <Input placeholder="Health (%) *" type="number" value={batteryHealth} onChange={(e) => setBatteryHealth(e.target.value)} />
                  <Input placeholder="Price" type="number" value={batteryPrice} onChange={(e) => setBatteryPrice(e.target.value)} />
                  <Input placeholder="Suggested price" type="number" value={batterySuggestedPrice} onChange={(e) => setBatterySuggestedPrice(e.target.value)} />
                </div>

                <div className="flex items-center gap-2">
                  <Button 
                    type="button" 
                    onClick={getBatterySuggestion}
                    disabled={loadingBatterySuggestion || !selectedBatteryId}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  >
                    {loadingBatterySuggestion ? "Getting AI Price..." : "✨ AI Price Suggestion"}
                  </Button>
                  <span className="text-xs text-gray-500">AI will suggest price based on battery details</span>
                </div>

                <div className="flex items-center gap-2">
                  <label className="w-12 h-12 flex items-center justify-center border-2 border-dashed rounded cursor-pointer hover:bg-gray-50">
                    <input 
                      type="file" 
                      accept="image/*" 
                      multiple 
                      className="hidden" 
                      onChange={handleBatteryImageUpload} 
                      disabled={uploadingBattery} 
                    />
                    {uploadingBattery ? <div className="loading-spinner" /> : <span className="text-2xl">+</span>}
                  </label>
                  <Button type="button" onClick={addBatteryToListing}>Add battery</Button>
                </div>

                {listingBatteries.length > 0 && (
                  <div className="mt-2">
                    {listingBatteries.map((b, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-muted/10 p-2 rounded mb-1">
                        <div className="text-sm">
                          <div>Battery ID: {b.batteryId}</div>
                          <div className="text-xs text-muted-foreground">
                            Health: {b.health}% • Price: {b.price?.toLocaleString('vi-VN')} VND • Suggested: {b.suggestedPrice?.toLocaleString('vi-VN')} VND
                          </div>
                        </div>
                        <Button type="button" onClick={() => removeBattery(idx)} variant="destructive">Remove</Button>
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
                  <Input placeholder="Odometer *" type="number" value={vehicleOdometer} onChange={(e) => setVehicleOdometer(e.target.value)} />
                  <Input placeholder="Battery health (%) *" type="number" value={vehicleBatteryHealth} onChange={(e) => setVehicleBatteryHealth(e.target.value)} />
                  <Input placeholder="Color" value={vehicleColor} onChange={(e) => setVehicleColor(e.target.value)} />
                </div>

                <div className="grid sm:grid-cols-3 gap-2">
                  <Input placeholder="VIN" value={vehicleVin} onChange={(e) => setVehicleVin(e.target.value)} />
                  <Input placeholder="License plate" value={vehicleLicensePlate} onChange={(e) => setVehicleLicensePlate(e.target.value)} />
                  <Input placeholder="Price" type="number" value={vehiclePriceLocal} onChange={(e) => setVehiclePriceLocal(e.target.value)} />
                </div>

                <div className="grid sm:grid-cols-1 gap-2">
                  <Input placeholder="Suggested price" type="number" value={vehicleSuggestedPrice} onChange={(e) => setVehicleSuggestedPrice(e.target.value)} />
                </div>

                <div className="flex items-center gap-2">
                  <Button 
                    type="button" 
                    onClick={getVehicleSuggestion}
                    disabled={loadingVehicleSuggestion || !selectedVehicleId || !vehicleOdometer || !vehicleBatteryHealth}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  >
                    {loadingVehicleSuggestion ? "Getting AI Price..." : "✨ AI Price Suggestion"}
                  </Button>
                  <span className="text-xs text-gray-500">AI will suggest price based on vehicle details</span>
                </div>

                <div className="flex items-center gap-2">
                  <label className="w-12 h-12 flex items-center justify-center border-2 border-dashed rounded cursor-pointer hover:bg-gray-50">
                    <input 
                      type="file" 
                      accept="image/*" 
                      multiple 
                      className="hidden" 
                      onChange={handleVehicleImageUpload} 
                      disabled={uploadingVehicle} 
                    />
                    {uploadingVehicle ? <div className="loading-spinner" /> : <span className="text-2xl">+</span>}
                  </label>
                  <Button type="button" onClick={addVehicleToListing}>Add vehicle</Button>
                </div>

                {listingVehicles.length > 0 && (
                  <div className="mt-2">
                    {listingVehicles.map((v, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-muted/10 p-2 rounded mb-1">
                        <div className="text-sm">
                          <div>Vehicle ID: {v.vehicleId}</div>
                          <div className="text-xs text-muted-foreground">
                            Odo: {v.odometer} • Battery: {v.batteryHealth}% • Price: {v.price?.toLocaleString('vi-VN')} VND • Suggested: {v.suggestedPrice?.toLocaleString('vi-VN')} VND
                          </div>
                        </div>
                        <Button type="button" onClick={() => removeVehicle(idx)} variant="destructive">Remove</Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="pt-4">
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Creating Listing..." : "Create Listing"}
            </Button>
          </div>
        </form>

        {/* Right side: image preview */}
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