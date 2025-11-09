import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/Button/Button";
import Input from "../../components/Input/Input";
import { useAuth } from "../../contexts/AuthContext";
import { userLogin } from "../../api/userApi";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const auth = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // backend nên trả { token, user } hoặc token
      const res = await userLogin({ username, password }); // backend login
      await auth.login(res);
      
      // Wait a bit for user state to update
      await new Promise((resolve) => setTimeout(resolve, 100));
      
      // Get user from context or localStorage
      const storedUser = auth.user || JSON.parse(localStorage.getItem("user") || "null");
      
      // Check role: 1 or "Admin" = admin, 2 or "User" = user
      const roleNum = Number(storedUser?.role);
      const roleString = storedUser?.role;
      
      // Redirect based on role
      if (roleNum === 1 || roleString === "Admin" || roleString === "admin") {
        navigate("/admin/dashboard", { replace: true });
      } else if (roleNum === 2 || roleString === "User" || roleString === "user") {
        navigate("/", { replace: true });
      } else {
        // Fallback: use RoleRedirect component logic
        navigate("/go", { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-14 max-w-md">
      <h1 className="text-2xl font-semibold mb-4">Login</h1>
      <form className="space-y-3" onSubmit={handleSubmit}>
  <Input placeholder="UserName" type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
        <Input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <div className="text-red-500 text-sm">{error}</div>}
        <Button className="w-full" type="submit" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </Button>
      </form>
    </div>
  );
}


