import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Button, ErrorState, Input } from '../components/ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { getErrorMessage } from '../lib/api.js';

const loginSchema = z.object({
    email: z.email('Enter a valid email address.'),
    password: z.string().min(8, 'Password must be at least 8 characters.'),
});

const registerSchema = z.object({
    name: z.string().min(2, 'Name is too short.'),
    email: z.email('Enter a valid email address.'),
    password: z.string().min(8, 'Password must be at least 8 characters.'),
    password_confirmation: z.string().min(8, 'Confirm the password.'),
}).refine((values) => values.password === values.password_confirmation, {
    path: ['password_confirmation'],
    message: 'Passwords must match.',
});

export function AuthPage({ mode }) {
    const navigate = useNavigate();
    const { isAuthenticated, loading, login, register } = useAuth();
    const [error, setError] = useState('');
    const schema = mode === 'register' ? registerSchema : loginSchema;

    const form = useForm({
        resolver: zodResolver(schema),
        defaultValues: mode === 'register'
            ? { name: '', email: '', password: '', password_confirmation: '' }
            : { email: '', password: '' },
    });

    const onSubmit = form.handleSubmit(async (values) => {
        try {
            setError('');
            if (mode === 'register') {
                await register(values);
            } else {
                await login(values);
            }
            navigate('/dashboard');
        } catch (requestError) {
            setError(getErrorMessage(requestError));
        }
    });

    if (loading) {
        return <div className="px-6 py-8 text-sm text-slate-600">Loading...</div>;
    }

    if (isAuthenticated) {
        return <Navigate to="/dashboard" replace />;
    }

    return (
        <div className="min-h-screen px-4 py-4 md:px-6">
            <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-6xl flex-col gap-4">
                <header className="panel-surface sticky top-4 z-20 overflow-hidden">
                    <div className="safety-stripe h-2" />
                    <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
                        <Link to="/" className="text-2xl font-black uppercase text-ink-950">
                            SmartShift
                        </Link>
                        <nav className="flex flex-wrap items-center gap-2">
                            <Link className="rounded-md border border-transparent px-4 py-2.5 text-sm font-black uppercase text-slate-700 transition hover:border-ink-950/10 hover:bg-white" to="/">
                                Home
                            </Link>
                            <Link className="rounded-md border border-transparent px-4 py-2.5 text-sm font-black uppercase text-slate-700 transition hover:border-ink-950/10 hover:bg-white" to="/login">
                                Login
                            </Link>
                            <Link to="/register">
                                <Button variant="secondary">Register</Button>
                            </Link>
                        </nav>
                    </div>
                </header>

                <main className="panel-surface flex-1 overflow-hidden">
                <div className="grid lg:grid-cols-[1.15fr_0.85fr]">
                    <div className="panel-grid border-b border-ink-950/10 bg-paper-100 p-8 md:border-b-0 md:border-r md:p-12">
                        <div className="safety-stripe mb-8 h-2 w-44" />
                        <p className="section-line">Warehouse Shift Control</p>
                        <h1 className="mt-5 max-w-xl text-4xl font-black uppercase text-ink-950 md:text-6xl">
                            Bright, clear warehouse scheduling.
                        </h1>
                        <p className="mt-5 max-w-lg text-base leading-7 text-slate-700">
                            SmartShift gives managers and workers one clean place to see shifts, tasks, assignments, and swap requests without the clutter of spreadsheets or chat threads.
                        </p>
                        <div className="mt-8 grid gap-3 md:grid-cols-3">
                            <div className="record-card p-5">
                                <p className="text-[11px] font-bold uppercase text-brand-700">01 Planner</p>
                                <p className="mt-2 text-xl font-black uppercase text-ink-950">Assign fast</p>
                                <p className="mt-2 text-sm text-muted">Drag workers into shifts and catch conflicts before saving.</p>
                            </div>
                            <div className="record-card p-5">
                                <p className="text-[11px] font-bold uppercase text-brand-700">02 Tasks</p>
                                <p className="mt-2 text-xl font-black uppercase text-ink-950">Track work</p>
                                <p className="mt-2 text-sm text-muted">Each shift carries its own task list and assignees.</p>
                            </div>
                            <div className="record-card p-5">
                                <p className="text-[11px] font-bold uppercase text-brand-700">03 Swaps</p>
                                <p className="mt-2 text-xl font-black uppercase text-ink-950">Approve swaps</p>
                                <p className="mt-2 text-sm text-muted">Workers request swaps, coworkers respond, admins finalize.</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6 bg-white p-8 md:p-10">
                        <div>
                            <p className="text-[11px] font-bold uppercase text-slate-500">
                                {mode === 'register' ? 'Create Account' : 'Sign In'}
                            </p>
                            <h2 className="mt-3 text-3xl font-black uppercase text-ink-950">
                                {mode === 'register' ? 'Register Worker' : 'Access Dashboard'}
                            </h2>
                            <p className="mt-3 text-sm text-slate-600">
                                {mode === 'register'
                                    ? 'Worker accounts can view personal shifts, tasks, and swap requests.'
                                    : 'Use your account to manage shifts or check your assigned work.'}
                            </p>
                        </div>

                        {error ? <ErrorState message={error} /> : null}

                        <form className="space-y-4" onSubmit={onSubmit}>
                            {mode === 'register' ? (
                                <Input label="Full Name" placeholder="Alice Picker" error={form.formState.errors.name?.message} {...form.register('name')} />
                            ) : null}
                            <Input label="Email" placeholder="worker@smartshift.test" error={form.formState.errors.email?.message} {...form.register('email')} />
                            <Input label="Password" type="password" placeholder="password" error={form.formState.errors.password?.message} {...form.register('password')} />
                            {mode === 'register' ? (
                                <Input label="Confirm Password" type="password" placeholder="password" error={form.formState.errors.password_confirmation?.message} {...form.register('password_confirmation')} />
                            ) : null}
                            <Button className="w-full" type="submit" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting ? 'Please wait...' : mode === 'register' ? 'Create Worker Account' : 'Log In'}
                            </Button>
                        </form>

                        <p className="text-sm text-muted">
                            {mode === 'register' ? 'Already registered?' : 'Need an account?'}{' '}
                            <Link className="font-semibold text-brand-700 hover:text-brand-500" to={mode === 'register' ? '/login' : '/register'}>
                                {mode === 'register' ? 'Go to login' : 'Register'}
                            </Link>
                        </p>
                        <div className="rounded-md border border-ink-950/10 bg-sky-50 px-4 py-4 text-sm text-slate-700">
                            <p className="text-[11px] font-bold uppercase text-brand-700">Demo Admin</p>
                            <p className="mt-2 font-semibold text-slate-900">admin@smartshift.test</p>
                            <p className="mt-1 text-slate-500">password</p>
                        </div>
                    </div>
                </div>
                </main>

                <footer className="panel-surface px-6 py-5">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                            <p className="font-black uppercase text-ink-950">SmartShift</p>
                            <p className="mt-1 text-sm text-slate-600">Warehouse scheduling for managers and workers.</p>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm font-semibold text-slate-600">
                            <Link to="/">Home</Link>
                            <Link to="/login">Login</Link>
                            <Link to="/register">Register</Link>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
}
