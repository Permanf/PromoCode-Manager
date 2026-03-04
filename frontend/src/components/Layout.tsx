import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function Layout({ children }: { children: React.ReactNode }) {
  const { logout } = useAuth();
  const location = useLocation();

  const navLink = (to: string, label: string) => (
    <Link
      to={to}
      className={
        location.pathname === to
          ? 'text-indigo-600 font-medium'
          : 'text-slate-600 hover:text-slate-900'
      }
    >
      {label}
    </Link>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14 items-center">
            <div className="flex gap-6">
              <Link to="/dashboard" className="text-indigo-600 font-semibold">
                PromoCode Manager
              </Link>
              {navLink('/analytics/users', 'Users')}
              {navLink('/analytics/promocodes', 'Promocodes')}
              {navLink('/analytics/promo-usages', 'Promo Usages')}
              {navLink('/promocodes', 'Manage Promocodes')}
              {navLink('/orders', 'Orders')}
            </div>
            <button onClick={logout} className="text-slate-600 hover:text-slate-900 text-sm">
              Logout
            </button>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
