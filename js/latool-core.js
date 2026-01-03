/**
 * Linked Art Analysis Tool - Core Processing Logic
 * Browser-compatible ESM module converted from latool.js
 */

export class LinkedArtAnalyzer {
    constructor() {
        this.logMessages = new Set();
        this.results = {};
        this.abortController = null;
    }

    /**
     * Cancel ongoing request
     */
    cancel() {
        if (this.abortController) {
            this.abortController.abort();
            this.abortController = null;
        }
    }

    /**
     * Fetch JSON data from URL with abort support
     */
    async fetchJson(url) {
        this.abortController = new AbortController();
        const signal = this.abortController.signal;

        try {
            const response = await fetch(url, { signal });

            if (!response.ok) {
                throw new Error(`Failed to fetch data from ${url}. Status: ${response.status}`);
            }

            try {
                return await response.json();
            } catch (jsonError) {
                throw new Error(`Failed to parse JSON from ${url}.`);
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('Request cancelled');
            }
            throw new Error(`Error fetching data from ${url}: ${error.message}`);
        }
    }

    /**
     * Convert numeric IDs to full URIs
     */
    convertToFullUri(id) {
        const patterns = [
            { prefix: 'aat:', baseUri: 'http://vocab.getty.edu/aat/' },
            { prefix: 'tgn:', baseUri: 'http://vocab.getty.edu/tgn/' },
            { prefix: 'ulan:', baseUri: 'http://vocab.getty.edu/ulan/' }
        ];
        for (const pattern of patterns) {
            if (id.startsWith(pattern.prefix)) {
                this.logMessages.add("Numeric IDs used instead of full URIs.");
                return id.replace(pattern.prefix, pattern.baseUri);
            }
        }
        return id;
    }

    /**
     * Expand all numeric IDs recursively
     */
    expandNumericIds(data) {
        function recursiveExpand(obj) {
            if (Array.isArray(obj)) {
                return obj.map(item => recursiveExpand(item));
            } else if (obj && typeof obj === 'object') {
                for (const key in obj) {
                    if (key === 'id' && typeof obj[key] === 'string') {
                        obj[key] = this.convertToFullUri(obj[key]);
                    } else {
                        obj[key] = recursiveExpand.call(this, obj[key]);
                    }
                }
            }
            return obj;
        }

        const expandedData = recursiveExpand.call(this, data);
        return { expandedData };
    }

    /**
     * Get content or value from item
     */
    getContentOrValue(item, dataField) {
        if (item.content) {
            return item.content;
        } else if (item.value) {
            this.logMessages.add(`${dataField} could not be retrieved using the "content" attribute. "value" attribute retrieved instead.`);
            return item.value;
        }
        return null;
    }

