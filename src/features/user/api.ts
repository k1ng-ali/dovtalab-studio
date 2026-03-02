import { http } from "@/shared/api/http";

export const getMe = () => http.get(`/users/me`);

export const getProfile = () => http.get(`/users/profile`);