/**
 * Complete Linked Art Entity Parser - Browser Compatible Version
 * Recursively parses ALL properties regardless of their names
 */

// ============================================
// Utility Functions
// ============================================

/**
 * Safely get label from object
 */
function getLabel(obj) {
    if (!obj) return null;
    return obj._label || obj.label || obj.name || null;
}

/**
 * Detect entity type and return friendly name
 */
function getFriendlyTypeName(type) {
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

// Debug logging
const DEBUG = true;
function debugLog(...args) {
    if (DEBUG) {
        console.log('[CompleteParser]', ...args);
    }
}

/**
 * Simple literal types that don't need recursion
 */
const SIMPLE_TYPES = ['string', 'number', 'boolean'];

/**
 * Check if a value is a simple object (reference-like, no nested structure)
 */
function isSimpleObject(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return false;
    }

    const keys = Object.keys(value);
    if (keys.length > 5) {
        return false;
    }

    const simpleKeys = new Set([
        'id', 'type', '_label', 'label', 'name',
        'classified_as', 'equivalent'
    ]);

    for (const key of keys) {
        if (!simpleKeys.has(key)) {
            return false;
        }
        const val = value[key];
        if (Array.isArray(val) && val.length > 0) {
            return false;
        }
        if (typeof val === 'object' && val !== null && !isSimpleObject(val)) {
            return false;
        }
    }

    return true;
}

/**
 * Check if a value needs recursive parsing
 */
function needsRecursion(value) {
    if (value === null || value === undefined) {
        return false;
    }

    if (Array.isArray(value)) {
        return true;
    }

    if (typeof value === 'object') {
        return !isSimpleObject(value);
    }

    return false;
}

/**
 * Check if a value is a reference that should be fetched
 */
function shouldResolveReference(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return false;
    }

    const hasId = !!value.id;
    const hasLabel = !!value._label || !!value.label || !!value.name;

    return hasId && isSimpleObject(value) && !hasLabel;
}

/**
 * Parse a single entity completely
 */
export async function parseEntity(entity, fetch, logMessages, options = {}) {
    debugLog('parseEntity called, entity type:', typeof entity, entity);

    const {
        resolveReferences = true,
        maxDepth = 3,
        currentDepth = 0,
        visited = new Set()
    } = options;

    // Handle primitive values
    if (entity === null || entity === undefined) {
        debugLog('Returning literal for null/undefined');
        return { type: 'literal', value: entity };
    }

    if (SIMPLE_TYPES.includes(typeof entity)) {
        debugLog('Returning literal for simple type:', typeof entity);
        return { type: 'literal', value: entity };
    }

    // Handle arrays
    if (Array.isArray(entity)) {
        debugLog('Processing array with', entity.length, 'items');
        const items = await Promise.all(
            entity.map((item, index) => {
                debugLog(`Processing array item ${index}:`, typeof item);
                return parseEntity(item, fetch, logMessages, {
                    resolveReferences,
                    maxDepth,
                    currentDepth,
                    visited
                });
            })
        );
        return { type: 'array', items };
    }

    // Handle objects
    if (typeof entity !== 'object') {
        debugLog('Returning literal for non-object');
        return { type: 'literal', value: entity };
    }

    // Get basic entity info
    const id = entity.id;
    const type = entity.type || 'Unknown';
    const label = getLabel(entity);

    debugLog('Entity info:', { id, type, label, currentDepth });

    const result = {
        type: 'entity',
        id,
        entityType: type,
        friendlyType: getFriendlyTypeName(type),
        label,
        properties: {}
    };

    // If this is a reference and we should resolve it
    if (resolveReferences && shouldResolveReference(entity) && id && !visited.has(id)) {
        debugLog('Resolving reference:', id);
        visited.add(id);
        try {
            const response = await fetch(id);
            if (response.ok) {
                const fullData = await response.json();
                return await parseEntity(fullData, fetch, logMessages, {
                    resolveReferences,
                    maxDepth,
                    currentDepth,
                    visited
                });
            }
        } catch (error) {
            debugLog('Failed to resolve reference:', error);
            if (logMessages) {
                logMessages.add(`Failed to resolve reference ${id}: ${error.message}`);
            }
        }
    }

    // Check depth limit
    if (currentDepth >= maxDepth) {
        debugLog('Depth limit reached at', currentDepth);
        result._truncated = true;
        return result;
    }

    // Parse ALL properties (no whitelist!)
    const keys = Object.keys(entity);
    debugLog('Processing', keys.length, 'properties:', keys);

    for (const [key, value] of Object.entries(entity)) {
        if (key === '@context') continue;

        debugLog(`Processing property "${key}":`, typeof value, value);

        if (value === null || value === undefined) {
            result.properties[key] = { type: 'null' };
            continue;
        }

        // Handle any nested entities based on TYPE, not property name
        if (needsRecursion(value)) {
            const nextDepth = currentDepth + 1;
            debugLog(`Recursing into "${key}" at depth`, nextDepth);

            result.properties[key] = await parseEntity(value, fetch, logMessages, {
                resolveReferences,
                maxDepth,
                currentDepth: nextDepth,
                visited
            });
        } else {
            // Handle simple literal values
            result.properties[key] = { type: 'literal', value };
        }
    }

    return result;
}

