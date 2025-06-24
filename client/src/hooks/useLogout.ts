import { useAuthActions } from "@/stores/auth";
import { useNavigate } from "react-router-dom";

export const useLogout = () => {
  const { setToken, setUser } = useAuthActions();
  const nav = useNavigate();

  const logout = () => {
    setToken("");
    setUser(null);
    nav("/login");
  };
  return { logout };
};
