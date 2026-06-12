import { useQuery } from '@tanstack/react-query';
import { api, getErrorMessage } from '../lib/api.js';
import { PlannerBoard } from '../components/PlannerBoard.jsx';
import { ErrorState, LoadingState, PageHeader } from '../components/ui.jsx';

export function PlannerPage() {
    const planner = useQuery({
        queryKey: ['planner'],
        queryFn: () => api('/planner'),
    });

    if (planner.isLoading) {
        return <LoadingState label="Loading planner..." />;
    }

    if (planner.isError) {
        return <ErrorState message={getErrorMessage(planner.error)} />;
    }

    return (
        <div className="space-y-8">
            <PageHeader
                title="Shift Planner"
                description="Drag workers into shifts, move cards between columns, and keep capacity or time conflicts from reaching the database."
            />
            <PlannerBoard data={planner.data} />
        </div>
    );
}
