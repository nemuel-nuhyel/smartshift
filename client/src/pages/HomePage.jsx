import { Link, Navigate } from 'react-router-dom';
import { Button } from '../components/ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const problems = [
    {
        code: '01',
        title: 'Double-Booking Chaos',
        description: "Workers get assigned to overlapping shifts, and spreadsheets don't catch it until it's already a problem.",
    },
    {
        code: '02',
        title: 'Unclear Responsibilities',
        description: 'Tasks get scattered across messages, notes, and memory. Ownership disappears fast.',
    },
    {
        code: '03',
        title: 'Poor Communication',
        description: 'Shift changes bounce through group chats, and critical updates vanish in the scroll.',
    },
];

const features = [
    'Drag-and-drop planner with live capacity checks',
    'Role-based access for managers and workers',
    'Task creation, assignment, and completion tracking',
    'Structured shift swap workflow with approvals',
    'Fast schedule updates without chat-thread confusion',
    'Responsive access from desktop, tablet, or phone',
];

const steps = [
    {
        number: '01',
        title: 'Create Shifts',
        description: 'Set the date, time, capacity, and warehouse location in one place.',
    },
    {
        number: '02',
        title: 'Assign Workers',
        description: 'Drag workers into shift columns and catch conflicts before saving.',
    },
    {
        number: '03',
        title: 'Track And Swap',
        description: 'Workers follow tasks, update progress, and request swaps through a clear workflow.',
    },
];

const roleCards = [
    {
        title: 'For Managers',
        items: [
            'Create and manage shifts',
            'Assign workers from the planner board',
            'Track tasks and workload by shift',
            'Approve or reject swap requests',
            'Manage worker accounts and roles',
        ],
        cta: 'Start Managing',
    },
    {
        title: 'For Workers',
        items: [
            'View your personal schedule',
            'See assigned tasks in one place',
            'Update task progress during the shift',
            'Request or respond to swap requests',
            'Stay aligned without extra messages',
        ],
        cta: 'Join Your Team',
    },
];

const testimonials = [
    {
        quote: 'SmartShift cut our scheduling time by 70% and stopped double-booking completely.',
        author: 'Warehouse Manager, Logistics Co.',
    },
    {
        quote: 'I can see my whole week at a glance, and swap requests take seconds instead of a long chat thread.',
        author: 'Warehouse Worker',
    },
];

