import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/Button/Button";
import Input from "../../components/Input/Input";
import useAuth from "../../hooks/useAuth";
import { userRegister, registerOtp } from "../../api/userApi";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUserName] = useState("");
  const [address, setAddress] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // OTP flow
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState(null);
  const [pendingEmail, setPendingEmail] = useState(null);
  const [registerRes, setRegisterRes] = useState(null); // optional: lưu response nếu cần khi verify

  const auth = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await userRegister({ username, email, password, address, phoneNumber });
      // lưu email để dùng verify OTP mà không bắt nhập lại
      setPendingEmail(email);
      setRegisterRes(res); // nếu backend trả token tạm thời, lưu và dùng khi verify
      setShowOtpModal(true);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Register failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) {
      setOtpError("Enter OTP");
      return;
    }
    setOtpLoading(true);
    setOtpError(null);
    try {
      // gửi email đã lưu cùng otp, backend sẽ trả token/user sau verify
      const res = await registerOtp({ email: pendingEmail, otp });
      // đăng nhập / lưu token tùy api (nếu trả token ở res)
      auth.login(res);
      setShowOtpModal(false);
      navigate("/");
    } catch (err) {
      setOtpError(err.response?.data?.message || err.message || "OTP verification failed");
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <div className="container py-14 max-w-md">
      <h1 className="text-2xl font-semibold mb-4">Register</h1>
      <form className="space-y-3" onSubmit={handleSubmit}>
        <Input placeholder="Name" type="text" value={username} onChange={(e) => setUserName(e.target.value)} />
        <Input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <Input placeholder="Confirm Password" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        <Input placeholder="Phone Number" type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
        <Input placeholder="Address" type="text" value={address} onChange={(e) => setAddress(e.target.value)} />
        {error && <div className="text-red-500 text-sm">{error}</div>}
        <Button className="w-full" type="submit" disabled={loading}>
          {loading ? "Signing up..." : "Sign up"}
        </Button>
      </form>

      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded shadow-lg p-6 w-full max-w-sm">
            <h2 className="text-lg font-semibold mb-2">Verify OTP</h2>
            <p className="text-sm mb-4">
              Nhập mã OTP đã gửi tới: <strong>{pendingEmail}</strong>
            </p>
            <Input placeholder="Enter OTP" type="text" value={otp} onChange={(e) => setOtp(e.target.value)} />
            {otpError && <div className="text-red-500 text-sm mt-2">{otpError}</div>}
            <div className="flex gap-2 mt-4">
              <Button type="button" onClick={handleVerifyOtp} disabled={otpLoading}>
                {otpLoading ? "Verifying..." : "Verify"}
              </Button>
              <Button type="button" className="bg-gray-200 text-black" onClick={() => setShowOtpModal(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


