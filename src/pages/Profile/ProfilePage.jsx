import { useEffect, useState } from "react";
import { getUser } from "../../api/userApi";
import { useAuth } from "../../contexts/AuthContext";
import Placeholder from "../../components/Placeholder/Placeholder";
import { useNavigate } from "react-router-dom";

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState(null);
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      // If context already has user, use it first
      if (user) {
        setProfile(user);
      } else {
        const res = await getUser();
        const u = res?.result ?? res;
        setProfile(u);
      }
    } catch (err) {
      setError(err?.response?.data || err.message || "Failed to load profile");
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  // load on mount
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // react to auth changes (logout/login) so UI updates immediately
  useEffect(() => {
    if (user) {
      setProfile(user);
    } else {
      // user logged out: clear profile
      setProfile(null);
    }
  }, [user]);

  if (loading)
    return <Placeholder title="Loading profile..." description="Please wait" />;

  if (!profile)
    return (
      <div className="obys-hero py-14">
        <div className="container max-w-md fade-in-slow">
          <div className="obys-card rounded-lg p-6">
            <h1 className="text-2xl font-semibold mb-4 text-white">Profile</h1>
            <div className="text-white/80 mb-4">Bạn chưa đăng nhập.</div>
            <div className="flex gap-2">
              <button className="btn" onClick={load}>
                Tải lại
              </button>
              <button
                className="btn btn-ghost"
                onClick={() => {
                  logout();
                }}
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      </div>
    );

  // hard-coded sample posts for demo
  const samplePosts = [
    {
      id: 1,
      title: "Selling 50 EV batteries - like new",
      price: "$3,200",
      desc: "10 units available, warranty 6 months",
    },
    {
      id: 2,
      title: "Battery pack B-200 for EV conversion",
      price: "$1,500",
      desc: "Single unit, used 6 months",
    },
    {
      id: 3,
      title: "Bulk lithium cells - 1000pcs",
      price: "$12,000",
      desc: "Wholesale, FOB",
    },
  ];

  return (
    <div className="obys-hero py-14">
      <div className="container max-w-5xl fade-in-slow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left column: avatar + basic info */}
          <div className="col-span-1 obys-card rounded-lg p-6">
            <div className="flex flex-col items-center">
              <div className="w-28 h-28 rounded-full bg-white/6 flex items-center justify-center text-2xl font-bold mb-4 text-white">
                {(profile.fullName ?? profile.name ?? profile.username)
                  ?.charAt(0)
                  ?.toUpperCase() || "U"}
              </div>
              <div className="text-lg font-semibold text-white">
                {profile.fullName ?? profile.name ?? profile.username}
              </div>
              <div className="text-sm text-white/80">{profile.email}</div>
              <div className="mt-4 w-full">
                <button
                  className="btn w-full"
                  onClick={() =>
                    navigate("/settings", { state: { tab: "edit" } })
                  }
                >
                  Edit profile
                </button>
              </div>
            </div>
          </div>
          {/* Right column: posts / activity */}
          <div className="col-span-2">
            <div className="obys-card rounded-lg p-6 mb-6 text-white">
              <h2 className="text-xl font-semibold mb-4">My Listings</h2>
              <div className="space-y-4">
                {samplePosts.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-start gap-4 border-b border-white/6 pb-3"
                  >
                    <div className="w-12 h-12 bg-white/6 rounded flex items-center justify-center text-sm font-medium text-white/90">
                      IMG
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <div className="font-medium text-white">{p.title}</div>
                        <div className="text-sm font-semibold text-white">
                          {p.price}
                        </div>
                      </div>
                      <div className="text-sm text-white/80">{p.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="obys-card rounded-lg p-6 text-white">
              <h2 className="text-xl font-semibold mb-4">Activity</h2>
              <div className="text-sm text-white/80">
                No recent activity. This area will show messages, offers and
                transaction history.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
