import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, getErrorMessage } from '../lib/api.js';
import { formatDate, formatTimeRange } from '../lib/format.js';
import { useAuth } from '../context/AuthContext.jsx';
import { EmptyState, ErrorState, LoadingState, MetricCard, PageHeader, Panel, StatusBadge } from '../components/ui.jsx';
import { cx } from '../lib/format.js';

const metricCopy = {
    workers: ['Active workers', 'People available for shift coverage.'],
    shifts: ['Scheduled shifts', 'Shift windows currently in the system.'],
    tasks: ['Open task base', 'Tasks created across warehouse work.'],
    pending_swaps: ['Pending swaps', 'Swap requests waiting for action.'],
    upcoming_shifts: ['Upcoming shifts', 'Assignments coming up on your calendar.'],
    assigned_tasks: ['Assigned tasks', 'Work items currently tied to you.'],
    incoming_swaps: ['Incoming swaps', 'Requests waiting for your response.'],
};

const metricTones = ['slate', 'brand', 'mint', 'ink'];

function metricLabel(key) {
    return metricCopy[key]?.[0] ?? key.replaceAll('_', ' ');
}

function metricHelper(key) {
    return metricCopy[key]?.[1] ?? 'Current workspace count.';
}

function clampPercent(value) {
    if (Number.isNaN(value) || !Number.isFinite(value)) {
        return 0;
    }

    return Math.min(100, Math.max(0, value));
}

function ProgressBar({ value, tone = 'brand' }) {
    const tones = {
        brand: 'bg-brand-500',
        mint: 'bg-mint-500',
        sky: 'bg-sky-500',
        amber: 'bg-amber-400',
    };

    return (
        <div className="h-2 overflow-hidden rounded-sm bg-slate-200">
            <div
                className={cx('h-full rounded-sm transition-all', tones[tone] ?? tones.brand)}
                style={{ width: `${clampPercent(value)}%` }}
            />
        </div>
    );
}

function InsightCard({ label, value, helper, tone = 'brand' }) {
    const tones = {
        brand: 'border-brand-500/25 bg-brand-50',
        mint: 'border-mint-400/35 bg-emerald-50',
        sky: 'border-sky-300/40 bg-sky-50',
        amber: 'border-amber-300/50 bg-amber-50',
    };

    return (
        <div className={cx('rounded-lg border p-4', tones[tone] ?? tones.brand)}>
            <p className="text-[11px] font-black uppercase text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-black text-ink-950">{value}</p>
            <p className="mt-1 text-sm leading-5 text-slate-600">{helper}</p>
        </div>
    );
}

function ShiftRecord({ shift }) {
    const assigned = shift.assignments?.length ?? 0;
    const capacity = shift.capacity ?? 0;
    const coverage = capacity > 0 ? (assigned / capacity) * 100 : 0;

    return (
        <article className="record-card p-4">
            <div className="grid gap-4 sm:grid-cols-[88px_minmax(0,1fr)] sm:items-start">
                <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-3 text-center">
                    <p className="text-[11px] font-black uppercase text-slate-500">Date</p>
                    <p className="mt-1 text-sm font-black text-ink-950">{formatDate(shift.shift_date)}</p>
                </div>
                <div className="min-w-0">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                            <h3 className="truncate text-lg font-black uppercase text-ink-950">{shift.title}</h3>
                            <p className="mt-1 text-sm text-muted">
                                {formatTimeRange(shift.start_time, shift.end_time)}
                                {shift.location ? ` | ${shift.location}` : ''}
                            </p>
                        </div>
                        <span className="data-chip shrink-0">
                            {assigned}/{capacity} staffed
                        </span>
                    </div>
                    <div className="mt-4 space-y-2">
                        <div className="flex items-center justify-between text-xs font-black uppercase text-slate-500">
                            <span>Coverage</span>
                            <span>{Math.round(clampPercent(coverage))}%</span>
                        </div>
                        <ProgressBar value={coverage} tone={coverage >= 80 ? 'mint' : coverage >= 50 ? 'brand' : 'amber'} />
                    </div>
                </div>
            </div>
        </article>
    );
}

function WorkerShiftRecord({ assignment }) {
    const shift = assignment.shift;

    return (
        <article className="record-card p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                    <p className="text-[11px] font-black uppercase text-slate-500">{formatDate(shift.shift_date)}</p>
                    <h3 className="mt-1 truncate text-lg font-black uppercase text-ink-950">{shift.title}</h3>
                    <p className="mt-1 text-sm text-muted">
                        {formatTimeRange(shift.start_time, shift.end_time)}
                        {shift.location ? ` | ${shift.location}` : ''}
                    </p>
                </div>
                <StatusBadge value={assignment.status} />
            </div>
        </article>
    );
}

