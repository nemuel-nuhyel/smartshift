import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api, getErrorMessage } from '../lib/api.js';
import { formatDate, formatTimeRange } from '../lib/format.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Button, EmptyState, ErrorState, Input, LoadingState, PageHeader, Panel, TextArea } from '../components/ui.jsx';

const shiftSchema = z.object({
    title: z.string().min(2, 'Title is required.'),
    shift_date: z.string().min(1, 'Date is required.'),
    start_time: z.string().min(1, 'Start time is required.'),
    end_time: z.string().min(1, 'End time is required.'),
    capacity: z.coerce.number().int().min(1, 'Capacity must be at least 1.'),
    location: z.string().optional(),
    notes: z.string().optional(),
}).refine((values) => values.end_time > values.start_time, {
    path: ['end_time'],
    message: 'End time must be after start time.',
});

export function ShiftsPage() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [formError, setFormError] = useState('');
    const [editingShift, setEditingShift] = useState(null);

    const shifts = useQuery({
        queryKey: ['shifts'],
        queryFn: () => api('/shifts'),
    });

    const form = useForm({
        resolver: zodResolver(shiftSchema),
        defaultValues: {
            title: '',
            shift_date: '',
            start_time: '',
            end_time: '',
            capacity: 3,
            location: '',
            notes: '',
        },
    });

    const resetForm = () => {
        setEditingShift(null);
        setFormError('');
        form.reset({
            title: '',
            shift_date: '',
            start_time: '',
            end_time: '',
            capacity: 3,
            location: '',
            notes: '',
        });
    };

    const mutation = useMutation({
        mutationFn: (values) => api(editingShift ? `/shifts/${editingShift.id}` : '/shifts', {
            method: editingShift ? 'PATCH' : 'POST',
            body: values,
        }),
        onSuccess: () => {
            resetForm();
            queryClient.invalidateQueries({ queryKey: ['shifts'] });
            queryClient.invalidateQueries({ queryKey: ['planner'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        },
        onError: (error) => setFormError(getErrorMessage(error)),
    });

    const deleteMutation = useMutation({
        mutationFn: (shiftId) => api(`/shifts/${shiftId}`, { method: 'DELETE' }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['shifts'] });
            queryClient.invalidateQueries({ queryKey: ['planner'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        },
    });

    const startEdit = (shift) => {
        setEditingShift(shift);
        form.reset({
            title: shift.title,
            shift_date: String(shift.shift_date).slice(0, 10),
            start_time: String(shift.start_time).slice(0, 5),
            end_time: String(shift.end_time).slice(0, 5),
            capacity: shift.capacity,
            location: shift.location ?? '',
            notes: shift.notes ?? '',
        });
    };

    if (shifts.isLoading) {
        return <LoadingState label="Loading shifts..." />;
    }

    if (shifts.isError) {
        return <ErrorState message={getErrorMessage(shifts.error)} />;
    }

    return (
        <div className="space-y-8">
            <PageHeader
                title={user.role === 'admin' ? 'Shift Management' : 'Assigned Shifts'}
                description={user.role === 'admin'
                    ? 'Create shift windows, track capacity, and keep the planner aligned with the official schedule.'
                    : 'These are the shifts currently assigned to your account.'}
            />

            <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
                {user.role === 'admin' ? (
                    <Panel title={editingShift ? 'Edit Shift' : 'Create Shift'} description="Changes here update the warehouse schedule and planner board.">
                        {formError ? <ErrorState message={formError} /> : null}
                        <form className="space-y-4" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
                            <Input label="Shift Title" error={form.formState.errors.title?.message} {...form.register('title')} />
                            <Input label="Date" type="date" error={form.formState.errors.shift_date?.message} {...form.register('shift_date')} />
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Input label="Start Time" type="time" error={form.formState.errors.start_time?.message} {...form.register('start_time')} />
                                <Input label="End Time" type="time" error={form.formState.errors.end_time?.message} {...form.register('end_time')} />
                            </div>
                            <Input label="Capacity" type="number" min="1" error={form.formState.errors.capacity?.message} {...form.register('capacity')} />
                            <Input label="Location" error={form.formState.errors.location?.message} {...form.register('location')} />
                            <TextArea label="Notes" error={form.formState.errors.notes?.message} {...form.register('notes')} />
                            <div className="flex gap-3">
                                <Button type="submit" disabled={mutation.isPending}>
                                    {mutation.isPending ? 'Saving...' : editingShift ? 'Update Shift' : 'Create Shift'}
                                </Button>
                                {editingShift ? (
                                    <Button type="button" variant="secondary" onClick={resetForm}>
                                        Cancel
                                    </Button>
                                ) : null}
                            </div>
                        </form>
                    </Panel>
                ) : null}

                <Panel title="Shift List" description="Capacity, assigned workers, and task count at a glance.">
                    <div className="space-y-4">
                        {shifts.data.length === 0 ? (
                            <EmptyState title="No shifts found" description="Create a shift or wait for an admin assignment." />
                        ) : shifts.data.map((shift) => (
                            <div key={shift.id} className="record-card">
                                <div className="flex flex-wrap items-start justify-between gap-4">
                                    <div>
                                        <h3 className="text-lg font-black uppercase text-ink-950">{shift.title}</h3>
                                        <p className="mt-1 text-sm text-muted">
                                            {formatDate(shift.shift_date)} | {formatTimeRange(shift.start_time, shift.end_time)}
                                        </p>
                                        <p className="mt-1 text-sm text-slate-600">
                                            {shift.location || 'No location set'} | {shift.assignments.length}/{shift.capacity} workers | {shift.tasks.length} tasks
                                        </p>
                                    </div>
                                    {user.role === 'admin' ? (
                                        <div className="flex gap-2">
                                            <Button variant="secondary" onClick={() => startEdit(shift)}>
                                                Edit
                                            </Button>
                                            <Button variant="danger" onClick={() => deleteMutation.mutate(shift.id)} disabled={deleteMutation.isPending}>
                                                Delete
                                            </Button>
                                        </div>
                                    ) : null}
                                </div>
                                {shift.notes ? <p className="mt-4 text-sm text-muted">{shift.notes}</p> : null}
                                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                                    {shift.assignments.map((assignment) => (
                                        <div key={assignment.id} className="rounded-md border border-ink-950/10 bg-paper-100 px-4 py-3 text-sm">
                                            <p className="font-black uppercase text-ink-950">{assignment.user.name}</p>
                                            <p className="text-muted">{assignment.user.email}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </Panel>
            </div>
        </div>
    );
}
