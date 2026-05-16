import {defineStore} from "pinia";
import * as api from "./api";
import type {AuthStatus, AuthTokensResponse} from "@/features/auth/types.ts";


// ----- Store----------------
export const useAuthStore = defineStore("auth", {
    // ------ State -------------
    state: () => ({
        status: 'idle' as AuthStatus | 'idle',
        accessToken: null as string | null,
        error: null as string | null,
    }),

    getters: {
      isAuthenticated: (state): boolean => state.status === 'authenticated',
      isLoading: (state):boolean =>state.status === 'loading',
    },

    actions: {
        async login(tg_data: string) {
            try {
                const { data } = await api.telegramAuth({ init_data: tg_data })
                this.accessToken = data.access_token
                this.status = 'authenticated'
            } catch (e: any) {
                console.error('login error:', e)
                // Добавь это чтобы видеть в дебаг оверлее
                throw new Error(e?.response?.data?.detail ?? e?.message ?? JSON.stringify(e))
            }
        },

        async testLogin() {
            try {
                const { data } = await api.testLogin()
                this.accessToken = data.access_token
                localStorage.setItem('refresh_token', data.refresh_token)
            } catch (e: any) {
                console.error('login error:', e)
                // Добавь это чтобы видеть в дебаг оверлее
                throw new Error(e?.response?.data?.detail ?? e?.message ?? JSON.stringify(e))
            }
        },

        // --- Login Widget -----

        async loginWithTelegram(payload: { code: string; nonce: string; code_verifier: string, redirect_uri: string }) {
            this.status = 'loading'
            try {
                const { data } = await api.telegramLogin(payload)
                this.applyTokens(data)
                console.log("Success", data)
                await this.refresh()
            } catch (e) {
                this.setError(e)
                throw e
            }
        },

        async refresh() {
            const refreshToken = localStorage.getItem('refresh_token')
            if (!refreshToken) {
                this.status = 'idle'
                return
            }
            const { data } = await api.refreshToken({ refresh_token: refreshToken })
            this.accessToken = data.access_token
            this.status = 'authenticated'
            console.log(data)
            // Обновляем refresh token (ротация)
            if (data.refresh_token) {
                localStorage.setItem('refresh_token', data.refresh_token)
            }
        },

        logout() {
            this.accessToken = null
            this.status = 'idle'
            this.error = null
            localStorage.removeItem('refresh_token') // ← добавь
        },

        // --- Internal Helpers ----
        applyTokens(data: AuthTokensResponse) {
            this.accessToken = data.access_token
            this.status = 'authenticated'
            this.error = null;
            if (data.refresh_token) {
                console.log(data.refresh_token)
                localStorage.setItem('refresh_token', data.refresh_token)
            }
        },

        setError(e: unknown) {
            const msg = e instanceof Error
                ? e.message
                : (e as any)?.response?.data?.detail ?? 'Неизвестная ошибка'
            this.error = msg
            this.status = 'error'
            console.error('[AuthStore]', msg)
        }
    },

})