import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAppDispatch } from '../store';
import { setCredentials, setError } from '../store/slices/authSlice';
import { addToast } from '../store/slices/uiSlice';
import apiClient from '../services/apiClient';
import { firebaseSignIn } from '../services/firebaseAuth';
import Input from '../components/common/Input';
import { Button } from '../components/common/Button';
import { ROUTES, APP_NAME } from '../constants';
import type { ApiResponse } from '../types';

const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type FormData = z.infer<typeof schema>;

const LoginPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  const from = (location.state as any)?.from?.pathname;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      // Sign in with Firebase Client SDK
      const credential = await firebaseSignIn(data.email, data.password);
      const token = await credential.user.getIdToken();

      // Get user profile from backend using the /auth/me endpoint
      const res = await apiClient.get<ApiResponse<any>>('/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const user = res.data.data;
      dispatch(setCredentials({ user, token }));
      dispatch(addToast({ type: 'success', message: 'Welcome back!' }));

      const role = user.role;
      const redirect = from ?? (role === 'seller' ? ROUTES.DASHBOARD.SELLER : ROUTES.DASHBOARD.BUYER);
      navigate(redirect, { replace: true });
    } catch (err: any) {
      const message = err?.response?.data?.error?.message ?? err?.message ?? 'Login failed';
      dispatch(setError(message));
      dispatch(addToast({ type: 'error', message }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold font-display text-primary-600 mb-2">
            {APP_NAME}
          </h1>
          <p className="text-lg text-gray-600">Welcome back</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-xl shadow-sm p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Sign in to your account</h2>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              required
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="Password"
              type="password"
              autoComplete="current-password"
              required
              error={errors.password?.message}
              {...register('password')}
            />
            <Button type="submit" loading={loading} fullWidth size="lg">
              Sign in
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link 
                to={ROUTES.REGISTER} 
                className="text-primary-600 hover:text-primary-700 font-medium transition-colors duration-200"
              >
                Create account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
