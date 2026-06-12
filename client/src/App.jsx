import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { AppShell } from './components/AppShell.jsx';
import { AuthPage } from './pages/AuthPage.jsx';
import { DashboardPage } from './pages/DashboardPage.jsx';
import { HomePage } from './pages/HomePage.jsx';
import { PlannerPage } from './pages/PlannerPage.jsx';
import { SchedulePage } from './pages/SchedulePage.jsx';
import { ShiftsPage } from './pages/ShiftsPage.jsx';
import { SwapRequestsPage } from './pages/SwapRequestsPage.jsx';
import { TasksPage } from './pages/TasksPage.jsx';
import { UsersPage } from './pages/UsersPage.jsx';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 20_000,
            refetchOnWindowFocus: false,
        },
    },
});

function ProtectedRoute({ children, adminOnly = false }) {
    const { isAuthenticated, loading, user } = useAuth();

    if (loading) {
        return <div className="px-6 py-8 text-sm text-slate-300">Loading...</div>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (adminOnly && user.role !== 'admin') {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
}

export function SmartShiftApp() {
    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <BrowserRouter>
                    <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/login" element={<AuthPage mode="login" />} />
                        <Route path="/register" element={<AuthPage mode="register" />} />
                        <Route
                            element={(
                                <ProtectedRoute>
                                    <AppShell />
                                </ProtectedRoute>
                            )}
                        >
                            <Route path="/dashboard" element={<DashboardPage />} />
                            <Route path="/shifts" element={<ShiftsPage />} />
                            <Route path="/tasks" element={<TasksPage />} />
                            <Route path="/my-schedule" element={<SchedulePage />} />
                            <Route path="/swap-requests" element={<SwapRequestsPage />} />
                            <Route
                                path="/planner"
                                element={(
                                    <ProtectedRoute adminOnly>
                                        <PlannerPage />
                                    </ProtectedRoute>
                                )}
                            />
                            <Route
                                path="/users"
                                element={(
                                    <ProtectedRoute adminOnly>
                                        <UsersPage />
                                    </ProtectedRoute>
                                )}
                            />
                        </Route>
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </BrowserRouter>
            </AuthProvider>
        </QueryClientProvider>
    );
}
