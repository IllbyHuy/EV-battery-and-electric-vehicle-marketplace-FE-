import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { updateUser, sendOtpChangeEmail, changeEmail } from "../../api/userApi";
import { useAuth } from "../../contexts/AuthContext";

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const location = useLocation();

  const [active, setActive] = useState(location.state?.tab ?? "profile");

  // Profile form
  const [fullName, setFullName] = useState("");
  const [address, setAddress] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [imgs, setImgs] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);

  // Change email flow
  const [confirmChangeEmail, setConfirmChangeEmail] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [emailMsg, setEmailMsg] = useState(null);

  useEffect(() => {
    // initialize form values from user when available
    if (user) {
      setFullName(user.fullName ?? user.name ?? user.username ?? "");
      setAddress(user.address ?? "");
      setPhoneNumber(user.phoneNumber ?? "");
      setImgs(user.imgs && user.imgs.join ? user.imgs.join(",") : "");
    }
  }, [user]);

  const handleSaveProfile = async () => {
    setSaving(true);
    setSaveMsg(null);
    try {
      const payload = { fullName, address, phoneNumber, imgs };
      await updateUser(payload);
      setSaveMsg({ type: "success", text: "Profile updated." });
      if (refreshUser) await refreshUser();
    } catch (err) {
      setSaveMsg({
        type: "error",
        text: err?.response?.data || err.message || "Save failed",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleStartChangeEmail = async () => {
    setLoadingEmail(true);
    setEmailMsg(null);
    try {
      await sendOtpChangeEmail({ newEmail });
      setOtpSent(true);
      setEmailMsg({
        type: "info",
        text: "OTP sent to new email. Check your inbox.",
      });
    } catch (err) {
      setEmailMsg({
        type: "error",
        text: err?.response?.data || err.message || "Failed to send OTP",
      });
    } finally {
      setLoadingEmail(false);
    }
  };

  const handleConfirmChangeEmail = async () => {
    setLoadingEmail(true);
    setEmailMsg(null);
    try {
      await changeEmail({ email: newEmail, otp });
      setEmailMsg({ type: "success", text: "Email changed successfully." });
      setOtpSent(false);
      setConfirmChangeEmail(false);
      setNewEmail("");
      setOtp("");
      if (refreshUser) await refreshUser();
    } catch (err) {
      setEmailMsg({
        type: "error",
        text: err?.response?.data || err.message || "Change email failed",
      });
    } finally {
      setLoadingEmail(false);
    }
  };

  return (
    <div className="obys-hero py-14">
      <div className="container mx-auto max-w-4xl fade-in-slow">
        <div className="obys-card rounded-2xl p-8">
          <h1 className="text-2xl font-semibold mb-6 text-white">Settings</h1>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <aside className="col-span-1 border rounded-lg p-4">
              <ul className="space-y-2">
                <li>
                  <button
                    className={`w-full text-left p-3 rounded ${active === "profile" ? "bg-accent/20 font-semibold" : "hover:bg-accent/10"}`}
                    onClick={() => setActive("profile")}
                  >
                    Edit Profile
                  </button>
                </li>
                <li>
                  <button
                    className={`w-full text-left p-3 rounded ${active === "appearance" ? "bg-accent/20 font-semibold" : "hover:bg-accent/10"}`}
                    onClick={() => setActive("appearance")}
                  >
                    Appearance & Preferences
                  </button>
                </li>
                <li>
                  <button
                    className={`w-full text-left p-3 rounded ${active === "help" ? "bg-accent/20 font-semibold" : "hover:bg-accent/10"}`}
                    onClick={() => setActive("help")}
                  >
                    Help & Support
                  </button>
                </li>
                <li>
                  <button
                    className={`w-full text-left p-3 rounded ${active === "changeEmail" ? "bg-accent/20 font-semibold" : "hover:bg-accent/10"}`}
                    onClick={() => {
                      setActive("changeEmail");
                      setConfirmChangeEmail(true);
                    }}
                  >
                    Change Email
                  </button>
                </li>
              </ul>
            </aside>

            <div className="col-span-3">
              {active === "profile" && (
                <section className="border rounded-lg p-6 mb-6">
                  <h2 className="text-lg font-medium mb-4">Edit Profile</h2>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm">Full name</label>
                      <input
                        className="w-full border p-2 rounded"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm">Phone number</label>
                      <input
                        className="w-full border p-2 rounded"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm">Address</label>
                      <input
                        className="w-full border p-2 rounded"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm">
                        Images (comma separated URLs)
                      </label>
                      <input
                        className="w-full border p-2 rounded"
                        value={imgs}
                        onChange={(e) => setImgs(e.target.value)}
                      />
                    </div>

                    <div className="flex gap-2 mt-3">
                      <button
                        className="btn"
                        onClick={handleSaveProfile}
                        disabled={saving}
                      >
                        {saving ? "Saving..." : "Save"}
                      </button>
                      <button
                        className="btn btn-ghost"
                        onClick={() => {
                          if (user) {
                            setFullName(
                              user.fullName ?? user.name ?? user.username ?? "",
                            );
                            setAddress(user.address ?? "");
                            setPhoneNumber(user.phoneNumber ?? "");
                            setImgs(
                              user.imgs && user.imgs.join
                                ? user.imgs.join(",")
                                : "",
                            );
                            setSaveMsg(null);
                          }
                        }}
                      >
                        Reset
                      </button>
                    </div>

                    {saveMsg && (
                      <div
                        className={`mt-3 ${saveMsg.type === "error" ? "text-red-600" : "text-green-600"}`}
                      >
                        {saveMsg.text}
                      </div>
                    )}
                  </div>
                </section>
              )}

              {active === "appearance" && (
                <section className="border rounded-lg p-6 mb-6">
                  <h2 className="text-lg font-medium mb-4">
                    Appearance & Preferences
                  </h2>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-sm">Font size</label>
                      <select className="border p-2 rounded w-40">
                        <option>Small</option>
                        <option>Medium</option>
                        <option>Large</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm">Theme color</label>
                      <select className="border p-2 rounded w-40">
                        <option>Light</option>
                        <option>Dark</option>
                      </select>
                    </div>
                  </div>
                </section>
              )}

              {active === "help" && (
                <section className="border rounded-lg p-6 mb-6">
                  <h2 className="text-lg font-medium mb-4">Help & Support</h2>
                  <div className="text-sm text-muted-foreground">
                    For support, contact support@example.com or check the
                    documentation. (Placeholder)
                  </div>
                </section>
              )}

              {active === "changeEmail" && (
                <section className="border rounded-lg p-6 mb-6">
                  <h2 className="text-lg font-medium mb-4">Change Email</h2>

                  {confirmChangeEmail ? (
                    <div className="space-y-3">
                      <div className="text-sm">
                        Are you sure you want to change your email?
                      </div>
                      <div className="flex gap-2">
                        <button
                          className="btn"
                          onClick={() => setConfirmChangeEmail(false)}
                        >
                          Yes, continue
                        </button>
                        <button
                          className="btn btn-ghost"
                          onClick={() => {
                            setConfirmChangeEmail(false);
                            setActive("profile");
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      {!otpSent ? (
                        <div>
                          <label className="block text-sm">New email</label>
                          <input
                            className="w-full border p-2 rounded"
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                          />
                          <div className="flex gap-2 mt-3">
                            <button
                              className="btn"
                              onClick={handleStartChangeEmail}
                              disabled={loadingEmail || !newEmail}
                            >
                              {loadingEmail ? "Sending..." : "Send OTP"}
                            </button>
                            <button
                              className="btn btn-ghost"
                              onClick={() => {
                                setNewEmail("");
                                setEmailMsg(null);
                                setActive("profile");
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="text-sm text-muted-foreground mb-2">
                            OTP sent to {newEmail}
                          </div>
                          <label className="block text-sm">Enter OTP</label>
                          <input
                            className="w-full border p-2 rounded"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                          />
                          <div className="flex gap-2 mt-3">
                            <button
                              className="btn"
                              onClick={handleConfirmChangeEmail}
                              disabled={loadingEmail || !otp}
                            >
                              {loadingEmail ? "Verifying..." : "Verify OTP"}
                            </button>
                            <button
                              className="btn btn-ghost"
                              onClick={() => {
                                setOtpSent(false);
                                setOtp("");
                                setEmailMsg(null);
                              }}
                            >
                              Back
                            </button>
                            <button
                              className="btn btn-ghost"
                              onClick={() => {
                                setOtpSent(false);
                                setNewEmail("");
                                setOtp("");
                                setEmailMsg(null);
                                setActive("profile");
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      {emailMsg && (
                        <div
                          className={`mt-3 ${emailMsg.type === "error" ? "text-red-600" : emailMsg.type === "success" ? "text-green-600" : "text-blue-600"}`}
                        >
                          {emailMsg.text}
                        </div>
                      )}
                    </div>
                  )}
                </section>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
