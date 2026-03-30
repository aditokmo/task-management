import { Link } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { registerSchema, type RegisterFormValues } from '../schemas';
import { useAuth } from '../hooks/useAuth';

const defaultValues: RegisterFormValues = {
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
};

export function Register() {
    const { register: registerMutation, registerErrorMessage } = useAuth();

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema),
        defaultValues,
    });

    const onSubmit = handleSubmit(async (values) => {
        await registerMutation.mutateAsync({
            name: values.name,
            email: values.email,
            password: values.password,
        });
    });

    return (
        <main className="grid min-h-screen place-items-center bg-gradient-to-b from-background to-muted/40 p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-xl">Create Account</CardTitle>
                    <CardDescription>Join and start organizing your work today.</CardDescription>
                </CardHeader>

                <CardContent>
                    <form className="space-y-4" onSubmit={onSubmit}>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground">Full name</label>
                            <Input placeholder="Your name" {...register('name')} />
                            {errors.name?.message && <p className="text-xs text-destructive">{errors.name.message}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground">Email</label>
                            <Input type="email" placeholder="you@example.com" {...register('email')} />
                            {errors.email?.message && <p className="text-xs text-destructive">{errors.email.message}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground">Password</label>
                            <Input type="password" placeholder="Create a strong password" {...register('password')} />
                            {errors.password?.message && (
                                <p className="text-xs text-destructive">{errors.password.message}</p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground">Confirm password</label>
                            <Input type="password" placeholder="Repeat your password" {...register('confirmPassword')} />
                            {errors.confirmPassword?.message && (
                                <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
                            )}
                        </div>

                        {registerErrorMessage && <p className="text-xs text-destructive">{registerErrorMessage}</p>}

                        <Button type="submit" className="w-full" disabled={registerMutation.isPending}>
                            {registerMutation.isPending ? 'Creating account...' : 'Create Account'}
                        </Button>
                    </form>

                    <p className="mt-4 text-center text-xs text-muted-foreground">
                        Already have an account?{' '}
                        <Link to="/login" className="text-primary hover:underline">
                            Sign in
                        </Link>
                    </p>
                </CardContent>
            </Card>
        </main>
    );
}
