import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getListingById, getBatteryById, getVehicleById } from "../../api/ListingApi";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";

export default function ListingDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [listing, setListing] = useState({
    title: "",
    address: "",
    description: "",
    itemType: "Battery",
    price: "",
    listingBatteries: [],
    listingVehicles: [],
  });

  const [batteryMap, setBatteryMap] = useState({});
  const [vehicleMap, setVehicleMap] = useState({});

  useEffect(() => {
    let mounted = true;

    const fetchListing = async () => {
      setLoading(true);
      setError(null);
      try {
        const raw = await getListingById(id);
        const item = raw?.result ?? raw?.data ?? raw;
        if (!item) throw new Error("Listing not found");

        if (!mounted) return;

        setListing({
          title: item.title || "",
          address: item.address || "",
          description: item.description || "",
          itemType: item.itemType || item.type || "Battery",
          price: item.price ?? item.amount ?? "",
          listingBatteries: item.listingBatteries || [],
          listingVehicles: item.listingVehicles || [],
        });

        // fetch related battery/vehicle details
        const batteryIds = (item.listingBatteries || []).map(b => b.batteryId).filter(Boolean);
        const vehicleIds = (item.listingVehicles || []).map(v => v.vehicleId).filter(Boolean);

        const bResults = await Promise.allSettled(batteryIds.map(id => getBatteryById(id)));
        const vResults = await Promise.allSettled(vehicleIds.map(id => getVehicleById(id)));

        const bMap = {};
        bResults.forEach((r, i) => {
          if (r.status === "fulfilled") {
            const res = r.value;
            bMap[batteryIds[i]] = res?.result ?? res?.data ?? res ?? null;
          }
        });

        const vMap = {};
        vResults.forEach((r, i) => {
          if (r.status === "fulfilled") {
            const res = r.value;
            vMap[vehicleIds[i]] = res?.result ?? res?.data ?? res ?? null;
          }
        });

        if (!mounted) return;
        setBatteryMap(bMap);
        setVehicleMap(vMap);
      } catch (err) {
        if (!mounted) return;
        setError(err?.message || "Failed to load listing");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchListing();
    return () => { mounted = false; };
  }, [id]);

  // Hàm format tiền
  const formatPrice = (price) => {
    return Number(price).toLocaleString("vi-VN", {
      style: "currency",
      currency: "VND"
    });
  };

  // Hàm lấy tên Battery
  const getBatteryName = (batteryId) => {
    const detail = batteryMap[batteryId];
    if (detail?.brand && detail?.model) {
      return `${detail.brand} ${detail.model}`;
    } else if (detail?.brand) {
      return detail.brand;
    } else if (detail?.model) {
      return detail.model;
    } else if (detail?.name) {
      return detail.name;
    } else {
      return "Battery";
    }
  };

  // Hàm lấy tên Vehicle
  const getVehicleName = (vehicleId) => {
    const detail = vehicleMap[vehicleId];
    if (detail?.brand && detail?.model) {
      return `${detail.brand} ${detail.model}`;
    } else if (detail?.brand) {
      return detail.brand;
    } else if (detail?.model) {
      return detail.model;
    } else if (detail?.name) {
      return detail.name;
    } else {
      return "Vehicle";
    }
  };

  // Hàm render thông tin chi tiết Battery
  const renderBatteryDetails = (battery) => {
    const detail = batteryMap[battery.batteryId];
    return (
      <div className="text-xs text-muted-foreground space-y-1">
        <div>Health: {battery.health || 0}%</div>
        <div>Price: {formatPrice(battery.price || 0)}</div>
        {battery.suggestedPrice && (
          <div>Suggested: {formatPrice(battery.suggestedPrice)}</div>
        )}
        {detail?.capacity && (
          <div>Capacity: {detail.capacity} {detail.capacityUnit || "kWh"}</div>
        )}
        {detail?.voltage && (
          <div>Voltage: {detail.voltage}V</div>
        )}
      </div>
    );
  };

  // Hàm render thông tin chi tiết Vehicle
  const renderVehicleDetails = (vehicle) => {
    const detail = vehicleMap[vehicle.vehicleId];
    return (
      <div className="text-xs text-muted-foreground space-y-1">
        <div>Odometer: {(vehicle.odometer || 0).toLocaleString()} km</div>
        <div>Battery Health: {vehicle.batteryHealth || 0}%</div>
        <div>Price: {formatPrice(vehicle.price || 0)}</div>
        {vehicle.suggestedPrice && (
          <div>Suggested: {formatPrice(vehicle.suggestedPrice)}</div>
        )}
        {vehicle.color && (
          <div>Color: {vehicle.color}</div>
        )}
        {detail?.year && (
          <div>Year: {detail.year}</div>
        )}
        {detail?.range && (
          <div>Range: {detail.range} km</div>
        )}
      </div>
    );
  };

  const renderThumbs = (imgs) => {
    const arr = Array.isArray(imgs) ? imgs : String(imgs || "").split(",").map(s => s.trim()).filter(Boolean);
    if (!arr.length) return <div className="text-xs text-muted-foreground">No images</div>;
    return (
      <div className="flex gap-2">
        {arr.map((u, i) => (
          <div key={i} className="w-20 h-20 rounded overflow-hidden border">
            <img src={u} alt={`img-${i}`} className="w-full h-full object-cover" />
          </div>
        ))}
      </div>
    );
  };

  if (loading) return <div className="container py-10 text-center">Loading listing…</div>;
  if (error) return <div className="container py-10 text-red-500 text-center">{error}</div>;

  const { title, address, description, itemType, price, listingBatteries, listingVehicles } = listing;

  return (
    <div className="container py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Listing Details</h1>
        <Button 
          type="button" 
          onClick={() => navigate(-1)}
          variant="outline"
        >
          Back
        </Button>
      </div>

      <div className="flex gap-6">
        {/* Form */}
        <form className="space-y-4 max-w-3xl flex-1">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <Input placeholder="Title" value={title} disabled />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Address</label>
            <Input placeholder="Address" value={address} disabled />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Item type</label>
            <select className="border rounded p-2 w-full bg-black text-white" value={itemType} disabled>
              <option value="Battery">Battery</option>
              <option value="Vehicle">Vehicle</option>
              <option value="Fullset">Fullset</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Price</label>
            <Input 
              type="text" 
              placeholder="Price" 
              value={formatPrice(price)} 
              disabled 
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <Input placeholder="Description" value={description} disabled />
          </div>

          {/* Battery Section */}
          {(itemType === "Battery" || itemType === "Fullset") && (
            <div className="border rounded p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">Batteries</h3>
                <div className="text-sm text-muted-foreground">
                  {listingBatteries.length} battery{listingBatteries.length !== 1 ? 's' : ''}
                </div>
              </div>
              <div className="space-y-4">
                {listingBatteries.length === 0 && (
                  <div className="text-sm text-muted-foreground text-center py-4">
                    No batteries in this listing
                  </div>
                )}
                {listingBatteries.map((b, idx) => (
                  <div key={idx} className="border rounded p-4 bg-muted/5">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-medium text-lg">
                          {getBatteryName(b.batteryId)}
                        </h4>
                        {renderBatteryDetails(b)}
                      </div>
                    </div>
                    <div className="mt-3">
                      <label className="block text-sm font-medium mb-2">Images</label>
                      {renderThumbs(b.imgs)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Vehicle Section */}
          {(itemType === "Vehicle" || itemType === "Fullset") && (
            <div className="border rounded p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">Vehicles</h3>
                <div className="text-sm text-muted-foreground">
                  {listingVehicles.length} vehicle{listingVehicles.length !== 1 ? 's' : ''}
                </div>
              </div>
              <div className="space-y-4">
                {listingVehicles.length === 0 && (
                  <div className="text-sm text-muted-foreground text-center py-4">
                    No vehicles in this listing
                  </div>
                )}
                {listingVehicles.map((v, idx) => (
                  <div key={idx} className="border rounded p-4 bg-muted/5">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-medium text-lg">
                          {getVehicleName(v.vehicleId)}
                        </h4>
                        {renderVehicleDetails(v)}
                      </div>
                    </div>
                    <div className="mt-3">
                      <label className="block text-sm font-medium mb-2">Images</label>
                      {renderThumbs(v.imgs)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </form>

        {/* Right thumbnails */}
        <aside className="w-80">
          {/* Battery Images */}
          {(itemType === "Battery" || itemType === "Fullset") && listingBatteries.length > 0 && (
            <div className="border rounded p-4 mb-4">
              <h4 className="font-medium text-lg mb-3">All Battery Images</h4>
              <div className="grid grid-cols-2 gap-3">
                {listingBatteries.flatMap(lb => 
                  Array.isArray(lb.imgs) ? lb.imgs : String(lb.imgs || "").split(",").filter(Boolean)
                ).map((url, i) => (
                  <div key={i} className="relative aspect-square rounded overflow-hidden border">
                    <img src={url} alt={`battery-${i}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
              {listingBatteries.flatMap(lb => 
                Array.isArray(lb.imgs) ? lb.imgs : String(lb.imgs || "").split(",").filter(Boolean)
              ).length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-4">No battery images</div>
              )}
            </div>
          )}

          {/* Vehicle Images */}
          {(itemType === "Vehicle" || itemType === "Fullset") && listingVehicles.length > 0 && (
            <div className="border rounded p-4">
              <h4 className="font-medium text-lg mb-3">All Vehicle Images</h4>
              <div className="grid grid-cols-2 gap-3">
                {listingVehicles.flatMap(lv => 
                  Array.isArray(lv.imgs) ? lv.imgs : String(lv.imgs || "").split(",").filter(Boolean)
                ).map((url, i) => (
                  <div key={i} className="relative aspect-square rounded overflow-hidden border">
                    <img src={url} alt={`vehicle-${i}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
              {listingVehicles.flatMap(lv => 
                Array.isArray(lv.imgs) ? lv.imgs : String(lv.imgs || "").split(",").filter(Boolean)
              ).length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-4">No vehicle images</div>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}