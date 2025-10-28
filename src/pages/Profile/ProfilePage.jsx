import { useEffect, useState } from "react";
import { getUser } from "../../api/userApi";
import { useAuth } from "../../contexts/AuthContext";
import Placeholder from "../../components/Placeholder/Placeholder";

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState(null);
  const { logout } = useAuth();

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getUser();
      // backend may return { result: user } or user directly
      const user = res?.result ?? res;
      setProfile(user);
    } catch (err) {
      setError(err?.response?.data || err.message || "Failed to load profile");
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading)
    return <Placeholder title="Loading profile..." description="Please wait" />;
  if (error)
    return (
      <div className="container py-14 max-w-md">
        <h1 className="text-2xl font-semibold mb-4">Profile</h1>
        <div className="text-red-600 mb-4">
          {typeof error === "string" ? error : JSON.stringify(error)}
        </div>
        <button className="btn" onClick={load}>
          Retry
        </button>
      </div>
    );

  return (
    <div className="container py-14 max-w-md">
      <h1 className="text-2xl font-semibold mb-4">Profile</h1>
      {!profile ? (
        <div>No profile data</div>
      ) : (
        <div className="space-y-3">
          <div>
            <div className="text-sm text-muted-foreground">Name</div>
            <div className="font-medium">
              {profile.name ?? profile.username ?? profile.email}
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Email</div>
            <div className="font-medium">{profile.email ?? "-"}</div>
          </div>
          {/* render additional fields if present */}
          {profile.role && (
            <div>
              <div className="text-sm text-muted-foreground">Role</div>
              <div className="font-medium">{profile.role}</div>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <button className="btn" onClick={load}>
              Refresh
            </button>
            <button
              className="btn btn-ghost"
              onClick={() => {
                logout();
              }}
            >
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
