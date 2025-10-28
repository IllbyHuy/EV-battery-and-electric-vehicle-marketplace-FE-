import { createContext, useContext, useEffect, useState } from "react";
import { api, setAuthToken } from "../api/userApi";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  // Check token in localStorage and fetch user info on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      // ensure api instance sends Authorization header
      setAuthToken(token);
      api
        .get("/api/User/GetUser")
        .then((res) => {
          setUser(res.data.result);
        })
        .catch(() => {
          setUser(null);
          localStorage.removeItem("token");
          setAuthToken(null);
        });
    }
  }, []);

  // Login nhận response, lưu token, fetch user info
  const login = async (res) => {
    if (res.token) {
      localStorage.setItem("token", res.token);
      // set header on shared api instance and fetch user info
      setAuthToken(res.token);
      try {
        const userRes = await api.get("/api/User/GetUser");
        setUser(userRes.data.result);
      } catch {
        setUser(null);
      }
    }
  };

  // Logout xoá token, xoá user
  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
