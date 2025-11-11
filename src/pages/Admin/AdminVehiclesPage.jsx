import { useEffect, useState } from "react";
import { Car, CheckCircle2, XCircle, RefreshCw, Search, Plus, X, Check, Edit, Trash2 } from "lucide-react";
import { getAllVehicles, createVehicle, getAllBatteries, approveVehicle, updateVehicle, deleteVehicle } from "../../api/userApi";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { storage } from "../../config/firebase-config";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function AdminVehiclesPage() {
  const [vehicles, setVehicles] = useState([]);
  const [batteries, setBatteries] = useState([]); // For dropdown
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterApproved, setFilterApproved] = useState("all"); // "all", "approved", "pending"
  const [approvingIds, setApprovingIds] = useState(new Set()); // Track which vehicles are being approved
  const [updatingIds, setUpdatingIds] = useState(new Set()); // Track which vehicles are being updated
  const [deletingIds, setDeletingIds] = useState(new Set()); // Track which vehicles are being deleted
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null); // Track which vehicle is being edited
  const [vehicleForm, setVehicleForm] = useState({
    brand: "",
    model: "",
    startYear: "",
    endYear: "",
    compatibleBatteryIds: [], // Array of battery IDs
    imgs: "", // comma-separated URLs
  });
  const [createImageFiles, setCreateImageFiles] = useState([]); // File[] for create
  const [editImageFiles, setEditImageFiles] = useState([]); // File[] for edit
  const [editImageUrls, setEditImageUrls] = useState([]); // existing urls in edit
  const [batteryDropdownOpen, setBatteryDropdownOpen] = useState(false);

  const getFirstImage = (imgs) => {
    if (!imgs) return "/placeholder.svg";
    if (Array.isArray(imgs)) return imgs[0] || "/placeholder.svg";
    const first = String(imgs).split(",").map((s) => s.trim()).filter(Boolean)[0];
    return first || "/placeholder.svg";
  };

  useEffect(() => {
    fetchVehicles();
    fetchBatteries();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (batteryDropdownOpen && !event.target.closest('.battery-dropdown-container')) {
        setBatteryDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [batteryDropdownOpen]);

  const fetchBatteries = async () => {
    try {
      const response = await getAllBatteries();
      if (response.isSuccess && response.result) {
        setBatteries(response.result);
      }
    } catch (err) {
      console.error("Error fetching batteries:", err);
    }
  };

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getAllVehicles();
      
      // Handle response structure: { statusCode, isSuccess, errorMessage, result }
      if (response.isSuccess && response.result) {
        setVehicles(response.result);
      } else {
        setError(response.errorMessage || "Failed to fetch vehicles");
      }
    } catch (err) {
      setError(err.response?.data?.errorMessage || err.message || "Failed to load vehicles");
      console.error("Error fetching vehicles:", err);
    } finally {
      setLoading(false);
    }
  };

  // Upload helper: upload list of files to Firebase Storage, return URLs
  const uploadImagesAndGetUrls = async (files, folder = "vehicle-images") => {
    if (!files || files.length === 0) return [];
    const uploadTasks = files.map(async (file) => {
      const fileRef = ref(storage, `${folder}/${Date.now()}_${file.name}`);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      return url;
    });
    return Promise.all(uploadTasks);
  };

  // Handle create vehicle
  const handleCreateVehicle = async (e) => {
    e.preventDefault();
    try {
      setCreating(true);
      setError(null);

      // Validate form
      if (!vehicleForm.brand || !vehicleForm.model || !vehicleForm.startYear || !vehicleForm.endYear) {
        setError("Vui lòng điền đầy đủ thông tin");
        return;
      }

      // Prepare vehicle data
      const vehicleData = {
        brand: vehicleForm.brand.trim(),
        model: vehicleForm.model.trim(),
        startYear: Number(vehicleForm.startYear),
        endYear: Number(vehicleForm.endYear),
        compatibleBatteryIds: vehicleForm.compatibleBatteryIds,
        imgs: "", // will be set after upload
      };

      // Upload images if any, then set imgs (comma-separated urls)
      const uploadedUrls = await uploadImagesAndGetUrls(createImageFiles, "vehicle-images");
      if (uploadedUrls.length > 0) {
        vehicleData.imgs = uploadedUrls.join(",");
      }

      const response = await createVehicle(vehicleData);

      // Handle response structure: { statusCode, isSuccess, errorMessage, result }
      if (response.isSuccess) {
        // Reset form
        setVehicleForm({ brand: "", model: "", startYear: "", endYear: "", compatibleBatteryIds: [], imgs: "" });
        setCreateImageFiles([]);
        setShowCreateForm(false);
        // Reload vehicle list after successful creation
        await fetchVehicles();
      } else {
        setError(response.errorMessage || "Failed to create vehicle");
      }
    } catch (err) {
      setError(err.response?.data?.errorMessage || err.message || "Failed to create vehicle");
      console.error("Error creating vehicle:", err);
    } finally {
      setCreating(false);
    }
  };

  // Handle battery selection
  const toggleBattery = (batteryId) => {
    setVehicleForm((prev) => {
      const currentIds = prev.compatibleBatteryIds;
      if (currentIds.includes(batteryId)) {
        return { ...prev, compatibleBatteryIds: currentIds.filter((id) => id !== batteryId) };
      } else {
        return { ...prev, compatibleBatteryIds: [...currentIds, batteryId] };
      }
    });
  };

  // Get selected battery names for display
  const getSelectedBatteryNames = () => {
    return vehicleForm.compatibleBatteryIds
      .map((id) => {
        const battery = batteries.find((b) => b.id === id);
        return battery ? `${battery.brand} ${battery.model}` : null;
      })
      .filter(Boolean);
  };

  // Handle approve vehicle
  const handleApprove = async (vehicleId) => {
    try {
      setApprovingIds((prev) => new Set(prev).add(vehicleId));
      setError(null);
      
      const response = await approveVehicle(vehicleId);
      
      // Handle response structure: { statusCode, isSuccess, errorMessage, result }
      if (response.isSuccess) {
        // Reload vehicle list after successful approval
        await fetchVehicles();
      } else {
        setError(response.errorMessage || "Failed to approve vehicle");
      }
    } catch (err) {
      setError(err.response?.data?.errorMessage || err.message || "Failed to approve vehicle");
      console.error("Error approving vehicle:", err);
    } finally {
      setApprovingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(vehicleId);
        return newSet;
      });
    }
  };

  // Handle edit vehicle - open edit form
  const handleEdit = (vehicle) => {
    setEditingVehicle(vehicle);
    setVehicleForm({
      brand: vehicle.brand || "",
      model: vehicle.model || "",
      startYear: vehicle.startYear?.toString() || "",
      endYear: vehicle.endYear?.toString() || "",
      compatibleBatteryIds: vehicle.batteryModels ? 
        // Map battery model names to IDs (if we have them)
        batteries
          .filter(b => vehicle.batteryModels.includes(b.model) || vehicle.batteryModels.includes(`${b.brand} ${b.model}`))
          .map(b => b.id) : [],
      imgs: typeof vehicle.imgs === "string" ? vehicle.imgs : Array.isArray(vehicle.imgs) ? vehicle.imgs.join(",") : "",
    });
    const existingUrls = typeof vehicle.imgs === "string"
      ? vehicle.imgs.split(",").map(s => s.trim()).filter(Boolean)
      : Array.isArray(vehicle.imgs) ? vehicle.imgs : [];
    setEditImageUrls(existingUrls);
    setEditImageFiles([]);
  };

  // Handle update vehicle
  const handleUpdateVehicle = async (e) => {
    e.preventDefault();
    if (!editingVehicle) return;

    try {
      setUpdatingIds((prev) => new Set(prev).add(editingVehicle.id));
      setError(null);

      // Validate form
      if (!vehicleForm.brand || !vehicleForm.model || !vehicleForm.startYear || !vehicleForm.endYear) {
        setError("Vui lòng điền đầy đủ thông tin");
        return;
      }

      // Prepare vehicle data
      const vehicleData = {
        brand: vehicleForm.brand.trim(),
        model: vehicleForm.model.trim(),
        startYear: Number(vehicleForm.startYear),
        endYear: Number(vehicleForm.endYear),
        compatibleBatteryIds: vehicleForm.compatibleBatteryIds,
        imgs: vehicleForm.imgs || "", // default to existing string
      };

      // Upload any new files and merge with existing URLs
      if (editImageFiles.length > 0) {
        const newUrls = await uploadImagesAndGetUrls(editImageFiles, "vehicle-images");
        const finalUrls = [...(editImageUrls || []), ...newUrls];
        vehicleData.imgs = finalUrls.join(",");
      } else if (editImageUrls && editImageUrls.length >= 0) {
        vehicleData.imgs = editImageUrls.join(",");
      }

      const response = await updateVehicle(editingVehicle.id, vehicleData);

      // Handle response structure: { statusCode, isSuccess, errorMessage, result }
      if (response.isSuccess) {
        // Reset form and close edit dialog
        setEditingVehicle(null);
        setVehicleForm({ brand: "", model: "", startYear: "", endYear: "", compatibleBatteryIds: [], imgs: "" });
        setEditImageFiles([]);
        setEditImageUrls([]);
        // Reload vehicle list after successful update
        await fetchVehicles();
      } else {
        setError(response.errorMessage || "Failed to update vehicle");
      }
    } catch (err) {
      setError(err.response?.data?.errorMessage || err.message || "Failed to update vehicle");
      console.error("Error updating vehicle:", err);
    } finally {
      setUpdatingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(editingVehicle?.id);
        return newSet;
      });
    }
  };

  // Handle delete vehicle
  const handleDelete = async (vehicleId, vehicleBrand, vehicleModel) => {
    // Confirm before deleting
    const vehicleName = `${vehicleBrand || ""} ${vehicleModel || ""}`.trim() || "xe này";
    if (!window.confirm(`Bạn có chắc chắn muốn xóa ${vehicleName}? Hành động này không thể hoàn tác.`)) {
      return;
    }

    try {
      setDeletingIds((prev) => new Set(prev).add(vehicleId));
      setError(null);

      const response = await deleteVehicle(vehicleId);

      // Handle response structure: { statusCode, isSuccess, errorMessage, result }
      if (response.isSuccess) {
        // Reload vehicle list after successful deletion
        await fetchVehicles();
      } else {
        setError(response.errorMessage || "Failed to delete vehicle");
      }
    } catch (err) {
      setError(err.response?.data?.errorMessage || err.message || "Failed to delete vehicle");
      console.error("Error deleting vehicle:", err);
    } finally {
      setDeletingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(vehicleId);
        return newSet;
      });
    }
  };

  // Filter vehicles based on search and approval status
  const filteredVehicles = vehicles.filter((vehicle) => {
    const matchesSearch =
      vehicle.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.model?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filterApproved === "all" ||
      (filterApproved === "approved" && vehicle.isAproved) ||
      (filterApproved === "pending" && !vehicle.isAproved);

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6 p-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Car className="h-6 w-6" />
            Quản lý Xe Điện
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Xem và quản lý tất cả xe điện trong hệ thống
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowCreateForm(!showCreateForm)}
            variant="default"
          >
            <Plus className="h-4 w-4 mr-2" />
            Tạo Xe Mới
          </Button>
          <Button onClick={fetchVehicles} disabled={loading} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Làm mới
          </Button>
        </div>
      </header>

      {/* Create Vehicle Form */}
      {showCreateForm && !editingVehicle && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tạo Xe Điện Mới</CardTitle>
            <CardDescription>
              Điền thông tin để tạo xe điện mới trong hệ thống
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateVehicle} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Brand <span className="text-destructive">*</span>
                  </label>
                  <Input
                    placeholder="VD: Tesla"
                    value={vehicleForm.brand}
                    onChange={(e) =>
                      setVehicleForm((s) => ({ ...s, brand: e.target.value }))
                    }
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Model <span className="text-destructive">*</span>
                  </label>
                  <Input
                    placeholder="VD: Model 3"
                    value={vehicleForm.model}
                    onChange={(e) =>
                      setVehicleForm((s) => ({ ...s, model: e.target.value }))
                    }
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Năm bắt đầu <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="number"
                    placeholder="VD: 2024"
                    value={vehicleForm.startYear}
                    onChange={(e) =>
                      setVehicleForm((s) => ({ ...s, startYear: e.target.value }))
                    }
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Năm kết thúc <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="number"
                    placeholder="VD: 2025"
                    value={vehicleForm.endYear}
                    onChange={(e) =>
                      setVehicleForm((s) => ({ ...s, endYear: e.target.value }))
                    }
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Ảnh xe (có thể chọn nhiều)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    setCreateImageFiles(files);
                  }}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
                {createImageFiles && createImageFiles.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {createImageFiles.map((f, i) => (
                      <img key={i} src={URL.createObjectURL(f)} alt={f.name} className="w-20 h-20 object-cover rounded-md" />
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Pin tương thích
                </label>
                <div className="relative battery-dropdown-container">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-between"
                    onClick={() => setBatteryDropdownOpen(!batteryDropdownOpen)}
                  >
                    <span>
                      {vehicleForm.compatibleBatteryIds.length > 0
                        ? `Đã chọn ${vehicleForm.compatibleBatteryIds.length} pin`
                        : "Chọn pin tương thích"}
                    </span>
                    <span className="text-muted-foreground">▼</span>
                  </Button>
                  {batteryDropdownOpen && (
                    <div className="absolute z-50 w-full mt-1 bg-card border rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {batteries.length === 0 ? (
                        <div className="p-3 text-sm text-muted-foreground">
                          Không có pin nào
                        </div>
                      ) : (
                        <div className="p-2">
                          {batteries.map((battery) => (
                            <label
                              key={battery.id}
                              className="flex items-center gap-2 p-2 hover:bg-muted rounded cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={vehicleForm.compatibleBatteryIds.includes(battery.id)}
                                onChange={() => toggleBattery(battery.id)}
                                className="rounded"
                              />
                              <span className="text-sm">
                                {battery.brand} {battery.model}
                                {battery.capacity && ` (${battery.capacity} kWh)`}
                              </span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {vehicleForm.compatibleBatteryIds.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {getSelectedBatteryNames().map((name, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {name}
                        <button
                          type="button"
                          onClick={() => {
                            const battery = batteries.find(
                              (b) => `${b.brand} ${b.model}` === name
                            );
                            if (battery) toggleBattery(battery.id);
                          }}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false);
                    setVehicleForm({ brand: "", model: "", startYear: "", endYear: "", compatibleBatteryIds: [], imgs: "" });
                    setCreateImageFiles([]);
                    setError(null);
                  }}
                  disabled={creating}
                >
                  Hủy
                </Button>
                <Button type="submit" disabled={creating}>
                  {creating ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Đang tạo...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Tạo Xe
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Edit Vehicle Form */}
      {editingVehicle && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Sửa Xe Điện</CardTitle>
            <CardDescription>
              Cập nhật thông tin cho xe: {editingVehicle.brand} {editingVehicle.model}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateVehicle} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Brand <span className="text-destructive">*</span>
                  </label>
                  <Input
                    placeholder="VD: Tesla"
                    value={vehicleForm.brand}
                    onChange={(e) =>
                      setVehicleForm((s) => ({ ...s, brand: e.target.value }))
                    }
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Model <span className="text-destructive">*</span>
                  </label>
                  <Input
                    placeholder="VD: Model 3"
                    value={vehicleForm.model}
                    onChange={(e) =>
                      setVehicleForm((s) => ({ ...s, model: e.target.value }))
                    }
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Năm bắt đầu <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="number"
                    placeholder="VD: 2024"
                    value={vehicleForm.startYear}
                    onChange={(e) =>
                      setVehicleForm((s) => ({ ...s, startYear: e.target.value }))
                    }
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Năm kết thúc <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="number"
                    placeholder="VD: 2025"
                    value={vehicleForm.endYear}
                    onChange={(e) =>
                      setVehicleForm((s) => ({ ...s, endYear: e.target.value }))
                    }
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Ảnh xe
                </label>
                {editImageUrls && editImageUrls.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-2">
                    {editImageUrls.map((url, i) => (
                      <div key={i} className="relative">
                        <img src={url} alt={`vehicle-${i}`} className="w-20 h-20 object-cover rounded-md" />
                        <button
                          type="button"
                          onClick={() => setEditImageUrls((prev) => prev.filter((_, idx) => idx !== i))}
                          className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs"
                          title="Xóa ảnh"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    setEditImageFiles(files);
                  }}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
                {editImageFiles && editImageFiles.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {editImageFiles.map((f, i) => (
                      <img key={i} src={URL.createObjectURL(f)} alt={f.name} className="w-20 h-20 object-cover rounded-md" />
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Pin tương thích
                </label>
                <div className="relative battery-dropdown-container">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-between"
                    onClick={() => setBatteryDropdownOpen(!batteryDropdownOpen)}
                  >
                    <span>
                      {vehicleForm.compatibleBatteryIds.length > 0
                        ? `Đã chọn ${vehicleForm.compatibleBatteryIds.length} pin`
                        : "Chọn pin tương thích"}
                    </span>
                    <span className="text-muted-foreground">▼</span>
                  </Button>
                  {batteryDropdownOpen && (
                    <div className="absolute z-50 w-full mt-1 bg-card border rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {batteries.length === 0 ? (
                        <div className="p-3 text-sm text-muted-foreground">
                          Không có pin nào
                        </div>
                      ) : (
                        <div className="p-2">
                          {batteries.map((battery) => (
                            <label
                              key={battery.id}
                              className="flex items-center gap-2 p-2 hover:bg-muted rounded cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={vehicleForm.compatibleBatteryIds.includes(battery.id)}
                                onChange={() => toggleBattery(battery.id)}
                                className="rounded"
                              />
                              <span className="text-sm">
                                {battery.brand} {battery.model}
                                {battery.capacity && ` (${battery.capacity} kWh)`}
                              </span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {vehicleForm.compatibleBatteryIds.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {getSelectedBatteryNames().map((name, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {name}
                        <button
                          type="button"
                          onClick={() => {
                            const battery = batteries.find(
                              (b) => `${b.brand} ${b.model}` === name
                            );
                            if (battery) toggleBattery(battery.id);
                          }}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditingVehicle(null);
                    setVehicleForm({ brand: "", model: "", startYear: "", endYear: "", compatibleBatteryIds: [], imgs: "" });
                    setEditImageFiles([]);
                    setEditImageUrls([]);
                    setError(null);
                  }}
                  disabled={updatingIds.has(editingVehicle.id)}
                >
                  Hủy
                </Button>
                <Button type="submit" disabled={updatingIds.has(editingVehicle.id)}>
                  {updatingIds.has(editingVehicle.id) ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Đang cập nhật...
                    </>
                  ) : (
                    <>
                      <Edit className="h-4 w-4 mr-2" />
                      Cập nhật
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tìm kiếm & Lọc</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm theo brand hoặc model..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterApproved === "all" ? "default" : "outline"}
                onClick={() => setFilterApproved("all")}
                size="sm"
              >
                Tất cả
              </Button>
              <Button
                variant={filterApproved === "approved" ? "default" : "outline"}
                onClick={() => setFilterApproved("approved")}
                size="sm"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Đã duyệt
              </Button>
              <Button
                variant={filterApproved === "pending" ? "default" : "outline"}
                onClick={() => setFilterApproved("pending")}
                size="sm"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Chờ duyệt
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="text-destructive text-sm">{error}</div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Đang tải...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Vehicles Table */}
      {!loading && !error && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Danh sách Xe Điện ({filteredVehicles.length})</CardTitle>
                <CardDescription>
                  Tổng số: {vehicles.length} xe | Đã duyệt: {vehicles.filter(v => v.isAproved).length} | Chờ duyệt: {vehicles.filter(v => !v.isAproved).length}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredVehicles.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Không tìm thấy xe nào
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 text-sm font-semibold">Ảnh</th>
                      <th className="text-left p-3 text-sm font-semibold">Brand</th>
                      <th className="text-left p-3 text-sm font-semibold">Model</th>
                      <th className="text-left p-3 text-sm font-semibold">Năm sản xuất</th>
                      <th className="text-left p-3 text-sm font-semibold">Battery Models</th>
                      {/* <th className="text-center p-3 text-sm font-semibold">Listings</th> */}
                      <th className="text-center p-3 text-sm font-semibold">Trạng thái</th>
                      <th className="text-center p-3 text-sm font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredVehicles.map((vehicle) => (
                      <tr
                        key={vehicle.id}
                        className="border-b hover:bg-muted/50 transition-colors"
                      >
                        <td className="p-3">
                          <img
                            src={getFirstImage(vehicle.imgs)}
                            alt={`${vehicle.brand || ""} ${vehicle.model || ""}`.trim() || "vehicle"}
                            className="w-14 h-14 object-cover rounded-md border"
                            onError={(e) => { e.currentTarget.src = "/placeholder.svg"; }}
                          />
                        </td>
                        <td className="p-3 text-sm font-medium">{vehicle.brand || "—"}</td>
                        <td className="p-3 text-sm">{vehicle.model || "—"}</td>
                        <td className="p-3 text-sm">
                          {vehicle.startYear && vehicle.endYear ? (
                            vehicle.startYear === vehicle.endYear ? (
                              vehicle.startYear
                            ) : (
                              `${vehicle.startYear} - ${vehicle.endYear}`
                            )
                          ) : vehicle.startYear ? (
                            vehicle.startYear
                          ) : vehicle.endYear ? (
                            vehicle.endYear
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="p-3 text-sm">
                          {vehicle.batteryModels && vehicle.batteryModels.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {vehicle.batteryModels.map((battery, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {battery}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        {/* <td className="p-3 text-sm text-center">
                          <Badge variant="secondary">{vehicle.listingCount || 0}</Badge>
                        </td> */}
                        <td className="p-3 text-center">
                          {vehicle.isAproved ? (
                            <Badge className="bg-green-600 hover:bg-green-700">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Đã duyệt
                            </Badge>
                          ) : (
                            <Badge variant="destructive">
                              <XCircle className="h-3 w-3 mr-1" />
                              Chờ duyệt
                            </Badge>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {!vehicle.isAproved && (
                              <Button
                                size="sm"
                                onClick={() => handleApprove(vehicle.id)}
                                disabled={approvingIds.has(vehicle.id) || updatingIds.has(vehicle.id) || deletingIds.has(vehicle.id)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                {approvingIds.has(vehicle.id) ? (
                                  <>
                                    <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                                    Đang duyệt...
                                  </>
                                ) : (
                                  <>
                                    <Check className="h-3 w-3 mr-1" />
                                    Duyệt
                                  </>
                                )}
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(vehicle)}
                              disabled={approvingIds.has(vehicle.id) || updatingIds.has(vehicle.id) || deletingIds.has(vehicle.id)}
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Sửa
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(vehicle.id, vehicle.brand, vehicle.model)}
                              disabled={approvingIds.has(vehicle.id) || updatingIds.has(vehicle.id) || deletingIds.has(vehicle.id)}
                            >
                              {deletingIds.has(vehicle.id) ? (
                                <>
                                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                                  Đang xóa...
                                </>
                              ) : (
                                <>
                                  <Trash2 className="h-3 w-3 mr-1" />
                                  Xóa
                                </>
                              )}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

