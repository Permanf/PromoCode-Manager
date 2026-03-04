import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function DashboardPage() {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14 items-center">
            <div className="flex gap-6">
              <Link to="/dashboard" className="text-indigo-600 font-semibold">
                PromoCode Manager
              </Link>
              <Link to="/analytics/users" className="text-slate-600 hover:text-slate-900">
                Users
              </Link>
              <Link to="/analytics/promocodes" className="text-slate-600 hover:text-slate-900">
                Promocodes
              </Link>
              <Link to="/analytics/promo-usages" className="text-slate-600 hover:text-slate-900">
                Promo Usages
              </Link>
              <Link to="/promocodes" className="text-slate-600 hover:text-slate-900">
                Manage Promocodes
              </Link>
              <Link to="/orders" className="text-slate-600 hover:text-slate-900">
                Orders
              </Link>
            </div>
            <button
              onClick={logout}
              className="text-slate-600 hover:text-slate-900 text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/analytics/users"
            className="p-6 bg-white rounded-lg shadow border border-slate-200 hover:border-indigo-300 transition"
          >
            <h2 className="font-semibold text-slate-900">Users Analytics</h2>
            <p className="text-sm text-slate-600 mt-1">View users with aggregated stats</p>
          </Link>
          <Link
            to="/analytics/promocodes"
            className="p-6 bg-white rounded-lg shadow border border-slate-200 hover:border-indigo-300 transition"
          >
            <h2 className="font-semibold text-slate-900">Promocodes Analytics</h2>
            <p className="text-sm text-slate-600 mt-1">View promocode effectiveness</p>
          </Link>
          <Link
            to="/analytics/promo-usages"
            className="p-6 bg-white rounded-lg shadow border border-slate-200 hover:border-indigo-300 transition"
          >
            <h2 className="font-semibold text-slate-900">Promo Usages</h2>
            <p className="text-sm text-slate-600 mt-1">History of promocode applications</p>
          </Link>
        </div>
      </main>
    </div>
  );
}
