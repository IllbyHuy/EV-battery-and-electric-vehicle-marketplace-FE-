import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getListingById, getBatteryById, getVehicleById } from "../../api/ListingApi";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";

export default function ListingDetails() {
  const { id } = useParams();
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

  if (loading) return <div>Loading listing…</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  const { title, address, description, itemType, price, listingBatteries, listingVehicles } = listing;

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

  return (
    <div className="container py-10">
      <h1 className="text-2xl font-bold mb-6">Listing</h1>

      <div className="flex gap-6">
        {/* Form */}
        <form className="space-y-4 max-w-3xl flex-1">
          <Input placeholder="Title" value={title} disabled />
          <Input placeholder="Address" value={address} disabled />
          
          <div>
            <label className="block text-sm font-medium mb-1">Item type</label>
            <select className="border rounded p-2 w-full bg-black text-white" value={itemType} disabled>
              <option value="Battery">Battery</option>
              <option value="Vehicle">Vehicle</option>
              <option value="Fullset">Fullset</option>
            </select>
          </div>

          <Input type="text" placeholder="Price" value={price} disabled />
          <Input placeholder="Description" value={description} disabled />

          {(itemType === "Battery" || itemType === "Fullset") && (
            <div className="border rounded p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">Listing Batteries</h3>
                <div className="text-xs text-muted-foreground">{listingBatteries.length} added</div>
              </div>
              <div className="space-y-3">
                {listingBatteries.length === 0 && <div className="text-sm text-muted-foreground">No batteries</div>}
                {listingBatteries.map((b, idx) => {
                  const detail = batteryMap[b.batteryId];
                  return (
                    <div key={idx} className="flex items-center justify-between bg-muted/10 p-2 rounded">
                      <div className="text-sm">
                        <div>{detail?.brand ? `${detail.brand} ${detail.model || ""}` : b.batteryId}</div>
                        <div className="text-xs text-muted-foreground">Health: {b.health} • Price: {b.price}</div>
                      </div>
                      <div>{renderThumbs(b.imgs)}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {(itemType === "Vehicle" || itemType === "Fullset") && (
            <div className="border rounded p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">Listing Vehicles</h3>
                <div className="text-xs text-muted-foreground">{listingVehicles.length} added</div>
              </div>
              <div className="space-y-3">
                {listingVehicles.length === 0 && <div className="text-sm text-muted-foreground">No vehicles</div>}
                {listingVehicles.map((v, idx) => {
                  const detail = vehicleMap[v.vehicleId];
                  return (
                    <div key={idx} className="flex items-center justify-between bg-muted/10 p-2 rounded">
                      <div className="text-sm">
                        <div>{detail?.brand ? `${detail.brand} ${detail.model || detail.name || ""}` : v.vehicleId}</div>
                        <div className="text-xs text-muted-foreground">Odo: {v.odometer} • Battery: {v.batteryHealth}</div>
                      </div>
                      <div>{renderThumbs(v.imgs)}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <Button type="button" onClick={() => {}}>Close</Button>
        </form>

        {/* Right thumbnails */}
        <aside className="w-72">
          <div className="border rounded p-3 mb-4">
            <h4 className="font-medium text-sm mb-2">Battery images (all)</h4>
            <div className="grid grid-cols-3 gap-2">
              {listingBatteries.flatMap(lb => Array.isArray(lb.imgs) ? lb.imgs : String(lb.imgs || "").split(",").filter(Boolean))
                .map((url, i) => (
                  <div key={i} className="relative w-20 h-20 rounded overflow-hidden">
                    <img src={url} alt={`bat-${i}`} className="w-full h-full object-cover" />
                  </div>
                ))}
            </div>
          </div>

          <div className="border rounded p-3">
            <h4 className="font-medium text-sm mb-2">Vehicle images (all)</h4>
            <div className="grid grid-cols-3 gap-2">
              {listingVehicles.flatMap(lv => Array.isArray(lv.imgs) ? lv.imgs : String(lv.imgs || "").split(",").filter(Boolean))
                .map((url, i) => (
                  <div key={i} className="relative w-20 h-20 rounded overflow-hidden">
                    <img src={url} alt={`veh-${i}`} className="w-full h-full object-cover" />
                  </div>
                ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
