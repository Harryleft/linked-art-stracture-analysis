/**
 * Pattern extractors for Linked Art data
 * Each pattern extracts specific types of data from Linked Art JSON-LD
 */

import { getContentOrValue, findClassifiedAs, findGettyUri, iterativeSearch, formatTimespan } from '../utils.js';
import { getTerm } from '../vocab.js';

/**
 * Extract names/titles from entity
 */
export async function extractNames(data, fetch, logMessages) {
    const results = {};

    const nameUris = {
        'Title': 'http://vocab.getty.edu/aat/300404670',
        'Exhibited Title': 'http://vocab.getty.edu/aat/300417207',
        'Former Title': 'http://vocab.getty.edu/aat/300417203'
    };

    for (const [key, uri] of Object.entries(nameUris)) {
        const names = (data.identified_by || [])
            .filter(item => item.type === 'Name' && findClassifiedAs(item.classified_as, [uri]))
            .map(item => getContentOrValue(item, key, logMessages))
            .filter(Boolean);
        results[key] = names.length > 0 ? names : ['Not found'];
    }

    return results;
}

/**
 * Extract identifiers from entity
 */
export async function extractIdentifiers(data, fetch, logMessages) {
    const results = {};

    const identifierUris = {
        'Accession Number': 'http://vocab.getty.edu/aat/300312355'
    };

    for (const [key, uri] of Object.entries(identifierUris)) {
        const identifiers = (data.identified_by || [])
            .filter(item => item.type === 'Identifier' && findClassifiedAs(item.classified_as, [uri]))
            .map(item => getContentOrValue(item, key, logMessages))
            .filter(Boolean);
        results[key] = identifiers.length > 0 ? identifiers : ['Not found'];
    }

    return results;
}

/**
 * Extract work type classification
 */
export async function extractWorkType(data, fetch, logMessages) {
    const results = {};

    const typeUris = { 'Work Type (Classification)': 'http://vocab.getty.edu/aat/300435443' };

    for (const [key, uri] of Object.entries(typeUris)) {
        const preferredTerms = await Promise.all(
            (data.classified_as || []).map(async item => {
                if (findClassifiedAs(item, [uri])) {
                    const gettyUri = findGettyUri(item);
                    if (gettyUri) return await getTerm(gettyUri, key, 'preferred', fetch, logMessages);
                }
                return null;
            })
        );
        const validTerms = preferredTerms.filter(Boolean);
        results[key] = validTerms.length > 0 ? validTerms : ['Not found'];
    }

    return results;
}

/**
 * Extract creators from production event
 */
export async function extractCreators(data, fetch, logMessages) {
    const results = {};

    async function findCarriedOutBy(obj) {
        const creatorIds = [];
        await iterativeSearch(obj, item => {
            if (item.carried_out_by) creatorIds.push(item.carried_out_by[0].id);
        });
        return creatorIds;
    }

    if (data?.produced_by) {
        const creatorIds = await findCarriedOutBy(data.produced_by);
        const creators = await Promise.all(creatorIds.map(id => getTerm(id, "Creator", 'preferred', fetch, logMessages)));
        results['Creators'] = creators.filter(Boolean).length > 0 ? creators.filter(Boolean) : ['Not found'];

        if (results['Creators'].length > 1) {
            results['CreatorsMessage'] = 'Multiple creators found. Please verify.';
        }
    } else {
        results['Creators'] = ['Not found'];
    }

    return results;
}

/**
 * Extract timespan information
 */
export async function extractTimespan(data, fetch, logMessages) {
    const results = {};

    // Timespan (Name) - display date
    if (data && data.produced_by && data.produced_by.timespan && data.produced_by.timespan.identified_by) {
        const timespanNames = [];
        for (const item of data.produced_by.timespan.identified_by) {
            if (item.type === 'Name') {
                timespanNames.push(getContentOrValue(item, 'Timespan Display', logMessages));
            }
        }
        results['Timespan (Name)'] = timespanNames.length > 0 ? timespanNames : ['Not found'];
    } else {
        results['Timespan (Name)'] = ['Not found'];
    }

    // Timespan (Structured) - formatted from begin/end dates
    if (data && data.produced_by && data.produced_by.timespan) {
        const timespan = data.produced_by.timespan;
        if (timespan.begin_of_the_begin || timespan.end_of_the_end) {
            const timespanStatement = formatTimespan(timespan.begin_of_the_begin, timespan.end_of_the_end);
            results['Timespan (Structured)'] = timespanStatement ? [timespanStatement] : ['Not found'];
        } else {
            results['Timespan (Structured)'] = ['Not found'];
        }
    } else {
        results['Timespan (Structured)'] = ['Not found'];
    }

    return results;
}

