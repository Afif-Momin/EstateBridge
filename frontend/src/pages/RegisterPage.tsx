import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm, useController } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase';
import { useAppDispatch } from '../store';
import { setCredentials } from '../store/slices/authSlice';
import { addToast } from '../store/slices/uiSlice';
import apiClient from '../services/apiClient';
import { firebaseSignUp } from '../services/firebaseAuth';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import { Button } from '../components/common/Button';
import { ROUTES, USER_ROLES, VALIDATION, APP_NAME } from '../constants';
import type { ApiResponse, AuthResponse } from '../types';

/** Map Firebase Auth error codes to friendly messages */
const getFirebaseErrorMessage = (code: string): string => {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'This email is already registered. Please sign in instead.';
    case 'auth/invalid-email':
      return 'Invalid email address.';
    case 'auth/weak-password':
      return 'Password is too weak. Use at least 8 characters with uppercase, lowercase, and a number.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection and try again.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment and try again.';
    default:
      return 'Authentication failed. Please try again.';
  }
};

// Country → States/Provinces
const COUNTRY_STATES: Record<string, { value: string; label: string }[]> = {
  US: [
    { value: 'AL', label: 'Alabama' }, { value: 'AK', label: 'Alaska' },
    { value: 'AZ', label: 'Arizona' }, { value: 'AR', label: 'Arkansas' },
    { value: 'CA', label: 'California' }, { value: 'CO', label: 'Colorado' },
    { value: 'CT', label: 'Connecticut' }, { value: 'DE', label: 'Delaware' },
    { value: 'FL', label: 'Florida' }, { value: 'GA', label: 'Georgia' },
    { value: 'HI', label: 'Hawaii' }, { value: 'ID', label: 'Idaho' },
    { value: 'IL', label: 'Illinois' }, { value: 'IN', label: 'Indiana' },
    { value: 'IA', label: 'Iowa' }, { value: 'KS', label: 'Kansas' },
    { value: 'KY', label: 'Kentucky' }, { value: 'LA', label: 'Louisiana' },
    { value: 'ME', label: 'Maine' }, { value: 'MD', label: 'Maryland' },
    { value: 'MA', label: 'Massachusetts' }, { value: 'MI', label: 'Michigan' },
    { value: 'MN', label: 'Minnesota' }, { value: 'MS', label: 'Mississippi' },
    { value: 'MO', label: 'Missouri' }, { value: 'MT', label: 'Montana' },
    { value: 'NE', label: 'Nebraska' }, { value: 'NV', label: 'Nevada' },
    { value: 'NH', label: 'New Hampshire' }, { value: 'NJ', label: 'New Jersey' },
    { value: 'NM', label: 'New Mexico' }, { value: 'NY', label: 'New York' },
    { value: 'NC', label: 'North Carolina' }, { value: 'ND', label: 'North Dakota' },
    { value: 'OH', label: 'Ohio' }, { value: 'OK', label: 'Oklahoma' },
    { value: 'OR', label: 'Oregon' }, { value: 'PA', label: 'Pennsylvania' },
    { value: 'RI', label: 'Rhode Island' }, { value: 'SC', label: 'South Carolina' },
    { value: 'SD', label: 'South Dakota' }, { value: 'TN', label: 'Tennessee' },
    { value: 'TX', label: 'Texas' }, { value: 'UT', label: 'Utah' },
    { value: 'VT', label: 'Vermont' }, { value: 'VA', label: 'Virginia' },
    { value: 'WA', label: 'Washington' }, { value: 'WV', label: 'West Virginia' },
    { value: 'WI', label: 'Wisconsin' }, { value: 'WY', label: 'Wyoming' },
  ],
  IN: [
    { value: 'AN', label: 'Andaman and Nicobar Islands' },
    { value: 'AP', label: 'Andhra Pradesh' }, { value: 'AR', label: 'Arunachal Pradesh' },
    { value: 'AS', label: 'Assam' }, { value: 'BR', label: 'Bihar' },
    { value: 'CH', label: 'Chandigarh' }, { value: 'CT', label: 'Chhattisgarh' },
    { value: 'DN', label: 'Dadra and Nagar Haveli and Daman and Diu' },
    { value: 'DL', label: 'Delhi' }, { value: 'GA', label: 'Goa' },
    { value: 'GJ', label: 'Gujarat' }, { value: 'HR', label: 'Haryana' },
    { value: 'HP', label: 'Himachal Pradesh' }, { value: 'JK', label: 'Jammu and Kashmir' },
    { value: 'JH', label: 'Jharkhand' }, { value: 'KA', label: 'Karnataka' },
    { value: 'KL', label: 'Kerala' }, { value: 'LA', label: 'Ladakh' },
    { value: 'LD', label: 'Lakshadweep' }, { value: 'MP', label: 'Madhya Pradesh' },
    { value: 'MH', label: 'Maharashtra' }, { value: 'MN', label: 'Manipur' },
    { value: 'ML', label: 'Meghalaya' }, { value: 'MZ', label: 'Mizoram' },
    { value: 'NL', label: 'Nagaland' }, { value: 'OR', label: 'Odisha' },
    { value: 'PY', label: 'Puducherry' }, { value: 'PB', label: 'Punjab' },
    { value: 'RJ', label: 'Rajasthan' }, { value: 'SK', label: 'Sikkim' },
    { value: 'TN', label: 'Tamil Nadu' }, { value: 'TS', label: 'Telangana' },
    { value: 'TR', label: 'Tripura' }, { value: 'UP', label: 'Uttar Pradesh' },
    { value: 'UT', label: 'Uttarakhand' }, { value: 'WB', label: 'West Bengal' },
  ],
  GB: [
    { value: 'ENG', label: 'England' }, { value: 'SCT', label: 'Scotland' },
    { value: 'WLS', label: 'Wales' }, { value: 'NIR', label: 'Northern Ireland' },
  ],
  CA: [
    { value: 'AB', label: 'Alberta' }, { value: 'BC', label: 'British Columbia' },
    { value: 'MB', label: 'Manitoba' }, { value: 'NB', label: 'New Brunswick' },
    { value: 'NL', label: 'Newfoundland and Labrador' }, { value: 'NS', label: 'Nova Scotia' },
    { value: 'NT', label: 'Northwest Territories' }, { value: 'NU', label: 'Nunavut' },
    { value: 'ON', label: 'Ontario' }, { value: 'PE', label: 'Prince Edward Island' },
    { value: 'QC', label: 'Quebec' }, { value: 'SK', label: 'Saskatchewan' },
    { value: 'YT', label: 'Yukon' },
  ],
  AU: [
    { value: 'ACT', label: 'Australian Capital Territory' },
    { value: 'NSW', label: 'New South Wales' }, { value: 'NT_AU', label: 'Northern Territory' },
    { value: 'QLD', label: 'Queensland' }, { value: 'SA_AU', label: 'South Australia' },
    { value: 'TAS', label: 'Tasmania' }, { value: 'VIC', label: 'Victoria' },
    { value: 'WA_AU', label: 'Western Australia' },
  ],
};

