import { createContext, useContext, useEffect, useState } from "react";
import { api, setAuthToken, getUser } from "../api/userApi";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  // Check token in localStorage and fetch user info on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      // ensure api instance sends Authorization header
      setAuthToken(token);
      getUser()
        .then((res) => {
          // backend may return shape { result: user } or user directly
          setUser(res.result ?? res);
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
    // Accept either: { token, user } (response from userLogin)
    // or a token string
    let token = null;
    if (!res) return;
    if (typeof res === "string") token = res;
    else if (res.token) token = res.token;
    else if (res.accessToken) token = res.accessToken;

    if (token) {
      localStorage.setItem("token", token);
      setAuthToken(token);
      try {
        const userRes = await getUser();
        setUser(userRes.result ?? userRes);
        // optionally cache user in localStorage
        try {
          localStorage.setItem(
            "user",
            JSON.stringify(userRes.result ?? userRes),
          );
        } catch {}
      } catch {
        setUser(null);
      }
    }
  };

  // Logout xoá token, xoá user
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setAuthToken(null);
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