function TaskRecord({ task, assignment }) {
    const taskData = task ?? assignment?.task;
    const status = assignment?.status;

    return (
        <article className="record-card p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                    <h3 className="truncate text-lg font-black uppercase text-ink-950">{taskData.title}</h3>
                    <p className="mt-1 text-sm text-muted">{taskData.shift?.title ?? 'No shift attached'}</p>
                    {taskData.description ? <p className="mt-2 text-sm leading-6 text-slate-600">{taskData.description}</p> : null}
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                    {taskData.priority ? <StatusBadge value={taskData.priority} /> : null}
                    <StatusBadge value={status ?? taskData.status} />
                    {status && taskData.status && status !== taskData.status ? <StatusBadge value={taskData.status} /> : null}
                </div>
            </div>
        </article>
    );
}

function CommandCenter({ user, data }) {
    const isAdmin = user.role === 'admin';
    const nextItem = isAdmin ? data.upcoming_shifts?.[0] : data.upcoming_shifts?.[0]?.shift;
    const nextCoverage = isAdmin && nextItem?.capacity
        ? ((nextItem.assignments?.length ?? 0) / nextItem.capacity) * 100
        : null;
    const pendingSwaps = data.metrics?.pending_swaps ?? data.metrics?.incoming_swaps ?? 0;
    const taskTotal = data.metrics?.tasks ?? data.metrics?.assigned_tasks ?? 0;

    return (
        <section className="overflow-hidden rounded-lg border border-ink-950 bg-ink-950 text-white shadow-[0_24px_70px_rgba(15,23,42,0.22)]">
            <div className="grid gap-0 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
                <div className="p-5 md:p-7">
                    <div className="safety-stripe h-2 w-full max-w-sm" />
                    <div className="mt-8 max-w-2xl">
                        <p className="text-[11px] font-black uppercase text-brand-300">
                            {isAdmin ? 'Admin command center' : 'Personal command center'}
                        </p>
                        <h2 className="mt-3 text-3xl font-black uppercase leading-tight md:text-5xl">
                            {isAdmin ? 'Keep today staffed, visible, and moving.' : 'Know your next shift and task load fast.'}
                        </h2>
                        <p className="mt-4 max-w-xl text-sm leading-6 text-slate-300">
                            {isAdmin
                                ? 'A concise control surface for staffing coverage, workload volume, and the swap decisions that can affect the day.'
                                : 'A focused view of your schedule, assigned work, and incoming swap requests without manager-only noise.'}
                        </p>
                    </div>
                    <div className="mt-8 grid gap-3 sm:grid-cols-3">
                        <div className="rounded-md border border-white/10 bg-white/5 p-4">
                            <p className="text-[11px] font-black uppercase text-slate-400">Mode</p>
                            <p className="mt-2 text-xl font-black uppercase">{user.role}</p>
                        </div>
                        <div className="rounded-md border border-white/10 bg-white/5 p-4">
                            <p className="text-[11px] font-black uppercase text-slate-400">Task load</p>
                            <p className="mt-2 text-xl font-black uppercase">{taskTotal}</p>
                        </div>
                        <div className="rounded-md border border-white/10 bg-white/5 p-4">
                            <p className="text-[11px] font-black uppercase text-slate-400">Swap queue</p>
                            <p className="mt-2 text-xl font-black uppercase">{pendingSwaps}</p>
                        </div>
                    </div>
                </div>

                <aside className="border-t border-white/10 bg-white/[0.04] p-5 md:p-7 lg:border-l lg:border-t-0">
                    <p className="text-[11px] font-black uppercase text-slate-400">Next up</p>
                    {nextItem ? (
                        <div className="mt-4 rounded-lg border border-white/10 bg-white/8 p-5">
                            <h3 className="text-2xl font-black uppercase leading-tight">{nextItem.title}</h3>
                            <p className="mt-3 text-sm leading-6 text-slate-300">
                                {formatDate(nextItem.shift_date)} | {formatTimeRange(nextItem.start_time, nextItem.end_time)}
                                {nextItem.location ? ` | ${nextItem.location}` : ''}
                            </p>
                            {isAdmin ? (
                                <div className="mt-6 space-y-2">
                                    <div className="flex justify-between text-xs font-black uppercase text-slate-400">
                                        <span>Staffing coverage</span>
                                        <span>{Math.round(clampPercent(nextCoverage))}%</span>
                                    </div>
                                    <ProgressBar value={nextCoverage} tone="mint" />
                                </div>
                            ) : null}
                        </div>
                    ) : (
                        <div className="mt-4 rounded-lg border border-white/10 bg-white/8 p-5 text-sm text-slate-300">
                            No upcoming shift data is available yet.
                        </div>
                    )}
                </aside>
            </div>
        </section>
    );
}

