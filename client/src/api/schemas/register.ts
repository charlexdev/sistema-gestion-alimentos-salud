import { z } from "zod"; // Corrected 'z' import from 'zod'

export const registerSchema = z
  .object({
    username: z
      .string()
      .min(6, {
        message: "El nombre de usuario debe tener al menos 6 caracteres",
      })
      .max(40, {
        // Add this line for max length validation
        message: "El nombre de usuario no debe exceder los 40 caracteres",
      }),
    email: z.string().email({ message: "Por favor ingresa un email válido" }),
    password: z
      .string()
      .min(6, { message: "La contraseña debe tener al menos 6 caracteres" })
      .max(40, {
        // Add this line for max length validation
        message: "La contraseña no debe exceder los 40 caracteres",
      }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export type RegisterData = z.infer<typeof registerSchema>;
