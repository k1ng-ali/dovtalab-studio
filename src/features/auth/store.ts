import {defineStore} from "pinia";
import * as api from "./api";
import type {TelegramDataTest} from "@/features/auth/types.ts";

export const useAuthStore = defineStore("auth", {
    state: () => ({
        accessToken: null as string | null,
    }),

    actions: {
        async login(tg_data: TelegramDataTest) {
            console.log(import.meta.env.VITE_API_URL)
            console.log(tg_data)
            const { data } = await api.telegramAuth(
                tg_data
            );

            this.accessToken = data.access_token

            localStorage.setItem('refresh_token', data.refresh_token)
        },

        async refresh() {
            const {data} = await api.refreshToken();
            this.accessToken = data.access_token
        },
        logout() {
            this.accessToken = null;
            localStorage.removeItem('refresh_token');
        }
    }
})