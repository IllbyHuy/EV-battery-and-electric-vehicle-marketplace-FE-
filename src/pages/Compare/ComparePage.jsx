import { useEffect, useMemo, useState } from "react";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { getAllVehicles, getAllBatteries, setAuthToken } from "../../api/userApi";
import { cn } from "../../utils/cn";

function formatMoney(value) {
  if (value == null || Number.isNaN(Number(value))) return "—";
  try {
    return Number(value).toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
    });
  } catch (err) {
    return value;
  }
}

function normalizeVehicles(source = []) {
  return source.map((vehicle, index) => {
    const id =
      vehicle?.id ??
      vehicle?.vehicleId ??
      vehicle?.vehicleID ??
      `vehicle-${index}`;
    const brand =
      vehicle?.brand ??
      vehicle?.vehicleBrand ??
      vehicle?.make ??
      vehicle?.manufacturer ??
      "Unknown";
    const model =
      vehicle?.model ??
      vehicle?.vehicleModel ??
      vehicle?.name ??
      vehicle?.title ??
      "";
    const name = [brand, model].filter(Boolean).join(" ") || vehicle?.name || `Vehicle ${index + 1}`;

    const startYear =
      vehicle?.startYear ??
      vehicle?.yearStart ??
      vehicle?.year ??
      vehicle?.beginYear ??
      null;
    const endYear =
      vehicle?.endYear ??
      vehicle?.yearEnd ??
      vehicle?.year ??
      vehicle?.finishYear ??
      null;

    let yearRange = "—";
    if (startYear && endYear) {
      yearRange = startYear === endYear ? `${startYear}` : `${startYear}–${endYear}`;
    } else if (startYear) {
      yearRange = `${startYear}`;
    } else if (endYear) {
      yearRange = `${endYear}`;
    }

    const rangeValue =
      vehicle?.range ??
      vehicle?.estimatedRange ??
      vehicle?.rangeMi ??
      vehicle?.rangeKm ??
      vehicle?.range_miles ??
      null;
    const rangeUnit =
      vehicle?.rangeUnit ??
      (vehicle?.rangeKm != null ? "km" : null) ??
      (vehicle?.rangeMi != null ? "mi" : null) ??
      (vehicle?.range_miles != null ? "mi" : null) ??
      null;

    const drivetrain =
      vehicle?.drivetrain ??
      vehicle?.drive ??
      vehicle?.driveType ??
      vehicle?.driveTrain ??
      null;
    const seats =
      vehicle?.seats ??
      vehicle?.seatCount ??
      vehicle?.capacity ??
      null;

    const batteryNames = (() => {
      if (Array.isArray(vehicle?.batteryModels) && vehicle.batteryModels.length > 0) {
        return vehicle.batteryModels.join(", ");
      }
      if (Array.isArray(vehicle?.compatibleBatteries) && vehicle.compatibleBatteries.length > 0) {
        return vehicle.compatibleBatteries
          .map((b) => {
            const brandPart = b?.brand ?? b?.manufacturer ?? "";
            const modelPart = b?.model ?? b?.name ?? "";
            const combined = `${brandPart} ${modelPart}`.trim();
            return combined || null;
          })
          .filter(Boolean)
          .join(", ");
      }
      return (
        vehicle?.batteryModel ??
        vehicle?.batteryName ??
        vehicle?.battery ??
        vehicle?.batteryType ??
        null
      );
    })();

    const price =
      vehicle?.price ??
      vehicle?.suggestedPrice ??
      vehicle?.marketPrice ??
      vehicle?.msrp ??
      vehicle?.basePrice ??
      null;

    return {
      id: String(id),
      name,
      brand,
      model,
      yearRange,
      rangeValue,
      rangeUnit,
      drivetrain,
      seats,
      battery: batteryNames,
      price,
      raw: vehicle,
    };
  });
}

