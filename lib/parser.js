/**
 * Complete Linked Art Entity Parser
 * Recursively parses ALL properties regardless of their names
 * Uses type-based detection to determine what to parse
 */

import { getLabel, isReference, getFriendlyTypeName } from './utils.js';
import { getTerm } from './vocab.js';

/**
 * Simple literal types that don't need recursion
 */
const SIMPLE_TYPES = ['string', 'number', 'boolean'];

/**
 * Metadata properties that should be skipped (JSON-LD specific)
 */
const SKIP_PROPERTIES = [
    '@context'
];

/**
 * Check if a value is a simple object (reference-like, no nested structure)
 * Simple objects have only: id, type, _label, or equivalent
 */
function isSimpleObject(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return false;
    }

    const keys = Object.keys(value);
    // If it has many properties, it's probably a complex object
    if (keys.length > 5) {
        return false;
    }

    // Check if all keys are "simple" metadata keys
    const simpleKeys = new Set([
        'id', 'type', '_label', 'label', 'name',
        'classified_as', 'equivalent'  // These are usually just references
    ]);

    for (const key of keys) {
        if (!simpleKeys.has(key)) {
            return false;
        }
        // If the value of a key is complex (non-simple), then it's not a simple object
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

    // Arrays always need recursion
    if (Array.isArray(value)) {
        return true;
    }

    // Objects need recursion unless they're simple
    if (typeof value === 'object') {
        return !isSimpleObject(value);
    }

    // Primitives don't need recursion
    return false;
}

/**
 * Check if a value is a reference that should be fetched
 */
function shouldResolveReference(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return false;
    }

    // Has an ID but is missing substantial data
    const hasId = !!value.id;
    const hasLabel = !!value._label || !!value.label || !!value.name;
    const hasType = !!value.type;

    // If it has an ID but missing type or label, it's probably a reference
    // Or if it only has id, type, _label (simple object with ID)
    return hasId && isSimpleObject(value) && !hasLabel;
}

/**
 * Parse a single entity completely
 * Recursively parses ALL properties, not just predefined ones
 */
export async function parseEntity(entity, fetch, logMessages, options = {}) {
    const {
        resolveReferences = true,
        maxDepth = 3,
        currentDepth = 0,
        visited = new Set()
    } = options;

    // Handle primitive values
    if (entity === null || entity === undefined) {
        return { type: 'literal', value: entity };
    }

    if (SIMPLE_TYPES.includes(typeof entity)) {
        return { type: 'literal', value: entity };
    }

    // Handle arrays
    if (Array.isArray(entity)) {
        const items = await Promise.all(
            entity.map(item => parseEntity(item, fetch, logMessages, {
                resolveReferences,
                maxDepth,
                currentDepth,
                visited
            }))
        );
        return { type: 'array', items };
    }

    // Handle objects
    if (typeof entity !== 'object') {
        return { type: 'literal', value: entity };
    }

    // Get basic entity info
    const id = entity.id;
    const type = entity.type || 'Unknown';
    const label = getLabel(entity);

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
            logMessages.add(`Failed to resolve reference ${id}: ${error.message}`);
        }
    }

    // Check depth limit
    if (currentDepth >= maxDepth) {
        result._truncated = true;
        return result;
    }

    // Parse ALL properties (no whitelist!)
    for (const [key, value] of Object.entries(entity)) {
        if (SKIP_PROPERTIES.includes(key)) continue;

        if (value === null || value === undefined) {
            result.properties[key] = { type: 'null' };
            continue;
        }

        // Handle any nested entities based on TYPE, not property name
        if (needsRecursion(value)) {
            // Always increase depth for complex nested structures
            const nextDepth = currentDepth + 1;

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

    // Try to get Getty term for Type entities
    if (type === 'Type' && id && id.includes('vocab.getty.edu')) {
        const term = await getTerm(id, type, 'preferred', fetch, logMessages);
        if (term) {
            result.gettyTerm = term;
        }
    }

    return result;
}

/**
 * Format parsed entity as readable text
 */
export function formatParsedEntity(parsed, indent = 0) {
    const prefix = '  '.repeat(indent);

    if (!parsed) return `${prefix}[null]`;

    if (parsed.type === 'literal') {
        return `${prefix}${JSON.stringify(parsed.value)}`;
    }

    if (parsed.type === 'array') {
        if (parsed.items.length === 0) {
            return `${prefix}[]`;
        }
        let result = `${prefix}[\n`;
        for (const item of parsed.items) {
            result += formatParsedEntity(item, indent + 1) + '\n';
        }
        result += `${prefix}]`;
        return result;
    }

    if (parsed.type === 'null') {
        return `${prefix}null`;
    }

    if (parsed.type === 'entity') {
        let result = '';

        // Header
        if (parsed.id) {
            result += `${prefix}[${parsed.friendlyType || parsed.entityType}] ${parsed.label || '(unnamed)'}\n`;
            result += `${prefix}  ID: ${parsed.id}\n`;
        } else if (parsed.entityType) {
            result += `${prefix}[${parsed.friendlyType || parsed.entityType}] ${parsed.label || '(unnamed)'}\n`;
        }

        if (parsed.gettyTerm) {
            result += `${prefix}  Getty Term: ${parsed.gettyTerm}\n`;
        }

        if (parsed._truncated) {
            result += `${prefix}  [... truncated by depth limit]\n`;
        }

        // Properties - sorted for consistency
        const sortedKeys = Object.keys(parsed.properties || {}).sort();
        for (const key of sortedKeys) {
            const value = parsed.properties[key];
            result += `${prefix}  ${key}:\n`;
            result += formatParsedEntity(value, indent + 2) + '\n';
        }

        return result;
    }

    return `${prefix}${JSON.stringify(parsed)}`;
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
        nestedEntityCount: 0
    };

    for (const value of Object.values(parsed.properties || {})) {
        if (value.type === 'entity') {
            stats.nestedEntityCount++;
            if (value.id && value.id.startsWith('http')) {
                stats.hasReferences = true;
            }
        } else if (value.type === 'array') {
            for (const item of value.items || []) {
                if (item.type === 'entity') {
                    stats.nestedEntityCount++;
                    if (item.id && item.id.startsWith('http')) {
                        stats.hasReferences = true;
                    }
                }
            }
        }
    }

    return stats;
}
