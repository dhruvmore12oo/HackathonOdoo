'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { Button, Alert } from '@/components/ui';
import { PasswordInput } from '@/components/auth/PasswordInput';
import { useResetPassword } from '@/hooks/useAuth';
import { Suspense } from 'react';

const schema = z.object({
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
type FormData = z.infer<typeof schema>;

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const { mutate: resetPassword, isPending } = useResetPassword();
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { password: '', confirm_password: '' },
  });

  if (!token) {
    return (
      <div className="animate-in text-center">
        <div className="w-16 h-16 rounded-full bg-danger-50 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="h-8 w-8 text-danger-400" />
        </div>
        <h2 className="font-heading text-xl font-bold text-gray-900 mb-2">Invalid Reset Link</h2>
        <p className="text-gray-500 text-sm mb-6">
          This reset link is invalid or has expired. Please request a new one.
        </p>
        <Link href="/forgot-password" className="text-link text-sm">
          Request new reset link
        </Link>
      </div>
    );
  }

  const onSubmit = (data: FormData) => {
    resetPassword({ token, password: data.password });
  };

  return (
    <div className="animate-in">
      <div className="mb-8">
        <h2 className="font-heading text-2xl font-bold text-gray-900">Set new password</h2>
        <p className="text-gray-500 mt-1">Choose a strong password for your account</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" id="reset-password-form">
        <PasswordInput
          label="New Password"
          placeholder="Min 8 chars, uppercase, number, special"
          error={errors.password?.message}
          autoComplete="new-password"
          {...register('password')}
        />

        <PasswordInput
          label="Confirm Password"
          placeholder="Re-enter your new password"
          error={errors.confirm_password?.message}
          autoComplete="new-password"
          {...register('confirm_password')}
        />

        <Alert variant="info">
          Password must contain at least 8 characters, including uppercase, lowercase, number, and special character.
        </Alert>

        <Button type="submit" className="w-full" size="lg" isLoading={isPending}>
          Reset Password
        </Button>
      </form>

      <p className="mt-6 text-center">
        <Link href="/login" className="text-link text-sm inline-flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Back to sign in
        </Link>
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center p-12">Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
