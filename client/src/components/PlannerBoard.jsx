import { DndContext, PointerSensor, useDraggable, useDroppable, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api, getErrorMessage } from '../lib/api.js';
import { cx, formatDate, formatTimeRange, overlaps } from '../lib/format.js';
import { Button, ErrorState, StatusBadge } from './ui.jsx';

function PoolWorkerCard({ worker }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: `worker-${worker.id}`,
    });

    return (
        <div
            ref={setNodeRef}
            style={{ transform: CSS.Translate.toString(transform) }}
            className={cx(
                'rounded-md border border-ink-950/10 bg-white p-3 shadow-sm',
                isDragging && 'opacity-40',
            )}
            {...listeners}
            {...attributes}
        >
            <p className="font-black uppercase text-ink-950">{worker.name}</p>
            <p className="mt-1 text-xs text-muted">{worker.email}</p>
        </div>
    );
}

function AssignmentCard({ assignment }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: `assignment-${assignment.id}`,
    });

    return (
        <div
            ref={setNodeRef}
            style={{
                transform: CSS.Transform.toString(transform),
                transition,
            }}
            className={cx(
                'rounded-md border border-ink-950/10 bg-white p-3 shadow-sm',
                isDragging && 'opacity-45',
            )}
            {...attributes}
            {...listeners}
        >
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="font-black uppercase text-ink-950">{assignment.user.name}</p>
                    <p className="mt-1 text-xs text-muted">{assignment.user.email}</p>
                </div>
                <StatusBadge value={assignment.status} />
            </div>
        </div>
    );
}

function PlannerColumn({ shift, children }) {
    const { setNodeRef, isOver } = useDroppable({
        id: `shift-${shift.id}`,
    });

    return (
        <div
            ref={setNodeRef}
            className={cx(
                'flex min-w-80 flex-col gap-4 rounded-lg border border-ink-950/10 bg-paper-50 p-4 shadow-[0_12px_35px_rgba(16,19,22,0.06)]',
                isOver && 'border-brand-500 bg-brand-50',
            )}
        >
            <div className="space-y-3 border-b border-ink-950/10 pb-4">
                <div className="flex items-center justify-between gap-3">
                    <h3 className="text-lg font-black uppercase text-ink-950">{shift.title}</h3>
                    <span className="data-chip">
                        {shift.assignments.length}/{shift.capacity}
                    </span>
                </div>
                <p className="text-sm text-muted">{formatDate(shift.shift_date)}</p>
                <p className="text-sm text-slate-600">
                    {formatTimeRange(shift.start_time, shift.end_time)}
                    {shift.location ? ` | ${shift.location}` : ''}
                </p>
            </div>
            <SortableContext
                items={shift.assignments.map((assignment) => `assignment-${assignment.id}`)}
                strategy={verticalListSortingStrategy}
            >
                <div className="space-y-3">{children}</div>
            </SortableContext>
        </div>
    );
}

