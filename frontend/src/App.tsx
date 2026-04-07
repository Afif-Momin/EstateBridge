import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { QueryClientProvider } from '@tanstack/react-query';
import { store } from './store';
import { queryClient } from './services/queryClient';
import { ROUTES } from './constants';
import Navbar from './components/layout/Navbar';
import ProtectedRoute from './components/layout/ProtectedRoute';
import ToastContainer from './components/common/Toast';
import ErrorBoundary from './components/common/ErrorBoundary';
import { Spinner } from './components/common/Spinner';
import { EmailVerificationBanner } from './components/auth/EmailVerificationBanner';

// Lazy-loaded pages
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const SellerDashboardPage = lazy(() => import('./pages/SellerDashboardPage'));
const BuyerDashboardPage = lazy(() => import('./pages/BuyerDashboardPage'));
const PropertyBrowsePage = lazy(() => import('./pages/PropertyBrowsePage'));
const PropertyDetailPage = lazy(() => import('./pages/PropertyDetailPage'));
const PropertyCreatePage = lazy(() => import('./pages/PropertyCreatePage'));
const PropertyEditPage = lazy(() => import('./pages/PropertyEditPage'));
const MyListingsPage = lazy(() => import('./pages/MyListingsPage'));
const BuyerAppointmentsPage = lazy(() => import('./pages/BuyerAppointmentsPage'));
const SellerAppointmentsPage = lazy(() => import('./pages/SellerAppointmentsPage'));
const AISupportPage = lazy(() => import('./pages/AISupportPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <Spinner size="lg" />
  </div>
);

const AppRoutes: React.FC = () => (
  <Suspense fallback={<PageLoader />}>
    <Routes>
      {/* Public routes */}
      <Route path={ROUTES.LOGIN} element={<LoginPage />} />
      <Route path={ROUTES.REGISTER} element={<RegisterPage />} />

      {/* Home redirect */}
      <Route path={ROUTES.HOME} element={<Navigate to={ROUTES.PROPERTIES.BROWSE} replace />} />

      {/* Protected — any authenticated user */}
      <Route
        path={ROUTES.PROPERTIES.BROWSE}
        element={<ProtectedRoute><PropertyBrowsePage /></ProtectedRoute>}
      />
      <Route
        path={ROUTES.PROPERTIES.DETAIL}
        element={<ProtectedRoute><PropertyDetailPage /></ProtectedRoute>}
      />
      <Route
        path={ROUTES.AI_SUPPORT}
        element={<ProtectedRoute><AISupportPage /></ProtectedRoute>}
      />

      {/* Seller-only routes */}
      <Route
        path={ROUTES.DASHBOARD.SELLER}
        element={<ProtectedRoute requiredRole="seller"><SellerDashboardPage /></ProtectedRoute>}
      />
      <Route
        path={ROUTES.PROPERTIES.CREATE}
        element={<ProtectedRoute requiredRole="seller"><PropertyCreatePage /></ProtectedRoute>}
      />
      <Route
        path={ROUTES.PROPERTIES.EDIT}
        element={<ProtectedRoute requiredRole="seller"><PropertyEditPage /></ProtectedRoute>}
      />
      <Route
        path={ROUTES.PROPERTIES.MY_LISTINGS}
        element={<ProtectedRoute requiredRole="seller"><MyListingsPage /></ProtectedRoute>}
      />
      <Route
        path={ROUTES.APPOINTMENTS.SELLER}
        element={<ProtectedRoute requiredRole="seller"><SellerAppointmentsPage /></ProtectedRoute>}
      />

      {/* Buyer-only routes */}
      <Route
        path={ROUTES.DASHBOARD.BUYER}
        element={<ProtectedRoute requiredRole="buyer"><BuyerDashboardPage /></ProtectedRoute>}
      />
      <Route
        path={ROUTES.APPOINTMENTS.BUYER}
        element={<ProtectedRoute requiredRole="buyer"><BuyerAppointmentsPage /></ProtectedRoute>}
      />

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  </Suspense>
);

const App: React.FC = () => (
  <Provider store={store}>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ErrorBoundary>
          <div className="min-h-screen bg-gray-50">
            <Navbar />
            <EmailVerificationBanner />
            <main id="main-content">
              <AppRoutes />
            </main>
            <ToastContainer />
          </div>
        </ErrorBoundary>
      </BrowserRouter>
    </QueryClientProvider>
  </Provider>
);

export default App;