/**
 * Extract structured dimensions
 */
export async function extractDimensions(data, fetch, logMessages) {
    const results = {};

    const excludeEntry = (entry) => {
        return entry.classified_as?.some(classification => findGettyUri(classification) === "http://vocab.getty.edu/aat/300010269");
    };

    const getDimensionAndUnitLabels = async (dimension) => {
        const dimensionUri = findGettyUri(dimension.classified_as);
        const unitUri = dimension.unit ? findGettyUri(dimension.unit) : null;

        const [dimensionLabel, unitLabel] = await Promise.all([
            dimensionUri ? getTerm(dimensionUri, "Dimension", 'preferred', fetch, logMessages) : null,
            unitUri ? getTerm(unitUri, "Unit", 'preferred', fetch, logMessages) : null
        ]);

        if (!dimensionLabel) {
            logMessages.add(`Unable to retrieve dimension type from ${dimensionUri || dimension.classified_as.map(item => item.id).join(', ')}`);
        }

        if (!unitLabel) {
            logMessages.add(`Unable to retrieve dimension unit from ${unitUri || (dimension.unit ? dimension.unit.id : 'unknown unit')}`);
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
                    additionalClassLabel = additionalUri ? await getTerm(additionalUri, "Additional Classification", 'preferred', fetch, logMessages) : null;

                    if (!additionalClassLabel) {
                        logMessages.add(`Unable to retrieve additional classification label from ${additionalUri}`);
                    }
                    break;
                }
            }
        } else if (dimension.classified_as && dimension.classified_as.length > 1) {
            const additionalUri = dimension.classified_as[1]?.id;
            additionalClassLabel = additionalUri ? await getTerm(additionalUri, "Additional Classification", 'preferred', fetch, logMessages) : null;

            if (!additionalClassLabel) {
                logMessages.add(`Unable to retrieve additional classification label from ${additionalUri}`);
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
                            const label = await getTerm(member.id, "Set Label", 'preferred', fetch, logMessages);
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
    results['Dimensions (Structured)'] = dimensions ? dimensions.split('\n') : ['Not found'];

    return results;
}

/**
 * Extract structured materials
 */
export async function extractMaterials(data, fetch, logMessages) {
    const results = {};

    const materials = await Promise.all(
        (data.made_of || []).map(async material => {
            const materialUri = findGettyUri(material);
            if (materialUri) {
                return await getTerm(materialUri, 'Materials', 'preferred', fetch, logMessages);
            }
            return null;
        })
    );

    const materialsStr = materials.filter(Boolean).join(', ') || null;
    results['Materials (Structured)'] = materialsStr ? [materialsStr] : ['Not found'];

    return results;
}

/**
 * Extract reference properties (location, owner, set)
 */
export async function extractReferences(data, fetch, logMessages) {
    const results = {};

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
                        return await getTerm(item.id, label, 'preferred', fetch, logMessages);
                    }
                    return null;
                }));

                const validTerms = terms.filter(term => term);
                results[label] = validTerms.length > 0 ? validTerms : ['Not found'];
            } else if (data[property].id) {
                const preferredTerm = await getTerm(data[property].id, label, 'preferred', fetch, logMessages);
                results[label] = preferredTerm ? [preferredTerm] : ['Not found'];
            }
        } else {
            results[label] = ['Not found'];
        }
    }

    return results;
}

/**
 * Extract statements (referred_to_by)
 */
export async function extractStatements(data, fetch, logMessages) {
    const results = {};

    const findStatements = (targetUri) => {
        return (data.referred_to_by || [])
            .filter(item => item.type === 'LinguisticObject' && findClassifiedAs(item.classified_as, [targetUri]))
            .map(item => getContentOrValue(item, 'Statement', logMessages))
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
        let statements = findStatements(uris.primary);
        if (statements.length === 0 && uris.secondary && uris.secondary.length > 0) {
            for (const secondaryUri of uris.secondary) {
                statements = findStatements(secondaryUri);
                if (statements.length > 0) {
                    const primaryAltTerm = await getTerm(uris.primary, key, 'alternative', fetch, logMessages) || 'Primary Term';
                    const secondaryAltTerm = await getTerm(secondaryUri, key, 'alternative', fetch, logMessages) || 'Secondary Term';
                    logMessages.add(`${key} not found using ${uris.primary} ("${primaryAltTerm}"). ${secondaryUri} ("${secondaryAltTerm}") used instead.`);
                    break;
                }
            }
        }
        results[key] = statements.length > 0 ? statements : ['Not found'];
    }

    return results;
}

