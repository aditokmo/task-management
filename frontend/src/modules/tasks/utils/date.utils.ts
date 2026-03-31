export const toISOStringSafe = (dateValue: string) => {
    const parsed = new Date(dateValue);
    return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
};

export const formatDateForInput = (value: string) => {
    if (!value) {
        return '';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return '';
    }

    return date.toISOString().slice(0, 10);
};

export const formatTaskDueDate = (dueDate: string) => {
    const date = new Date(dueDate);
    if (Number.isNaN(date.getTime())) {
        return 'No due date';
    }

    return date.toLocaleDateString();
};