    /**
     * Iterative search through object
     */
    async iterativeSearch(obj, callback) {
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
     * Find classified as object
     */
    findClassifiedAs(obj, targetUris) {
        if (obj && typeof obj === 'object') {
            if (Array.isArray(obj)) {
                for (const item of obj) {
                    const result = this.findClassifiedAs(item, targetUris);
                    if (result) return result;
                }
            } else {
                for (const [key, value] of Object.entries(obj)) {
                    if (typeof value === 'string' && targetUris.includes(value)) return obj;
                    if (key === 'classified_as' || key === 'equivalent') {
                        const result = this.findClassifiedAs(value, targetUris);
                        if (result) return result;
                    }
                }
            }
        }
        return null;
    }

    /**
     * Find Getty vocabulary URI
     */
    findGettyUri(obj) {
        if (obj && typeof obj === 'object') {
            if (Array.isArray(obj)) {
                for (const item of obj) {
                    const foundUri = this.findGettyUri(item);
                    if (foundUri) return foundUri;
                }
            } else {
                for (const value of Object.values(obj)) {
                    if (typeof value === 'string' && value.includes('vocab.getty.edu')) return value;
                    const foundUri = this.findGettyUri(value);
                    if (foundUri) return foundUri;
                }
            }
        }
        return null;
    }

    /**
     * Get term from URI
     */
    async getTerm(uri, dataField, termType = 'preferred') {
        try {
            const response = await fetch(uri, {
                headers: {
                    'Accept': 'application/ld+json'
                }
            });
            if (!response.ok) throw new Error(`Invalid URL: ${uri}`);
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
            if (termType === 'preferred') {
                const label = data?.label || data?._label;
                if (label) {
                    this.logMessages.add(`No preferred term found for ${uri}. "${label === data?.label ? 'label' : '_label'}" retrieved instead.`);
                    return label;
                }
            }
            throw new Error(`No ${termType} term found for ${uri}`);
        } catch (error) {
            this.logMessages.add(`Error retrieving ${dataField} data: ${error.message}`);
            return null;
        }
    }

    /**
     * Creator pattern
     */
    async creatorPattern(data) {
        async function findCarriedOutBy(obj, analyzer) {
            const creatorIds = [];
            await analyzer.iterativeSearch(obj, item => {
                if (item.carried_out_by) creatorIds.push(item.carried_out_by[0].id);
            });
            return creatorIds;
        }

        if (data?.produced_by) {
            const creatorIds = await findCarriedOutBy(data.produced_by, this);
            const creators = await Promise.all(creatorIds.map(id => this.getTerm(id, "Creator")));
            this.results.Creators = creators.filter(Boolean).length > 0 ? creators.filter(Boolean) : ['Not found'];

            if (this.results.Creators.length > 1) {
                this.results.CreatorsMessage = 'Multiple creators found. Please verify.';
            }
        } else {
            this.results.Creators = ['Not found'];
        }
    }

    /**
     * Digital object pattern
     */
    async digitalObjPattern(data, contentTypes) {
        const contentResults = {};
        const seenIds = new Set();

        contentTypes.forEach(type => {
            contentResults[type.name] = [];
        });

        const checkConformsTo = (conformsToArray, target) => {
            if (!Array.isArray(conformsToArray)) {
                this.logMessages.add(`conforms_to is not an array: ${JSON.stringify(conformsToArray)}`);
                return false;
            }
            return conformsToArray.some(conform => conform.id.startsWith(target));
        };

        const extractContent = (digitalObject) => {
            if (digitalObject.access_point && digitalObject.access_point.length > 0) {
                return digitalObject.access_point[0].id;
            }
            return digitalObject.id;
        };

        const collectDigitalObjects = async (obj, target, typeCheck) => {
            const collected = [];
            await this.iterativeSearch(obj, async objItem => {
                if (objItem.digitally_carried_by) {
                    for (const digitalObject of objItem.digitally_carried_by) {
                        if (typeCheck(digitalObject, target) && !seenIds.has(extractContent(digitalObject))) {
                            collected.push(digitalObject);
                            seenIds.add(extractContent(digitalObject));
                        }
                    }
                } else if (typeCheck(objItem, target) && !seenIds.has(extractContent(objItem))) {
                    collected.push(objItem);
                    seenIds.add(extractContent(objItem));
                    this.logMessages.add(`Digital object ${objItem.id} was not embedded in a digitally_carried_by property as expected.`);
                }
            });
            return collected;
        };

        const webPages = await collectDigitalObjects(data, 'http://vocab.getty.edu/aat/300264578', (obj, target) => {
            return obj.classified_as && this.findClassifiedAs(obj.classified_as, [target]);
        });
        contentResults['Web Pages'] = webPages.map(extractContent);

        let iiifManifests = await collectDigitalObjects(data, 'http://iiif.io/api/presentation/3/context.json', (obj, target) => {
            return obj.conforms_to && checkConformsTo(obj.conforms_to, target);
        });

        if (iiifManifests.length === 0) {
            iiifManifests = await collectDigitalObjects(data, 'http://iiif.io/api/presentation', (obj, target) => {
                return obj.conforms_to && checkConformsTo(obj.conforms_to, target);
            });
        }

        contentResults['IIIF Manifest'] = iiifManifests.map(extractContent);

        for (const type of contentTypes) {
            this.results[type.name] = contentResults[type.name].length > 0 ? contentResults[type.name] : ['Not found'];
        }

        return contentResults;
    }

    /**
     * Type pattern
     */
    async typePattern(data) {
        const typeUris = { 'Work Type (Classification)': 'http://vocab.getty.edu/aat/300435443' };
        for (const [key, uri] of Object.entries(typeUris)) {
            const preferredTerms = await Promise.all(
                (data.classified_as || []).map(async item => {
                    if (this.findClassifiedAs(item, [uri])) {
                        const gettyUri = this.findGettyUri(item);
                        if (gettyUri) return await this.getTerm(gettyUri, key);
                    }
                    return null;
                })
            );
            const validTerms = preferredTerms.filter(Boolean);
            this.results[key] = validTerms.length > 0 ? validTerms : ['Not found'];
        }
    }

    /**
     * Statement pattern
     */
    async statementPattern(data) {
        const findStatements = (dataField, targetUri) => {
            return (data.referred_to_by || [])
                .filter(item => item.type === 'LinguisticObject' && this.findClassifiedAs(item.classified_as, [targetUri]))
                .map(item => this.getContentOrValue(item, dataField))
                .filter(Boolean);
        };

        const statementUris = {
            'Credit Line': { primary: 'http://vocab.getty.edu/aat/300435418', secondary: ['http://vocab.getty.edu/aat/300026687'] },
            'Dimensions Statement': { primary: 'http://vocab.getty.edu/aat/300435430', secondary: ['http://vocab.getty.edu/aat/300266036'] },
            'Materials Statement': { primary: 'http://vocab.getty.edu/aat/300435429', secondary: ['http://vocab.getty.edu/aat/300010358'] },
            'Citations': { primary: 'http://vocab.getty.edu/aat/300311705', secondary: [] },
            'Access Statement': { primary: 'http://vocab.getty.edu/aat/300133046', secondary: [] },
            'Description': { primary: 'http://vocab.getty.edu/aat/300435416', secondary: ['http://vocab.getty.edu/aat/300080091'] },
            'Provenance Description': { primary: 'http://vocab.getty.edu/aat/300435438', secondary: ['http://vocab.getty.edu/aat/300055863', 'http://vocab.getty.edu/aat/300444174'] },
            'Work Type (Statement)': { primary: 'http://vocab.getty.edu/aat/300435443', secondary: [] },
            'Social Media': { primary: 'http://vocab.getty.edu/aat/300312269', secondary: [] }
        };

        for (const [key, uris] of Object.entries(statementUris)) {
            let statements = findStatements(key, uris.primary);
            if (statements.length === 0 && uris.secondary && uris.secondary.length > 0) {
                for (const secondaryUri of uris.secondary) {
                    statements = findStatements(key, secondaryUri);
                    if (statements.length > 0) {
                        const primaryAltTerm = await this.getTerm(uris.primary, key, 'alternative') || 'Primary Term';
                        const secondaryAltTerm = await this.getTerm(secondaryUri, key, 'alternative') || 'Secondary Term';
                        this.logMessages.add(`${key} not found using ${uris.primary} ("${primaryAltTerm}"). ${secondaryUri} ("${secondaryAltTerm}") used instead.`);
                        break;
                    }
                }
            }
            this.results[key] = statements.length > 0 ? statements : ['Not found'];
        }
    }

    /**
     * Helper to find materials
     */
    async findMaterials(data) {
        const materials = await Promise.all(
            (data.made_of || []).map(async material => {
                const materialUri = this.findGettyUri(material);
                if (materialUri) {
                    return await this.getTerm(materialUri, 'Materials');
                }
                return null;
            })
        );
        return materials.filter(Boolean).join(', ') || null;
    }

    /**
     * Dimensions pattern
     */
    async dimensionsPattern(data) {
        const excludeEntry = (entry) => {
            return entry.classified_as?.some(classification => this.findGettyUri(classification) === "http://vocab.getty.edu/aat/300010269");
        };

        const getDimensionAndUnitLabels = async (dimension) => {
            const dimensionUri = this.findGettyUri(dimension.classified_as);
            const unitUri = dimension.unit ? this.findGettyUri(dimension.unit) : null;

            const [dimensionLabel, unitLabel] = await Promise.all([
                dimensionUri ? this.getTerm(dimensionUri, "Dimension") : null,
                unitUri ? this.getTerm(unitUri, "Unit") : null
            ]);

            if (!dimensionLabel) {
                this.logMessages.add(`Unable to retrieve dimension type from ${dimensionUri || dimension.classified_as.map(item => item.id).join(', ')}`);
            }

            if (!unitLabel) {
                this.logMessages.add(`Unable to retrieve dimension unit from ${unitUri || (dimension.unit ? dimension.unit.id : 'unknown unit')}`);
            }

            return { dimensionLabel, unitLabel };
        };

        const processPatternOne = async (dimension) => {
            const { dimensionLabel, unitLabel } = await getDimensionAndUnitLabels(dimension);
            return dimension.value && dimensionLabel && unitLabel ? `${dimensionLabel}: ${dimension.value} ${unitLabel}` : null;
        };

        const processPatternTwo = async (dimension) => {
            const { dimensionLabel, unitLabel } = await getDimensionAndUnitLabels(dimension);
            let additionalClassLabel = null;

            if (dimension.assigned_by && Array.isArray(dimension.assigned_by)) {
                for (const assignment of dimension.assigned_by) {
                    if (assignment.classified_as && assignment.classified_as.length > 0) {
                        const additionalUri = assignment.classified_as[0]?.id;
                        additionalClassLabel = additionalUri ? await this.getTerm(additionalUri, "Additional Classification") : null;

                        if (!additionalClassLabel) {
                            this.logMessages.add(`Unable to retrieve additional classification label from ${additionalUri}`);
                        }
                        break;
                    }
                }
            } else if (dimension.classified_as && dimension.classified_as.length > 1) {
                const additionalUri = dimension.classified_as[1]?.id;
                additionalClassLabel = additionalUri ? await this.getTerm(additionalUri, "Additional Classification") : null;

                if (!additionalClassLabel) {
                    this.logMessages.add(`Unable to retrieve additional classification label from ${additionalUri}`);
                }
            }

            return dimension.value && dimensionLabel && unitLabel ? { statement: `${dimensionLabel}: ${dimension.value} ${unitLabel}`, additionalClassLabel: additionalClassLabel || '' } : null;
        };

        const processDimension = async (dimension) => {
            if (excludeEntry(dimension)) return null;

            if (dimension.member_of && Array.isArray(dimension.member_of)) {
                return await processPatternOne(dimension);
            } else {
                return await processPatternTwo(dimension);
            }
        };

        const findDimensions = async (data) => {
            const dimensionsBySet = {};

            if (data.dimension && Array.isArray(data.dimension)) {
                for (const dim of data.dimension) {
                    const dimensionsData = await processDimension(dim);

                    if (dimensionsData) {
                        let setLabel = '';

                        if (typeof dimensionsData === 'string') {
                            for (const member of dim.member_of) {
                                const label = await this.getTerm(member.id, "Set Label");
                                if (label) {
                                    setLabel = label;
                                    break;
                                }
                            }
                            if (!dimensionsBySet[setLabel]) dimensionsBySet[setLabel] = [];
                            dimensionsBySet[setLabel].push(dimensionsData);
                        } else {
                            const { statement, additionalClassLabel } = dimensionsData;
                            if (!dimensionsBySet[additionalClassLabel]) dimensionsBySet[additionalClassLabel] = [];
                            dimensionsBySet[additionalClassLabel].push(statement);
                        }
                    }
                }
            }

            return Object.entries(dimensionsBySet)
                .map(([set, dims]) => `${set ? `${set}: ` : ''}${dims.join('; ')}`)
                .join('\n') || null;
        };

        const dimensions = await findDimensions(data);
        this.results['Dimensions (Structured)'] = dimensions ? dimensions.split('\n') : ['Not found'];
    }

    /**
     * Materials pattern
     */
    async materialsPattern(data) {
        const materials = await this.findMaterials(data);
        this.results['Materials (Structured)'] = materials ? [materials] : ['Not found'];
    }

    /**
     * Identifier pattern
     */
    async identifierPattern(data) {
        const findItemsByType = (targetUri, type) => {
            return (data.identified_by || [])
                .filter(item => item.type === type && this.findClassifiedAs(item.classified_as, [targetUri]))
                .map(item => this.getContentOrValue(item, type))
                .filter(Boolean);
        };

        const identifierUris = { 'Accession Number': 'http://vocab.getty.edu/aat/300312355' };
        for (const [key, uri] of Object.entries(identifierUris)) {
            const identifiers = findItemsByType(uri, 'Identifier');
            this.results[key] = identifiers.length > 0 ? identifiers : ['Not found'];
        }
    }

    /**
     * Name pattern
     */
    async namePattern(data) {
        const findItemsByType = (targetUri, type) => {
            return (data.identified_by || [])
                .filter(item => item.type === type && this.findClassifiedAs(item.classified_as, [targetUri]))
                .map(item => this.getContentOrValue(item, type))
                .filter(Boolean);
        };

        const nameUris = {
            'Title': 'http://vocab.getty.edu/aat/300404670',
            'Exhibited Title': 'http://vocab.getty.edu/aat/300417207',
            'Former Title': 'http://vocab.getty.edu/aat/300417203'
        };
        for (const [key, uri] of Object.entries(nameUris)) {
            const names = findItemsByType(uri, 'Name');
            this.results[key] = names.length > 0 ? names : ['Not found'];
        }
    }

    /**
     * Parse date string
     */
    parseDateString(dateString) {
        const regex = /^(-?\d+)-(\d{2})-(\d{2})T/;
        const match = dateString.match(regex);
        if (match) {
            const [, year, month, day] = match;
            return { year: parseInt(year, 10), month: parseInt(month, 10), day: parseInt(day, 10) };
        }
        return null;
    }

    /**
     * Format timespan
     */
    formatTimespan(beginDate, endDate) {
        const begin = this.parseDateString(beginDate);
        const end = this.parseDateString(endDate);

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
     * Timespan pattern
     */
    async timespanPattern(data) {
        if (data && data.produced_by && data.produced_by.timespan && data.produced_by.timespan.identified_by) {
            const timespanNames = [];
            for (const item of data.produced_by.timespan.identified_by) {
                if (item.type === 'Name') {
                    timespanNames.push(this.getContentOrValue(item, 'Timespan Display'));
                }
            }
            this.results['Timespan (Name)'] = timespanNames.length > 0 ? timespanNames : ['Not found'];
        } else {
            this.results['Timespan (Name)'] = ['Not found'];
        }

        if (data && data.produced_by && data.produced_by.timespan) {
            const timespan = data.produced_by.timespan;
            if (timespan.begin_of_the_begin || timespan.end_of_the_end) {
                const timespanStatement = this.formatTimespan(timespan.begin_of_the_begin, timespan.end_of_the_end);
                this.results['Timespan (Structured)'] = timespanStatement ? [timespanStatement] : ['Not found'];
            } else {
                this.results['Timespan (Structured)'] = ['Not found'];
            }
        } else {
            this.results['Timespan (Structured)'] = ['Not found'];
        }
    }

    /**
     * Reference pattern
     */
    async referencePattern(data) {
        const referenceProperties = {
            "current_location": "Location",
            "current_owner": "Owner",
            "member_of": "Set"
        };

        for (const [property, label] of Object.entries(referenceProperties)) {
            if (data[property]) {
                if (Array.isArray(data[property])) {
                    const terms = await Promise.all(data[property].map(async item => {
                        if (item.id) {
                            return await this.getTerm(item.id, label);
                        }
                        return null;
                    }));

                    const validTerms = terms.filter(term => term);
                    this.results[label] = validTerms.length > 0 ? validTerms : ['Not found'];
                } else if (data[property].id) {
                    const preferredTerm = await this.getTerm(data[property].id, label);
                    this.results[label] = preferredTerm ? [preferredTerm] : ['Not found'];
                }
            } else {
                this.results[label] = ['Not found'];
            }
        }
    }

    /**
     * Find images and thumbnails from IIIF manifest
     */
    async findImagesAndThumbnails(iiifManifestData) {
        if (!iiifManifestData) {
            this.results['Primary Image'] = ['Not found'];
            this.results['Primary Thumbnail'] = ['Not found'];
            this.results['All Images'] = ['Not found'];
            this.results['All Thumbnails'] = ['Not found'];
            return { primaryImage: undefined, primaryThumbnail: undefined, images: [], thumbnails: [] };
        }

        const context = iiifManifestData['@context'];
        let imagesSet = new Set();
        let thumbnailsSet = new Set();

        if (context === 'http://iiif.io/api/presentation/2/context.json') {
            const manifestThumbnailUri = iiifManifestData.thumbnail?.['@id'];
            if (manifestThumbnailUri) thumbnailsSet.add(manifestThumbnailUri);

            const canvases = iiifManifestData.sequences?.[0]?.canvases || [];
            for (const canvas of canvases) {
                const imageUris = canvas.images?.map(image => image.resource['@id']).filter(Boolean);
                const thumbnailUri = canvas.thumbnail?.['@id'];
                if (imageUris) imageUris.forEach(uri => imagesSet.add(uri));
                if (thumbnailUri) thumbnailsSet.add(thumbnailUri);
            }
        } else if (context === 'http://iiif.io/api/presentation/3/context.json') {
            const manifestThumbnailUris = iiifManifestData.thumbnail?.map(thumbnail => thumbnail.id).filter(Boolean) || [];
            manifestThumbnailUris.forEach(uri => thumbnailsSet.add(uri));

            const items = iiifManifestData.items || [];
            for (const item of items) {
                const imageUris = item.items?.flatMap(subItem => subItem.items?.map(subSubItem => subSubItem.body?.id).filter(Boolean)) || [];
                const thumbnailUris = item.thumbnail?.map(thumbnail => thumbnail.id).filter(Boolean) || [];
                imageUris.forEach(uri => imagesSet.add(uri));
                thumbnailUris.forEach(uri => thumbnailsSet.add(uri));
            }
        }

        const images = Array.from(imagesSet);
        const thumbnails = Array.from(thumbnailsSet);

        this.results['Primary Image'] = images.length > 0 ? [images[0]] : ['Not found'];
        this.results['Primary Thumbnail'] = thumbnails.length > 0 ? [thumbnails[0]] : ['Not found'];
        this.results['All Images'] = images.length > 0 ? images : ['Not found'];
        this.results['All Thumbnails'] = thumbnails.length > 0 ? thumbnails : ['Not found'];

        return {
            primaryImage: images[0],
            primaryThumbnail: thumbnails[0],
            images,
            thumbnails
        };
    }

    /**
     * IIIF pattern
     */
    async iiifPattern() {
        const iiifManifests = this.results['IIIF Manifest'];
        if (iiifManifests.length === 0 || iiifManifests[0] === 'Not found') {
            this.results['Primary Image'] = ['Not found'];
            this.results['Primary Thumbnail'] = ['Not found'];
            this.results['All Images'] = ['Not found'];
            this.results['All Thumbnails'] = ['Not found'];
            return;
        }

        const manifestUrl = iiifManifests[0];
        const iiifData = await this.fetchJson(manifestUrl);
        if (!iiifData) {
            this.logMessages.add(`Failed to fetch IIIF Manifest data from ${manifestUrl}`);
            this.results['Primary Image'] = ['Not found'];
            this.results['Primary Thumbnail'] = ['Not found'];
            this.results['All Images'] = ['Not found'];
            this.results['All Thumbnails'] = ['Not found'];
            return;
        }
        await this.findImagesAndThumbnails(iiifData);
    }

    /**
     * Main analysis function
     */
    async analyze(url, options = {}) {
        this.logMessages = new Set();
        this.results = {};

        const { logMode = 'errors', conciseMode = false, foundOnly = false } = options;

        try {
            const data = await this.fetchJson(url);
            if (!data) {
                throw new Error('Failed to fetch data');
            }

            const { expandedData } = this.expandNumericIds(data);

            const contentTypes = [
                { name: 'Web Pages', classified_as: 'http://vocab.getty.edu/aat/300264578' },
                {
                    name: 'IIIF Manifest',
                    conforms_to: { primary: 'http://iiif.io/api/presentation/3/context.json', secondary: 'http://iiif.io/api/presentation' }
                }
            ];

            await this.namePattern(expandedData);
            await this.identifierPattern(expandedData);
            await this.typePattern(expandedData);
            await this.creatorPattern(expandedData);
            await this.timespanPattern(expandedData);
            await this.dimensionsPattern(expandedData);
            await this.materialsPattern(expandedData);
            await this.referencePattern(expandedData);
            await this.statementPattern(expandedData);
            const digitalObjResults = await this.digitalObjPattern(expandedData, contentTypes);
            await this.iiifPattern();

            return {
                success: true,
                results: this.results,
                logMessages: Array.from(this.logMessages),
                logMode,
                conciseMode,
                foundOnly
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Format results for display
     */
    formatResults(analysisResult) {
        const { results, logMessages, logMode, conciseMode, foundOnly } = analysisResult;

        const outputOrder = [
            'Title',
            'Exhibited Title',
            'Former Title',
            'Accession Number',
            'Creators',
            { primary: 'Work Type (Classification)', secondary: 'Work Type (Statement)' },
            { primary: 'Timespan (Name)', secondary: 'Timespan (Structured)' },
            { primary: 'Dimensions Statement', secondary: 'Dimensions (Structured)' },
            { primary: 'Materials Statement', secondary: 'Materials (Structured)' },
            'Location',
            'Owner',
            'Set',
            'Social Media',
            'Credit Line',
            'Citations',
            'Access Statement',
            'Description',
            'Provenance Description',
            'Web Pages',
            'IIIF Manifest',
            'Primary Image',
            'Primary Thumbnail',
            'All Images',
            'All Thumbnails'
        ];

        const formatted = [];

        outputOrder.forEach(entry => {
            if (typeof entry === 'string') {
                if (foundOnly && results[entry]?.[0] === 'Not found') return;
                if (results[entry]) {
                    formatted.push({
                        label: entry,
                        values: results[entry]
                    });
                }
            } else {
                const { primary, secondary } = entry;
                if (conciseMode) {
                    const conciseLabel = primary.split(' (')[0];
                    if (results[primary] && results[primary][0] !== 'Not found') {
                        if (foundOnly && results[primary][0] === 'Not found') return;
                        formatted.push({
                            label: conciseLabel,
                            values: results[primary]
                        });
                    } else if (results[secondary]) {
                        if (foundOnly && results[secondary][0] === 'Not found') return;
                        formatted.push({
                            label: conciseLabel,
                            values: results[secondary]
                        });
                    }
                } else {
                    if (results[primary]) {
                        if (foundOnly && results[primary][0] === 'Not found') return;
                        formatted.push({
                            label: primary,
                            values: results[primary]
                        });
                    }
                    if (results[secondary]) {
                        if (foundOnly && results[secondary][0] === 'Not found') return;
                        formatted.push({
                            label: secondary,
                            values: results[secondary]
                        });
                    }
                }
            }
        });

        if (logMode === 'all' && logMessages.length > 0) {
            formatted.push({
                label: 'Log Messages',
                values: logMessages
            });
        }

        return formatted;
    }
}
