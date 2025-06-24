import z from "zod";

export const role = z.enum(["admin", "user"]);

export const userSchema = z.object({
  _id: z.string(),
  name: z.string(), 
  role: role,
});


export type User = z.infer<typeof userSchema>;