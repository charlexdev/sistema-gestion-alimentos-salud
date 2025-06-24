import z from "zod";

export const registerSchema = z
  .object({
    username: z
      .string()
      .min(2, {
        message: "El nombre de usuario debe tener al menos 2 caracteres",
      }), // Modificado
    email: z.string().email({ message: "Por favor ingresa un email válido" }),
    password: z
      .string()
      .min(6, { message: "La contraseña debe tener al menos 6 caracteres" }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export type RegisterData = z.infer<typeof registerSchema>;
