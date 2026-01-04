/**
 * Getty Vocabulary resolver - fetches terms from Getty AAT/TGN/ULAN URIs
 */

/**
 * Attempt to fetch with different headers
 */
async function attemptFetch(url, headers, fetch) {
    try {
        const response = await fetch(url, { headers });
        return { response, error: null };
    } catch (error) {
        return { response: null, error };
    }
}

/**
 * Process successful response and extract term
 */
async function processResponse(response, termType) {
    const data = await response.json();
    const identifiedBy = data?.identified_by;

    if (Array.isArray(identifiedBy)) {
        for (const item of identifiedBy) {
            const classifiedAs = item?.classified_as || [];
            if (termType === 'preferred') {
                if (classifiedAs.some(ca => ca.id === "http://vocab.getty.edu/aat/300404670")) return item.content;
                if (classifiedAs.some(ca => ca.equivalent?.some(eq => eq.id === "http://vocab.getty.edu/aat/300404670"))) return item.content;
            } else {
                if (classifiedAs.some(ca => ca.id === "http://vocab.getty.edu/aat/300404670")) {
                    const alternativeContent = item?.alternative?.[0]?.content;
                    if (alternativeContent) return alternativeContent;
                }
            }
        }
    }

    // Fallback to label when no preferred term found
    if (termType === 'preferred') {
        const label = data?.label || data?._label;
        if (label) {
            return { label, source: data?.label ? 'label' : '_label' };
        }
    }

    return null;
}

/**
 * Fetch term from Getty vocabulary URI
 * @param {string} uri - The Getty vocabulary URI
 * @param {string} dataField - Field name for logging
 * @param {string} termType - 'preferred' or 'alternative'
 * @param {Function} fetch - Fetch function
 * @param {Set} logMessages - Log messages set
 * @returns {Promise<string|null>} - The term or null
 */
export async function getTerm(uri, dataField, termType = 'preferred', fetch, logMessages) {
    try {
        let data = null;
        let lastError = null;

        // Attempt 1: No Accept header (most compatible)
        const attempt1 = await attemptFetch(uri, {}, fetch);
        if (attempt1.response && attempt1.response.ok) {
            data = await processResponse(attempt1.response, termType);
            if (data) {
                if (typeof data === 'object' && data.label) {
                    logMessages.add(`No preferred term found for ${uri}. "${data.source}" retrieved instead.`);
                    return data.label;
                }
                return data;
            }
        } else if (attempt1.response) {
            lastError = `HTTP ${attempt1.response.status}`;
        } else {
            lastError = attempt1.error?.message || 'Network error';
        }

        // Attempt 2: With application/ld+json header
        const attempt2 = await attemptFetch(uri, { 'Accept': 'application/ld+json' }, fetch);
        if (attempt2.response && attempt2.response.ok) {
            data = await processResponse(attempt2.response, termType);
            if (data) {
                if (typeof data === 'object' && data.label) {
                    logMessages.add(`No preferred term found for ${uri}. "${data.source}" retrieved instead.`);
                    return data.label;
                }
                return data;
            }
        } else if (attempt2.response) {
            lastError = `HTTP ${attempt2.response.status}`;
        } else {
            lastError = attempt2.error?.message || 'Network error';
        }

        // Attempt 3: With application/json header (fallback)
        const attempt3 = await attemptFetch(uri, { 'Accept': 'application/json' }, fetch);
        if (attempt3.response && attempt3.response.ok) {
            data = await processResponse(attempt3.response, termType);
            if (data) {
                if (typeof data === 'object' && data.label) {
                    logMessages.add(`No preferred term found for ${uri}. "${data.source}" retrieved instead.`);
                    return data.label;
                }
                return data;
            }
        } else if (attempt3.response) {
            lastError = `HTTP ${attempt3.response.status}`;
        } else {
            lastError = attempt3.error?.message || 'Network error';
        }

        // All attempts failed
        throw new Error(`All fetch attempts failed for ${uri}. Last error: ${lastError}`);
    } catch (error) {
        // Check if it's an HTML response (common fallback)
        if (error.message.includes('is not valid JSON') || error.message.includes('<!DOCTYPE')) {
            logMessages.add(`Error retrieving ${dataField} data: ${uri} returned HTML instead of JSON (possible fallback page)`);
        } else {
            logMessages.add(`Error retrieving ${dataField} data: ${error.message}`);
        }
        return null;
    }
}