function normalizeBatteries(source = []) {
  return source.map((battery, index) => {
    const id =
      battery?.id ??
      battery?.batteryId ??
      battery?.batteryID ??
      `battery-${index}`;
    const brand =
      battery?.brand ??
      battery?.manufacturer ??
      battery?.maker ??
      "Unknown";
    const model =
      battery?.model ??
      battery?.batteryModel ??
      battery?.name ??
      "";
    const name = [brand, model].filter(Boolean).join(" ") || battery?.name || `Battery ${index + 1}`;

    const chemistry =
      battery?.chemistry ??
      battery?.type ??
      battery?.chem ??
      battery?.cellChemistry ??
      battery?.chemistryType ??
      null;

    const capacityValue =
      battery?.capacity ??
      battery?.capacityKWh ??
      battery?.capacityAh ??
      battery?.energyCapacity ??
      null;
    const capacityUnit =
      battery?.capacityUnit ??
      (battery?.capacityAh != null ? "Ah" : null) ??
      (battery?.capacityKWh != null || battery?.capacity != null ? "kWh" : null);

    const voltageValue =
      battery?.voltage ??
      battery?.voltageV ??
      battery?.nominalVoltage ??
      battery?.voltageRating ??
      null;
    const voltageUnit =
      battery?.voltageUnit ??
      (voltageValue != null ? "V" : null);

    const health =
      battery?.health ??
      battery?.stateOfHealth ??
      battery?.soh ??
      battery?.healthPercent ??
      null;

    const cycleCount =
      battery?.cycleCount ??
      battery?.cycles ??
      battery?.cycle ??
      null;

    const price =
      battery?.price ??
      battery?.suggestedPrice ??
      battery?.marketPrice ??
      null;

    return {
      id: String(id),
      name,
      brand,
      model,
      chemistry,
      capacityValue,
      capacityUnit,
      voltageValue,
      voltageUnit,
      health,
      cycleCount,
      price,
      raw: battery,
    };
  });
}

function formatWithUnit(value, unit) {
  if (value == null || value === "") return "—";
  const formatted = typeof value === "number" ? value.toLocaleString() : String(value);
  return unit ? `${formatted} ${unit}` : formatted;
}

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

const vehicleRows = [
  { key: "brand", label: "Brand" },
  { key: "model", label: "Model" },
  { key: "yearRange", label: "Year Range" },
  {
    key: "rangeValue",
    label: "Range",
    render: (value, item) => formatWithUnit(value, item?.rangeUnit ?? (typeof value === "number" ? "mi" : null)),
  },
  { key: "drivetrain", label: "Drivetrain" },
  {
    key: "seats",
    label: "Seats",
    render: (value) => (value != null && value !== "" ? value : "—"),
  },
  { key: "battery", label: "Battery" },
  {
    key: "price",
    label: "Price",
    render: (value) => formatMoney(value),
  },
];

const batteryRows = [
  { key: "brand", label: "Brand" },
  { key: "model", label: "Model" },
  { key: "chemistry", label: "Chemistry" },
  {
    key: "capacityValue",
    label: "Capacity",
    render: (value, item) =>
      formatWithUnit(value, item?.capacityUnit ?? (typeof value === "number" ? "kWh" : null)),
  },
  {
    key: "voltageValue",
    label: "Voltage",
    render: (value, item) => formatWithUnit(value, item?.voltageUnit ?? (typeof value === "number" ? "V" : null)),
  },
  {
    key: "health",
    label: "Health",
    render: (value) => formatWithUnit(value, typeof value === "number" ? "%" : null),
  },
  {
    key: "cycleCount",
    label: "Cycle Count",
    render: (value) =>
      value != null && value !== ""
        ? typeof value === "number"
          ? value.toLocaleString()
          : value
        : "—",
  },
  {
    key: "price",
    label: "Price",
    render: (value) => formatMoney(value),
  },
];

