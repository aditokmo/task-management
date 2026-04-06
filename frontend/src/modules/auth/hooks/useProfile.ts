import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ProfileService } from '../services/profile.service';
import type { UpdateProfilePayload, ChangePasswordPayload } from '../types/profile.types';
import { getAPIErrorMessage } from '@/utils/api-error-handler';
import { useAuthStore } from '@/store';

const PROFILE_QUERY_KEY = 'profile';

export const useProfile = () => {
    return useQuery({
        queryKey: [PROFILE_QUERY_KEY],
        queryFn: ProfileService.getProfile,
    });
};

export const useUpdateProfile = () => {
    const queryClient = useQueryClient();
    const setUser = useAuthStore((state) => state.setUser);

    return useMutation({
        mutationFn: (data: UpdateProfilePayload) => ProfileService.updateProfile(data),
        onSuccess: (data) => {
            queryClient.setQueryData([PROFILE_QUERY_KEY], data);
            // Update auth store with new user data
            setUser({
                name: data.name,
                profileImage: data.profileImage,
            });
        },
        onError: (error) => {
            const errorMessage = getAPIErrorMessage(error);
            console.error('Failed to update profile:', errorMessage);
        },
    });
};

export const useChangePassword = () => {
    return useMutation({
        mutationFn: (data: ChangePasswordPayload) => ProfileService.changePassword(data),
        onError: (error) => {
            const errorMessage = getAPIErrorMessage(error);
            console.error('Failed to change password:', errorMessage);
        },
    });
};
