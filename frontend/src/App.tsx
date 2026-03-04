import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { UsersAnalyticsPage } from './pages/analytics/UsersAnalyticsPage';
import { PromocodesAnalyticsPage } from './pages/analytics/PromocodesAnalyticsPage';
import { PromoUsagesAnalyticsPage } from './pages/analytics/PromoUsagesAnalyticsPage';
import { PromocodesPage } from './pages/PromocodesPage';
import { OrdersPage } from './pages/OrdersPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/analytics/users"
        element={
          <ProtectedRoute>
            <UsersAnalyticsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/analytics/promocodes"
        element={
          <ProtectedRoute>
            <PromocodesAnalyticsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/analytics/promo-usages"
        element={
          <ProtectedRoute>
            <PromoUsagesAnalyticsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/promocodes"
        element={
          <ProtectedRoute>
            <PromocodesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/orders"
        element={
          <ProtectedRoute>
            <OrdersPage />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
          <Toaster position="top-right" />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