// State → Cities
const STATE_CITIES: Record<string, { value: string; label: string }[]> = {
  // US States
  CA: [
    { value: 'Los Angeles', label: 'Los Angeles' }, { value: 'San Francisco', label: 'San Francisco' },
    { value: 'San Diego', label: 'San Diego' }, { value: 'San Jose', label: 'San Jose' },
    { value: 'Sacramento', label: 'Sacramento' }, { value: 'Fresno', label: 'Fresno' },
    { value: 'Long Beach', label: 'Long Beach' }, { value: 'Oakland', label: 'Oakland' },
  ],
  NY: [
    { value: 'New York City', label: 'New York City' }, { value: 'Buffalo', label: 'Buffalo' },
    { value: 'Rochester', label: 'Rochester' }, { value: 'Yonkers', label: 'Yonkers' },
    { value: 'Syracuse', label: 'Syracuse' }, { value: 'Albany', label: 'Albany' },
  ],
  TX: [
    { value: 'Houston', label: 'Houston' }, { value: 'San Antonio', label: 'San Antonio' },
    { value: 'Dallas', label: 'Dallas' }, { value: 'Austin', label: 'Austin' },
    { value: 'Fort Worth', label: 'Fort Worth' }, { value: 'El Paso', label: 'El Paso' },
  ],
  FL: [
    { value: 'Jacksonville', label: 'Jacksonville' }, { value: 'Miami', label: 'Miami' },
    { value: 'Tampa', label: 'Tampa' }, { value: 'Orlando', label: 'Orlando' },
    { value: 'St. Petersburg', label: 'St. Petersburg' },
  ],
  IL: [
    { value: 'Chicago', label: 'Chicago' }, { value: 'Aurora', label: 'Aurora' },
    { value: 'Naperville', label: 'Naperville' }, { value: 'Joliet', label: 'Joliet' },
  ],
  WA: [
    { value: 'Seattle', label: 'Seattle' }, { value: 'Spokane', label: 'Spokane' },
    { value: 'Tacoma', label: 'Tacoma' }, { value: 'Bellevue', label: 'Bellevue' },
  ],
  // India States
  MH: [
    { value: 'Mumbai', label: 'Mumbai' }, { value: 'Pune', label: 'Pune' },
    { value: 'Nagpur', label: 'Nagpur' }, { value: 'Nashik', label: 'Nashik' },
    { value: 'Aurangabad', label: 'Aurangabad' }, { value: 'Thane', label: 'Thane' },
  ],
  DL: [
    { value: 'New Delhi', label: 'New Delhi' }, { value: 'Delhi', label: 'Delhi' },
    { value: 'Noida', label: 'Noida' }, { value: 'Gurgaon', label: 'Gurgaon' },
  ],
  KA: [
    { value: 'Bangalore', label: 'Bangalore' }, { value: 'Mysore', label: 'Mysore' },
    { value: 'Hubli', label: 'Hubli' }, { value: 'Mangalore', label: 'Mangalore' },
  ],
  TN: [
    { value: 'Chennai', label: 'Chennai' }, { value: 'Coimbatore', label: 'Coimbatore' },
    { value: 'Madurai', label: 'Madurai' }, { value: 'Salem', label: 'Salem' },
  ],
  GJ: [
    { value: 'Ahmedabad', label: 'Ahmedabad' }, { value: 'Surat', label: 'Surat' },
    { value: 'Vadodara', label: 'Vadodara' }, { value: 'Rajkot', label: 'Rajkot' },
  ],
  RJ: [
    { value: 'Jaipur', label: 'Jaipur' }, { value: 'Jodhpur', label: 'Jodhpur' },
    { value: 'Udaipur', label: 'Udaipur' }, { value: 'Kota', label: 'Kota' },
  ],
  UP: [
    { value: 'Lucknow', label: 'Lucknow' }, { value: 'Kanpur', label: 'Kanpur' },
    { value: 'Agra', label: 'Agra' }, { value: 'Varanasi', label: 'Varanasi' },
    { value: 'Ghaziabad', label: 'Ghaziabad' }, { value: 'Noida', label: 'Noida' },
  ],
  WB: [
    { value: 'Kolkata', label: 'Kolkata' }, { value: 'Howrah', label: 'Howrah' },
    { value: 'Durgapur', label: 'Durgapur' }, { value: 'Asansol', label: 'Asansol' },
  ],
  TS: [
    { value: 'Hyderabad', label: 'Hyderabad' }, { value: 'Warangal', label: 'Warangal' },
    { value: 'Nizamabad', label: 'Nizamabad' },
  ],
  KL: [
    { value: 'Thiruvananthapuram', label: 'Thiruvananthapuram' }, { value: 'Kochi', label: 'Kochi' },
    { value: 'Kozhikode', label: 'Kozhikode' },
  ],
  // UK
  ENG: [
    { value: 'London', label: 'London' }, { value: 'Birmingham', label: 'Birmingham' },
    { value: 'Manchester', label: 'Manchester' }, { value: 'Leeds', label: 'Leeds' },
    { value: 'Sheffield', label: 'Sheffield' }, { value: 'Bristol', label: 'Bristol' },
    { value: 'Liverpool', label: 'Liverpool' }, { value: 'Leicester', label: 'Leicester' },
  ],
  SCT: [
    { value: 'Edinburgh', label: 'Edinburgh' }, { value: 'Glasgow', label: 'Glasgow' },
    { value: 'Aberdeen', label: 'Aberdeen' }, { value: 'Dundee', label: 'Dundee' },
  ],
  WLS: [
    { value: 'Cardiff', label: 'Cardiff' }, { value: 'Swansea', label: 'Swansea' },
    { value: 'Newport', label: 'Newport' },
  ],
  NIR: [
    { value: 'Belfast', label: 'Belfast' }, { value: 'Derry', label: 'Derry' },
  ],
  // Canada
  ON: [
    { value: 'Toronto', label: 'Toronto' }, { value: 'Ottawa', label: 'Ottawa' },
    { value: 'Mississauga', label: 'Mississauga' }, { value: 'Hamilton', label: 'Hamilton' },
  ],
  BC: [
    { value: 'Vancouver', label: 'Vancouver' }, { value: 'Victoria', label: 'Victoria' },
    { value: 'Kelowna', label: 'Kelowna' }, { value: 'Abbotsford', label: 'Abbotsford' },
  ],
  QC: [
    { value: 'Montreal', label: 'Montreal' }, { value: 'Quebec City', label: 'Quebec City' },
    { value: 'Laval', label: 'Laval' }, { value: 'Gatineau', label: 'Gatineau' },
  ],
  AB: [
    { value: 'Calgary', label: 'Calgary' }, { value: 'Edmonton', label: 'Edmonton' },
    { value: 'Red Deer', label: 'Red Deer' }, { value: 'Lethbridge', label: 'Lethbridge' },
  ],
  // Australia
  NSW: [
    { value: 'Sydney', label: 'Sydney' }, { value: 'Newcastle', label: 'Newcastle' },
    { value: 'Wollongong', label: 'Wollongong' }, { value: 'Central Coast', label: 'Central Coast' },
  ],
  VIC: [
    { value: 'Melbourne', label: 'Melbourne' }, { value: 'Geelong', label: 'Geelong' },
    { value: 'Ballarat', label: 'Ballarat' }, { value: 'Bendigo', label: 'Bendigo' },
  ],
  QLD: [
    { value: 'Brisbane', label: 'Brisbane' }, { value: 'Gold Coast', label: 'Gold Coast' },
    { value: 'Sunshine Coast', label: 'Sunshine Coast' }, { value: 'Cairns', label: 'Cairns' },
  ],
  WA_AU: [
    { value: 'Perth', label: 'Perth' }, { value: 'Fremantle', label: 'Fremantle' },
    { value: 'Bunbury', label: 'Bunbury' },
  ],
  SA_AU: [
    { value: 'Adelaide', label: 'Adelaide' }, { value: 'Mount Gambier', label: 'Mount Gambier' },
  ],
  NT_AU: [
    { value: 'Darwin', label: 'Darwin' }, { value: 'Alice Springs', label: 'Alice Springs' },
  ],
};

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
  buy_city: z.string().min(1, 'City is required'),
  buy_state: z.string().min(1, 'State is required'),
  buy_address: z.string().min(5, 'Address must be at least 5 characters'),
  buy_pincode: z.string().min(5, 'Pincode is required'),
});

