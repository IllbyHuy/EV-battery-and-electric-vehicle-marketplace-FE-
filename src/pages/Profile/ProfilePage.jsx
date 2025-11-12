import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { api, deleteListing, setAuthToken } from "../../api/ListingApi";
import Placeholder from "../../components/Placeholder/Placeholder";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/button";

// API call - chỉ lấy listings của user hiện tại
const getUserListings = async () => {
  const { data } = await api.get("/api/Listing/UserAll");
  return data?.result ?? data ?? [];
};

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState(null);
  const [listings, setListings] = useState([]);
  const [deleteLoading, setDeleteLoading] = useState(null);
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const loadProfileAndListings = async () => {
      setLoading(true);
      setError(null);

      try {
        // ✅ THÊM: Set auth token trước khi gọi API
        const token = localStorage.getItem("authToken") || localStorage.getItem("token") || sessionStorage.getItem("authToken");
        if (token) {
          setAuthToken(token);
        }

        if (user) {
          setProfile(user);
          
          // ✅ CHỈ gọi API khi có user
          try {
            const userListings = await getUserListings();
            setListings(userListings.slice(0, 5));
          } catch (listingErr) {
            console.error("Error loading user listings:", listingErr);
            // Nếu lỗi, vẫn set listings là mảng rỗng thay vì không làm gì
            setListings([]);
          }
        } else {
          setProfile({
            username: "Guest",
            email: "Not logged in",
            fullName: "Guest User"
          });
          setListings([]); // ✅ Đảm bảo set listings rỗng khi không có user
        }

      } catch (err) {
        console.error(err);
        setError(err?.response?.data?.errorMessage || err.message || "Failed to load profile");
        setListings([]); // ✅ Đảm bảo set listings rỗng khi có lỗi
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
      setListings(prev => prev.filter(l => (l.id ?? l.listingId ?? l._id) !== listingId));
      alert("Listing deleted successfully!");
    } catch (err) {
      console.error("Error deleting listing:", err);
      alert(err?.response?.data?.message || "Failed to delete listing");
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleViewAllListings = () => {
    navigate("/listings");
  };

  // ✅ THÊM: Hàm refresh listings
  const handleRefreshListings = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const userListings = await getUserListings();
      setListings(userListings.slice(0, 5));
    } catch (err) {
      console.error("Error refreshing listings:", err);
      alert("Failed to refresh listings");
    } finally {
      setLoading(false);
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
                      onClick={() => navigate("/listings/new")}
                    >
                      Create New Listing
                    </button>
                    {/* ✅ THÊM: Nút refresh */}
                    <button
                      className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors"
                      onClick={handleRefreshListings}
                      disabled={loading}
                    >
                      {loading ? "Refreshing..." : "Refresh Listings"}
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
                <div className="flex gap-2">
                  {listings.length > 0 && (
                    <button
                      onClick={handleViewAllListings}
                      className="text-sm text-blue-400 hover:text-blue-300"
                    >
                      View All Listings
                    </button>
                  )}
                  {user && (
                    <button
                      onClick={handleRefreshListings}
                      className="text-sm text-green-400 hover:text-green-300"
                      disabled={loading}
                    >
                      {loading ? "Refreshing..." : "Refresh"}
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                {listings.length === 0 && (
                  <div className="text-center py-8">
                    <div className="text-gray-300 mb-4">
                      {user ? "You have no listings yet." : "No listings available."}
                    </div>
                    {user && (
                      <div className="space-y-2">
                        <button
                          className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-lg transition-colors"
                          onClick={() => navigate("/new-listing")}
                        >
                          Create Your First Listing
                        </button>
                        <button
                          className="bg-green-600 hover:bg-green-700 text-white py-2 px-6 rounded-lg transition-colors block mx-auto"
                          onClick={handleRefreshListings}
                          disabled={loading}
                        >
                          {loading ? "Refreshing..." : "Refresh Listings"}
                        </button>
                      </div>
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

                          {/* Action Buttons - CHỈ CÒN DELETE */}
                          <div className="flex gap-2">
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
      </div>
    </div>
  );
}