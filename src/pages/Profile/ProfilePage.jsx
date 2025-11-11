import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { api, deleteListing, updateListing } from "../../api/ListingApi";
import Placeholder from "../../components/Placeholder/Placeholder";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";

// API call
const getAllListings = async () => {
  const { data } = await api.get("/api/Listing/all");
  return data?.result ?? data ?? [];
};

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState(null);
  const [listings, setListings] = useState([]);
  const [editingListing, setEditingListing] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  // Form state for editing
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    address: "",
    itemType: "Battery",
    listingBatteries: [],
    listingVehicles: []
  });

  // State for available batteries and vehicles
  const [availableBatteries, setAvailableBatteries] = useState([]);
  const [availableVehicles, setAvailableVehicles] = useState([]);
  const [selectedBatteryId, setSelectedBatteryId] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState("");

  useEffect(() => {
    const loadProfileAndListings = async () => {
      setLoading(true);
      setError(null);

      try {
        if (user) {
          setProfile(user);
        } else {
          setProfile({
            username: "Guest",
            email: "Not logged in",
            fullName: "Guest User"
          });
        }

        const allListings = await getAllListings();
        const userListings = allListings.filter(listing => 
          listing.userId === user?.id
        );
        setListings(userListings.slice(0, 5));

        // Load available batteries and vehicles
        const [batteriesRes, vehiclesRes] = await Promise.allSettled([
          api.get("/api/Battery/all"),
          api.get("/api/Vehicle/Getall")
        ]);

        if (batteriesRes.status === "fulfilled") {
          setAvailableBatteries(Array.isArray(batteriesRes.value.data) ? batteriesRes.value.data : batteriesRes.value.data?.result ?? []);
        }

        if (vehiclesRes.status === "fulfilled") {
          setAvailableVehicles(Array.isArray(vehiclesRes.value.data) ? vehiclesRes.value.data : vehiclesRes.value.data?.result ?? []);
        }
      } catch (err) {
        console.error(err);
        setError(err?.response?.data?.errorMessage || err.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    loadProfileAndListings();
  }, [user]);

  // Clear data khi itemType thay đổi (logic từ NewListing)
  useEffect(() => {
    if (!showEditModal) return;

    // Clear batteries khi itemType không phải Battery hoặc FullSet
    if (editForm.itemType !== "Battery" && editForm.itemType !== "FullSet") {
      setEditForm(prev => ({
        ...prev,
        listingBatteries: []
      }));
    }
    
    // Clear vehicles khi itemType không phải Vehicle hoặc FullSet
    if (editForm.itemType !== "Vehicle" && editForm.itemType !== "FullSet") {
      setEditForm(prev => ({
        ...prev,
        listingVehicles: []
      }));
    }
  }, [editForm.itemType, showEditModal]);

  const handleDeleteListing = async (listingId) => {
    if (!window.confirm("Are you sure you want to delete this listing?")) {
      return;
    }

    setDeleteLoading(listingId);
    try {
      await deleteListing(listingId);
      setListings(prev => prev.filter(l => (l.id ?? l.listingId ?? l._id) !== listingId));
      alert("Listing deleted successfully!");
    } catch (err) {
      console.error("Error deleting listing:", err);
      alert(err?.response?.data?.message || "Failed to delete listing");
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleEditListing = (listing) => {
    // ✅ CẢI THIỆN: Xác định itemType chính xác hơn
    let itemType = "Battery"; // default
    
    if (listing.listingBatteries?.length > 0 && listing.listingVehicles?.length > 0) {
      itemType = "FullSet";
    } else if (listing.listingVehicles?.length > 0) {
      itemType = "Vehicle";
    } else if (listing.listingBatteries?.length > 0) {
      itemType = "Battery";
    }

    // ✅ Kiểm tra xem listing có itemType từ server không
    if (listing.itemType) {
      itemType = listing.itemType;
    }

    setEditingListing(listing);
    setEditForm({
      title: listing.title || "",
      description: listing.description || "",
      address: listing.address || "",
      itemType: itemType,
      listingBatteries: listing.listingBatteries || [],
      listingVehicles: listing.listingVehicles || []
    });
    setShowEditModal(true);
  };

  const handleUpdateListing = async (e) => {
    e.preventDefault();
    if (!editingListing) return;

    // Validate based on itemType (logic từ NewListing)
    if (editForm.itemType === "Battery" && editForm.listingBatteries.length === 0) {
      alert("Please add at least one battery for Battery type listing");
      return;
    }

    if (editForm.itemType === "Vehicle" && editForm.listingVehicles.length === 0) {
      alert("Please add at least one vehicle for Vehicle type listing");
      return;
    }

    if (editForm.itemType === "FullSet" && editForm.listingBatteries.length === 0 && editForm.listingVehicles.length === 0) {
      alert("Please add at least one battery or vehicle for FullSet type listing");
      return;
    }

    setEditLoading(true);
    try {
      const listingId = editingListing.id ?? editingListing.listingId ?? editingListing._id;
      
      // ✅ ÁP DỤNG LOGIC TỪ CREATE: Chuẩn bị data dựa trên itemType
      let listingBatteriesData = [];
      if (editForm.itemType === "Battery" || editForm.itemType === "FullSet") {
        listingBatteriesData = editForm.listingBatteries.map(battery => ({
          batteryId: battery.batteryId,
          health: battery.health || 0,
          price: battery.price || 0,
          suggestedPrice: battery.suggestedPrice || 0,
          imgs: Array.isArray(battery.imgs) ? battery.imgs.join(",") : battery.imgs || ""
        }));
      }

      let listingVehiclesData = [];
      if (editForm.itemType === "Vehicle" || editForm.itemType === "FullSet") {
        listingVehiclesData = editForm.listingVehicles.map(vehicle => ({
          vehicleId: vehicle.vehicleId,
          odometer: vehicle.odometer || 0,
          batteryHealth: vehicle.batteryHealth || 0,
          color: vehicle.color || "",
          vhr: vehicle.vhr || "",
          licenseDate: vehicle.licenseDate || "",
          price: vehicle.price || 0,
          suggestedPrice: vehicle.suggestedPrice || 0,
          imgs: Array.isArray(vehicle.imgs) ? vehicle.imgs.join(",") : vehicle.imgs || ""
        }));
      }

      // ✅ TẠO PAYLOAD GIỐNG NHƯ CREATE
      const updatePayload = {
        title: editForm.title.trim(),
        description: editForm.description?.trim() || "",
        address: editForm.address?.trim() || "",
        itemType: editForm.itemType, // ✅ QUAN TRỌNG: Thêm itemType
        listingBatteries: listingBatteriesData,
        listingVehicles: listingVehiclesData
      };

      console.log("Update payload:", JSON.stringify(updatePayload, null, 2));

      // ✅ Gọi API update - payload là object, không phải array
      const res = await updateListing(listingId, updatePayload);
      console.log("Update response:", res);

      // Cập nhật state
      setListings(prev => prev.map(l => 
        (l.id ?? l.listingId ?? l._id) === listingId 
          ? { 
              ...l, 
              ...updatePayload,
              listingBatteries: listingBatteriesData,
              listingVehicles: listingVehiclesData
            }
          : l
      ));

      setShowEditModal(false);
      setEditingListing(null);
      alert("Listing updated successfully!");
    } catch (err) {
      console.error("Error updating listing:", err);
      console.error("Error response:", err.response?.data);
      
      let errorMessage = "Failed to update listing";
      if (err.response?.data) {
        errorMessage = err.response.data?.title || 
                      err.response.data?.errorMessage || 
                      err.response.data?.message ||
                      JSON.stringify(err.response.data);
      }
      
      alert(`Error: ${errorMessage}`);
    } finally {
      setEditLoading(false);
    }
  };

  // Hàm xử lý thay đổi itemType
  const handleItemTypeChange = (newItemType) => {
    setEditForm(prev => ({
      ...prev,
      itemType: newItemType
    }));
  };

  // Hàm thêm battery mới với dropdown selection
  const handleAddBattery = () => {
    // ✅ THÊM VALIDATION GIỐNG CREATE
    if (editForm.itemType !== "Battery" && editForm.itemType !== "FullSet") {
      alert("Cannot add battery when item type is not Battery or FullSet");
      return;
    }

    if (!selectedBatteryId && availableBatteries.length > 0) {
      setSelectedBatteryId(availableBatteries[0].id ?? availableBatteries[0].batteryId ?? availableBatteries[0]._id);
    }
    
    if (!selectedBatteryId) {
      alert("Please select a battery first");
      return;
    }

    const selectedBattery = availableBatteries.find(b => 
      (b.id ?? b.batteryId ?? b._id) === selectedBatteryId
    );
    
    if (!selectedBattery) {
      alert("Selected battery not found");
      return;
    }

    const newBattery = {
      batteryId: selectedBattery.id ?? selectedBattery.batteryId ?? selectedBattery._id,
      health: 0,
      price: 0,
      suggestedPrice: 0,
      imgs: ""
    };
    
    setEditForm(prev => ({
      ...prev,
      listingBatteries: [...prev.listingBatteries, newBattery]
    }));
    
    // Reset selection
    setSelectedBatteryId("");
  };

  // Hàm cập nhật thông tin battery
  const handleUpdateBattery = (index, field, value) => {
    setEditForm(prev => ({
      ...prev,
      listingBatteries: prev.listingBatteries.map((battery, i) => 
        i === index ? { ...battery, [field]: value } : battery
      )
    }));
  };

  // Hàm xóa battery
  const handleRemoveBattery = (index) => {
    setEditForm(prev => ({
      ...prev,
      listingBatteries: prev.listingBatteries.filter((_, i) => i !== index)
    }));
  };

  // Hàm thêm vehicle mới với dropdown selection
  const handleAddVehicle = () => {
    // ✅ THÊM VALIDATION GIỐNG CREATE
    if (editForm.itemType !== "Vehicle" && editForm.itemType !== "FullSet") {
      alert("Cannot add vehicle when item type is not Vehicle or FullSet");
      return;
    }

    if (!selectedVehicleId && availableVehicles.length > 0) {
      setSelectedVehicleId(availableVehicles[0].id ?? availableVehicles[0].vehicleId ?? availableVehicles[0]._id);
    }
    
    if (!selectedVehicleId) {
      alert("Please select a vehicle first");
      return;
    }

    const selectedVehicle = availableVehicles.find(v => 
      (v.id ?? v.vehicleId ?? v._id) === selectedVehicleId
    );
    
    if (!selectedVehicle) {
      alert("Selected vehicle not found");
      return;
    }

    const newVehicle = {
      vehicleId: selectedVehicle.id ?? selectedVehicle.vehicleId ?? selectedVehicle._id,
      odometer: 0,
      batteryHealth: 0,
      color: "",
      vhr: "",
      licenseDate: "",
      price: 0,
      suggestedPrice: 0,
      imgs: ""
    };
    
    setEditForm(prev => ({
      ...prev,
      listingVehicles: [...prev.listingVehicles, newVehicle]
    }));
    
    // Reset selection
    setSelectedVehicleId("");
  };

  // Hàm cập nhật thông tin vehicle
  const handleUpdateVehicle = (index, field, value) => {
    setEditForm(prev => ({
      ...prev,
      listingVehicles: prev.listingVehicles.map((vehicle, i) => 
        i === index ? { ...vehicle, [field]: value } : vehicle
      )
    }));
  };

  // Hàm xóa vehicle
  const handleRemoveVehicle = (index) => {
    setEditForm(prev => ({
      ...prev,
      listingVehicles: prev.listingVehicles.filter((_, i) => i !== index)
    }));
  };

  const handleViewAllListings = () => {
    navigate("/listings");
  };

  // Hàm đóng modal khi click ra ngoài
  const handleModalClose = (e) => {
    if (e.target === e.currentTarget) {
      setShowEditModal(false);
      setEditingListing(null);
    }
  };

  if (loading) return <Placeholder title="Loading profile..." description="Please wait" />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black py-14">
      <div className="container max-w-5xl fade-in-slow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left column: profile */}
          <div className="col-span-1 bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex flex-col items-center">
              <div className="w-28 h-28 rounded-full bg-gray-700 flex items-center justify-center text-2xl font-bold mb-4 text-white">
                {(profile?.fullName ?? profile?.username)?.charAt(0)?.toUpperCase() || "G"}
              </div>
              <div className="text-lg font-semibold text-white">{profile?.fullName ?? profile?.username ?? "Guest"}</div>
              <div className="text-sm text-gray-300">{profile?.email ?? "Not logged in"}</div>
              <div className="mt-4 w-full space-y-2">
                {user ? (
                  <>
                    <button
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
                      onClick={() => navigate("/settings", { state: { tab: "edit" } })}
                    >
                      Edit profile
                    </button>
                    <button
                      className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors"
                      onClick={() => navigate("/new-listing")}
                    >
                      Create New Listing
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
                      onClick={() => navigate("/login")}
                    >
                      Login
                    </button>
                    <button
                      className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors"
                      onClick={() => navigate("/register")}
                    >
                      Register
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right column: listings */}
          <div className="col-span-2">
            <div className="bg-gray-800 rounded-lg p-6 mb-6 border border-gray-700">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-white">
                  {user ? "My Listings" : "Recent Listings"}
                </h2>
                {listings.length > 0 && (
                  <button
                    onClick={handleViewAllListings}
                    className="text-sm text-blue-400 hover:text-blue-300"
                  >
                    View All Listings
                  </button>
                )}
              </div>

              <div className="space-y-4">
                {listings.length === 0 && (
                  <div className="text-center py-8">
                    <div className="text-gray-300 mb-4">
                      {user ? "You have no listings yet." : "No listings available."}
                    </div>
                    {user && (
                      <button
                        className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-lg transition-colors"
                        onClick={() => navigate("/new-listing")}
                      >
                        Create Your First Listing
                      </button>
                    )}
                  </div>
                )}

                {listings.map((listing) => {
                  const listingId = listing.id ?? listing.listingId ?? listing._id;
                  const firstBattery = listing.listingBatteries?.[0];
                  const firstVehicle = listing.listingVehicles?.[0];
                  const displayPrice = firstBattery?.price || firstVehicle?.price;
                  const isOwner = user && listing.userId === user.id;

                  return (
                    <div
                      key={listingId}
                      className="border border-gray-700 rounded-lg p-4 hover:bg-gray-750 transition-colors bg-gray-800"
                    >
                      {/* Listing Header */}
                      <div className="flex items-start gap-4 mb-3">
                        {/* Listing Image */}
                        <div
                          className="w-16 h-16 bg-gray-700 rounded flex items-center justify-center text-sm font-medium text-gray-300 cursor-pointer flex-shrink-0"
                          onClick={() => navigate(`/listings/${listingId}`)}
                        >
                          {firstBattery?.imgs || firstVehicle?.imgs ? (
                            <img
                              src={(firstBattery?.imgs?.split(',')[0] || firstVehicle?.imgs?.split(',')[0])}
                              alt={listing.title}
                              className="w-full h-full object-cover rounded"
                            />
                          ) : (
                            "IMG"
                          )}
                        </div>

                        {/* Listing Info */}
                        <div
                          className="flex-1 cursor-pointer"
                          onClick={() => navigate(`/listings/${listingId}`)}
                        >
                          <div className="flex justify-between items-start">
                            <div className="font-medium text-white">{listing.title}</div>
                            <div className="text-sm font-semibold text-white">
                              {displayPrice ? `${displayPrice.toLocaleString('vi-VN')} VND` : "N/A"}
                            </div>
                          </div>
                          <div className="text-sm text-gray-300 mb-2 line-clamp-2">{listing.description}</div>
                          <div className="text-xs text-gray-400">
                            {listing.listingBatteries?.length > 0 && `${listing.listingBatteries.length} battery(s)`}
                            {listing.listingBatteries?.length > 0 && listing.listingVehicles?.length > 0 && " • "}
                            {listing.listingVehicles?.length > 0 && `${listing.listingVehicles.length} vehicle(s)`}
                          </div>
                        </div>
                      </div>

                      {/* Listing Footer với Action Buttons - chỉ hiển thị cho chủ sở hữu */}
                      {isOwner && (
                        <div className="flex justify-between items-center pt-3 border-t border-gray-700">
                          <div className="text-xs text-gray-400">
                            <span>Your listing</span>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditListing(listing);
                              }}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors flex items-center gap-1"
                              disabled={deleteLoading === listingId}
                            >
                              <svg
                                className="w-3 h-3"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                              Edit
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteListing(listingId);
                              }}
                              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors flex items-center gap-1"
                              disabled={deleteLoading === listingId}
                            >
                              <svg
                                className="w-3 h-3"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                              {deleteLoading === listingId ? "Deleting..." : "Delete"}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-semibold mb-4 text-white">Activity</h2>
              <div className="text-sm text-gray-300">
                {user ? "No recent activity. This area will show messages, offers and transaction history." : "Please login to see your activity."}
              </div>
            </div>
          </div>
        </div>

        {/* Edit Listing Modal */}
        {showEditModal && editingListing && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-70 flex items-start justify-center z-50 p-4 pt-20"
            onClick={handleModalClose}
          >
            <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl border border-gray-700 max-h-[75vh] overflow-hidden flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-white">Edit Listing</h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingListing(null);
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pr-2">
                <form onSubmit={handleUpdateListing} className="space-y-4">
                  {/* Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Title *
                      </label>
                      <Input
                        type="text"
                        value={editForm.title}
                        onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Enter listing title"
                        required
                        className="w-full bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Item Type *
                      </label>
                      <select
                        value={editForm.itemType}
                        onChange={(e) => handleItemTypeChange(e.target.value)}
                        className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                      >
                        <option value="Battery">Battery</option>
                        <option value="Vehicle">Vehicle</option>
                        <option value="FullSet">Full Set</option>
                      </select>
                      <p className="text-xs text-gray-400 mt-1">
                        Changing item type will clear unrelated items
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Description
                    </label>
                    <Input
                      type="text"
                      value={editForm.description}
                      onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Enter description"
                      className="w-full bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Address
                    </label>
                    <Input
                      type="text"
                      value={editForm.address}
                      onChange={(e) => setEditForm(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="Enter address"
                      className="w-full bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    />
                  </div>

                  {/* Battery Section */}
                  {(editForm.itemType === "Battery" || editForm.itemType === "FullSet") && (
                    <div className="border-t border-gray-700 pt-4">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="text-lg font-medium text-white">Batteries</h3>
                      </div>

                      {/* Battery Selection Dropdown */}
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Select Battery
                        </label>
                        <select
                          value={selectedBatteryId}
                          onChange={(e) => setSelectedBatteryId(e.target.value)}
                          className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                        >
                          <option value="">Choose a battery</option>
                          {availableBatteries.map(battery => (
                            <option key={battery.id ?? battery.batteryId ?? battery._id} 
                                    value={battery.id ?? battery.batteryId ?? battery._id}>
                              {battery.name || battery.model || `Battery ${battery.id}`}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex justify-between items-center mb-3">
                        <Button
                          type="button"
                          onClick={handleAddBattery}
                          className="bg-green-700 hover:bg-green-600 text-white"
                          disabled={availableBatteries.length === 0 || !selectedBatteryId}
                        >
                          Add Selected Battery
                        </Button>
                      </div>

                      {editForm.listingBatteries.length === 0 ? (
                        <div className="text-center py-4 text-gray-400">
                          No batteries added. Select a battery and click "Add Selected Battery" to add one.
                        </div>
                      ) : (
                        editForm.listingBatteries.map((battery, index) => (
                          <div key={index} className="border border-gray-600 rounded-lg p-4 mb-3 bg-gray-750">
                            <div className="flex justify-between items-center mb-2">
                              <h4 className="font-medium text-white">Battery {index + 1}</h4>
                              <Button
                                type="button"
                                onClick={() => handleRemoveBattery(index)}
                                variant="outline"
                                size="sm"
                                className="text-red-500 border-red-500 hover:bg-red-900 hover:text-white"
                              >
                                Remove
                              </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                  Health (%)
                                </label>
                                <Input
                                  type="number"
                                  value={battery.health}
                                  onChange={(e) => handleUpdateBattery(index, 'health', parseInt(e.target.value) || 0)}
                                  min="0"
                                  max="100"
                                  className="w-full bg-gray-700 border-gray-600 text-white"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                  Price (VND)
                                </label>
                                <Input
                                  type="number"
                                  value={battery.price}
                                  onChange={(e) => handleUpdateBattery(index, 'price', parseInt(e.target.value) || 0)}
                                  min="0"
                                  className="w-full bg-gray-700 border-gray-600 text-white"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                  Suggested Price (VND)
                                </label>
                                <Input
                                  type="number"
                                  value={battery.suggestedPrice}
                                  onChange={(e) => handleUpdateBattery(index, 'suggestedPrice', parseInt(e.target.value) || 0)}
                                  min="0"
                                  className="w-full bg-gray-700 border-gray-600 text-white"
                                />
                              </div>

                              <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                  Image URLs (comma separated)
                                </label>
                                <Input
                                  type="text"
                                  value={battery.imgs}
                                  onChange={(e) => handleUpdateBattery(index, 'imgs', e.target.value)}
                                  placeholder="Enter image URLs"
                                  className="w-full bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                                />
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* Vehicle Section */}
                  {(editForm.itemType === "Vehicle" || editForm.itemType === "FullSet") && (
                    <div className="border-t border-gray-700 pt-4">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="text-lg font-medium text-white">Vehicles</h3>
                      </div>

                      {/* Vehicle Selection Dropdown */}
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Select Vehicle
                        </label>
                        <select
                          value={selectedVehicleId}
                          onChange={(e) => setSelectedVehicleId(e.target.value)}
                          className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                        >
                          <option value="">Choose a vehicle</option>
                          {availableVehicles.map(vehicle => (
                            <option key={vehicle.id ?? vehicle.vehicleId ?? vehicle._id} 
                                    value={vehicle.id ?? vehicle.vehicleId ?? vehicle._id}>
                              {vehicle.name || vehicle.model || `Vehicle ${vehicle.id}`}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex justify-between items-center mb-3">
                        <Button
                          type="button"
                          onClick={handleAddVehicle}
                          className="bg-green-700 hover:bg-green-600 text-white"
                          disabled={availableVehicles.length === 0 || !selectedVehicleId}
                        >
                          Add Selected Vehicle
                        </Button>
                      </div>

                      {editForm.listingVehicles.length === 0 ? (
                        <div className="text-center py-4 text-gray-400">
                          No vehicles added. Select a vehicle and click "Add Selected Vehicle" to add one.
                        </div>
                      ) : (
                        editForm.listingVehicles.map((vehicle, index) => (
                          <div key={index} className="border border-gray-600 rounded-lg p-4 mb-3 bg-gray-750">
                            <div className="flex justify-between items-center mb-2">
                              <h4 className="font-medium text-white">Vehicle {index + 1}</h4>
                              <Button
                                type="button"
                                onClick={() => handleRemoveVehicle(index)}
                                variant="outline"
                                size="sm"
                                className="text-red-500 border-red-500 hover:bg-red-900 hover:text-white"
                              >
                                Remove
                              </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                  Odometer
                                </label>
                                <Input
                                  type="number"
                                  value={vehicle.odometer}
                                  onChange={(e) => handleUpdateVehicle(index, 'odometer', parseInt(e.target.value) || 0)}
                                  min="0"
                                  className="w-full bg-gray-700 border-gray-600 text-white"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                  Battery Health (%)
                                </label>
                                <Input
                                  type="number"
                                  value={vehicle.batteryHealth}
                                  onChange={(e) => handleUpdateVehicle(index, 'batteryHealth', parseInt(e.target.value) || 0)}
                                  min="0"
                                  max="100"
                                  className="w-full bg-gray-700 border-gray-600 text-white"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                  Color
                                </label>
                                <Input
                                  type="text"
                                  value={vehicle.color}
                                  onChange={(e) => handleUpdateVehicle(index, 'color', e.target.value)}
                                  placeholder="Enter color"
                                  className="w-full bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                  VHR
                                </label>
                                <Input
                                  type="text"
                                  value={vehicle.vhr}
                                  onChange={(e) => handleUpdateVehicle(index, 'vhr', e.target.value)}
                                  placeholder="Enter VHR"
                                  className="w-full bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                  License Date
                                </label>
                                <Input
                                  type="text"
                                  value={vehicle.licenseDate}
                                  onChange={(e) => handleUpdateVehicle(index, 'licenseDate', e.target.value)}
                                  placeholder="Enter license date"
                                  className="w-full bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                  Price (VND)
                                </label>
                                <Input
                                  type="number"
                                  value={vehicle.price}
                                  onChange={(e) => handleUpdateVehicle(index, 'price', parseInt(e.target.value) || 0)}
                                  min="0"
                                  className="w-full bg-gray-700 border-gray-600 text-white"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                  Suggested Price (VND)
                                </label>
                                <Input
                                  type="number"
                                  value={vehicle.suggestedPrice}
                                  onChange={(e) => handleUpdateVehicle(index, 'suggestedPrice', parseInt(e.target.value) || 0)}
                                  min="0"
                                  className="w-full bg-gray-700 border-gray-600 text-white"
                                />
                              </div>

                              <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                  Image URLs (comma separated)
                                </label>
                                <Input
                                  type="text"
                                  value={vehicle.imgs}
                                  onChange={(e) => handleUpdateVehicle(index, 'imgs', e.target.value)}
                                  placeholder="Enter image URLs"
                                  className="w-full bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                                />
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  <div className="flex gap-2 pt-4 border-t border-gray-700">
                    <Button
                      type="submit"
                      disabled={editLoading}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {editLoading ? "Updating..." : "Update Listing"}
                    </Button>
                    <Button
                      type="button"
                      onClick={() => {
                        setShowEditModal(false);
                        setEditingListing(null);
                      }}
                      variant="outline"
                      className="flex-1 bg-gray-700 hover:bg-gray-600 text-white border-gray-600"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}