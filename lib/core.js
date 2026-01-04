/**
 * Linked Art Analyzer - Core analysis engine
 */

import { expandNumericIds, detectEntityType } from './utils.js';
import * as patterns from './extractors/patterns.js';

export class LinkedArtAnalyzer {
    constructor(fetch) {
        this.fetch = fetch;
        this.logMessages = new Set();
        this.results = {};
    }

    /**
     * Fetch JSON from URL
     */
    async fetchJson(url) {
        try {
            const response = await this.fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('Request cancelled');
            }
            throw new Error(`Error fetching data from ${url}: ${error.message}`);
        }
    }

    /**
     * Main analysis function
     */
    async analyze(url) {
        this.logMessages = new Set();
        this.results = {};

        try {
            const data = await this.fetchJson(url);
            if (!data) {
                throw new Error('Failed to fetch data');
            }

            const expandedData = expandNumericIds(data, this.logMessages);

            // Detect and store entity type
            const entityInfo = detectEntityType(expandedData);
            this.results['Entity Type'] = [entityInfo.friendlyName];
            this.results['Entity ID'] = [expandedData.id || url];

            const entityType = expandedData?.type;

            // Generic patterns that apply to all entity types
            await this._extractGenericData(expandedData);

            // Type-specific patterns
            switch (entityType) {
                case 'HumanMadeObject':
                    await this._extractHumanMadeObjectData(expandedData);
                    break;
                case 'DigitalObject':
                    await this._extractDigitalObjectData(expandedData);
                    break;
                case 'Person':
                    await this._extractPersonData(expandedData);
                    break;
                case 'Group':
                    await this._extractGroupData(expandedData);
                    break;
                case 'Place':
                    await this._extractPlaceData(expandedData);
                    break;
                case 'Activity':
                case 'Event':
                    await this._extractActivityData(expandedData);
                    break;
            }

            return {
                success: true,
                results: this.results,
                logMessages: Array.from(this.logMessages),
                entityType: entityInfo.friendlyName
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Extract data common to all entity types
     */
    async _extractGenericData(data) {
        const names = await patterns.extractNames(data, this.fetch, this.logMessages);
        Object.assign(this.results, names);

        const identifiers = await patterns.extractIdentifiers(data, this.fetch, this.logMessages);
        Object.assign(this.results, identifiers);

        const workType = await patterns.extractWorkType(data, this.fetch, this.logMessages);
        Object.assign(this.results, workType);

        const statements = await patterns.extractStatements(data, this.fetch, this.logMessages);
        Object.assign(this.results, statements);

        const references = await patterns.extractReferences(data, this.fetch, this.logMessages);
        Object.assign(this.results, references);
    }

    /**
     * Extract HumanMadeObject-specific data
     */
    async _extractHumanMadeObjectData(data) {
        const creators = await patterns.extractCreators(data, this.fetch, this.logMessages);
        Object.assign(this.results, creators);

        const timespan = await patterns.extractTimespan(data, this.fetch, this.logMessages);
        Object.assign(this.results, timespan);

        const dimensions = await patterns.extractDimensions(data, this.fetch, this.logMessages);
        Object.assign(this.results, dimensions);

        const materials = await patterns.extractMaterials(data, this.fetch, this.logMessages);
        Object.assign(this.results, materials);

        // Digital objects (IIIF, web pages)
        const digitalObjects = await patterns.extractDigitalObjects(data, this.fetch, this.logMessages);
        Object.assign(this.results, digitalObjects);

        // If IIIF manifest found, extract images
        if (digitalObjects['IIIF Manifest'] && digitalObjects['IIIF Manifest'][0] !== 'Not found') {
            const images = await patterns.extractImagesFromIIIF(digitalObjects['IIIF Manifest'][0], this.fetch, this.logMessages);
            Object.assign(this.results, images);
        } else {
            this.results['Primary Image'] = ['Not found'];
            this.results['Primary Thumbnail'] = ['Not found'];
            this.results['All Images'] = ['Not found'];
            this.results['All Thumbnails'] = ['Not found'];
        }
    }

    /**
     * Extract DigitalObject-specific data
     */
    async _extractDigitalObjectData(data) {
        const digitalObjects = await patterns.extractDigitalObjects(data, this.fetch, this.logMessages);
        Object.assign(this.results, digitalObjects);

        // If IIIF manifest found, extract images
        if (digitalObjects['IIIF Manifest'] && digitalObjects['IIIF Manifest'][0] !== 'Not found') {
            const images = await patterns.extractImagesFromIIIF(digitalObjects['IIIF Manifest'][0], this.fetch, this.logMessages);
            Object.assign(this.results, images);
        } else {
            this.results['Primary Image'] = ['Not found'];
            this.results['Primary Thumbnail'] = ['Not found'];
            this.results['All Images'] = ['Not found'];
            this.results['All Thumbnails'] = ['Not found'];
        }

        // DigitalObjects might have created_by instead of produced_by
        if (data.created_by) {
            const creators = await patterns.extractCreators(data, this.fetch, this.logMessages);
            Object.assign(this.results, creators);
        }
    }

    /**
     * Extract Person-specific data
     */
    async _extractPersonData(data) {
        const { getTerm } = await import('./vocab.js');

        if (data.born_at) {
            const birthPlaces = await Promise.all(
                (Array.isArray(data.born_at) ? data.born_at : [data.born_at])
                    .map(p => p.id ? getTerm(p.id, 'Birth Place', 'preferred', this.fetch, this.logMessages) : null)
            );
            const validPlaces = birthPlaces.filter(Boolean);
            if (validPlaces.length > 0) this.results['Birth Place'] = validPlaces;
        }

        if (data.died_at) {
            const deathPlaces = await Promise.all(
                (Array.isArray(data.died_at) ? data.died_at : [data.died_at])
                    .map(p => p.id ? getTerm(p.id, 'Death Place', 'preferred', this.fetch, this.logMessages) : null)
            );
            const validPlaces = deathPlaces.filter(Boolean);
            if (validPlaces.length > 0) this.results['Death Place'] = validPlaces;
        }

        if (data.timespan) {
            const timespan = await patterns.extractTimespan(data, this.fetch, this.logMessages);
            Object.assign(this.results, timespan);
        }
    }

    /**
     * Extract Group-specific data
     */
    async _extractGroupData(data) {
        const { getTerm } = await import('./vocab.js');

        if (data.timespan) {
            const timespan = await patterns.extractTimespan(data, this.fetch, this.logMessages);
            Object.assign(this.results, timespan);
        }

        if (data.formed_by) {
            const founders = await Promise.all(
                (Array.isArray(data.formed_by) ? data.formed_by : [data.formed_by])
                    .map(f => f.carried_out_by?.[0]?.id ? getTerm(f.carried_out_by[0].id, 'Founder', 'preferred', this.fetch, this.logMessages) : null)
            );
            const validFounders = founders.filter(Boolean);
            if (validFounders.length > 0) this.results['Founded By'] = validFounders;
        }
    }

    /**
     * Extract Place-specific data
     */
    async _extractPlaceData(data) {
        const { getTerm } = await import('./vocab.js');

        if (data.part_of) {
            const parentPlaces = await Promise.all(
                (Array.isArray(data.part_of) ? data.part_of : [data.part_of])
                    .map(p => p.id ? getTerm(p.id, 'Parent Place', 'preferred', this.fetch, this.logMessages) : null)
            );
            const validPlaces = parentPlaces.filter(Boolean);
            if (validPlaces.length > 0) this.results['Part Of'] = validPlaces;
        }
    }

    /**
     * Extract Activity/Event-specific data
     */
    async _extractActivityData(data) {
        const { getTerm } = await import('./vocab.js');

        if (data.timespan) {
            const timespan = await patterns.extractTimespan(data, this.fetch, this.logMessages);
            Object.assign(this.results, timespan);
        }

        if (data.carried_out_by) {
            const actors = await Promise.all(
                (Array.isArray(data.carried_out_by) ? data.carried_out_by : [data.carried_out_by])
                    .map(a => a.id ? getTerm(a.id, 'Participant', 'preferred', this.fetch, this.logMessages) : null)
            );
            const validActors = actors.filter(Boolean);
            if (validActors.length > 0) this.results['Participants'] = validActors;
        }

        if (data.took_place_at) {
            const places = await Promise.all(
                (Array.isArray(data.took_place_at) ? data.took_place_at : [data.took_place_at])
                    .map(p => p.id ? getTerm(p.id, 'Location', 'preferred', this.fetch, this.logMessages) : null)
            );
            const validPlaces = places.filter(Boolean);
            if (validPlaces.length > 0) {
                // Merge with existing Location if present
                const existing = this.results['Location'] || [];
                this.results['Location'] = [...existing, ...validPlaces];
            }
        }
    }
}