type FormData = z.infer<typeof schema>;

const RegisterPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedState, setSelectedState] = useState<string>('');

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  // useController for cascading dropdowns so RHF tracks their values
  const { field: countryField } = useController({ name: 'buy_country', control, defaultValue: '' });
  const { field: stateField } = useController({ name: 'buy_state', control, defaultValue: '' });
  const { field: cityField } = useController({ name: 'buy_city', control, defaultValue: '' });

  const stateOptions = selectedCountry ? (COUNTRY_STATES[selectedCountry] ?? []) : [];
  const cityOptions = selectedState ? (STATE_CITIES[selectedState] ?? []) : [];

  const onCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const country = e.target.value;
    setSelectedCountry(country);
    setSelectedState('');
    countryField.onChange(country);
    stateField.onChange('');
    cityField.onChange('');
  };

  const onStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const state = e.target.value;
    setSelectedState(state);
    stateField.onChange(state);
    cityField.onChange('');
  };

  const onCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    cityField.onChange(e.target.value);
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      let token: string;

      try {
        // Try to create a new Firebase Auth account
        const credential = await firebaseSignUp(data.email, data.password);
        token = await credential.user.getIdToken();
      } catch (firebaseErr: any) {
        // If the email already exists in Firebase (stranded from a previous failed attempt),
        // sign in with the same credentials to get a fresh token, then retry backend registration
        if (firebaseErr?.code === 'auth/email-already-in-use') {
          try {
            const existingCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
            token = await existingCredential.user.getIdToken();
          } catch {
            // Wrong password or other issue — just show the original "already registered" error
            dispatch(addToast({ 
              type: 'error', 
              message: 'This email is already registered. Please sign in instead.' 
            }));
            return;
          }
        } else {
          // Other Firebase errors (weak password, invalid email, etc.)
          const message = firebaseErr?.code 
            ? getFirebaseErrorMessage(firebaseErr.code)
            : (firebaseErr?.message ?? 'Registration failed');
          dispatch(addToast({ type: 'error', message }));
          return;
        }
      }

      // Register user profile in backend (uses idToken to link with Firebase Auth user)
      const res = await apiClient.post<ApiResponse<AuthResponse>>('/auth/register', {
        email: data.email,
        fullName: data.fullName,
        role: data.role,
        idToken: token,
        buy_country: data.buy_country,
        buy_city: data.buy_city,
        buy_state: data.buy_state,
        buy_address: data.buy_address,
        buy_pincode: data.buy_pincode,
      });

      dispatch(setCredentials({ user: res.data.data.user, token }));
      dispatch(addToast({ 
        type: 'success', 
        message: 'Account created successfully!' 
      }));

      const redirect = data.role === 'seller' ? ROUTES.DASHBOARD.SELLER : ROUTES.DASHBOARD.BUYER;
      navigate(redirect, { replace: true });
    } catch (err: any) {
      // Extract the most specific error message from the backend response
      const backendFields = err?.response?.data?.error?.fields;
      const backendMessage = err?.response?.data?.error?.message;
      
      let message = 'Registration failed. Please try again.';
      if (backendFields) {
        // Show first field-level validation error
        const firstField = Object.values(backendFields)[0] as string[];
        message = firstField?.[0] ?? backendMessage ?? message;
      } else if (backendMessage) {
        message = backendMessage;
      } else if (err?.message) {
        message = err.message;
      }

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
                {/* Country */}
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
                  value={countryField.value}
                  onChange={onCountryChange}
                  onBlur={countryField.onBlur}
                  name={countryField.name}
                  ref={countryField.ref}
                />

                {/* State — dropdown if available, free text fallback */}
                {stateOptions.length > 0 ? (
                  <Select
                    label="State/Province"
                    required
                    options={stateOptions}
                    placeholder="Select your state"
                    error={errors.buy_state?.message}
                    value={stateField.value}
                    onChange={onStateChange}
                    onBlur={stateField.onBlur}
                    name={stateField.name}
                    ref={stateField.ref}
                    disabled={!selectedCountry}
                  />
                ) : (
                  <Input
                    label="State/Province"
                    type="text"
                    autoComplete="address-level1"
                    required
                    error={errors.buy_state?.message}
                    {...register('buy_state')}
                  />
                )}

                {/* City — dropdown if available, free text fallback */}
                {cityOptions.length > 0 ? (
                  <Select
                    label="City"
                    required
                    options={cityOptions}
                    placeholder="Select your city"
                    error={errors.buy_city?.message}
                    value={cityField.value}
                    onChange={onCityChange}
                    onBlur={cityField.onBlur}
                    name={cityField.name}
                    ref={cityField.ref}
                    disabled={!selectedState}
                  />
                ) : (
                  <Input
                    label="City"
                    type="text"
                    autoComplete="address-level2"
                    required
                    error={errors.buy_city?.message}
                    placeholder={selectedState ? 'Enter your city' : selectedCountry ? 'Select a state first' : 'Enter your city'}
                    {...register('buy_city')}
                  />
                )}

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

            <Button 
              type="submit" 
              loading={loading} 
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
