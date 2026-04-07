import React from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../constants';

const NotFoundPage: React.FC = () => (
  <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
    <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
    <p className="text-xl text-gray-600 mb-6">Page not found</p>
    <Link to={ROUTES.HOME} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
      Go home
    </Link>
  </div>
);

export default NotFoundPage;
