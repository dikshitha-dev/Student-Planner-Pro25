import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { setAuthTokenGetter, useGetMe, User } from "@workspace/api-client-react";

interface AuthContextType {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // Provide token to API client
    setAuthTokenGetter(() => {
      // In a real app we'd probably want to read from AsyncStorage here too if token state isn't initialized
      return token;
    });
  }, [token]);

  useEffect(() => {
    async function loadToken() {
      try {
        const storedToken = await AsyncStorage.getItem("auth_token");
        if (storedToken) {
          setToken(storedToken);
        }
      } catch (e) {
        console.error("Failed to load auth token", e);
      } finally {
        setIsInitializing(false);
      }
    }
    loadToken();
  }, []);

  const { data: user, isLoading: isUserLoading } = useGetMe({
    query: {
      enabled: !!token,
      retry: false,
    },
  });

  const login = async (newToken: string) => {
    try {
      await AsyncStorage.setItem("auth_token", newToken);
      setToken(newToken);
    } catch (e) {
      console.error("Failed to save auth token", e);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem("auth_token");
      setToken(null);
    } catch (e) {
      console.error("Failed to remove auth token", e);
    }
  };

  const isLoading = isInitializing || (!!token && isUserLoading);
  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider
      value={{
        token,
        user: user || null,
        isAuthenticated,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
