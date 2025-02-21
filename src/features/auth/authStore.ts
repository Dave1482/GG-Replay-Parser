import { create } from "zustand";

interface User {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  actions: {
    setUser: (user: User | null) => void;
    logout: () => void;
  };
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  actions: {
    setUser: (user) => set({ user, isAuthenticated: !!user }),
    logout: () => set({ user: null, isAuthenticated: false }),
  },
}));

export const useAuthActions = () => useAuthStore((state) => state.actions);
export const useUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () =>
  useAuthStore((state) => state.isAuthenticated);
