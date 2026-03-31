import { Link } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { LOGIN_DEFAULT_VALUES } from '../constants';
import { Checkbox } from '@/components/ui/checkbox';
import { loginSchema, type LoginFormValues } from '../schemas';
import { useAuth } from '../hooks/useAuth';

export function Login() {
    const { login, loginErrorMessage } = useAuth();

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: LOGIN_DEFAULT_VALUES,
    });

    const rememberMe = watch('rememberMe');

    const onSubmit = handleSubmit(async (values) => {
        await login.mutateAsync(values);
    });

    return (
        <main className="grid min-h-screen place-items-center bg-gradient-to-b from-background to-muted/40 p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-xl">Welcome Back</CardTitle>
                    <CardDescription>Sign in to continue managing your tasks.</CardDescription>
                </CardHeader>

                <CardContent>
                    <form className="space-y-4" onSubmit={onSubmit}>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground">Email</label>
                            <Input type="email" placeholder="you@example.com" {...register('email')} />
                            {errors.email?.message && <p className="text-xs text-destructive">{errors.email.message}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground">Password</label>
                            <Input type="password" placeholder="Enter your password" {...register('password')} />
                            {errors.password?.message && (
                                <p className="text-xs text-destructive">{errors.password.message}</p>
                            )}
                        </div>

                        <div className="flex items-center justify-between gap-4">
                            <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                                <Checkbox
                                    checked={rememberMe}
                                    onCheckedChange={(checked) => setValue('rememberMe', Boolean(checked))}
                                />
                                Remember me
                            </label>

                            <Link to="/forgot-password" className="text-xs text-primary hover:underline">
                                Forgot password?
                            </Link>
                        </div>

                        {loginErrorMessage && <p className="text-xs text-destructive">{loginErrorMessage}</p>}

                        <Button type="submit" className="w-full" disabled={login.isPending}>
                            {login.isPending ? 'Signing in...' : 'Sign In'}
                        </Button>
                    </form>

                    <p className="mt-4 text-center text-xs text-muted-foreground">
                        No account yet?{' '}
                        <Link to="/register" className="text-primary hover:underline">
                            Create one
                        </Link>
                    </p>
                </CardContent>
            </Card>
        </main>
    );
}