export default function ComparePage() {
  const [activeTab, setActiveTab] = useState("vehicles");
  const [vehicleSource, setVehicleSource] = useState([]);
  const [batterySource, setBatterySource] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [vehicleQuery, setVehicleQuery] = useState("");
  const [batteryQuery, setBatteryQuery] = useState("");

  const [selectedVehicleIds, setSelectedVehicleIds] = useState([]);
  const [selectedBatteryIds, setSelectedBatteryIds] = useState([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const token =
          localStorage.getItem("token") ??
          localStorage.getItem("authToken") ??
          sessionStorage.getItem("authToken");
        if (token) setAuthToken(token);
        const [vehicleResponse, batteryResponse] = await Promise.all([
          getAllVehicles(),
          getAllBatteries(),
        ]);
        if (!mounted) return;
        const { items: vehicleItems, error: vehicleError } = unwrapApiCollection(vehicleResponse);
        const { items: batteryItems, error: batteryError } = unwrapApiCollection(batteryResponse);

        setVehicleSource(Array.isArray(vehicleItems) ? vehicleItems : []);
        setBatterySource(Array.isArray(batteryItems) ? batteryItems : []);

        const errorMessages = [vehicleError, batteryError].filter(Boolean);
        setError(errorMessages.length > 0 ? errorMessages.join(" | ") : null);
      } catch (err) {
        if (!mounted) return;
        setError(err?.response?.data?.errorMessage ?? err?.message ?? "Không thể tải dữ liệu so sánh.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const vehicles = useMemo(() => normalizeVehicles(vehicleSource), [vehicleSource]);
  const batteries = useMemo(() => normalizeBatteries(batterySource), [batterySource]);

  const filteredVehicles = useMemo(() => {
    const query = vehicleQuery.trim().toLowerCase();
    if (!query) return vehicles;
    return vehicles.filter((item) => item.name.toLowerCase().includes(query));
  }, [vehicleQuery, vehicles]);

  const filteredBatteries = useMemo(() => {
    const query = batteryQuery.trim().toLowerCase();
    if (!query) return batteries;
    return batteries.filter((item) => item.name.toLowerCase().includes(query));
  }, [batteryQuery, batteries]);

  const selectedVehicles = useMemo(
    () => selectedVehicleIds.map((id) => vehicles.find((item) => item.id === id)).filter(Boolean),
    [selectedVehicleIds, vehicles],
  );

  const selectedBatteries = useMemo(
    () => selectedBatteryIds.map((id) => batteries.find((item) => item.id === id)).filter(Boolean),
    [selectedBatteryIds, batteries],
  );

  function toggleVehicle(id) {
    setSelectedVehicleIds((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id],
    );
  }

  function toggleBattery(id) {
    setSelectedBatteryIds((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id],
    );
  }

  function renderSelectionList(allItems, visibleItems, selectedIds, toggle, query, setQuery, type) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-lg">
            Chọn {type === "vehicles" ? "Vehicle" : "Battery"} để so sánh
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Tìm kiếm..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            {selectedIds.map((id) => {
              const item = allItems.find((option) => option.id === id);
              if (!item) return null;
              return (
                <Badge
                  key={id}
                  className="flex items-center gap-2 cursor-pointer bg-secondary text-secondary-foreground"
                  onClick={() => toggle(id)}
                >
                  {item.name}
                  <span className="text-xs text-muted-foreground">(bỏ)</span>
                </Badge>
              );
            })}
            {selectedIds.length === 0 && (
              <span className="text-xs text-muted-foreground">Chưa chọn mục nào</span>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {visibleItems.length === 0 && !loading ? (
              <div className="col-span-full text-sm text-muted-foreground">
                Không tìm thấy dữ liệu.
              </div>
            ) : (
              visibleItems.map((item) => {
                const isChecked = selectedIds.includes(item.id);
                return (
                  <label
                    key={item.id}
                    className={cn(
                      "cursor-pointer rounded-lg border p-3 text-sm transition hover:border-primary",
                      isChecked && "border-primary bg-primary/5",
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        className="mt-1"
                        checked={isChecked}
                        onChange={() => toggle(item.id)}
                      />
                      <div>
                        <div className="font-semibold">{item.name || "Không rõ tên"}</div>
                        <div className="text-xs text-muted-foreground">
                          {type === "vehicles"
                            ? item.yearRange && item.yearRange !== "—"
                              ? `Năm: ${item.yearRange}`
                              : "Không rõ năm"
                            : (() => {
                                const capacityText = formatWithUnit(
                                  item.capacityValue,
                                  item.capacityUnit ?? (typeof item.capacityValue === "number" ? "kWh" : null),
                                );
                                return capacityText === "—"
                                  ? "Không rõ dung lượng"
                                  : `Dung lượng: ${capacityText}`;
                              })()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {type === "vehicles"
                            ? (() => {
                                const rangeText = formatWithUnit(
                                  item.rangeValue,
                                  item.rangeUnit ?? (typeof item.rangeValue === "number" ? "mi" : null),
                                );
                                return rangeText === "—" ? "Quãng đường: —" : `Quãng đường: ${rangeText}`;
                              })()
                            : (() => {
                                const healthText = formatWithUnit(
                                  item.health,
                                  typeof item.health === "number" ? "%" : null,
                                );
                                return healthText === "—" ? "Health: —" : `Health: ${healthText}`;
                              })()}
                        </div>
                        <div className="text-xs font-medium text-foreground mt-1">
                          {formatMoney(item.price)}
                        </div>
                      </div>
                    </div>
                  </label>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  function renderComparison(rows, selectedItems, onRemove) {
    if (selectedItems.length < 2) {
      return (
        <Card className="col-span-full">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Hãy chọn ít nhất 2 mục để bắt đầu so sánh.
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] border-collapse text-sm">
          <thead>
            <tr className="bg-muted/40">
              <th className="border px-3 py-2 text-left font-semibold">Thông số</th>
              {selectedItems.map((item) => (
                <th key={item.id} className="border px-3 py-2 text-left font-semibold">
                  <div className="flex items-center justify-between gap-2">
                    <span>{item.name || "—"}</span>
                    <Button
                      variant="ghost"
                      className="h-8 px-3 text-xs"
                      onClick={() => {
                        onRemove(item.id);
                      }}
                    >
                      Bỏ
                    </Button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key} className="odd:bg-muted/20">
                <td className="border px-3 py-2 font-medium">{row.label}</td>
                {selectedItems.map((item) => {
                  const value = item[row.key];
                  const formatter =
                    row.render ??
                    ((val) => (val != null && val !== "" ? (typeof val === "number" ? val.toLocaleString() : val) : "—"));
                  return (
                    <td key={`${item.id}-${row.key}`} className="border px-3 py-2">
                      {formatter(value, item)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="container py-10 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Compare</h1>
        <p className="text-sm text-muted-foreground">
          So sánh thông số chi tiết giữa nhiều Vehicle hoặc Battery. Có thể chọn 2, 3 hoặc nhiều hơn
          để so sánh song song.
        </p>
      </div>

      <div className="flex gap-2 border-b pb-2">
        <button
          type="button"
          className={cn(
            "rounded-md px-4 py-2 text-sm font-medium transition",
            activeTab === "vehicles"
              ? "bg-primary text-primary-foreground shadow"
              : "text-muted-foreground hover:text-foreground",
          )}
          onClick={() => setActiveTab("vehicles")}
        >
          Vehicles
        </button>
        <button
          type="button"
          className={cn(
            "rounded-md px-4 py-2 text-sm font-medium transition",
            activeTab === "batteries"
              ? "bg-primary text-primary-foreground shadow"
              : "text-muted-foreground hover:text-foreground",
          )}
          onClick={() => setActiveTab("batteries")}
        >
          Batteries
        </button>
      </div>

      {loading ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Đang tải dữ liệu so sánh...
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-red-500">{error}</CardContent>
        </Card>
      ) : activeTab === "vehicles" ? (
        <div className="space-y-6">
          {renderSelectionList(
            vehicles,
            filteredVehicles,
            selectedVehicleIds,
            toggleVehicle,
            vehicleQuery,
            setVehicleQuery,
            "vehicles",
          )}
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              Đang so sánh {selectedVehicles.length} vehicle.
            </span>
            {selectedVehicles.length > 0 && (
              <Button variant="ghost" className="h-8 px-3 text-xs" onClick={() => setSelectedVehicleIds([])}>
                Bỏ tất cả
              </Button>
            )}
          </div>
          {renderComparison(vehicleRows, selectedVehicles, (id) =>
            setSelectedVehicleIds((prev) => prev.filter((itemId) => itemId !== id)),
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {renderSelectionList(
            batteries,
            filteredBatteries,
            selectedBatteryIds,
            toggleBattery,
            batteryQuery,
            setBatteryQuery,
            "batteries",
          )}
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              Đang so sánh {selectedBatteries.length} battery.
            </span>
            {selectedBatteries.length > 0 && (
              <Button variant="ghost" className="h-8 px-3 text-xs" onClick={() => setSelectedBatteryIds([])}>
                Bỏ tất cả
              </Button>
            )}
          </div>
          {renderComparison(batteryRows, selectedBatteries, (id) =>
            setSelectedBatteryIds((prev) => prev.filter((itemId) => itemId !== id)),
          )}
        </div>
      )}
    </div>
  );
}
