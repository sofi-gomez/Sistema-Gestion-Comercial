/**
 * Utility to format dates consistently and avoid timezone offsets.
 * 
 * When parsing YYYY-MM-DD strings, JavaScript's Date constructor interprets them as UTC.
 * This can cause dates to shift to the previous day in negative timezones (like UTC-3).
 */

/**
 * Formats a date string (ISO or YYYY-MM-DD) to DD/MM/YYYY local format.
 */
export const formatDateLocal = (dateStr) => {
    if (!dateStr) return "-";

    // Handle ISO strings (contains 'T') or just date strings
    const simpleDate = dateStr.split('T')[0];
    const parts = simpleDate.split('-');

    if (parts.length !== 3) return dateStr;

    // parts[0] = YYYY, parts[1] = MM, parts[2] = DD
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
};

/**
 * Returns an ISO date string (YYYY-MM-DD) for today in local time.
 */
export const getTodayISO = () => {
    return new Date().toISOString().split('T')[0];
};
