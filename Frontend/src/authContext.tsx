import React, { createContext, useState, useEffect, useContext } from "react";
import { getCurrentUser } from "./api";

interface User {_id: string, email:string, role:string, name:string}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch user from API
  const fetchUser = async (token: string) => {
    try {
      const response = await getCurrentUser(token);
      setUser(response.user);
    } catch (error) {
      console.error("Error fetching user:", error);
      setUser(null); // Clear user on error
    }
  };

  // Refresh user from token
  const refreshUser = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    await fetchUser(token);
    setLoading(false);
  };

  // Login function
  const login = async (token: string) => {
    localStorage.setItem("token", token);
    await refreshUser();
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  useEffect(() => {
    refreshUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};