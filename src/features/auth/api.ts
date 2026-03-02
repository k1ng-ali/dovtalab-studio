import {http} from "@/shared/api/http.ts";

export const telegramAuth = (data: any) =>
    http.post('/auth/test', data)

export const refreshToken = () =>
    http.post('/auth/refresh')