export function PlannerBoard({ data }) {
    const queryClient = useQueryClient();
    const [message, setMessage] = useState('');
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

    const assignmentLookup = useMemo(() => {
        const map = {};
        data.shifts.forEach((shift) => {
            shift.assignments.forEach((assignment, index) => {
                map[`assignment-${assignment.id}`] = { assignment, shift, index };
            });
        });
        return map;
    }, [data.shifts]);

    const shiftLookup = useMemo(
        () => Object.fromEntries(data.shifts.map((shift) => [shift.id, shift])),
        [data.shifts],
    );

    const mutation = useMutation({
        mutationFn: (payload) => api('/planner/assignments/reorder', {
            method: 'PATCH',
            body: payload,
        }),
        onSuccess: () => {
            setMessage('');
            queryClient.invalidateQueries({ queryKey: ['planner'] });
            queryClient.invalidateQueries({ queryKey: ['shifts'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        },
        onError: (error) => {
            setMessage(getErrorMessage(error));
        },
    });

    const validateMove = ({ userId, fromShiftId, toShiftId }) => {
        if (toShiftId === null) {
            return null;
        }

        const targetShift = shiftLookup[toShiftId];
        const targetAssignments = targetShift.assignments;
        const currentAssignment = fromShiftId
            ? (shiftLookup[fromShiftId]?.assignments ?? []).find((assignment) => assignment.user_id === userId)
            : null;

        const duplicate = targetAssignments.find(
            (assignment) => assignment.user_id === userId && assignment.id !== currentAssignment?.id,
        );

        if (duplicate) {
            return 'This worker is already assigned to the target shift.';
        }

        const effectiveCount = targetAssignments.length - (fromShiftId === toShiftId ? 1 : 0);
        if (effectiveCount >= targetShift.capacity) {
            return 'This shift is already at capacity.';
        }

        const conflictingShift = data.shifts.find((shift) => {
            if (shift.id === toShiftId || shift.id === fromShiftId) {
                return false;
            }

            return shift.assignments.some((assignment) => assignment.user_id === userId) && overlaps(shift, targetShift);
        });

        if (conflictingShift) {
            return 'This worker already has an overlapping shift.';
        }

        return null;
    };

    const handleDragEnd = ({ active, over }) => {
        if (!over) {
            return;
        }

        const activeId = String(active.id);
        const overId = String(over.id);

        let userId;
        let fromShiftId = null;

        if (activeId.startsWith('worker-')) {
            userId = Number(activeId.replace('worker-', ''));
        } else {
            const source = assignmentLookup[activeId];
            if (!source) {
                return;
            }

            userId = source.assignment.user_id;
            fromShiftId = source.shift.id;
        }

        let toShiftId = null;
        let position = null;

        if (overId === 'pool') {
            toShiftId = null;
        } else if (overId.startsWith('shift-')) {
            toShiftId = Number(overId.replace('shift-', ''));
            position = shiftLookup[toShiftId]?.assignments.length ?? 0;
        } else if (overId.startsWith('assignment-')) {
            const target = assignmentLookup[overId];
            if (!target) {
                return;
            }

            toShiftId = target.shift.id;
            position = target.index;
        }

        if (fromShiftId === toShiftId && activeId === overId) {
            return;
        }

        const validationMessage = validateMove({ userId, fromShiftId, toShiftId });
        if (validationMessage) {
            setMessage(validationMessage);
            return;
        }

        mutation.mutate({
            user_id: userId,
            from_shift_id: fromShiftId,
            to_shift_id: toShiftId,
            position,
        });
    };

    const { setNodeRef: setPoolRef, isOver: isPoolOver } = useDroppable({ id: 'pool' });

    return (
        <div className="space-y-5">
            {message ? <ErrorState message={message} /> : null}
            <section className="dark-panel p-5">
                <div className="safety-stripe mb-5 h-2 w-full max-w-xs" />
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <p className="text-[11px] font-black uppercase text-brand-300">Live Planner</p>
                        <p className="mt-3 text-xl font-black uppercase text-white">
                            Drag workers. Place them. Fix conflicts before save.
                        </p>
                        <p className="mt-2 max-w-3xl text-sm text-slate-200/80">
                            Move a worker into any shift column to assign them. Move a card back to the pool to unassign. Capacity and overlap checks run before the API update.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <div className="data-chip">Workers {data.workers.length}</div>
                        <div className="data-chip">Shifts {data.shifts.length}</div>
                        <Button variant="secondary" onClick={() => queryClient.invalidateQueries({ queryKey: ['planner'] })}>
                            Refresh Board
                        </Button>
                    </div>
                </div>
            </section>
            <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
                <div className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
                    <div
                        ref={setPoolRef}
                        className={cx(
                            'rounded-lg border border-ink-950/10 bg-paper-50 p-4 shadow-[0_12px_35px_rgba(16,19,22,0.06)]',
                            isPoolOver && 'border-brand-500 bg-brand-50',
                        )}
                    >
                        <h3 className="text-lg font-black uppercase text-ink-950">Worker Pool</h3>
                        <p className="mt-1 text-sm text-muted">
                            Drop an assignment back here to unassign that worker from the shift.
                        </p>
                        <div className="mt-4 space-y-3">
                            {data.workers.map((worker) => (
                                <PoolWorkerCard key={worker.id} worker={worker} />
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-4 overflow-x-auto pb-2">
                        {data.shifts.map((shift) => (
                            <PlannerColumn key={shift.id} shift={shift}>
                                {shift.assignments.map((assignment) => (
                                    <AssignmentCard key={assignment.id} assignment={assignment} />
                                ))}
                            </PlannerColumn>
                        ))}
                    </div>
                </div>
            </DndContext>
        </div>
    );
}
