'use client';

import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, User as UserIcon } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { PasswordInput } from '@/components/auth/PasswordInput';
import { GuestGuard } from '@/components/auth/GuestGuard';
import { useRegister, useGoogleLoginAuth } from '@/hooks/useAuth';
import { GoogleLogin } from '@react-oauth/google';
import toast from 'react-hot-toast';

const registerSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(80),
  last_name: z.string().min(1, 'Last name is required').max(80),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'At least 8 characters')
    .regex(/[A-Z]/, 'One uppercase letter')
    .regex(/[a-z]/, 'One lowercase letter')
    .regex(/[0-9]/, 'One number')
    .regex(/[!@#$%^&*(),.?":{}|<>_\-+=~`[\]\\\/]/, 'One special character'),
  confirm_password: z.string(),
}).refine((d) => d.password === d.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
});
type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const { mutate: registerUser, isPending } = useRegister();
  const { mutate: googleLogin, isPending: isGooglePending } = useGoogleLoginAuth();
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { first_name: '', last_name: '', email: '', password: '', confirm_password: '' },
  });

  const onSubmit = (data: RegisterForm) => {
    registerUser({
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email,
      password: data.password,
    });
  };

  return (
    <GuestGuard>
      <div className="animate-in">
        <div className="mb-8">
          <h2 className="font-heading text-2xl font-bold text-gray-900">Create your account</h2>
          <p className="text-gray-500 mt-1">Join Traveloop and start planning amazing trips</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" id="register-form">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="First Name"
              placeholder="John"
              leftIcon={<UserIcon className="h-4 w-4" />}
              error={errors.first_name?.message}
              autoComplete="given-name"
              {...register('first_name')}
            />
            <Input
              label="Last Name"
              placeholder="Doe"
              error={errors.last_name?.message}
              autoComplete="family-name"
              {...register('last_name')}
            />
          </div>

          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            leftIcon={<Mail className="h-4 w-4" />}
            error={errors.email?.message}
            autoComplete="email"
            {...register('email')}
          />

          <PasswordInput
            label="Password"
            placeholder="Min 8 chars, uppercase, number, special"
            error={errors.password?.message}
            autoComplete="new-password"
            {...register('password')}
          />

          <PasswordInput
            label="Confirm Password"
            placeholder="Re-enter your password"
            error={errors.confirm_password?.message}
            autoComplete="new-password"
            {...register('confirm_password')}
          />

          <Button
            type="submit"
            className="w-full"
            size="lg"
            isLoading={isPending || isGooglePending}
            id="register-submit"
          >
            Create Account
          </Button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-background px-2 text-gray-500">Or continue with</span>
            </div>
          </div>

          <div className="flex justify-center w-full [&>div]:w-full">
            <GoogleLogin
              onSuccess={(credentialResponse) => {
                if (credentialResponse.credential) {
                  googleLogin(credentialResponse.credential);
                }
              }}
              onError={() => {
                toast.error('Failed to authenticate with Google');
              }}
              theme="outline"
              size="large"
              text="signup_with"
              width="100%"
            />
          </div>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link href="/login" className="text-link">Sign in</Link>
        </p>
      </div>
    </GuestGuard>
  );
}