/**
 * Get summary statistics of parsed entity
 */
export function getParsedEntityStats(parsed) {
    if (!parsed || parsed.type !== 'entity') {
        return null;
    }

    const stats = {
        type: parsed.entityType,
        label: parsed.label,
        id: parsed.id,
        propertyCount: Object.keys(parsed.properties || {}).length,
        propertyNames: Object.keys(parsed.properties || {}).sort(),
        hasReferences: false,
        nestedEntityCount: 0,
        arrayCount: 0,
        literalCount: 0,
        maxDepth: 0
    };

    function calculateDepth(node, currentDepth) {
        if (!node || typeof node !== 'object') return currentDepth;
        if (node.type === 'entity') {
            let maxD = currentDepth;
            for (const value of Object.values(node.properties || {})) {
                maxD = Math.max(maxD, calculateDepth(value, currentDepth + 1));
            }
            return maxD;
        }
        if (node.type === 'array') {
            let maxD = currentDepth;
            for (const item of node.items || []) {
                maxD = Math.max(maxD, calculateDepth(item, currentDepth + 1));
            }
            return maxD;
        }
        return currentDepth;
    }

    stats.maxDepth = calculateDepth(parsed, 0);

    for (const value of Object.values(parsed.properties || {})) {
        if (value.type === 'entity') {
            stats.nestedEntityCount++;
            if (value.id && value.id.startsWith('http')) {
                stats.hasReferences = true;
            }
        } else if (value.type === 'array') {
            stats.arrayCount++;
            for (const item of value.items || []) {
                if (item.type === 'entity') {
                    stats.nestedEntityCount++;
                    if (item.id && item.id.startsWith('http')) {
                        stats.hasReferences = true;
                    }
                }
            }
        } else if (value.type === 'literal') {
            stats.literalCount++;
        }
    }

    return stats;
}

/**
 * Get entity hierarchy for tree display
 */
export function getEntityHierarchy(parsed, path = '', maxDepth = 10) {
    if (!parsed || maxDepth <= 0) {
        return [];
    }

    const result = [];

    if (parsed.type === 'entity') {
        for (const [key, value] of Object.entries(parsed.properties || {})) {
            const currentPath = path ? `${path}.${key}` : key;

            result.push({
                key,
                path: currentPath,
                type: value.type,
                entityType: value.entityType,
                label: value.label,
                id: value.id,
                isArray: value.type === 'array',
                arrayLength: value.items?.length || 0,
                hasChildren: value.type === 'entity' || value.type === 'array',
                _truncated: value._truncated
            });

            if (value.type === 'entity') {
                result.push(...getEntityHierarchy(value, currentPath, maxDepth - 1));
            } else if (value.type === 'array') {
                value.items?.forEach((item, index) => {
                    const itemPath = `${currentPath}[${index}]`;
                    result.push({
                        key: `[${index}]`,
                        path: itemPath,
                        type: item.type,
                        entityType: item.entityType,
                        label: item.label,
                        id: item.id,
                        hasChildren: item.type === 'entity' || item.type === 'array',
                        _truncated: item._truncated
                    });

                    if (item.type === 'entity') {
                        result.push(...getEntityHierarchy(item, itemPath, maxDepth - 1));
                    }
                });
            }
        }
    }

    return result;
}

/**
 * Get property by path
 */
export function getPropertyByPath(parsed, path) {
    const parts = path.split(/[.\[\]]+/).filter(p => p);

    let current = parsed;
    for (const part of parts) {
        if (!current) return null;

        if (part === '') continue;

        const index = parseInt(part);
        if (!isNaN(index)) {
            // Array index
            if (current.type === 'array' && current.items) {
                current = current.items[index];
            } else {
                return null;
            }
        } else {
            // Object key
            if (current.type === 'entity' && current.properties) {
                current = current.properties[part];
            } else {
                return null;
            }
        }
    }

    return current;
}
