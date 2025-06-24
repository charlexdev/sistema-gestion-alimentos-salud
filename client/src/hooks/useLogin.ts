import type { LoginData } from "@/api/schemas/login";
import auth from "@/api/services/auth";
import { useAuthActions } from "@/stores/auth";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

export const useLogin = () => {
  const { setToken, setUser } = useAuthActions();
  const nav = useNavigate();

  return useMutation({
    mutationKey: ["login"],
    mutationFn: async (data: LoginData) => {
      const res = await auth.login(data.email, data.password);

      if (!res.token) {
        throw new Error("No se pudo iniciar sesión");
      }

      setToken(res.token);
      setUser(res.user);
      nav("/");
    },
  });
};
