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
    address: ""
  });

  useEffect(() => {
    const loadProfileAndListings = async () => {
      setLoading(true);
      setError(null);

      try {
        // Set profile từ user context (nếu có)
        if (user) {
          setProfile(user);
        } else {
          // Nếu không có user, vẫn hiển thị profile page nhưng với thông tin cơ bản
          setProfile({
            username: "Guest",
            email: "Not logged in",
            fullName: "Guest User"
          });
        }

        // Lấy tất cả listings từ API
        const allListings = await getAllListings();
        
        // Lọc listings của user hiện tại dựa trên userId
        const userListings = allListings.filter(listing => 
          listing.userId === user?.id
        );
        
        // Chỉ hiển thị 5 listings đầu tiên của user
        setListings(userListings.slice(0, 5));
      } catch (err) {
        console.error(err);
        setError(err?.response?.data?.errorMessage || err.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    loadProfileAndListings();
  }, [user]);

  const handleDeleteListing = async (listingId) => {
    if (!window.confirm("Are you sure you want to delete this listing?")) {
      return;
    }

    setDeleteLoading(listingId);
    try {
      await deleteListing(listingId);
      // Remove listing from state after successful deletion
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
    setEditingListing(listing);
    setEditForm({
      title: listing.title || "",
      description: listing.description || "",
      address: listing.address || ""
    });
    setShowEditModal(true);
  };

  const handleUpdateListing = async (e) => {
    e.preventDefault();
    if (!editingListing) return;

    setEditLoading(true);
    try {
      const listingId = editingListing.id ?? editingListing.listingId ?? editingListing._id;
      
      // Tạo payload update
      const updatePayload = {
        title: editForm.title.trim(),
        description: editForm.description?.trim() || "",
        address: editForm.address?.trim() || "",
        listingBatteries: editingListing.listingBatteries || [],
        listingVehicles: editingListing.listingVehicles || []
      };

      const payload = [updatePayload];

      console.log("Update payload:", JSON.stringify(payload, null, 2));

      const res = await updateListing(listingId, payload);
      console.log("Update response:", res);

      // Update listing in state
      setListings(prev => prev.map(l => 
        (l.id ?? l.listingId ?? l._id) === listingId 
          ? { ...l, ...updatePayload }
          : l
      ));

      setShowEditModal(false);
      setEditingListing(null);
      alert("Listing updated successfully!");
    } catch (err) {
      console.error("Error updating listing:", err);
      alert(err?.response?.data?.message || "Failed to update listing");
    } finally {
      setEditLoading(false);
    }
  };

  const handleViewAllListings = () => {
    navigate("/listings");
  };

  if (loading) return <Placeholder title="Loading profile..." description="Please wait" />;

  return (
    <div className="obys-hero py-14">
      <div className="container max-w-5xl fade-in-slow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left column: profile */}
          <div className="col-span-1 obys-card rounded-lg p-6">
            <div className="flex flex-col items-center">
              <div className="w-28 h-28 rounded-full bg-white/6 flex items-center justify-center text-2xl font-bold mb-4 text-white">
                {(profile?.fullName ?? profile?.username)?.charAt(0)?.toUpperCase() || "G"}
              </div>
              <div className="text-lg font-semibold text-white">{profile?.fullName ?? profile?.username ?? "Guest"}</div>
              <div className="text-sm text-white/80">{profile?.email ?? "Not logged in"}</div>
              <div className="mt-4 w-full space-y-2">
                {user ? (
                  <>
                    <button
                      className="btn w-full"
                      onClick={() => navigate("/settings", { state: { tab: "edit" } })}
                    >
                      Edit profile
                    </button>
                    <button
                      className="btn w-full btn-secondary"
                      onClick={() => navigate("/new-listing")}
                    >
                      Create New Listing
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="btn w-full"
                      onClick={() => navigate("/login")}
                    >
                      Login
                    </button>
                    <button
                      className="btn w-full btn-secondary"
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
            <div className="obys-card rounded-lg p-6 mb-6 text-white">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">
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
                    <div className="text-white/80 mb-4">
                      {user ? "You have no listings yet." : "No listings available."}
                    </div>
                    {user && (
                      <button
                        className="btn btn-primary"
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
                      className="border border-white/10 rounded-lg p-4 hover:bg-white/5 transition-colors"
                    >
                      {/* Listing Header */}
                      <div className="flex items-start gap-4 mb-3">
                        {/* Listing Image */}
                        <div
                          className="w-16 h-16 bg-white/6 rounded flex items-center justify-center text-sm font-medium text-white/90 cursor-pointer flex-shrink-0"
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
                          <div className="text-sm text-white/80 mb-2 line-clamp-2">{listing.description}</div>
                          <div className="text-xs text-white/60">
                            {listing.listingBatteries?.length > 0 && `${listing.listingBatteries.length} battery(s)`}
                            {listing.listingBatteries?.length > 0 && listing.listingVehicles?.length > 0 && " • "}
                            {listing.listingVehicles?.length > 0 && `${listing.listingVehicles.length} vehicle(s)`}
                          </div>
                        </div>
                      </div>

                      {/* Listing Footer với Action Buttons - chỉ hiển thị cho chủ sở hữu */}
                      {isOwner && (
                        <div className="flex justify-between items-center pt-3 border-t border-white/10">
                          <div className="text-xs text-white/60">
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

            <div className="obys-card rounded-lg p-6 text-white">
              <h2 className="text-xl font-semibold mb-4">Activity</h2>
              <div className="text-sm text-white/80">
                {user ? "No recent activity. This area will show messages, offers and transaction history." : "Please login to see your activity."}
              </div>
            </div>
          </div>
        </div>

        {/* Edit Listing Modal */}
        {showEditModal && editingListing && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Edit Listing</h2>

              <form onSubmit={handleUpdateListing} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title *
                  </label>
                  <Input
                    type="text"
                    value={editForm.title}
                    onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter listing title"
                    required
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <Input
                    type="text"
                    value={editForm.description}
                    onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter description"
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <Input
                    type="text"
                    value={editForm.address}
                    onChange={(e) => setEditForm(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Enter address"
                    className="w-full"
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    type="submit"
                    disabled={editLoading}
                    className="flex-1"
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
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}