/**
 * Extract digital objects (web pages, IIIF manifests)
 */
export async function extractDigitalObjects(data, fetch, logMessages) {
    const results = {};
    const seenIds = new Set();

    const contentTypes = [
        { name: 'Web Pages' },
        { name: 'IIIF Manifest' }
    ];

    contentTypes.forEach(type => {
        results[type.name] = [];
    });

    const checkConformsTo = (conformsToArray, target) => {
        if (!Array.isArray(conformsToArray)) {
            logMessages.add(`conforms_to is not an array: ${JSON.stringify(conformsToArray)}`);
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
        await iterativeSearch(obj, async objItem => {
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
                logMessages.add(`Digital object ${objItem.id} was not embedded in a digitally_carried_by property as expected.`);
            }
        });
        return collected;
    };

    const webPages = await collectDigitalObjects(data, 'http://vocab.getty.edu/aat/300264578', (obj, target) => {
        return obj.classified_as && findClassifiedAs(obj.classified_as, [target]);
    });
    results['Web Pages'] = webPages.map(extractContent);

    let iiifManifests = await collectDigitalObjects(data, 'http://iiif.io/api/presentation/3/context.json', (obj, target) => {
        return obj.conforms_to && checkConformsTo(obj.conforms_to, target);
    });

    if (iiifManifests.length === 0) {
        iiifManifests = await collectDigitalObjects(data, 'http://iiif.io/api/presentation', (obj, target) => {
            return obj.conforms_to && checkConformsTo(obj.conforms_to, target);
        });
    }

    results['IIIF Manifest'] = iiifManifests.map(extractContent);

    return results;
}

/**
 * Extract images from IIIF manifest
 */
export async function extractImagesFromIIIF(iiifManifestUrl, fetch, logMessages) {
    const results = {
        'Primary Image': ['Not found'],
        'Primary Thumbnail': ['Not found'],
        'All Images': ['Not found'],
        'All Thumbnails': ['Not found']
    };

    try {
        const response = await fetch(iiifManifestUrl);
        if (!response.ok) {
            logMessages.add(`Failed to fetch IIIF Manifest data from ${iiifManifestUrl}`);
            return results;
        }

        const iiifData = await response.json();
        if (!iiifData) {
            return results;
        }

        const context = iiifData['@context'];
        let imagesSet = new Set();
        let thumbnailsSet = new Set();

        if (context === 'http://iiif.io/api/presentation/2/context.json') {
            const manifestThumbnailUri = iiifData.thumbnail?.['@id'];
            if (manifestThumbnailUri) thumbnailsSet.add(manifestThumbnailUri);

            const canvases = iiifData.sequences?.[0]?.canvases || [];
            for (const canvas of canvases) {
                const imageUris = canvas.images?.map(image => image.resource['@id']).filter(Boolean);
                const thumbnailUri = canvas.thumbnail?.['@id'];
                if (imageUris) imageUris.forEach(uri => imagesSet.add(uri));
                if (thumbnailUri) thumbnailsSet.add(thumbnailUri);
            }
        } else if (context === 'http://iiif.io/api/presentation/3/context.json') {
            const manifestThumbnailUris = iiifData.thumbnail?.map(thumbnail => thumbnail.id).filter(Boolean) || [];
            manifestThumbnailUris.forEach(uri => thumbnailsSet.add(uri));

            const items = iiifData.items || [];
            for (const item of items) {
                const imageUris = item.items?.flatMap(subItem => subItem.items?.map(subSubItem => subSubItem.body?.id).filter(Boolean)) || [];
                const thumbnailUris = item.thumbnail?.map(thumbnail => thumbnail.id).filter(Boolean) || [];
                imageUris.forEach(uri => imagesSet.add(uri));
                thumbnailUris.forEach(uri => thumbnailsSet.add(uri));
            }
        }

        const images = Array.from(imagesSet);
        const thumbnails = Array.from(thumbnailsSet);

        results['Primary Image'] = images.length > 0 ? [images[0]] : ['Not found'];
        results['Primary Thumbnail'] = thumbnails.length > 0 ? [thumbnails[0]] : ['Not found'];
        results['All Images'] = images.length > 0 ? images : ['Not found'];
        results['All Thumbnails'] = thumbnails.length > 0 ? thumbnails : ['Not found'];

        return results;
    } catch (error) {
        logMessages.add(`Error processing IIIF manifest: ${error.message}`);
        return results;
    }
}
