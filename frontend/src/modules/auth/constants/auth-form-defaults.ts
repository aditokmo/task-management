import type { LoginFormValues, RegisterFormValues } from '../schemas';

export const LOGIN_DEFAULT_VALUES: LoginFormValues = {
    email: '',
    password: '',
    rememberMe: false,
};

export const REGISTER_DEFAULT_VALUES: RegisterFormValues = {
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
};