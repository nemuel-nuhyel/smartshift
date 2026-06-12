export function cx(...parts) {
    return parts.filter(Boolean).join(' ');
}

export function formatDate(value) {
    if (!value) {
        return 'Unknown date';
    }

    return new Intl.DateTimeFormat('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    }).format(new Date(value));
}

export function formatTimeRange(start, end) {
    return `${String(start).slice(0, 5)} - ${String(end).slice(0, 5)}`;
}

export function groupByDate(items, getDate) {
    return items.reduce((groups, item) => {
        const key = getDate(item);
        groups[key] ??= [];
        groups[key].push(item);
        return groups;
    }, {});
}

export function overlaps(first, second) {
    if (String(first.shift_date).slice(0, 10) !== String(second.shift_date).slice(0, 10)) {
        return false;
    }

    const firstStart = `${String(first.shift_date).slice(0, 10)}T${String(first.start_time).slice(0, 5)}:00`;
    const firstEnd = `${String(first.shift_date).slice(0, 10)}T${String(first.end_time).slice(0, 5)}:00`;
    const secondStart = `${String(second.shift_date).slice(0, 10)}T${String(second.start_time).slice(0, 5)}:00`;
    const secondEnd = `${String(second.shift_date).slice(0, 10)}T${String(second.end_time).slice(0, 5)}:00`;

    return new Date(firstStart) < new Date(secondEnd) && new Date(firstEnd) > new Date(secondStart);
}
