import { useState } from "react";
import { setAuthToken } from "../api/userApi";

const initialUser = (() => {
  try {
    const u = localStorage.getItem("user");
    return u ? JSON.parse(u) : null;
  } catch {
    return null;
  }
})();

export default function useAuth() {
  const [user, setUser] = useState(initialUser);

  const login = (res) => {
    // res can be { token, user } or token string or a user object
    let token = null;
    let u = null;

    if (typeof res === "string") {
      token = res;
    } else if (res?.token) {
      token = res.token;
      u = res.user ?? null;
    } else if (res?.accessToken) {
      token = res.accessToken;
      u = res.user ?? null;
    } else if (res && (res.id || res.email)) {
      u = res;
    }

    if (token) {
      localStorage.setItem("token", token);
      setAuthToken(token);
    }
    if (u) {
      localStorage.setItem("user", JSON.stringify(u));
      setUser(u);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setAuthToken(null);
    setUser(null);
  };

  return { user, login, logout };
}


