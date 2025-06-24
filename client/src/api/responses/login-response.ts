import type { User } from "../schemas/user";

export interface LoginResponse {
  token: string;
  user: User;
}
