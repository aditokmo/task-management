export interface AuthUser {
    id: string;
    email: string;
    name?: string;
    profileImage?: string;
}

export interface LoginPayload {
    email: string;
    password: string;
    rememberMe?: boolean;
}

export interface RegisterPayload {
    name: string;
    email: string;
    password: string;
}

export interface AuthResponse {
    user: AuthUser;
    accessToken: string;
    message?: string;
}