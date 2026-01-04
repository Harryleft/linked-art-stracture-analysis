/**
 * Linked Art JSON-LD Structure Analyzer
 * Extracts and displays entity types, properties, and vocabulary references
 * Optimized for Linked Art v1.0 data model
 */

export class JsonLdAnalyzer {
    constructor() {
        // Linked Art and common vocabulary sources
        this.vocabularies = {
            'aat': 'Getty AAT (Art & Architecture Thesaurus)',
            'tgn': 'Getty TGN (Thesaurus of Geographic Names)',
            'ulan': 'Getty ULAN (Union List of Artist Names)',
            'wikidata': 'Wikidata',
            'viaf': 'VIAF (Virtual International Authority File)',
            'orcid': 'ORCID',
            'geonames': 'GeoNames',
            'lc': 'Library of Congress',
            'dnb': 'German National Library',
            'bnc': 'British National Bibliography',
            'isni': 'ISNI (International Standard Name Identifier)'
        };

        // Linked Art entity types
        this.entityTypes = {
            'HumanMadeObject': 'Human-Made Object (艺术品/文物)',
            'DigitalObject': 'Digital Object (数字对象)',
            'Person': 'Person (人物)',
            'Group': 'Group (团体/组织)',
            'Place': 'Place (地点)',
            'Actor': 'Actor (行动者)',
            'LinguisticObject': 'Linguistic Object (文本对象)',
            'VisualItem': 'Visual Item (视觉项目)',
            'InformationObject': 'Information Object (信息对象)',
            'Set': 'Set (集合)',
            'Collection': 'Collection (收藏)',
            'Activity': 'Activity (活动)',
            'Event': 'Event (事件)',
            'ConditionAssessment': 'Condition Assessment (状况评估)',
            'Identifier': 'Identifier (标识符)',
            'Name': 'Name (名称)',
            'Type': 'Type (类型)',
            'ProprietaryClass': 'Proprietary Class (专有类别)'
        };
    }

    /**
     * Analyze JSON-LD structure
     */
    analyze(data, url = '') {
        // Handle both direct data and wrapped responses
        const rootData = this.extractRootData(data);

        return {
            url,
            type: this.extractEntityType(rootData),
            label: this.extractLabel(rootData),
            id: this.extractId(rootData),
            properties: this.extractProperties(rootData),
            vocabularies: this.extractVocabularies(rootData),
            structure: this.buildStructureTree(rootData),
            context: this.extractContext(rootData)
        };
    }

    /**
     * Extract root data if wrapped
     */
    extractRootData(data) {
        // If data has @context at root, it's the root
        if (data && data['@context']) {
            return data;
        }
        return data;
    }

    /**
     * Extract entity type(s) with proper handling
     */
    extractEntityType(data) {
        const types = new Set();

        // Check @type (JSON-LD standard)
        if (data['@type']) {
            if (Array.isArray(data['@type'])) {
                data['@type'].forEach(t => types.add(t));
            } else {
                types.add(data['@type']);
            }
        }

        // Check type property (Linked Art)
        if (data.type) {
            if (Array.isArray(data.type)) {
                data.type.forEach(t => types.add(t));
            } else {
                types.add(data.type);
            }
        }

        // Check classified_as for type information
        if (data.classified_as) {
            this.extractTypesFromClassifiedAs(data.classified_as, types);
        }

        return Array.from(types);
    }

    /**
     * Recursively extract types from classified_as
     */
    extractTypesFromClassifiedAs(classifiedAs, typesSet) {
        const items = Array.isArray(classifiedAs) ? classifiedAs : [classifiedAs];

        items.forEach(item => {
            if (!item) return;

            // Check if this is a Type entity
            if (item.type === 'Type' || item._label) {
                const label = item._label || item.id;
                if (label && typeof label === 'string') {
                    typesSet.add(`Type: ${label}`);
                }
            }

            // Recurse into nested classified_as
            if (item.classified_as) {
                this.extractTypesFromClassifiedAs(item.classified_as, typesSet);
            }
        });
    }

