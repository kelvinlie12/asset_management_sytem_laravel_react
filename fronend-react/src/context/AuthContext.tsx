import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import api from "../services/api";

export interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string | null;
  avatar_url?: string | null;
  phone: string | null;
  role: string;
  created_at?: string;
  updated_at?: string;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<User>;
  logout: () => Promise<void>;
  fetchProfile: () => Promise<User>;
  updateProfile: (
    data: Omit<Partial<User>, "avatar"> & { avatar?: File | string | null },
  ) => Promise<User>;
  changePassword: (data: {
    current_password: string;
    password: string;
    password_confirmation: string;
  }) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem(TOKEN_KEY),
  );
  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore session: validate the persisted token against the API.
  useEffect(() => {
    let active = true;
    const raw = localStorage.getItem(TOKEN_KEY);

    if (!raw) {
      setIsLoading(false);
      return;
    }

    api
      .get("/profile")
      .then(({ data }) => {
        if (!active) return;
        setUser(data.user);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      })
      .catch(() => {
        if (!active) return;
        setUser(null);
        setToken(null);
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    const { data } = await api.post("/auth/login", credentials);
    localStorage.setItem(TOKEN_KEY, data.access_token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    setToken(data.access_token);
    setUser(data.user);
    return data.user as User;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // Ignore network errors during logout.
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      setToken(null);
      setUser(null);
    }
  }, []);

  const fetchProfile = useCallback(async () => {
    const { data } = await api.get("/profile");
    setUser(data.user);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    return data.user as User;
  }, []);

  const updateProfile = useCallback(
    async (
      profile: Omit<Partial<User>, "avatar"> & { avatar?: File | string | null },
    ) => {
      const hasFile = profile.avatar instanceof File;
      const isFormData = hasFile || profile.avatar === null;

      if (isFormData) {
        const form = new FormData();
        (Object.entries(profile) as [
          keyof typeof profile,
          unknown,
        ][]).forEach(([key, value]) => {
          if (value === undefined) return;
          if (key === "avatar" && (value === null || value instanceof File)) {
            if (value !== null) form.append(key, value);
            else form.append(key, "");
          } else if (value !== null) {
            form.append(key, value as Blob | string);
          }
        });
        form.append("_method", "PUT");
        const { data } = await api.post("/profile", form);
        setUser(data.user);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        return data.user as User;
      }

      const { data } = await api.put("/profile", profile);
      setUser(data.user);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      return data.user as User;
    },
    [],
  );

  const changePassword = useCallback(
    async (payload: {
      current_password: string;
      password: string;
      password_confirmation: string;
    }) => {
      await api.put("/change-password", payload);
    },
    [],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(user && token),
      isLoading,
      login,
      logout,
      fetchProfile,
      updateProfile,
      changePassword,
    }),
    [user, token, isLoading, login, logout, fetchProfile, updateProfile, changePassword],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
