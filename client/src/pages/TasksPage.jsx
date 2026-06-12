import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, getErrorMessage } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Button, EmptyState, ErrorState, Input, LoadingState, PageHeader, Panel, Select, StatusBadge, TextArea } from '../components/ui.jsx';

const taskSchema = z.object({
    shift_id: z.coerce.number().int().min(1, 'Select a shift.'),
    title: z.string().min(2, 'Task title is required.'),
    description: z.string().optional(),
    priority: z.enum(['low', 'medium', 'high']),
    status: z.enum(['open', 'in_progress', 'done']),
});

export function TasksPage() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [editingTask, setEditingTask] = useState(null);
    const [formError, setFormError] = useState('');
    const [assignSelections, setAssignSelections] = useState({});
    const [statusFilter, setStatusFilter] = useState('');
    const [shiftFilter, setShiftFilter] = useState('');

    const tasks = useQuery({
        queryKey: ['tasks'],
        queryFn: () => api('/tasks'),
    });

    const shifts = useQuery({
        queryKey: ['task-shifts'],
        queryFn: () => api('/shifts'),
        enabled: user.role === 'admin',
    });

    const form = useForm({
        resolver: zodResolver(taskSchema),
        defaultValues: {
            shift_id: '',
            title: '',
            description: '',
            priority: 'medium',
            status: 'open',
        },
    });

    const resetForm = () => {
        setEditingTask(null);
        setFormError('');
        form.reset({
            shift_id: '',
            title: '',
            description: '',
            priority: 'medium',
            status: 'open',
        });
    };

    const saveTask = useMutation({
        mutationFn: (values) => api(editingTask ? `/tasks/${editingTask.id}` : '/tasks', {
            method: editingTask ? 'PATCH' : 'POST',
            body: values,
        }),
        onSuccess: () => {
            resetForm();
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        },
        onError: (error) => setFormError(getErrorMessage(error)),
    });

    const deleteTask = useMutation({
        mutationFn: (taskId) => api(`/tasks/${taskId}`, { method: 'DELETE' }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        },
    });

    const updateTaskStatus = useMutation({
        mutationFn: ({ taskId, status }) => api(`/tasks/${taskId}`, {
            method: 'PATCH',
            body: { status },
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        },
    });

    const assignWorker = useMutation({
        mutationFn: ({ taskId, userId }) => api('/task-assignments', {
            method: 'POST',
            body: { task_id: taskId, user_id: userId },
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
        },
    });

    const taskList = tasks.data ?? [];
    const taskOptions = useMemo(
        () => taskList
            .map((task) => ({
                ...task,
                assignedToCurrentUser: (task.assignments ?? []).some((assignment) => assignment.user_id === user.id),
            }))
            .filter((task) => (statusFilter ? task.status === statusFilter : true))
            .filter((task) => (shiftFilter ? String(task.shift_id) === shiftFilter : true)),
        [shiftFilter, statusFilter, taskList, user.id],
    );

    const shiftOptions = useMemo(
        () => [...new Map(taskList.map((task) => [task.shift_id, task.shift])).values()].filter(Boolean),
        [taskList],
    );

    const startEdit = (task) => {
        setEditingTask(task);
        form.reset({
            shift_id: task.shift_id,
            title: task.title,
            description: task.description ?? '',
            priority: task.priority,
            status: task.status,
        });
    };

    if (tasks.isLoading || (user.role === 'admin' && shifts.isLoading)) {
        return <LoadingState label="Loading tasks..." />;
    }

    if (tasks.isError || shifts.isError) {
        return <ErrorState message={getErrorMessage(tasks.error ?? shifts.error)} />;
    }

    return (
        <div className="space-y-8">
            <PageHeader
                title="Tasks"
                description={user.role === 'admin'
                    ? 'Create shift tasks, assign workers already on the shift, and track execution state.'
                    : 'View the tasks connected to your assigned shifts and update progress when you are the assignee.'}
                action={(
                    <div className="grid w-full gap-3 md:w-auto md:grid-cols-2">
                        <Select value={shiftFilter} onChange={(event) => setShiftFilter(event.target.value)}>
                            <option value="">All shifts</option>
                            {shiftOptions.map((shift) => (
                                <option key={shift.id} value={shift.id}>{shift.title}</option>
                            ))}
                        </Select>
                        <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                            <option value="">All statuses</option>
                            <option value="open">Open</option>
                            <option value="in_progress">In Progress</option>
                            <option value="done">Done</option>
                        </Select>
                    </div>
                )}
            />

            <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
                {user.role === 'admin' ? (
                    <Panel title={editingTask ? 'Edit Task' : 'Create Task'} description="Task definitions live inside shifts and can later be assigned to workers.">
                        {formError ? <ErrorState message={formError} /> : null}
                        <form className="space-y-4" onSubmit={form.handleSubmit((values) => saveTask.mutate(values))}>
                            <Select label="Shift" error={form.formState.errors.shift_id?.message} {...form.register('shift_id')}>
                                <option value="">Select shift</option>
                                {(shifts.data ?? []).map((shift) => (
                                    <option key={shift.id} value={shift.id}>{shift.title}</option>
                                ))}
                            </Select>
                            <Input label="Task Title" error={form.formState.errors.title?.message} {...form.register('title')} />
                            <TextArea label="Description" error={form.formState.errors.description?.message} {...form.register('description')} />
                            <Select label="Priority" error={form.formState.errors.priority?.message} {...form.register('priority')}>
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </Select>
                            <Select label="Status" error={form.formState.errors.status?.message} {...form.register('status')}>
                                <option value="open">Open</option>
                                <option value="in_progress">In Progress</option>
                                <option value="done">Done</option>
                            </Select>
                            <div className="flex gap-3">
                                <Button type="submit" disabled={saveTask.isPending}>
                                    {saveTask.isPending ? 'Saving...' : editingTask ? 'Update Task' : 'Create Task'}
                                </Button>
                                {editingTask ? (
                                    <Button type="button" variant="secondary" onClick={resetForm}>
                                        Cancel
                                    </Button>
                                ) : null}
                            </div>
                        </form>
                    </Panel>
                ) : null}

                <Panel title="Task List" description="Each task shows its shift, assignees, and current execution state.">
                    <div className="space-y-4">
                        {taskOptions.length === 0 ? (
                            <EmptyState title="No tasks available" description="Tasks will appear here when they are created for your shifts." />
                        ) : taskOptions.map((task) => (
                            <div key={task.id} className="record-card">
                                <div className="flex flex-wrap items-start justify-between gap-4">
                                    <div>
                                        <h3 className="text-lg font-black uppercase text-ink-950">{task.title}</h3>
                                        <p className="mt-1 text-sm text-muted">{task.shift?.title}</p>
                                        {task.description ? <p className="mt-3 text-sm text-slate-600">{task.description}</p> : null}
                                    </div>
                                    <div className="flex gap-2">
                                        <StatusBadge value={task.priority} />
                                        <StatusBadge value={task.status} />
                                    </div>
                                </div>

                                <div className="mt-4 flex flex-wrap gap-2">
                                    {(task.assignments ?? []).map((assignment) => (
                                        <div key={assignment.id} className="data-chip">
                                            {assignment.user.name}
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-5 flex flex-wrap items-center gap-3">
                                    <Select
                                        className="max-w-52"
                                        value={task.status}
                                        onChange={(event) => updateTaskStatus.mutate({ taskId: task.id, status: event.target.value })}
                                        disabled={user.role !== 'admin' && !task.assignedToCurrentUser}
                                    >
                                        <option value="open">Open</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="done">Done</option>
                                    </Select>

                                    {user.role === 'admin' ? (
                                        <>
                                            <Select
                                                className="max-w-56"
                                                value={assignSelections[task.id] ?? ''}
                                                onChange={(event) => setAssignSelections((current) => ({
                                                    ...current,
                                                    [task.id]: event.target.value,
                                                }))}
                                            >
                                                <option value="">Assign worker</option>
                                                {(task.shift?.assignments ?? []).map((assignment) => (
                                                    <option key={assignment.user.id} value={assignment.user.id}>
                                                        {assignment.user.name}
                                                    </option>
                                                ))}
                                            </Select>
                                            <Button
                                                variant="secondary"
                                                onClick={() => assignWorker.mutate({ taskId: task.id, userId: Number(assignSelections[task.id]) })}
                                                disabled={!assignSelections[task.id] || assignWorker.isPending}
                                            >
                                                Assign
                                            </Button>
                                            <Button variant="secondary" onClick={() => startEdit(task)}>
                                                Edit
                                            </Button>
                                            <Button variant="danger" onClick={() => deleteTask.mutate(task.id)} disabled={deleteTask.isPending}>
                                                Delete
                                            </Button>
                                        </>
                                    ) : null}
                                </div>
                            </div>
                        ))}
                    </div>
                </Panel>
            </div>
        </div>
    );
}
