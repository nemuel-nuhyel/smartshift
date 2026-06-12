import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, getErrorMessage } from '../lib/api.js';
import { formatDate, formatTimeRange } from '../lib/format.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Button, EmptyState, ErrorState, LoadingState, PageHeader, Panel, Select, StatusBadge, TextArea } from '../components/ui.jsx';

const swapSchema = z.object({
    source_assignment_id: z.coerce.number().int().min(1, 'Choose one of your assignments.'),
    target_assignment_id: z.coerce.number().int().min(1, 'Choose a target assignment.'),
    reason: z.string().optional(),
});

export function SwapRequestsPage() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [formError, setFormError] = useState('');

    const requests = useQuery({
        queryKey: ['swap-requests'],
        queryFn: () => api('/shift-swap-requests'),
    });

    const options = useQuery({
        queryKey: ['swap-options'],
        queryFn: () => api('/shift-swap-requests/options'),
        enabled: user.role === 'worker',
    });

    const form = useForm({
        resolver: zodResolver(swapSchema),
        defaultValues: {
            source_assignment_id: '',
            target_assignment_id: '',
            reason: '',
        },
    });

    const createRequest = useMutation({
        mutationFn: (values) => api('/shift-swap-requests', {
            method: 'POST',
            body: values,
        }),
        onSuccess: () => {
            setFormError('');
            form.reset({ source_assignment_id: '', target_assignment_id: '', reason: '' });
            queryClient.invalidateQueries({ queryKey: ['swap-requests'] });
            queryClient.invalidateQueries({ queryKey: ['swap-options'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        },
        onError: (error) => setFormError(getErrorMessage(error)),
    });

    const updateRequest = useMutation({
        mutationFn: ({ id, payload }) => api(`/shift-swap-requests/${id}`, {
            method: 'PATCH',
            body: payload,
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['swap-requests'] });
            queryClient.invalidateQueries({ queryKey: ['swap-options'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
            queryClient.invalidateQueries({ queryKey: ['shifts'] });
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
        },
    });

    const deleteRequest = useMutation({
        mutationFn: (id) => api(`/shift-swap-requests/${id}`, { method: 'DELETE' }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['swap-requests'] });
            queryClient.invalidateQueries({ queryKey: ['swap-options'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        },
    });

    if (requests.isLoading || options.isLoading) {
        return <LoadingState label="Loading swap requests..." />;
    }

    if (requests.isError || options.isError) {
        return <ErrorState message={getErrorMessage(requests.error ?? options.error)} />;
    }

    const renderAssignmentLabel = (assignment) => (
        `${assignment.shift.title} | ${formatDate(assignment.shift.shift_date)} | ${formatTimeRange(assignment.shift.start_time, assignment.shift.end_time)} | ${assignment.user.name}`
    );

    return (
        <div className="space-y-8">
            <PageHeader
                title="Shift Swap Requests"
                description={user.role === 'admin'
                    ? 'Approve or reject worker-confirmed swaps before the official schedule changes.'
                    : 'Request a swap, respond to incoming requests, and track the approval status.'}
            />

            <div className="grid gap-6 xl:grid-cols-[400px_minmax(0,1fr)]">
                {user.role === 'worker' ? (
                    <Panel title="Create Swap Request" description="Pick one of your current assignments and the worker shift you want to trade with.">
                        {formError ? <ErrorState message={formError} /> : null}
                        <form className="space-y-4" onSubmit={form.handleSubmit((values) => createRequest.mutate(values))}>
                            <Select label="Your Assignment" error={form.formState.errors.source_assignment_id?.message} {...form.register('source_assignment_id')}>
                                <option value="">Select source shift</option>
                                {options.data.source_assignments.map((assignment) => (
                                    <option key={assignment.id} value={assignment.id}>
                                        {renderAssignmentLabel(assignment)}
                                    </option>
                                ))}
                            </Select>
                            <Select label="Target Assignment" error={form.formState.errors.target_assignment_id?.message} {...form.register('target_assignment_id')}>
                                <option value="">Select target shift</option>
                                {options.data.target_assignments.map((assignment) => (
                                    <option key={assignment.id} value={assignment.id}>
                                        {renderAssignmentLabel(assignment)}
                                    </option>
                                ))}
                            </Select>
                            <TextArea label="Reason" error={form.formState.errors.reason?.message} {...form.register('reason')} />
                            <Button type="submit" disabled={createRequest.isPending}>
                                {createRequest.isPending ? 'Submitting...' : 'Submit Request'}
                            </Button>
                        </form>
                    </Panel>
                ) : null}

                <Panel title="Requests" description="Workers can accept or reject their incoming requests. Admins can finalize only after worker acceptance.">
                    <div className="space-y-4">
                        {requests.data.length === 0 ? (
                            <EmptyState title="No swap requests" description="New requests will appear here as workers submit them." />
                        ) : requests.data.map((request) => {
                            const isRequester = request.requester_id === user.id;
                            const isTargetWorker = request.target_assignment?.user_id === user.id;

                            return (
                                <div key={request.id} className="record-card">
                                    <div className="flex flex-wrap items-start justify-between gap-4">
                                        <div className="space-y-2">
                                            <p className="font-black uppercase text-ink-950">
                                                {request.requester.name} requested a swap
                                            </p>
                                            <p className="text-sm text-muted">
                                                From: {request.source_assignment.shift.title} ({request.source_assignment.user.name})
                                            </p>
                                            <p className="text-sm text-muted">
                                                To: {request.target_assignment ? `${request.target_assignment.shift.title} (${request.target_assignment.user.name})` : 'No target selected'}
                                            </p>
                                            {request.reason ? <p className="text-sm text-slate-600">{request.reason}</p> : null}
                                        </div>
                                        <StatusBadge value={request.status} />
                                    </div>

                                    <div className="mt-5 flex flex-wrap gap-3">
                                        {user.role === 'worker' && isTargetWorker && request.status === 'pending' ? (
                                            <>
                                                <Button variant="secondary" onClick={() => updateRequest.mutate({ id: request.id, payload: { status: 'accepted_by_worker' } })}>
                                                    Accept
                                                </Button>
                                                <Button variant="danger" onClick={() => updateRequest.mutate({ id: request.id, payload: { status: 'rejected_by_worker' } })}>
                                                    Reject
                                                </Button>
                                            </>
                                        ) : null}

                                        {user.role === 'admin' && request.status === 'accepted_by_worker' ? (
                                            <>
                                                <Button onClick={() => updateRequest.mutate({ id: request.id, payload: { status: 'approved' } })}>
                                                    Approve
                                                </Button>
                                                <Button variant="danger" onClick={() => updateRequest.mutate({ id: request.id, payload: { status: 'rejected' } })}>
                                                    Reject
                                                </Button>
                                            </>
                                        ) : null}

                                        {(user.role === 'admin' || (isRequester && request.status === 'pending')) ? (
                                            <Button variant="secondary" onClick={() => deleteRequest.mutate(request.id)}>
                                                Delete
                                            </Button>
                                        ) : null}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </Panel>
            </div>
        </div>
    );
}