    /**
     * Extract label/title
     */
    extractLabel(data) {
        // Check _label (Linked Art convention)
        if (data._label) return data._label;

        // Check label (JSON-LD)
        if (data.label) return data.label;

        // Try to get from identified_by Names
        if (data.identified_by && Array.isArray(data.identified_by)) {
            for (const id of data.identified_by) {
                if (id.type === 'Name' && id.content) {
                    return id.content;
                }
            }
        }

        return null;
    }

    /**
     * Extract primary ID
     */
    extractId(data) {
        if (data.id && typeof data.id === 'string') {
            return data.id;
        }
        return null;
    }

    /**
     * Extract @context
     */
    extractContext(data) {
        const context = data['@context'];
        if (!context) return null;

        if (typeof context === 'string') {
            return { type: 'external', url: context };
        }

        if (typeof context === 'object') {
            return {
                type: 'embedded',
                terms: Object.keys(context).slice(0, 15)
            };
        }

        return null;
    }

    /**
     * Extract all properties with better structure
     */
    extractProperties(data, depth = 0, maxDepth = 4) {
        if (depth > maxDepth || !data || typeof data !== 'object') {
            return [];
        }

        const properties = [];
        const processedKeys = new Set(['@context']);

        // Process properties in a logical order
        const priorityKeys = ['id', 'type', '@type', '_label', 'label', 'identified_by', 'classified_as'];
        const otherKeys = Object.keys(data).filter(k => !processedKeys.has(k));

        for (const key of [...priorityKeys, ...otherKeys].filter(k => data[k] !== undefined)) {
            if (processedKeys.has(key) && !priorityKeys.includes(key)) continue;
            processedKeys.add(key);

            const value = data[key];
            const propInfo = this.analyzeProperty(key, value, depth, maxDepth);
            if (propInfo) {
                properties.push(propInfo);
            }
        }

        return properties;
    }

    /**
     * Analyze a single property
     */
    analyzeProperty(key, value, depth, maxDepth) {
        const propInfo = {
            name: key,
            type: this.getValueType(value),
            hasArray: Array.isArray(value),
            depth: depth
        };

        // Special handling for known Linked Art properties
        propInfo.description = this.getPropertyDescription(key);

        // Extract ID if present
        if (value && typeof value === 'object' && value.id && typeof value.id === 'string') {
            propInfo.id = value.id;
            propInfo.idType = this.identifyVocabulary(value.id);
        }

        // Extract type for objects
        if (value && typeof value === 'object' && value.type) {
            propInfo.valueType = Array.isArray(value.type) ? value.type : [value.type];
        }

        // Extract label for objects
        if (value && typeof value === 'object' && value._label) {
            propInfo.label = value._label;
        }

        // Handle nested objects
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            const nested = this.extractProperties(value, depth + 1, maxDepth);
            propInfo.nested = nested; // Complete display - no limit
            propInfo.nestedCount = nested.length;
        }
        // Handle arrays
        else if (Array.isArray(value) && value.length > 0) {
            propInfo.arrayCount = value.length;

            // Show structure of first item if it's an object
            if (typeof value[0] === 'object' && value[0] !== null) {
                const nested = this.extractProperties(value[0], depth + 1, maxDepth);
                propInfo.nestedSample = nested; // Complete display - no limit
            }

            // Check if all items are same type
            if (value.length > 0 && value[0] && value[0].type) {
                propInfo.itemTypes = [...new Set(value.map(v => v?.type).filter(Boolean))];
            }
        }
        // Handle primitive values
        else if (value !== null && typeof value !== 'object') {
            propInfo.value = this.formatPrimitiveValue(value);
        }

