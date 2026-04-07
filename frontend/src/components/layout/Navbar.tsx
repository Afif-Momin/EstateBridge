import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store';
import { logout } from '../../store/slices/authSlice';
import { addToast } from '../../store/slices/uiSlice';
import { ROUTES, APP_NAME } from '../../constants';
import apiClient from '../../services/apiClient';
import { firebaseSignOut } from '../../services/firebaseAuth';

const Navbar: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, role, user } = useAppSelector((s) => s.auth);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // ignore backend errors
    }
    try {
      await firebaseSignOut();
    } catch {
      // ignore
    }
    dispatch(logout());
    dispatch(addToast({ type: 'success', message: 'Logged out successfully' }));
    navigate(ROUTES.LOGIN);
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
      isActive 
        ? 'text-primary-700 bg-primary-50' 
        : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'
    }`;

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm" aria-label="Main navigation">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link 
            to={ROUTES.HOME} 
            className="text-xl font-bold font-display text-primary-600 hover:text-primary-700 transition-colors duration-200"
          >
            {APP_NAME}
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-2">
            {isAuthenticated ? (
              <>
                <NavLink to={ROUTES.PROPERTIES.BROWSE} className={navLinkClass}>
                  Browse
                </NavLink>

                {role === 'seller' && (
                  <>
                    <NavLink to={ROUTES.DASHBOARD.SELLER} className={navLinkClass}>
                      Dashboard
                    </NavLink>
                    <NavLink to={ROUTES.PROPERTIES.MY_LISTINGS} className={navLinkClass}>
                      My Listings
                    </NavLink>
                    <NavLink to={ROUTES.APPOINTMENTS.SELLER} className={navLinkClass}>
                      Appointments
                    </NavLink>
                  </>
                )}

                {role === 'buyer' && (
                  <>
                    <NavLink to={ROUTES.DASHBOARD.BUYER} className={navLinkClass}>
                      Dashboard
                    </NavLink>
                    <NavLink to={ROUTES.APPOINTMENTS.BUYER} className={navLinkClass}>
                      Appointments
                    </NavLink>
                  </>
                )}

                <NavLink to={ROUTES.AI_SUPPORT} className={navLinkClass}>
                  AI Support
                </NavLink>

                <div className="flex items-center gap-3 ml-4 pl-4 border-l border-gray-200">
                  <span className="text-sm text-gray-600 font-medium">{user?.fullName}</span>
                  <button
                    onClick={handleLogout}
                    className="px-3 py-2 text-sm font-medium text-error-600 hover:text-error-700 hover:bg-error-50 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-error-500 focus:ring-offset-2"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                <NavLink to={ROUTES.LOGIN} className={navLinkClass}>
                  Login
                </NavLink>
                <Link
                  to={ROUTES.REGISTER}
                  className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-button hover:bg-primary-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                >
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200 min-w-[44px] min-h-[44px] flex items-center justify-center"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label="Toggle navigation menu"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div 
            id="mobile-menu" 
            className="md:hidden py-4 border-t border-gray-100 flex flex-col gap-2 animate-in slide-in-from-top duration-200"
          >
            {isAuthenticated ? (
              <>
                <NavLink 
                  to={ROUTES.PROPERTIES.BROWSE} 
                  className={navLinkClass} 
                  onClick={() => setMenuOpen(false)}
                >
                  Browse
                </NavLink>
                {role === 'seller' && (
                  <>
                    <NavLink 
                      to={ROUTES.DASHBOARD.SELLER} 
                      className={navLinkClass} 
                      onClick={() => setMenuOpen(false)}
                    >
                      Dashboard
                    </NavLink>
                    <NavLink 
                      to={ROUTES.PROPERTIES.MY_LISTINGS} 
                      className={navLinkClass} 
                      onClick={() => setMenuOpen(false)}
                    >
                      My Listings
                    </NavLink>
                    <NavLink 
                      to={ROUTES.APPOINTMENTS.SELLER} 
                      className={navLinkClass} 
                      onClick={() => setMenuOpen(false)}
                    >
                      Appointments
                    </NavLink>
                  </>
                )}
                {role === 'buyer' && (
                  <>
                    <NavLink 
                      to={ROUTES.DASHBOARD.BUYER} 
                      className={navLinkClass} 
                      onClick={() => setMenuOpen(false)}
                    >
                      Dashboard
                    </NavLink>
                    <NavLink 
                      to={ROUTES.APPOINTMENTS.BUYER} 
                      className={navLinkClass} 
                      onClick={() => setMenuOpen(false)}
                    >
                      Appointments
                    </NavLink>
                  </>
                )}
                <NavLink 
                  to={ROUTES.AI_SUPPORT} 
                  className={navLinkClass} 
                  onClick={() => setMenuOpen(false)}
                >
                  AI Support
                </NavLink>
                <div className="pt-2 mt-2 border-t border-gray-100">
                  <p className="px-3 py-2 text-sm text-gray-600 font-medium">{user?.fullName}</p>
                  <button 
                    onClick={handleLogout} 
                    className="w-full text-left px-3 py-2 text-sm font-medium text-error-600 hover:text-error-700 hover:bg-error-50 rounded-lg transition-colors duration-200 min-h-[44px]"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                <NavLink 
                  to={ROUTES.LOGIN} 
                  className={navLinkClass} 
                  onClick={() => setMenuOpen(false)}
                >
                  Login
                </NavLink>
                <NavLink 
                  to={ROUTES.REGISTER} 
                  className={navLinkClass} 
                  onClick={() => setMenuOpen(false)}
                >
                  Register
                </NavLink>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
