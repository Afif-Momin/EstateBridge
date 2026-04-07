import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAppDispatch } from '../store';
import { setCredentials } from '../store/slices/authSlice';
import { addToast } from '../store/slices/uiSlice';
import apiClient from '../services/apiClient';
import { firebaseSignUp } from '../services/firebaseAuth';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import { Button } from '../components/common/Button';
import { CaptchaWidget } from '../components/auth/CaptchaWidget';
import { ROUTES, USER_ROLES, VALIDATION, APP_NAME } from '../constants';
import type { ApiResponse, AuthResponse } from '../types';

const schema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(VALIDATION.PASSWORD_MIN_LENGTH, `Password must be at least ${VALIDATION.PASSWORD_MIN_LENGTH} characters`)
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  role: z.enum(['buyer', 'seller']),
  buy_country: z.string().min(2, 'Country is required'),
  buy_city: z.string().min(2, 'City is required'),
  buy_state: z.string().min(2, 'State is required'),
  buy_address: z.string().min(5, 'Address must be at least 5 characters'),
  buy_pincode: z.string().min(5, 'Pincode is required'),
});

type FormData = z.infer<typeof schema>;

const RegisterPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaError, setCaptchaError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      // Validate CAPTCHA token
      if (!captchaToken) {
        dispatch(addToast({ type: 'error', message: 'Please complete the verification' }));
        setLoading(false);
        return;
      }

      // Create Firebase Auth account
      const credential = await firebaseSignUp(data.email, data.password);
      const token = await credential.user.getIdToken();

      // Register with backend
      const res = await apiClient.post<ApiResponse<AuthResponse>>('/auth/register', {
        email: data.email,
        fullName: data.fullName,
        role: data.role,
        idToken: token,
        captchaToken,
        buy_country: data.buy_country,
        buy_city: data.buy_city,
        buy_state: data.buy_state,
        buy_address: data.buy_address,
        buy_pincode: data.buy_pincode,
      });

      dispatch(setCredentials({ user: res.data.data.user, token }));
      dispatch(addToast({ 
        type: 'success', 
        message: 'Account created successfully! Please check your email to verify your account.' 
      }));

      const redirect = data.role === 'seller' ? ROUTES.DASHBOARD.SELLER : ROUTES.DASHBOARD.BUYER;
      navigate(redirect, { replace: true });
    } catch (err: any) {
      const message = err?.response?.data?.error?.message ?? err?.message ?? 'Registration failed';
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
          <p className="text-lg text-gray-600">Create your account</p>
        </div>

        {/* Register Card */}
        <div className="bg-white rounded-xl shadow-sm p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Get started</h2>
          <p className="text-sm text-gray-600 mb-6">Join Estate Bridge today</p>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
            <Input
              label="Full Name"
              type="text"
              autoComplete="name"
              required
              error={errors.fullName?.message}
              {...register('fullName')}
            />
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
              autoComplete="new-password"
              required
              error={errors.password?.message}
              helperText="Must contain: 8+ characters, uppercase, lowercase, and number"
              {...register('password')}
            />
            <Select
              label="I am a"
              required
              options={USER_ROLES.map((r) => ({ value: r.value, label: r.label }))}
              placeholder="Select your role"
              error={errors.role?.message}
              {...register('role')}
            />

            {/* Location Fields */}
            <div className="border-t pt-5 mt-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Location Information</h3>
              <div className="space-y-4">
                <Select
                  label="Country"
                  required
                  options={[
                    { value: 'US', label: 'United States' },
                    { value: 'IN', label: 'India' },
                    { value: 'GB', label: 'United Kingdom' },
                    { value: 'CA', label: 'Canada' },
                    { value: 'AU', label: 'Australia' },
                  ]}
                  placeholder="Select your country"
                  error={errors.buy_country?.message}
                  {...register('buy_country')}
                />
                <Input
                  label="City"
                  type="text"
                  autoComplete="address-level2"
                  required
                  error={errors.buy_city?.message}
                  {...register('buy_city')}
                />
                <Input
                  label="State/Province"
                  type="text"
                  autoComplete="address-level1"
                  required
                  error={errors.buy_state?.message}
                  {...register('buy_state')}
                />
                <Input
                  label="Address"
                  type="text"
                  autoComplete="street-address"
                  required
                  error={errors.buy_address?.message}
                  {...register('buy_address')}
                />
                <Input
                  label="Pincode/ZIP Code"
                  type="text"
                  autoComplete="postal-code"
                  required
                  error={errors.buy_pincode?.message}
                  helperText="US: 5 digits, India: 6 digits"
                  {...register('buy_pincode')}
                />
              </div>
            </div>

            {/* CAPTCHA Widget */}
            <div className="pt-2">
              <CaptchaWidget
                action="register"
                onTokenReceived={(token) => {
                  setCaptchaToken(token);
                  setCaptchaError(null);
                }}
                onError={(error) => {
                  setCaptchaError(error.message);
                  setCaptchaToken(null);
                }}
              />
              {captchaError && (
                <p className="text-sm text-error-600 mt-2">
                  Verification failed. Please refresh the page and try again.
                </p>
              )}
            </div>

            <Button 
              type="submit" 
              loading={loading} 
              disabled={!captchaToken || !!captchaError}
              fullWidth 
              size="lg"
            >
              Create account
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link 
                to={ROUTES.LOGIN} 
                className="text-primary-600 hover:text-primary-700 font-medium transition-colors duration-200"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