        return propInfo;
    }

    /**
     * Get description for Linked Art properties
     */
    getPropertyDescription(key) {
        const descriptions = {
            'id': 'Unique identifier URI',
            'type': 'Entity type',
            '_label': 'Human-readable label',
            'identified_by': 'Identifiers and names for this entity',
            'classified_as': 'Classification terms from controlled vocabularies',
            'referred_to_by': 'Linguistic objects referring to this entity',
            'subject_of': 'Resources about this entity',
            'produced_by': 'Production event information',
            'carried_out_by': 'Who performed the action',
            'timespan': 'Time period information',
            'created_by': 'Creation event',
            'used_for': 'Purpose or use',
            'digitally_carried_by': 'Digital format carrier',
            'access_point': 'Access URL',
            'member_of': 'Collection or set membership',
            'represents': 'What this entity represents',
            'shows': 'Visual content shown',
            'about': 'Subject matter',
            'depicts': 'Visual depiction'
        };
        return descriptions[key];
    }

    /**
     * Get the type of a value
     */
    getValueType(value) {
        if (value === null) return 'null';
        if (Array.isArray(value)) return 'array';
        return typeof value;
    }

    /**
     * Format primitive value for display
     */
    formatPrimitiveValue(value) {
        if (typeof value === 'string') {
            if (value.length > 80) {
                return value.substring(0, 77) + '...';
            }
            return value;
        }
        return String(value);
    }

    /**
     * Extract all vocabulary references with better tracking
     */
    extractVocabularies(data, maxDepth = 5) {
        const vocabRefs = new Map();
        this.scanForVocabularies(data, vocabRefs, '', 0, maxDepth);

        return Array.from(vocabRefs.entries())
            .map(([source, refs]) => ({
                source,
                name: this.getVocabularyName(source),
                count: refs.length,
                examples: refs // Show all examples - no limit
            }))
            .filter(v => v.count > 0)
            .sort((a, b) => b.count - a.count);
    }

    /**
     * Recursively scan for vocabulary references
     */
    scanForVocabularies(obj, results, path = '', depth = 0, maxDepth = 5) {
        if (depth > maxDepth || !obj || typeof obj !== 'object') return;

        // Handle arrays
        if (Array.isArray(obj)) {
            obj.forEach((item, index) => {
                this.scanForVocabularies(item, results, `${path}[${index}]`, depth, maxDepth);
            });
            return;
        }

        // Handle objects
        for (const [key, value] of Object.entries(obj)) {
            const currentPath = path ? `${path}.${key}` : key;

            // No longer skip JSON-LD keywords - user requested complete display
            // Previously: if (key.startsWith('@') && key !== '@context') continue;

            // Check for vocabulary URLs in id fields
            if (key === 'id' && typeof value === 'string') {
                const vocab = this.identifyVocabulary(value);
                if (vocab) {
                    if (!results.has(vocab)) {
                        results.set(vocab, []);
                    }
                    results.get(vocab).push({
                        path: currentPath.replace('.id', ''),
                        uri: value,
                        context: this.getParentContext(path)
                    });
                }
            }

            // Check classified_as for vocabularies
            if (key === 'classified_as' && Array.isArray(value)) {
                value.forEach(item => {
                    if (item && item.id && typeof item.id === 'string') {
                        const vocab = this.identifyVocabulary(item.id);
                        if (vocab) {
                            if (!results.has(vocab)) {
                                results.set(vocab, []);
                            }
                            results.get(vocab).push({
                                path: currentPath,
                                uri: item.id,
                                label: item._label || item.type || '',
                                context: this.getParentContext(path)
                            });
                        }
                    }
                });
            }

            // Recurse into nested values
            if (value && typeof value === 'object') {
                this.scanForVocabularies(value, results, currentPath, depth + 1, maxDepth);
            }
        }
    }

    /**
     * Get parent context for a vocabulary reference
     */
    getParentContext(path) {
        // Simplify path to show where the vocab is used
        if (path.includes('classified_as')) return 'Classification';
        if (path.includes('identified_by')) return 'Identifier';
        if (path.includes('carried_out_by')) return 'Actor';
        if (path.includes('timespan')) return 'Timespan';
        if (path.includes('produced_by')) return 'Production';
        return 'Property';
    }

    /**
     * Identify vocabulary from URL
     */
    identifyVocabulary(url) {
        if (!url || typeof url !== 'string') return null;

        // Getty vocabularies
        if (url.includes('vocab.getty.edu')) {
            if (url.includes('/aat/')) return 'aat';
            if (url.includes('/tgn/')) return 'tgn';
            if (url.includes('/ulan/')) return 'ulan';
        }

        // Library of Congress
        if (url.includes('id.loc.gov')) return 'lc';

        // Wikidata
        if (url.includes('wikidata.org')) return 'wikidata';

        // VIAF
        if (url.includes('viaf.org')) return 'viaf';

        // ORCID
        if (url.includes('orcid.org')) return 'orcid';

        // GeoNames
        if (url.includes('geonames.org')) return 'geonames';

        // ISNI
        if (url.includes('isni.org')) return 'isni';

        // DNB (German National Library)
        if (url.includes('dnb.de')) return 'dnb';

        // BNC (British Library)
        if (url.includes('bnb.bl.uk')) return 'bnc';

        return null;
    }

    /**
     * Get vocabulary display name
     */
    getVocabularyName(key) {
        return this.vocabularies[key] || key.toUpperCase();
    }

    /**
     * Build a structure tree for visualization
     */
    buildStructureTree(data, maxDepth = Infinity) {
        return this.buildTreeNode(data, null, '', 0, maxDepth);
    }

    /**
     * Build a single tree node
     */
    buildTreeNode(obj, parentKey, path = '', depth = 0, maxDepth = Infinity) {
        if (depth > maxDepth || !obj || typeof obj !== 'object') {
            return null;
        }

        const node = {
            key: parentKey || 'root',
            path: path || 'root',
            depth: depth,
            children: []
        };

        // Add type info
        if (obj.type && !Array.isArray(obj.type)) {
            node.type = obj.type;
            node.nodeType = this.getEntityTypeLabel(obj.type);
        }

        // Add @type if different from type
        if (obj['@type'] && obj['@type'] !== obj.type) {
            node.jsonldType = obj['@type'];
        }

        // Add label
        if (obj._label) {
            node.label = obj._label;
        }

        // Add id if present
        if (obj.id && typeof obj.id === 'string') {
            node.id = obj.id;
            node.idType = this.identifyVocabulary(obj.id);
        }

        // Process children - no limit on number of children for complete display
        const childKeys = Object.keys(obj);

        for (const key of childKeys) {

            const value = obj[key];
            const childPath = path ? `${path}.${key}` : key;

            const child = {
                key: key,
                path: childPath
            };

            // Skip @context for cleaner display
            if (key === '@context') {
                child.value = '[JSON-LD Context]';
                child.isContext = true;
                node.children.push(child);
                continue;
            }

            const valueType = this.getValueType(value);
            child.type = valueType;

            // Add value for primitives
            if (value !== null && typeof value !== 'object') {
                child.value = this.formatPrimitiveValue(value);
            }
            // Add label for objects
            else if (value && typeof value === 'object' && value._label) {
                child.label = value._label;
            }

            // Add id for objects with id
            if (value && typeof value === 'object' && value.id && typeof value.id === 'string') {
                child.id = value.id;
                child.idType = this.identifyVocabulary(value.id);
            }

            // Add type info for typed objects
            if (value && typeof value === 'object' && value.type) {
                child.objectType = Array.isArray(value.type) ? value.type[0] : value.type;
            }

            // Handle arrays
            if (Array.isArray(value)) {
                child.isArray = true;
                child.length = value.length;

                // Show first item if it's an object
                if (value.length > 0 && typeof value[0] === 'object' && value[0] !== null) {
                    const nestedNode = this.buildTreeNode(value[0], `${key}[0]`, childPath + '[0]', depth + 1, maxDepth);
                    if (nestedNode && nestedNode.children) {
                        child.children = nestedNode.children; // Complete display - no limit
                    }
                }
            }
            // Recurse for objects
            else if (value && typeof value === 'object' && value !== null && !Array.isArray(value)) {
                const nestedNode = this.buildTreeNode(value, key, childPath, depth + 1, maxDepth);
                if (nestedNode && nestedNode.children) {
                    child.children = nestedNode.children; // Complete display - no limit
                }
            }

            node.children.push(child);
        }

        return node;
    }

    /**
     * Get human-readable label for entity type
     */
    getEntityTypeLabel(type) {
        return this.entityTypes[type] || type;
    }

    /**
     * Generate a summary of the JSON-LD structure
     */
    generateSummary(data) {
        const analysis = this.analyze(data);

        return {
            entityType: analysis.type.join(', ') || 'Unknown',
            label: analysis.label || 'No label',
            propertyCount: analysis.properties.length,
            vocabularySources: analysis.vocabularies.map(v => v.name).join(', ') || 'None',
            hasContext: !!data['@context'],
            hasId: !!data.id
        };
    }
}
