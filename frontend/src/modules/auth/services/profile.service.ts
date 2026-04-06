import { ApiService } from "@/api";
import type { UserProfile, UpdateProfilePayload, ChangePasswordPayload, PasswordChangeResponse } from "../types/profile.types";
import { ENDPOINTS } from "./endpoint";

export const ProfileService = {
    getProfile: async (): Promise<UserProfile> => {
        return ApiService.get<UserProfile>(ENDPOINTS.AUTH.PROFILE);
    },

    updateProfile: async (data: UpdateProfilePayload): Promise<UserProfile> => {
        return ApiService.put<UpdateProfilePayload, UserProfile>(ENDPOINTS.AUTH.PROFILE, data);
    },

    changePassword: async (data: ChangePasswordPayload): Promise<PasswordChangeResponse> => {
        return ApiService.post<ChangePasswordPayload, PasswordChangeResponse>(ENDPOINTS.AUTH.CHANGE_PASSWORD, data);
    }
}
