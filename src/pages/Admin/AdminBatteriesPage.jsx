import { useEffect, useState } from "react";
import { BatteryCharging, CheckCircle2, XCircle, RefreshCw, Search, Check, Plus, Trash2, Edit } from "lucide-react";
import { getAllBatteries, approveBattery, createBattery, deleteBattery, updateBattery } from "../../api/userApi";
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

export default function AdminBatteriesPage() {
  const [batteries, setBatteries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterApproved, setFilterApproved] = useState("all"); // "all", "approved", "pending"
  const [approvingIds, setApprovingIds] = useState(new Set()); // Track which batteries are being approved
  const [deletingIds, setDeletingIds] = useState(new Set()); // Track which batteries are being deleted
  const [updatingIds, setUpdatingIds] = useState(new Set()); // Track which batteries are being updated
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editingBattery, setEditingBattery] = useState(null); // Track which battery is being edited
  const [batteryForm, setBatteryForm] = useState({
    brand: "",
    model: "",
    capacity: "",
    voltage: "",
    imgs: "",
  });
  const [createImageFiles, setCreateImageFiles] = useState([]);
  const [editImageFiles, setEditImageFiles] = useState([]);
  const [editImageUrls, setEditImageUrls] = useState([]);

  useEffect(() => {
    fetchBatteries();
  }, []);

  const fetchBatteries = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getAllBatteries();
      
      // Handle response structure: { statusCode, isSuccess, errorMessage, result }
      if (response.isSuccess && response.result) {
        setBatteries(response.result);
      } else {
        setError(response.errorMessage || "Failed to fetch batteries");
      }
    } catch (err) {
      setError(err.response?.data?.errorMessage || err.message || "Failed to load batteries");
      console.error("Error fetching batteries:", err);
    } finally {
      setLoading(false);
    }
  };

  // Upload ảnh lên Firebase Storage và trả về danh sách URL
  const uploadImagesAndGetUrls = async (files, folder = "battery-images") => {
    if (!files || files.length === 0) return [];
    const tasks = files.map(async (file) => {
      const fileRef = ref(storage, `${folder}/${Date.now()}_${file.name}`);
      await uploadBytes(fileRef, file);
      return await getDownloadURL(fileRef);
    });
    return Promise.all(tasks);
  };

  // Handle approve battery
  const handleApprove = async (batteryId) => {
    try {
      setApprovingIds((prev) => new Set(prev).add(batteryId));
      setError(null);
      
      const response = await approveBattery(batteryId);
      
      // Handle response structure: { statusCode, isSuccess, errorMessage, result }
      if (response.isSuccess) {
        // Reload battery list after successful approval
        await fetchBatteries();
      } else {
        setError(response.errorMessage || "Failed to approve battery");
      }
    } catch (err) {
      setError(err.response?.data?.errorMessage || err.message || "Failed to approve battery");
      console.error("Error approving battery:", err);
    } finally {
      setApprovingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(batteryId);
        return newSet;
      });
    }
  };

  // Handle create battery
  const handleCreateBattery = async (e) => {
    e.preventDefault();
    try {
      setCreating(true);
      setError(null);

      // Validate form
      if (!batteryForm.brand || !batteryForm.model || !batteryForm.capacity || !batteryForm.voltage) {
        setError("Vui lòng điền đầy đủ thông tin");
        return;
      }

      // Prepare battery data
      const batteryData = {
        brand: batteryForm.brand.trim(),
        model: batteryForm.model.trim(),
        capacity: Number(batteryForm.capacity),
        voltage: batteryForm.voltage.trim(),
        imgs: "",
      };

      // Upload ảnh nếu có
      const uploaded = await uploadImagesAndGetUrls(createImageFiles, "battery-images");
      if (uploaded.length > 0) {
        batteryData.imgs = uploaded.join(",");
      }

      const response = await createBattery(batteryData);

      // Handle response structure: { statusCode, isSuccess, errorMessage, result }
      if (response.isSuccess) {
        // Reset form
        setBatteryForm({ brand: "", model: "", capacity: "", voltage: "", imgs: "" });
        setCreateImageFiles([]);
        setShowCreateForm(false);
        // Reload battery list after successful creation
        await fetchBatteries();
      } else {
        setError(response.errorMessage || "Failed to create battery");
      }
    } catch (err) {
      setError(err.response?.data?.errorMessage || err.message || "Failed to create battery");
      console.error("Error creating battery:", err);
    } finally {
      setCreating(false);
    }
  };

  // Handle delete battery
  const handleDelete = async (batteryId, batteryBrand, batteryModel) => {
    // Confirm before deleting
    const batteryName = `${batteryBrand || ""} ${batteryModel || ""}`.trim() || "pin này";
    if (!window.confirm(`Bạn có chắc chắn muốn xóa ${batteryName}? Hành động này không thể hoàn tác.`)) {
      return;
    }

    try {
      setDeletingIds((prev) => new Set(prev).add(batteryId));
      setError(null);

      const response = await deleteBattery(batteryId);

      // Handle response structure: { statusCode, isSuccess, errorMessage, result }
      if (response.isSuccess) {
        // Reload battery list after successful deletion
        await fetchBatteries();
      } else {
        setError(response.errorMessage || "Failed to delete battery");
      }
    } catch (err) {
      setError(err.response?.data?.errorMessage || err.message || "Failed to delete battery");
      console.error("Error deleting battery:", err);
    } finally {
      setDeletingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(batteryId);
        return newSet;
      });
    }
  };

  // Handle edit battery - open edit form
  const handleEdit = (battery) => {
    setEditingBattery(battery);
    setBatteryForm({
      brand: battery.brand || "",
      model: battery.model || "",
      capacity: battery.capacity?.toString() || "",
      voltage: battery.voltage || "",
      imgs: typeof battery.imgs === "string" ? battery.imgs : Array.isArray(battery.imgs) ? battery.imgs.join(",") : "",
    });
    const urls = typeof battery.imgs === "string"
      ? battery.imgs.split(",").map((s) => s.trim()).filter(Boolean)
      : Array.isArray(battery.imgs) ? battery.imgs : [];
    setEditImageUrls(urls);
    setEditImageFiles([]);
  };

  // Handle update battery
  const handleUpdateBattery = async (e) => {
    e.preventDefault();
    if (!editingBattery) return;

    try {
      setUpdatingIds((prev) => new Set(prev).add(editingBattery.id));
      setError(null);

      // Validate form
      if (!batteryForm.brand || !batteryForm.model || !batteryForm.capacity || !batteryForm.voltage) {
        setError("Vui lòng điền đầy đủ thông tin");
        return;
      }

      // Prepare battery data
      const batteryData = {
        brand: batteryForm.brand.trim(),
        model: batteryForm.model.trim(),
        capacity: Number(batteryForm.capacity),
        voltage: batteryForm.voltage.trim(),
        imgs: batteryForm.imgs || "",
      };

      // Nếu có upload mới, upload và merge với URL cũ
      if (editImageFiles.length > 0) {
        const newUrls = await uploadImagesAndGetUrls(editImageFiles, "battery-images");
        const finalUrls = [...(editImageUrls || []), ...newUrls];
        batteryData.imgs = finalUrls.join(",");
      } else if (editImageUrls && editImageUrls.length >= 0) {
        batteryData.imgs = editImageUrls.join(",");
      }

      const response = await updateBattery(editingBattery.id, batteryData);

      // Handle response structure: { statusCode, isSuccess, errorMessage, result }
      if (response.isSuccess) {
        // Reset form and close edit dialog
        setEditingBattery(null);
        setBatteryForm({ brand: "", model: "", capacity: "", voltage: "", imgs: "" });
        setEditImageFiles([]);
        setEditImageUrls([]);
        // Reload battery list after successful update
        await fetchBatteries();
      } else {
        setError(response.errorMessage || "Failed to update battery");
      }
    } catch (err) {
      setError(err.response?.data?.errorMessage || err.message || "Failed to update battery");
      console.error("Error updating battery:", err);
    } finally {
      setUpdatingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(editingBattery?.id);
        return newSet;
      });
    }
  };

  // Filter batteries based on search and approval status
  const filteredBatteries = batteries.filter((battery) => {
    const matchesSearch =
      battery.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      battery.model?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filterApproved === "all" ||
      (filterApproved === "approved" && battery.isAproved) ||
      (filterApproved === "pending" && !battery.isAproved);

    return matchesSearch && matchesFilter;
  });

  const getFirstImage = (imgs) => {
    if (!imgs) return "/placeholder.svg";
    if (Array.isArray(imgs)) return imgs[0] || "/placeholder.svg";
    // imgs có thể là chuỗi với nhiều URL, phân tách bởi dấu phẩy
    const first = String(imgs).split(",").map((s) => s.trim()).filter(Boolean)[0];
    return first || "/placeholder.svg";
  };

  return (
    <div className="space-y-6 p-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BatteryCharging className="h-6 w-6" />
            Quản lý Pin
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Xem và quản lý tất cả pin trong hệ thống
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowCreateForm(!showCreateForm)}
            variant="default"
          >
            <Plus className="h-4 w-4 mr-2" />
            Tạo Pin Mới
          </Button>
          <Button onClick={fetchBatteries} disabled={loading} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Làm mới
          </Button>
        </div>
      </header>

      {/* Create Battery Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tạo Pin Mới</CardTitle>
            <CardDescription>
              Điền thông tin để tạo pin mới trong hệ thống
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateBattery} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Brand <span className="text-destructive">*</span>
                  </label>
                  <Input
                    placeholder="VD: Panasonic"
                    value={batteryForm.brand}
                    onChange={(e) =>
                      setBatteryForm((s) => ({ ...s, brand: e.target.value }))
                    }
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Model <span className="text-destructive">*</span>
                  </label>
                  <Input
                    placeholder="VD: NCR18650B"
                    value={batteryForm.model}
                    onChange={(e) =>
                      setBatteryForm((s) => ({ ...s, model: e.target.value }))
                    }
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Capacity (kWh) <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="number"
                    placeholder="VD: 60"
                    value={batteryForm.capacity}
                    onChange={(e) =>
                      setBatteryForm((s) => ({ ...s, capacity: e.target.value }))
                    }
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Voltage <span className="text-destructive">*</span>
                  </label>
                  <Input
                    placeholder="VD: 400"
                    value={batteryForm.voltage}
                    onChange={(e) =>
                      setBatteryForm((s) => ({ ...s, voltage: e.target.value }))
                    }
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Ảnh pin (có thể chọn nhiều)
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
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false);
                    setBatteryForm({ brand: "", model: "", capacity: "", voltage: "", imgs: "" });
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
                      Tạo Pin
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Edit Battery Form */}
      {editingBattery && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Sửa Pin</CardTitle>
            <CardDescription>
              Cập nhật thông tin cho pin: {editingBattery.brand} {editingBattery.model}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateBattery} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Brand <span className="text-destructive">*</span>
                  </label>
                  <Input
                    placeholder="VD: Panasonic"
                    value={batteryForm.brand}
                    onChange={(e) =>
                      setBatteryForm((s) => ({ ...s, brand: e.target.value }))
                    }
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Model <span className="text-destructive">*</span>
                  </label>
                  <Input
                    placeholder="VD: NCR18650B"
                    value={batteryForm.model}
                    onChange={(e) =>
                      setBatteryForm((s) => ({ ...s, model: e.target.value }))
                    }
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Capacity (kWh) <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="number"
                    placeholder="VD: 60"
                    value={batteryForm.capacity}
                    onChange={(e) =>
                      setBatteryForm((s) => ({ ...s, capacity: e.target.value }))
                    }
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Voltage <span className="text-destructive">*</span>
                  </label>
                  <Input
                    placeholder="VD: 400"
                    value={batteryForm.voltage}
                    onChange={(e) =>
                      setBatteryForm((s) => ({ ...s, voltage: e.target.value }))
                    }
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Ảnh pin
                </label>
                {editImageUrls && editImageUrls.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-2">
                    {editImageUrls.map((url, i) => (
                      <div key={i} className="relative">
                        <img src={url} alt={`battery-${i}`} className="w-20 h-20 object-cover rounded-md" />
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
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditingBattery(null);
                    setBatteryForm({ brand: "", model: "", capacity: "", voltage: "", imgs: "" });
                    setEditImageFiles([]);
                    setEditImageUrls([]);
                    setError(null);
                  }}
                  disabled={updatingIds.has(editingBattery.id)}
                >
                  Hủy
                </Button>
                <Button type="submit" disabled={updatingIds.has(editingBattery.id)}>
                  {updatingIds.has(editingBattery.id) ? (
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

      {/* Batteries Table */}
      {!loading && !error && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Danh sách Pin ({filteredBatteries.length})</CardTitle>
                <CardDescription>
                  Tổng số: {batteries.length} pin | Đã duyệt: {batteries.filter(b => b.isAproved).length} | Chờ duyệt: {batteries.filter(b => !b.isAproved).length}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredBatteries.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Không tìm thấy pin nào
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 text-sm font-semibold">Ảnh</th>
                      <th className="text-left p-3 text-sm font-semibold">Brand</th>
                      <th className="text-left p-3 text-sm font-semibold">Model</th>
                      <th className="text-left p-3 text-sm font-semibold">Capacity</th>
                      <th className="text-left p-3 text-sm font-semibold">Voltage</th>
                      {/* <th className="text-center p-3 text-sm font-semibold">Listings</th> */}
                      <th className="text-center p-3 text-sm font-semibold">Trạng thái</th>
                      <th className="text-center p-3 text-sm font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBatteries.map((battery) => (
                      <tr
                        key={battery.id}
                        className="border-b hover:bg-muted/50 transition-colors"
                      >
                        <td className="p-3">
                          <img
                            src={getFirstImage(battery.imgs)}
                            alt={`${battery.brand || ""} ${battery.model || ""}`.trim() || "battery"}
                            className="w-14 h-14 object-cover rounded-md border"
                            onError={(e) => { e.currentTarget.src = "/placeholder.svg"; }}
                          />
                        </td>
                        <td className="p-3 text-sm font-medium">{battery.brand || "—"}</td>
                        <td className="p-3 text-sm">{battery.model || "—"}</td>
                        <td className="p-3 text-sm">
                          {battery.capacity ? `${battery.capacity} kWh` : "—"}
                        </td>
                        <td className="p-3 text-sm">{battery.voltage || "—"}</td>
                        {/* <td className="p-3 text-sm text-center">
                          <Badge variant="secondary">{battery.listingCount || 0}</Badge>
                        </td> */}
                        <td className="p-3 text-center">
                          {battery.isAproved ? (
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
                            {!battery.isAproved && (
                              <Button
                                size="sm"
                                onClick={() => handleApprove(battery.id)}
                                disabled={approvingIds.has(battery.id) || deletingIds.has(battery.id) || updatingIds.has(battery.id)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                {approvingIds.has(battery.id) ? (
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
                              onClick={() => handleEdit(battery)}
                              disabled={approvingIds.has(battery.id) || deletingIds.has(battery.id) || updatingIds.has(battery.id)}
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Sửa
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(battery.id, battery.brand, battery.model)}
                              disabled={approvingIds.has(battery.id) || deletingIds.has(battery.id) || updatingIds.has(battery.id)}
                            >
                              {deletingIds.has(battery.id) ? (
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

