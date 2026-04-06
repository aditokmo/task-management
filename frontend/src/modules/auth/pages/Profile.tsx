import { useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from '@tanstack/react-router';
import { ArrowLeft, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useProfile, useUpdateProfile } from '../hooks/useProfile';
import type { UpdateProfilePayload } from '../types/profile.types';

const profileSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').optional().or(z.literal('')),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

function getInitials(name?: string, email?: string) {
    const source = name?.trim() || email?.trim() || 'U';
    const parts = source.split(/\s+/).filter(Boolean);

    if (parts.length > 1) {
        return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
    }

    return source.slice(0, 2).toUpperCase();
}

export function ProfilePage() {
    const navigate = useNavigate();
    const { data: profile, isLoading: isLoadingProfile } = useProfile();
    const { mutate: updateProfile, isPending: isUpdatingProfile } = useUpdateProfile();

    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset: resetProfileForm,
    } = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
    });

    useEffect(() => {
        if (profile) {
            resetProfileForm({
                name: profile.name || '',
            });
            if (profile.profileImage) {
                setPreviewImage(profile.profileImage);
            }
        }
    }, [profile, resetProfileForm]);

    const onProfileSubmit = handleSubmit((values) => {
        const updateData: UpdateProfilePayload = {};
        if (values.name) {
            updateData.name = values.name;
        }
        if (previewImage) {
            updateData.profileImage = previewImage;
        }
        updateProfile(updateData);
    });

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Create an image element to get dimensions
            const img = new Image();
            const reader = new FileReader();

            reader.onload = (event) => {
                const result = event.target?.result as string;
                img.src = result;

                img.onload = () => {
                    // Create canvas for image optimization
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');

                    if (!ctx) return;

                    // Set max dimensions (e.g., 500x500)
                    const maxWidth = 500;
                    const maxHeight = 500;
                    let width = img.width;
                    let height = img.height;

                    // Calculate new dimensions maintaining aspect ratio
                    if (width > height) {
                        if (width > maxWidth) {
                            height = Math.round((height * maxWidth) / width);
                            width = maxWidth;
                        }
                    } else {
                        if (height > maxHeight) {
                            width = Math.round((width * maxHeight) / height);
                            height = maxHeight;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    ctx.drawImage(img, 0, 0, width, height);

                    // Convert to optimized data URL with compression
                    const optimizedImage = canvas.toDataURL('image/jpeg', 0.85);
                    setPreviewImage(optimizedImage);
                };
            };

            reader.readAsDataURL(file);
        }
    };

    const handleGoBack = () => {
        if (window.history.length > 1) {
            window.history.back();
            return;
        }

        navigate({ to: '/boards' });
    };

    if (isLoadingProfile) {
        return (
            <div className="min-h-[calc(100vh-64px)] bg-gradient-to-b from-background to-muted/20 p-4 sm:p-6">
                <div className="mx-auto max-w-2xl">
                    <Card>
                        <CardHeader>
                            <CardTitle>Loading profile...</CardTitle>
                        </CardHeader>
                    </Card>
                </div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="min-h-[calc(100vh-64px)] bg-gradient-to-b from-background to-muted/20 p-4 sm:p-6">
                <div className="mx-auto max-w-2xl">
                    <Card>
                        <CardHeader>
                            <CardTitle>Error</CardTitle>
                            <CardDescription>Failed to load profile</CardDescription>
                        </CardHeader>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[calc(100vh-64px)] bg-gradient-to-b from-background to-muted/20 p-4 sm:p-6">
            <div className="mx-auto max-w-2xl space-y-6">
                <div>
                    <button
                        type="button"
                        onClick={handleGoBack}
                        className="inline-flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                    </button>
                </div>

                {/* Profile Header */}
                <Card>
                    <CardHeader>
                        <CardTitle>Profile Settings</CardTitle>
                        <CardDescription>Manage your account information</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col items-center gap-6 sm:flex-row">
                            {/* Avatar Section */}
                            <div className="relative">
                                <Avatar className="h-24 w-24 bg-muted">
                                    {previewImage ? (
                                        <AvatarImage src={previewImage} alt={profile.name} />
                                    ) : null}
                                    <AvatarFallback className="text-lg font-semibold">
                                        {getInitials(profile.name, profile.email)}
                                    </AvatarFallback>
                                </Avatar>
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute -bottom-2 -right-2 rounded-full border-2 border-background bg-primary p-2 text-primary-foreground shadow-md hover:bg-primary/90"
                                    aria-label="Change profile picture"
                                >
                                    <Camera className="h-4 w-4" />
                                </button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleImageChange}
                                    aria-label="Upload profile image"
                                />
                            </div>

                            {/* User Info */}
                            <div className="flex-1 space-y-1 text-center sm:text-left">
                                <h3 className="text-lg font-semibold">{profile.name || 'User'}</h3>
                                <p className="text-sm text-muted-foreground">{profile.email}</p>
                                <p className="text-xs text-muted-foreground">
                                    Joined {new Date(profile.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Profile Form */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Profile Information</CardTitle>
                        <CardDescription>Update your profile details</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form className="space-y-4" onSubmit={onProfileSubmit}>
                            {/* Name Field */}
                            <div className="space-y-1.5">
                                <label htmlFor="name" className="text-sm font-medium text-muted-foreground">
                                    Name
                                </label>
                                <Input
                                    id="name"
                                    placeholder="Your name"
                                    {...register('name')}
                                />
                                {errors.name?.message && (
                                    <p className="text-xs text-destructive">{errors.name.message}</p>
                                )}
                            </div>

                            {/* Email Field (Disabled) */}
                            <div className="space-y-1.5">
                                <label htmlFor="email" className="text-sm font-medium text-muted-foreground">
                                    Email Address
                                </label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={profile.email}
                                    disabled
                                    className="bg-muted opacity-75"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Email address cannot be changed
                                </p>
                            </div>

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                disabled={isUpdatingProfile}
                                className="w-full"
                            >
                                {isUpdatingProfile ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Password Section - Disabled */}
                <Card className="opacity-60">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-lg">Password</CardTitle>
                                <CardDescription>Manage your password settings</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            Password change feature is currently disabled.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
