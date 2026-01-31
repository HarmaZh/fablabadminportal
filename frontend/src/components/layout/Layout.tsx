import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white shadow-md border-b-2 border-pale-sky/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="text-2xl font-bold text-jet-black hover:text-primary-600 transition-colors">
                FabLab Admin
              </Link>
            </div>

            <div className="flex items-center gap-6">
              <nav className="flex gap-2">
                <Link
                  to="/"
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    isActive('/')
                      ? 'bg-primary-500 text-white shadow-md'
                      : 'text-jet-black hover:bg-pale-sky hover:shadow-sm'
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  to="/inventory"
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    isActive('/inventory')
                      ? 'bg-primary-500 text-white shadow-md'
                      : 'text-jet-black hover:bg-pale-sky hover:shadow-sm'
                  }`}
                >
                  Inventory
                </Link>
                <Link
                  to="/students"
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    isActive('/students')
                      ? 'bg-primary-500 text-white shadow-md'
                      : 'text-jet-black hover:bg-pale-sky hover:shadow-sm'
                  }`}
                >
                  Students
                </Link>
              </nav>

              <div className="flex items-center gap-4 border-l-2 border-pale-sky pl-4">
                <div className="text-sm">
                  <p className="font-semibold text-jet-black">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-primary-600 text-xs font-medium">{user?.role}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-sm text-red-600 hover:text-red-700 font-semibold px-3 py-1 hover:bg-red-50 rounded-md transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};
