import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { Button } from './ui.jsx';
import { cx } from '../lib/format.js';
import { useAuth } from '../context/AuthContext.jsx';

export function AppShell() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth();
    const [mobileOpen, setMobileOpen] = useState(false);

    const navItems = useMemo(() => {
        const common = [
            { to: '/dashboard', label: 'Dashboard' },
            { to: '/shifts', label: 'Shifts' },
            { to: '/tasks', label: 'Tasks' },
            { to: '/my-schedule', label: 'My Schedule' },
            { to: '/swap-requests', label: 'Swap Requests' },
        ];

        if (user?.role === 'admin') {
            return [
                ...common.slice(0, 1),
                { to: '/planner', label: 'Planner' },
                ...common.slice(1),
                { to: '/users', label: 'Users' },
            ];
        }

        return common;
    }, [user?.role]);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const currentPage = navItems.find((item) => location.pathname.startsWith(item.to))?.label ?? 'Dashboard';

    return (
        <div className="min-h-screen px-4 py-4 md:px-6">
            <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-7xl gap-4 lg:grid-cols-[250px_minmax(0,1fr)]">
                <aside className={cx(
                    'panel-surface overflow-hidden bg-paper-50',
                    mobileOpen ? 'block' : 'hidden lg:block',
                )}>
                    <div className="safety-stripe h-2" />
                    <div className="border-b border-ink-950/10 px-6 py-6">
                        <p className="section-line">Warehouse Ops</p>
                        <h2 className="mt-4 text-3xl font-black uppercase text-ink-950">SmartShift</h2>
                        <p className="mt-3 text-sm text-slate-700">
                            {user?.name}
                            <span className="mt-1 block text-[11px] font-black uppercase text-slate-500">{user?.role}</span>
                        </p>
                    </div>
                    <nav className="space-y-2 p-4">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                onClick={() => setMobileOpen(false)}
                                className={({ isActive }) => cx(
                                    'block rounded-md border px-4 py-3 text-sm font-black uppercase transition',
                                    isActive
                                        ? 'border-ink-950 bg-ink-950 text-white'
                                        : 'border-transparent text-slate-700 hover:border-ink-950/15 hover:bg-white',
                                )}
                            >
                                {item.label}
                            </NavLink>
                        ))}
                    </nav>
                    <div className="p-4 pt-0">
                        <Button className="w-full" variant="secondary" onClick={handleLogout}>
                            Log Out
                        </Button>
                    </div>
                </aside>

                <main className="space-y-4">
                    <div className="panel-surface flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <p className="text-sm font-black uppercase text-ink-950">{user?.name}</p>
                            <p className="mt-1 text-[11px] uppercase text-muted">{currentPage}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <nav className="hidden flex-wrap items-center gap-2 xl:flex">
                                {navItems.map((item) => (
                                    <NavLink
                                        key={item.to}
                                        to={item.to}
                                        className={({ isActive }) => cx(
                                            'rounded-md border px-3 py-2 text-[11px] font-black uppercase transition',
                                            isActive
                                                ? 'border-ink-950 bg-ink-950 text-white'
                                                : 'border-ink-950/10 bg-white text-slate-600 hover:border-ink-950 hover:text-ink-950',
                                        )}
                                    >
                                        {item.label}
                                    </NavLink>
                                ))}
                            </nav>
                            <Button className="lg:hidden" variant="secondary" onClick={() => setMobileOpen((open) => !open)}>
                                {mobileOpen ? 'Close' : 'Menu'}
                            </Button>
                        </div>
                    </div>
                    <div className="panel-surface min-h-[calc(100vh-2rem)] bg-paper-50/95 p-5 md:p-8">
                        <Outlet />
                    </div>
                    <footer className="panel-surface px-5 py-4">
                        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                            <p className="text-sm font-black uppercase text-ink-950">SmartShift</p>
                            <p className="text-sm text-muted">Warehouse scheduling, task tracking, and swap approvals in one workspace.</p>
                        </div>
                    </footer>
                </main>
            </div>
        </div>
    );
}
