import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, getErrorMessage } from '../lib/api.js';
import { Button, EmptyState, ErrorState, Input, LoadingState, PageHeader, Panel, Select, StatusBadge } from '../components/ui.jsx';

const userSchema = z.object({
    name: z.string().min(2, 'Name is required.'),
    email: z.email('Enter a valid email address.'),
    password: z.string().min(8, 'Password must be at least 8 characters.'),
    password_confirmation: z.string().min(8, 'Confirm the password.'),
    role: z.enum(['admin', 'worker']),
}).refine((values) => values.password === values.password_confirmation, {
    path: ['password_confirmation'],
    message: 'Passwords must match.',
});

export function UsersPage() {
    const queryClient = useQueryClient();
    const [formError, setFormError] = useState('');

    const users = useQuery({
        queryKey: ['users'],
        queryFn: () => api('/users'),
    });

    const form = useForm({
        resolver: zodResolver(userSchema),
        defaultValues: {
            name: '',
            email: '',
            password: '',
            password_confirmation: '',
            role: 'worker',
        },
    });

    const createUser = useMutation({
        mutationFn: (values) => api('/users', {
            method: 'POST',
            body: values,
        }),
        onSuccess: () => {
            setFormError('');
            form.reset({ name: '', email: '', password: '', password_confirmation: '', role: 'worker' });
            queryClient.invalidateQueries({ queryKey: ['users'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        },
        onError: (error) => setFormError(getErrorMessage(error)),
    });

    const updateUser = useMutation({
        mutationFn: ({ id, payload }) => api(`/users/${id}`, {
            method: 'PATCH',
            body: payload,
        }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
    });

    const deleteUser = useMutation({
        mutationFn: (id) => api(`/users/${id}`, { method: 'DELETE' }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        },
    });

    if (users.isLoading) {
        return <LoadingState label="Loading users..." />;
    }

    if (users.isError) {
        return <ErrorState message={getErrorMessage(users.error)} />;
    }

    return (
        <div className="space-y-8">
            <PageHeader
                title="User Management"
                description="Administrators can create worker accounts, promote staff, and remove old records."
            />

            <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
                <Panel title="Create User" description="New public registrations default to worker, but admins can create any role here.">
                    {formError ? <ErrorState message={formError} /> : null}
                    <form className="space-y-4" onSubmit={form.handleSubmit((values) => createUser.mutate(values))}>
                        <Input label="Full Name" error={form.formState.errors.name?.message} {...form.register('name')} />
                        <Input label="Email" error={form.formState.errors.email?.message} {...form.register('email')} />
                        <Input label="Password" type="password" error={form.formState.errors.password?.message} {...form.register('password')} />
                        <Input label="Confirm Password" type="password" error={form.formState.errors.password_confirmation?.message} {...form.register('password_confirmation')} />
                        <Select label="Role" error={form.formState.errors.role?.message} {...form.register('role')}>
                            <option value="worker">Worker</option>
                            <option value="admin">Admin</option>
                        </Select>
                        <Button type="submit" disabled={createUser.isPending}>
                            {createUser.isPending ? 'Creating...' : 'Create User'}
                        </Button>
                    </form>
                </Panel>

                <Panel title="Users" description="Role updates are applied immediately and affect access control.">
                    <div className="space-y-4">
                        {users.data.length === 0 ? (
                            <EmptyState title="No users found" description="Create a user to get the system started." />
                        ) : users.data.map((user) => (
                            <div key={user.id} className="record-card">
                                <div className="flex flex-wrap items-start justify-between gap-4">
                                    <div>
                                        <p className="text-lg font-black uppercase text-ink-950">{user.name}</p>
                                        <p className="mt-1 text-sm text-muted">{user.email}</p>
                                        <p className="mt-2 text-xs uppercase text-slate-500">
                                            {user.shift_assignments_count} shifts | {user.task_assignments_count} task assignments
                                        </p>
                                    </div>
                                    <StatusBadge value={user.role} />
                                </div>
                                <div className="mt-4 flex flex-wrap items-center gap-3">
                                    <Select
                                        className="max-w-44"
                                        value={user.role}
                                        onChange={(event) => updateUser.mutate({ id: user.id, payload: { role: event.target.value } })}
                                    >
                                        <option value="worker">Worker</option>
                                        <option value="admin">Admin</option>
                                    </Select>
                                    <Button variant="danger" onClick={() => deleteUser.mutate(user.id)} disabled={deleteUser.isPending}>
                                        Delete
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </Panel>
            </div>
        </div>
    );
}
