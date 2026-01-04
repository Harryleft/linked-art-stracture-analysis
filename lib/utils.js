/**
 * Utility functions for Linked Art analysis
 */

/**
 * Convert compact IDs (aat:300312355) to full URIs
 */
export function convertToFullUri(id, logMessages) {
    if (!id || typeof id !== 'string') {
        return id;
    }

    const patterns = [
        { prefix: 'aat:', baseUri: 'http://vocab.getty.edu/aat/' },
        { prefix: 'tgn:', baseUri: 'http://vocab.getty.edu/tgn/' },
        { prefix: 'ulan:', baseUri: 'http://vocab.getty.edu/ulan/' }
    ];

    for (const pattern of patterns) {
        if (id.startsWith(pattern.prefix)) {
            if (logMessages) {
                logMessages.add("Numeric IDs used instead of full URIs.");
            }
            return id.replace(pattern.prefix, pattern.baseUri);
        }
    }

    return id;
}

/**
 * Recursively expand all numeric IDs in data
 */
export function expandNumericIds(data, logMessages) {
    function recursiveExpand(obj) {
        if (obj === null || obj === undefined) {
            return obj;
        }

        if (Array.isArray(obj)) {
            return obj.map(item => recursiveExpand(item));
        } else if (typeof obj === 'object') {
            for (const key in obj) {
                if (key === 'id' && typeof obj[key] === 'string') {
                    obj[key] = convertToFullUri(obj[key], logMessages);
                } else {
                    obj[key] = recursiveExpand(obj[key]);
                }
            }
        }
        return obj;
    }

    return recursiveExpand(data);
}

/**
 * Get content or value from item (handles versioning differences)
 */
export function getContentOrValue(item, dataField, logMessages) {
    if (!item) return null;

    if (item.content) {
        return item.content;
    } else if (item.value) {
        if (logMessages) {
            logMessages.add(`${dataField} could not be retrieved using the "content" attribute. "value" attribute retrieved instead.`);
        }
        return item.value;
    }
    return null;
}

/**
 * Iterative search through object with callback
 */
export async function iterativeSearch(obj, callback) {
    const queue = [obj];
    while (queue.length > 0) {
        const current = queue.shift();
        if (current && typeof current === 'object') {
            await callback(current);
            if (Array.isArray(current)) {
                queue.push(...current);
            } else {
                queue.push(...Object.values(current));
            }
        }
    }
}

/**
 * Find object by classified_as property
 */
export function findClassifiedAs(obj, targetUris) {
    if (!obj || typeof obj !== 'object') return null;

    if (Array.isArray(obj)) {
        for (const item of obj) {
            const result = findClassifiedAs(item, targetUris);
            if (result) return result;
        }
    } else {
        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'string' && targetUris.includes(value)) return obj;
            if (key === 'classified_as' || key === 'equivalent') {
                const result = findClassifiedAs(value, targetUris);
                if (result) return result;
            }
        }
    }
    return null;
}

/**
 * Find Getty vocabulary URI in object
 */
export function findGettyUri(obj) {
    if (!obj || typeof obj !== 'object') return null;

    if (Array.isArray(obj)) {
        for (const item of obj) {
            const foundUri = findGettyUri(item);
            if (foundUri) return foundUri;
        }
    } else {
        for (const value of Object.values(obj)) {
            if (typeof value === 'string' && value.includes('vocab.getty.edu')) return value;
            const foundUri = findGettyUri(value);
            if (foundUri) return foundUri;
        }
    }
    return null;
}

/**
 * Parse date string into components
 */
export function parseDateString(dateString) {
    if (!dateString) return null;

    const regex = /^(-?\d+)-(\d{2})-(\d{2})T/;
    const match = dateString.match(regex);
    if (match) {
        const [, year, month, day] = match;
        return { year: parseInt(year, 10), month: parseInt(month, 10), day: parseInt(day, 10) };
    }
    return null;
}

/**
 * Format timespan for display
 */
export function formatTimespan(beginDate, endDate) {
    const begin = parseDateString(beginDate);
    const end = parseDateString(endDate);

    if (!begin && !end) return null;

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const isSameYear = begin.year === end.year;
    const isSameMonth = isSameYear && begin.month === end.month;

    // Scenario 1: full year(s) span
    if (begin.month === 1 && begin.day === 1 && end.month === 12 && end.day === 31) {
        return isSameYear ? `${begin.year > 0 ? begin.year : `${Math.abs(begin.year)} BC`}` : `${begin.year > 0 ? begin.year : `${Math.abs(begin.year)} BC`} to ${end.year > 0 ? end.year : `${Math.abs(end.year)} BC`}`;
    }

    // Scenario 2: full month(s) span
    const lastDayOfEndMonth = new Date(end.year, end.month, 0).getDate();
    if (begin.day === 1 && end.day === lastDayOfEndMonth) {
        if (isSameMonth) {
            return `${monthNames[begin.month - 1]} ${begin.year > 0 ? begin.year : `${Math.abs(begin.year)} BC`}`;
        }
        if (isSameYear) {
            return `${monthNames[begin.month - 1]} to ${monthNames[end.month - 1]} ${begin.year > 0 ? begin.year : `${Math.abs(begin.year)} BC`}`;
        }
        return `${monthNames[begin.month - 1]} ${begin.year > 0 ? begin.year : `${Math.abs(begin.year)} BC`} to ${monthNames[end.month - 1]} ${end.year > 0 ? end.year : `${Math.abs(end.year)} BC`}`;
    }

    // Scenario 3: specific dates span
    const beginDateStr = `${begin.day} ${monthNames[begin.month - 1]} ${begin.year > 0 ? begin.year : `${Math.abs(begin.year)} BC`}`;
    const endDateStr = `${end.day} ${monthNames[end.month - 1]} ${end.year > 0 ? end.year : `${Math.abs(end.year)} BC`}`;

    return isSameMonth
        ? `${begin.day} to ${endDateStr}`
        : `${beginDateStr} to ${endDateStr}`;
}

/**
 * Detect entity type and return friendly name
 */
export function getFriendlyTypeName(type) {
    const typeNames = {
        'HumanMadeObject': 'Physical Object',
        'DigitalObject': 'Digital Object',
        'Person': 'Person',
        'Group': 'Group/Organization',
        'Place': 'Place',
        'VisualItem': 'Visual Work',
        'LinguisticObject': 'Textual Work',
        'PropositionalObject': 'Abstract Work',
        'Set': 'Set/Collection',
        'Activity': 'Activity',
        'Event': 'Event',
        'Type': 'Concept/Type',
        'TimeSpan': 'Time Span',
        'Name': 'Name',
        'Identifier': 'Identifier',
        'Dimension': 'Dimension',
        'Material': 'Material',
        'Language': 'Language',
        'MeasurementUnit': 'Measurement Unit',
        'Currency': 'Currency',
        'Right': 'Right'
    };
    return typeNames[type] || type;
}

/**
 * Detect entity type from data
 */
export function detectEntityType(data) {
    const type = data?.type || 'Unknown';
    const label = data?._label || 'Unnamed';
    return { type, label, friendlyName: getFriendlyTypeName(type) };
}

/**
 * Safely get label from object
 */
export function getLabel(obj) {
    if (!obj) return null;
    return obj._label || obj.label || obj.name || null;
}

/**
 * Check if value is a reference (has id but missing full data)
 */
export function isReference(value) {
    if (!value || typeof value !== 'object') return false;
    return !!(value.id && (!value._label || value.type === undefined));
}
