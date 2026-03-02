import {defineStore} from "pinia";
import * as api from "./api";
import type {User} from "@/features/user/types.ts";

export const useUser = defineStore("user", {
    state: () => ({
        user: null as User | null,
    }),

    getters: {
        isAuthenticated: (state) => !!state.user,
        full_name: (state) =>
            state.user ? state.user.first_name + " " + (state.user.last_name ? state.user.last_name : "") :
                ""
    },

    actions: {
        async fetchMe() {
            const { data } = await api.getMe();
            this.user = data;
            console.log(this.user)
        }
    }
})