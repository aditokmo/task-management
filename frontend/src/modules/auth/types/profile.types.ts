export interface UserProfile {
    id: string;
    email: string;
    name?: string;
    profileImage?: string;
    createdAt: string;
    updatedAt: string;
}

export interface UpdateProfilePayload {
    name?: string;
    profileImage?: string;
}

export interface ChangePasswordPayload {
    currentPassword: string;
    newPassword: string;
}

export interface PasswordChangeResponse {
    success: boolean;
    message: string;
}
