import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, buildQuery, getErrorMessage } from '../lib/api.js';
import { formatDate, formatTimeRange, groupByDate } from '../lib/format.js';
import { useAuth } from '../context/AuthContext.jsx';
import { EmptyState, ErrorState, LoadingState, PageHeader, Panel, Select } from '../components/ui.jsx';

export function SchedulePage() {
    const { user } = useAuth();
    const [selectedUserId, setSelectedUserId] = useState('');

    const users = useQuery({
        queryKey: ['schedule-users'],
        queryFn: () => api('/users'),
        enabled: user.role === 'admin',
    });

    const shifts = useQuery({
        queryKey: ['schedule', selectedUserId],
        queryFn: () => api(`/shifts${buildQuery({ user_id: selectedUserId })}`),
    });

    if (shifts.isLoading || users.isLoading) {
        return <LoadingState label="Loading schedule..." />;
    }

    if (shifts.isError || users.isError) {
        return <ErrorState message={getErrorMessage(shifts.error ?? users.error)} />;
    }

    const grouped = groupByDate(shifts.data, (shift) => String(shift.shift_date).slice(0, 10));

    return (
        <div className="space-y-8">
            <PageHeader
                title="My Schedule"
                description={user.role === 'admin'
                    ? 'Inspect the timetable overall or focus on one worker at a time.'
                    : 'A clear list of your assigned warehouse shifts.'}
                action={user.role === 'admin' ? (
                    <div className="w-full max-w-xs">
                        <Select value={selectedUserId} onChange={(event) => setSelectedUserId(event.target.value)}>
                            <option value="">All workers</option>
                            {users.data.filter((option) => option.role === 'worker').map((option) => (
                                <option key={option.id} value={option.id}>{option.name}</option>
                            ))}
                        </Select>
                    </div>
                ) : null}
            />

            <Panel title="Calendar View" description="Grouped by shift date for quick scanning.">
                {Object.keys(grouped).length === 0 ? (
                    <EmptyState title="No schedule data" description="No shifts match the current filter." />
                ) : (
                    <div className="space-y-6">
                        {Object.entries(grouped).map(([date, items]) => (
                            <div key={date} className="space-y-3">
                                <h3 className="text-lg font-black uppercase text-ink-950">{formatDate(date)}</h3>
                                <div className="grid gap-4 md:grid-cols-2">
                                    {items.map((shift) => (
                                        <div key={shift.id} className="record-card">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <p className="font-black uppercase text-ink-950">{shift.title}</p>
                                                    <p className="mt-1 text-sm text-muted">{formatTimeRange(shift.start_time, shift.end_time)}</p>
                                                    <p className="mt-2 text-sm text-slate-600">{shift.location || 'No location set'}</p>
                                                </div>
                                                <span className="data-chip">
                                                    {shift.assignments.length} assigned
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Panel>
        </div>
    );
}
