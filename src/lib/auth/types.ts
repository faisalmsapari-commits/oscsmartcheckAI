import { UserRole } from "@/types/common";

export interface AuthSessionState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: {
    uid: string;
    email: string | null;
    displayName: string | null;
    role: UserRole;
  } | null;
}
