import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api, clearToken, getToken, saveToken } from "./api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .me()
      .then((data) => setMember(data.member))
      .catch(() => {
        clearToken();
        setMember(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo(
    () => ({
      member,
      loading,
      isAdmin: member?.role === "ADMIN",
      async signIn(identifier, password) {
        const data = await api.login(identifier, password);
        saveToken(data.token);
        setMember(data.member);
        return data.member;
      },
      async register(payload) {
        const data = await api.register(payload);
        saveToken(data.token);
        setMember(data.member);
        return data.member;
      },
      signOut() {
        clearToken();
        setMember(null);
      },
    }),
    [member, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
