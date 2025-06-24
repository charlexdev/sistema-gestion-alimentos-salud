import type { User } from "@/api/schemas/user";
import { create } from "zustand";
import { persist } from "zustand/middleware";
type AuthState = {
  user: User | null;
  token: string;
};

type AuthActions = {
  setUser: (user: User | null) => void;
  setToken: (token: string) => void;
};

type AuthStore = AuthState & AuthActions;

const STORE_KEY = "auth-data";

const authStore = create<AuthStore>()(
  persist(
    (set) => ({
      token: "",
      user: null,
      setToken(token) {
        set({ token });
      },
      setUser(user) {
        set({ user });
      },
    }),
    { name: STORE_KEY }
  )
);

export const useUser = () => authStore((state) => state.user);
export const useToken = () => authStore((state) => state.token);

export const useAuthActions = () => {
  const { setToken, setUser } = authStore();
  return { setToken, setUser };
};