function HeroBoard() {
    return (
        <div className="relative overflow-hidden rounded-lg border border-ink-950/10 bg-white p-5 shadow-[0_24px_60px_rgba(16,19,22,0.12)]">
            <div className="absolute inset-x-0 top-0 h-2 safety-stripe" />
            <div className="mt-5 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-lg border border-ink-950/10 bg-paper-50 p-4">
                    <div className="flex items-center justify-between">
                        <p className="text-[11px] font-bold uppercase text-brand-700">Planner Board</p>
                        <div className="data-chip">3 / 5 staff</div>
                    </div>
                    <div className="mt-4 space-y-3">
                        <div className="rounded-md border border-sky-200 bg-sky-50 p-3">
                            <p className="text-sm font-black uppercase text-ink-950">Morning Shift</p>
                            <p className="mt-1 text-xs text-slate-600">06:00 - 14:00 | Dock A</p>
                        </div>
                        <div className="rounded-md border border-ink-950/10 bg-white p-3">
                            <p className="text-sm font-black uppercase text-ink-950">Packing Queue</p>
                            <p className="mt-1 text-xs text-slate-600">Assigned to Marta and Idris</p>
                        </div>
                        <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3">
                            <p className="text-sm font-black uppercase text-ink-950">Forklift Restock</p>
                            <p className="mt-1 text-xs text-slate-600">Status: in progress</p>
                        </div>
                    </div>
                </div>

                <div className="dark-panel space-y-4 p-4">
                    <div className="flex items-center justify-between">
                        <p className="text-[11px] font-bold uppercase text-brand-300">Live Signals</p>
                        <span className="rounded-md bg-emerald-400/20 px-3 py-1 text-[11px] font-bold uppercase text-emerald-200">
                            Synced
                        </span>
                    </div>
                    <div className="rounded-md border border-white/10 bg-white/5 p-4">
                        <p className="text-sm font-black uppercase">Conflict Check</p>
                        <p className="mt-2 text-sm text-slate-300">Overlapping shifts are blocked before the assignment reaches the API.</p>
                    </div>
                    <div className="rounded-md border border-white/10 bg-white/5 p-4">
                        <p className="text-sm font-black uppercase">Swap Workflow</p>
                        <p className="mt-2 text-sm text-slate-300">Worker accepts first. Admin approves last. The schedule changes only when both steps are complete.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-md border border-white/10 bg-white/5 p-4">
                            <p className="text-[11px] font-bold uppercase text-slate-300">Workers</p>
                            <p className="mt-2 text-3xl font-black">24</p>
                        </div>
                        <div className="rounded-md border border-white/10 bg-white/5 p-4">
                            <p className="text-[11px] font-bold uppercase text-slate-300">Open Tasks</p>
                            <p className="mt-2 text-3xl font-black">11</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function HomePage() {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return <div className="px-6 py-8 text-sm text-slate-600">Loading...</div>;
    }

    if (isAuthenticated) {
        return <Navigate to="/dashboard" replace />;
    }

    return (
        <div className="min-h-screen px-4 py-4 md:px-6">
            <div className="mx-auto max-w-7xl space-y-4">
                <header className="panel-surface sticky top-4 z-20 flex items-center justify-between px-5 py-4 backdrop-blur">
                    <div>
                        <p className="section-line">Warehouse Shift Control</p>
                        <h1 className="mt-3 text-2xl font-black uppercase text-ink-950 md:text-3xl">SmartShift</h1>
                    </div>
                    <nav className="flex flex-wrap items-center justify-end gap-3">
                        <a className="hidden rounded-md border border-transparent px-4 py-2.5 text-sm font-black uppercase text-slate-700 transition hover:border-ink-950/10 hover:bg-white md:inline-flex" href="#features">
                            Features
                        </a>
                        <a className="hidden rounded-md border border-transparent px-4 py-2.5 text-sm font-black uppercase text-slate-700 transition hover:border-ink-950/10 hover:bg-white md:inline-flex" href="#how-it-works">
                            How It Works
                        </a>
                        <Link to="/login">
                            <Button variant="ghost">Log In</Button>
                        </Link>
                        <Link to="/register">
                            <Button>Get Started</Button>
                        </Link>
                    </nav>
                </header>

                <section className="panel-surface panel-grid overflow-hidden px-6 py-10 md:px-10 md:py-14">
                    <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
                        <div>
                            <p className="section-line">Smarter Warehouse Scheduling</p>
                            <h2 className="mt-5 max-w-xl text-4xl font-black uppercase text-ink-950 md:text-6xl">
                                Eliminate booking mistakes and keep every shift visible.
                            </h2>
                            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-700 md:text-lg">
                                SmartShift gives warehouse managers and workers one shared system for planning shifts, assigning work, tracking progress, and handling swaps without spreadsheet drift.
                            </p>
                            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                                <Link to="/register">
                                    <Button className="w-full sm:w-auto">Get Started Free</Button>
                                </Link>
                                <a href="#features">
                                    <Button className="w-full sm:w-auto" variant="secondary">See How It Works</Button>
                                </a>
                            </div>
                        </div>
                        <HeroBoard />
                    </div>
                </section>

                <section className="grid gap-4 lg:grid-cols-3">
                    {problems.map((problem) => (
                        <article key={problem.code} className="panel-surface p-6">
                            <p className="text-[11px] font-bold uppercase text-brand-700">{problem.code}</p>
                            <h3 className="mt-4 text-2xl font-black uppercase text-ink-950">{problem.title}</h3>
                            <p className="mt-3 text-sm leading-6 text-slate-600">{problem.description}</p>
                        </article>
                    ))}
                </section>

                <section id="features" className="panel-surface px-6 py-8 md:px-8 md:py-10">
                    <div className="max-w-3xl">
                        <p className="section-line">Features Overview</p>
                        <h3 className="mt-4 text-3xl font-black uppercase text-ink-950">Built for real shift operations</h3>
                    </div>
                    <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {features.map((feature, index) => (
                            <article key={feature} className="record-card">
                                <p className="text-[11px] font-bold uppercase text-brand-700">
                                    {String(index + 1).padStart(2, '0')}
                                </p>
                                <p className="mt-4 text-xl font-black uppercase text-ink-950">{feature}</p>
                            </article>
                        ))}
                    </div>
                </section>

                <section id="how-it-works" className="panel-surface px-6 py-8 md:px-8 md:py-10">
                    <div className="max-w-3xl">
                        <p className="section-line">How It Works</p>
                        <h3 className="mt-4 text-3xl font-black uppercase text-ink-950">Create, assign, track</h3>
                    </div>
                    <div className="mt-8 grid gap-4 lg:grid-cols-3">
                        {steps.map((step) => (
                            <article key={step.number} className="record-card p-6">
                                <div className="flex h-14 w-14 items-center justify-center rounded-md bg-ink-950 text-lg font-black text-white">
                                    {step.number}
                                </div>
                                <h4 className="mt-5 text-2xl font-black uppercase text-ink-950">{step.title}</h4>
                                <p className="mt-3 text-sm leading-6 text-slate-600">{step.description}</p>
                            </article>
                        ))}
                    </div>
                </section>

                <section className="grid gap-4 lg:grid-cols-2">
                    {roleCards.map((role) => (
                        <article key={role.title} className="panel-surface px-6 py-8">
                            <p className="section-line">{role.title}</p>
                            <h3 className="mt-4 text-3xl font-black uppercase text-ink-950">{role.title}</h3>
                            <div className="mt-6 space-y-3">
                                {role.items.map((item) => (
                                    <div key={item} className="rounded-md border border-ink-950/10 bg-white px-4 py-3 text-sm text-slate-700">
                                        {item}
                                    </div>
                                ))}
                            </div>
                            <Link className="mt-6 inline-block" to="/register">
                                <Button>{role.cta}</Button>
                            </Link>
                        </article>
                    ))}
                </section>

                <section className="panel-surface px-6 py-8 md:px-8 md:py-10">
                    <p className="section-line">Testimonials</p>
                    <div className="mt-8 grid gap-4 lg:grid-cols-2">
                        {testimonials.map((testimonial) => (
                            <article key={testimonial.author} className="record-card p-6">
                                <p className="text-lg font-semibold leading-8 text-slate-800">"{testimonial.quote}"</p>
                                <p className="mt-5 text-sm font-bold uppercase text-brand-700">{testimonial.author}</p>
                            </article>
                        ))}
                    </div>
                </section>

                <section className="dark-panel overflow-hidden px-6 py-10 md:px-10">
                    <div className="safety-stripe mb-8 h-2 w-full max-w-sm" />
                    <p className="text-[11px] font-bold uppercase text-white/80">Ready To Streamline Your Warehouse?</p>
                    <h3 className="mt-4 max-w-3xl text-3xl font-black uppercase md:text-5xl">
                        Join the teams replacing spreadsheet scheduling with a live planning system.
                    </h3>
                    <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                        <Link to="/register">
                            <Button className="w-full border-white/10 bg-white text-slate-900 hover:bg-slate-100 sm:w-auto">Create Free Account</Button>
                        </Link>
                        <Link className="text-sm font-bold uppercase text-white/90 hover:text-white" to="/login">
                            Already have an account? Log in
                        </Link>
                    </div>
                </section>

                <footer className="panel-surface px-6 py-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <p className="font-black uppercase text-ink-950">SmartShift</p>
                            <p className="mt-2 text-sm text-slate-600">Smarter warehouse scheduling for managers and workers.</p>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm font-semibold text-slate-600">
                            <a href="#features">Features</a>
                            <Link to="/register">Register</Link>
                            <Link to="/login">Login</Link>
                        </div>
                    </div>
                    <p className="mt-5 text-xs uppercase text-slate-500">Copyright 2026 SmartShift. All rights reserved.</p>
                </footer>
            </div>
        </div>
    );
}
