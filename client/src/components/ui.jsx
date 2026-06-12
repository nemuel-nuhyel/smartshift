import { cx } from '../lib/format.js';

export function PageHeader({ title, description, action, eyebrow = 'SmartShift' }) {
    return (
        <div className="border-b border-ink-950/10 pb-6">
            <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                <div className="space-y-3">
                    <p className="section-line">
                        {eyebrow}
                    </p>
                    <h1 className="max-w-4xl text-3xl font-black uppercase leading-tight text-ink-950 md:text-5xl">
                        {title}
                    </h1>
                    {description ? (
                        <p className="max-w-3xl text-sm leading-6 text-muted md:text-[15px]">{description}</p>
                    ) : null}
                </div>
                {action}
            </div>
        </div>
    );
}

export function Panel({ title, description, children, className }) {
    return (
        <section className={cx('panel-surface overflow-hidden', className)}>
            {(title || description) && (
                <div className="border-b border-slate-200 px-5 py-4 md:px-6 md:py-5">
                    {title ? <h2 className="text-base font-black uppercase text-ink-950 md:text-lg">{title}</h2> : null}
                    {description ? <p className="mt-1.5 text-sm leading-6 text-muted">{description}</p> : null}
                </div>
            )}
            <div className="p-5 md:p-6">{children}</div>
        </section>
    );
}

export function MetricCard({ label, value, tone = 'brand', helper }) {
    const tones = {
        brand: 'border-brand-500/25 bg-brand-50 text-brand-700',
        mint: 'border-mint-400/35 bg-emerald-50 text-emerald-700',
        slate: 'border-sky-300/40 bg-sky-50 text-sky-700',
        ink: 'border-ink-950/10 bg-ink-950 text-white',
    };

    return (
        <div className={cx('rounded-lg border p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)]', tones[tone])}>
            <p className={cx('text-[11px] font-black uppercase', tone === 'ink' ? 'text-white/65' : 'text-slate-500')}>{label}</p>
            <div className="mt-4 flex items-end justify-between gap-4">
                <p className={cx('text-4xl font-black', tone === 'ink' ? 'text-white' : 'text-ink-950')}>{value}</p>
                <div className={cx('h-12 w-2 rounded-sm', tone === 'ink' ? 'bg-white/15' : 'bg-white/80')}>
                    <div className={cx(
                        'h-full w-full rounded-sm',
                        tone === 'mint' ? 'bg-mint-500' : tone === 'brand' ? 'bg-brand-500' : tone === 'ink' ? 'bg-white' : 'bg-sky-500',
                    )} />
                </div>
            </div>
            {helper ? <p className={cx('mt-3 text-xs leading-5', tone === 'ink' ? 'text-white/65' : 'text-slate-500')}>{helper}</p> : null}
        </div>
    );
}

export function Button({ className, variant = 'primary', ...props }) {
    const variants = {
        primary: 'border border-ink-950 bg-ink-950 text-white hover:bg-ink-800',
        secondary: 'border border-ink-950/15 bg-white text-ink-950 hover:border-ink-950 hover:bg-paper-100',
        ghost: 'border border-transparent bg-transparent text-slate-700 hover:bg-white/70',
        danger: 'border border-rose-700 bg-rose-600 text-white hover:bg-rose-700',
    };

    return (
        <button
            className={cx(
                'inline-flex items-center justify-center rounded-md px-4 py-2.5 text-sm font-black uppercase transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                variants[variant],
                className,
            )}
            {...props}
        />
    );
}

export function Input({ label, error, className, ...props }) {
    return (
        <label className="block space-y-2">
            {label ? <span className="text-[11px] font-black uppercase text-slate-600">{label}</span> : null}
            <input
                className={cx(
                    'w-full rounded-md border border-ink-950/15 bg-white px-4 py-3 text-sm text-ink-950 outline-none transition placeholder:text-slate-400 focus:border-ink-950 focus-visible:ring-2 focus-visible:ring-brand-300',
                    className,
                )}
                {...props}
            />
            {error ? <span className="text-xs text-rose-500">{error}</span> : null}
        </label>
    );
}

export function Select({ label, error, className, children, ...props }) {
    return (
        <label className="block space-y-2">
            {label ? <span className="text-[11px] font-black uppercase text-slate-600">{label}</span> : null}
            <select
                className={cx(
                    'w-full rounded-md border border-ink-950/15 bg-white px-4 py-3 text-sm text-ink-950 outline-none transition focus:border-ink-950 focus-visible:ring-2 focus-visible:ring-brand-300',
                    className,
                )}
                {...props}
            >
                {children}
            </select>
            {error ? <span className="text-xs text-rose-500">{error}</span> : null}
        </label>
    );
}

export function TextArea({ label, error, className, ...props }) {
    return (
        <label className="block space-y-2">
            {label ? <span className="text-[11px] font-black uppercase text-slate-600">{label}</span> : null}
            <textarea
                className={cx(
                    'min-h-28 w-full rounded-md border border-ink-950/15 bg-white px-4 py-3 text-sm text-ink-950 outline-none transition placeholder:text-slate-400 focus:border-ink-950 focus-visible:ring-2 focus-visible:ring-brand-300',
                    className,
                )}
                {...props}
            />
            {error ? <span className="text-xs text-rose-500">{error}</span> : null}
        </label>
    );
}

export function StatusBadge({ value }) {
    const tones = {
        admin: 'border-brand-300/40 bg-brand-100 text-brand-700',
        worker: 'border-sky-300/50 bg-sky-100 text-sky-700',
        assigned: 'border-sky-300/50 bg-sky-100 text-sky-700',
        completed: 'border-emerald-300/50 bg-emerald-100 text-emerald-700',
        cancelled: 'border-slate-300/50 bg-slate-100 text-slate-600',
        open: 'border-amber-300/50 bg-amber-100 text-amber-700',
        in_progress: 'border-blue-300/50 bg-blue-100 text-blue-700',
        done: 'border-emerald-300/50 bg-emerald-100 text-emerald-700',
        pending: 'border-amber-300/50 bg-amber-100 text-amber-700',
        accepted_by_worker: 'border-sky-300/50 bg-sky-100 text-sky-700',
        rejected_by_worker: 'border-rose-300/50 bg-rose-100 text-rose-700',
        approved: 'border-emerald-300/50 bg-emerald-100 text-emerald-700',
        rejected: 'border-rose-300/50 bg-rose-100 text-rose-700',
        low: 'border-slate-300/50 bg-slate-100 text-slate-600',
        medium: 'border-amber-300/50 bg-amber-100 text-amber-700',
        high: 'border-rose-300/50 bg-rose-100 text-rose-700',
    };

    return (
        <span className={cx(
            'inline-flex rounded-md border px-3 py-1.5 text-[11px] font-black uppercase',
            tones[value] ?? 'border-slate-200 bg-white text-slate-700',
        )}>
            {String(value).replaceAll('_', ' ')}
        </span>
    );
}

export function EmptyState({ title, description }) {
    return (
        <div className="rounded-lg border border-dashed border-ink-950/20 bg-white px-5 py-8 text-center">
            <p className="text-lg font-black uppercase text-ink-950">{title}</p>
            {description ? <p className="mt-2 text-sm text-muted">{description}</p> : null}
        </div>
    );
}

export function LoadingState({ label = 'Loading...' }) {
    return <p className="text-sm text-muted">{label}</p>;
}

export function ErrorState({ message }) {
    return (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {message}
        </div>
    );
}
