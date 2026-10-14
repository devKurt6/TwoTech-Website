import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../lib/api";
const Context = createContext();
export function AuthProvider({ children }) {
  const [state, setState] = useState({
    loading: true,
    user: null,
    admin: false,
    error: null,
    expired: false,
  });
  useEffect(() => {
    let alive = true;
    const check = async () => {
      try {
        const user = await api.me();
        if (alive)
          setState({
            loading: false,
            user,
            admin: true,
            error: null,
            expired: false,
          });
      } catch (e) {
        if (alive)
          setState({
            loading: false,
            user: null,
            admin: false,
            error: e.status === 401 ? null : e.message,
            expired: false,
          });
      }
    };
    const expired = () => {
      if (alive)
        setState({
          loading: false,
          user: null,
          admin: false,
          error: null,
          expired: true,
        });
    };
    check();
    window.addEventListener("tt-auth-change", check);
    window.addEventListener("tt-auth-expired", expired);
    window.addEventListener("focus", check);
    return () => {
      alive = false;
      window.removeEventListener("tt-auth-change", check);
      window.removeEventListener("tt-auth-expired", expired);
      window.removeEventListener("focus", check);
    };
  }, []);
  return <Context.Provider value={state}>{children}</Context.Provider>;
}
export function useAuth() {
  return useContext(Context);
}