export function DashboardPage() {
    const { user } = useAuth();
    const dashboard = useQuery({
        queryKey: ['dashboard'],
        queryFn: () => api('/dashboard'),
    });

    const metrics = useMemo(
        () => Object.entries(dashboard.data?.metrics ?? {}),
        [dashboard.data?.metrics],
    );

    if (dashboard.isLoading) {
        return <LoadingState label="Loading dashboard..." />;
    }

    if (dashboard.isError) {
        return <ErrorState message={getErrorMessage(dashboard.error)} />;
    }

    const data = dashboard.data;
    const isAdmin = user.role === 'admin';
    const upcomingCount = isAdmin ? data.upcoming_shifts.length : data.upcoming_shifts.length;
    const taskCount = isAdmin ? data.recent_tasks.length : data.tasks.length;

    return (
        <div className="space-y-7">
            <PageHeader
                eyebrow={isAdmin ? 'Operations Overview' : 'Worker Overview'}
                title={isAdmin ? 'Dashboard' : 'My Workday'}
                description={isAdmin
                    ? 'Monitor staffing, task volume, and swap pressure from a clean command surface built for quick scanning.'
                    : 'Track your schedule, assigned work, and incoming swap actions in a focused personal view.'}
                action={(
                    <div className="flex flex-wrap gap-2">
                        <span className="data-chip">{user.name}</span>
                        <span className="data-chip">{user.role}</span>
                    </div>
                )}
            />

            <CommandCenter user={user} data={data} />

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {metrics.map(([key, value], index) => (
                    <MetricCard
                        key={key}
                        label={metricLabel(key)}
                        value={value}
                        helper={metricHelper(key)}
                        tone={metricTones[index % metricTones.length]}
                    />
                ))}
            </section>

            <section className="grid gap-4 lg:grid-cols-3">
                <InsightCard
                    label={isAdmin ? 'Schedule depth' : 'Calendar depth'}
                    value={upcomingCount}
                    helper={isAdmin ? 'Upcoming shift records available for planning.' : 'Upcoming assignments currently visible.'}
                    tone="sky"
                />
                <InsightCard
                    label={isAdmin ? 'Recent workload' : 'Personal workload'}
                    value={taskCount}
                    helper={isAdmin ? 'Recent tasks surfaced from active shift work.' : 'Task assignments shown in your queue.'}
                    tone="mint"
                />
                <InsightCard
                    label="Response priority"
                    value={data.metrics.pending_swaps ?? data.metrics.incoming_swaps ?? 0}
                    helper={isAdmin ? 'Swap requests can change final coverage.' : 'Incoming requests need a worker response.'}
                    tone="amber"
                />
            </section>

            {isAdmin ? (
                <div className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
                    <Panel title="Upcoming Shifts" description="Closest shift windows with staffing coverage and location context.">
                        <div className="space-y-4">
                            {data.upcoming_shifts.length === 0 ? (
                                <EmptyState title="No shifts yet" description="Create the first shift from the Shifts page." />
                            ) : data.upcoming_shifts.map((shift) => (
                                <ShiftRecord key={shift.id} shift={shift} />
                            ))}
                        </div>
                    </Panel>

                    <Panel title="Recent Tasks" description="Latest operational tasks, priority, and execution state.">
                        <div className="space-y-4">
                            {data.recent_tasks.length === 0 ? (
                                <EmptyState title="No tasks yet" description="Tasks created for shifts will show up here." />
                            ) : data.recent_tasks.map((task) => (
                                <TaskRecord key={task.id} task={task} />
                            ))}
                        </div>
                    </Panel>
                </div>
            ) : (
                <div className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
                    <Panel title="My Upcoming Shifts" description="Your next scheduled assignments grouped for quick scanning.">
                        <div className="space-y-4">
                            {data.upcoming_shifts.length === 0 ? (
                                <EmptyState title="Nothing scheduled" description="You do not have any upcoming shifts yet." />
                            ) : data.upcoming_shifts.map((assignment) => (
                                <WorkerShiftRecord key={assignment.id} assignment={assignment} />
                            ))}
                        </div>
                    </Panel>

                    <Panel title="My Task Load" description="Assigned task work with shift context and status.">
                        <div className="space-y-4">
                            {data.tasks.length === 0 ? (
                                <EmptyState title="No assigned tasks" description="Assigned tasks will appear here once a manager creates them." />
                            ) : data.tasks.map((assignment) => (
                                <TaskRecord key={assignment.id} assignment={assignment} />
                            ))}
                        </div>
                    </Panel>
                </div>
            )}
        </div>
    );
}
