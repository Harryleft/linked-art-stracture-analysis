#!/usr/bin/env node
/**
 * Linked Art Analysis Tool - CLI Entry Point
 * Complete recursive parser implementation
 */

import fetch from 'node-fetch';
import fs from 'fs';
import yaml from 'js-yaml';
import { parseEntity, formatParsedEntity, getParsedEntityStats } from './lib/parser.js';
import { expandNumericIds } from './lib/utils.js';

// Parse command line arguments
const args = process.argv.slice(2);
const url = args.find(arg => !arg.startsWith('--'));
const logFlag = args.includes('--log');
const saveFlag = args.find(arg => arg.startsWith('--save='));
const saveFilename = saveFlag ? saveFlag.split('=')[1] : null;
const depthFlag = args.find(arg => arg.startsWith('--depth='));
const maxDepth = depthFlag ? parseInt(depthFlag.split('=')[1]) : 3;
const noResolveFlag = args.includes('--no-resolve');

if (!url) {
    console.error('Please provide a URL as a command line argument');
    console.error('');
    console.error('Usage: node latool.js <URL> [options]');
    console.error('');
    console.error('Options:');
    console.error('  --log              Show detailed log messages');
    console.error('  --save=FILE        Save results to YAML file');
    console.error('  --depth=N          Maximum recursion depth (default: 3)');
    console.error('  --no-resolve       Don\'t resolve external references');
    process.exit(1);
}

console.log(`Fetching Linked Art data from ${url}...`);
console.log(`Max recursion depth: ${maxDepth}`);
console.log(`Resolve references: ${!noResolveFlag}`);
console.log('');

// Create log messages set
const logMessages = new Set();

// Main execution
(async () => {
    try {
        // Fetch data
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const rawData = await response.json();

        // Expand numeric IDs
        const data = expandNumericIds(rawData, logMessages);

        // Parse entity completely
        console.log('Parsing entity...');
        const parsed = await parseEntity(data, fetch.bind(null), logMessages, {
            resolveReferences: !noResolveFlag,
            maxDepth,
            currentDepth: 0,
            visited: new Set()
        });

        // Get statistics
        const stats = getParsedEntityStats(parsed);

        // Output results
        console.log('');
        console.log('='.repeat(80));
        console.log('COMPLETE LINKED ART ENTITY ANALYSIS');
        console.log('='.repeat(80));
        console.log('');

        // Summary
        console.log('SUMMARY');
        console.log('-------');
        console.log(`Entity Type: ${stats.type}`);
        console.log(`Label: ${stats.label || '(unnamed)'}`);
        console.log(`ID: ${stats.id || '(none)'}`);
        console.log(`Properties: ${stats.propertyCount}`);
        console.log(`Nested Entities: ${stats.nestedEntityCount}`);
        console.log(`Has External References: ${stats.hasReferences ? 'Yes' : 'No'}`);
        console.log('');

        // Property names
        console.log('PROPERTIES');
        console.log('---------');
        for (const prop of stats.propertyNames) {
            console.log(`  - ${prop}`);
        }
        console.log('');

        // Full structure
        console.log('COMPLETE STRUCTURE');
        console.log('------------------');
        console.log('');
        const formatted = formatParsedEntity(parsed, 0);
        console.log(formatted);

        // Log messages
        if (logFlag && logMessages.size > 0) {
            console.log('');
            console.log('LOG MESSAGES');
            console.log('------------');
            for (const msg of logMessages) {
                console.log(`  - ${msg}`);
            }
        } else if (logMessages.size > 0) {
            console.log('');
            console.log(`${logMessages.size} issue(s) logged. Use --log to view details.`);
        }

        // Save to file if requested
        if (saveFilename) {
            try {
                // Create a serializable version of the parsed data
                const serializable = makeSerializable(parsed);
                const yamlStr = yaml.dump(serializable, {
                    lineWidth: -1,
                    noRefs: true
                });
                fs.writeFileSync(saveFilename, yamlStr, 'utf8');
                console.log(`Results saved to ${saveFilename}`);
            } catch (error) {
                console.error(`Failed to save results: ${error.message}`);
            }
        }

    } catch (error) {
        console.error('');
        console.error('ERROR:', error.message);
        if (logFlag) {
            console.error(error.stack);
        }
        process.exit(1);
    }
})();

/**
 * Convert parsed entity to serializable format
 */
function makeSerializable(parsed, visited = new Set()) {
    if (!parsed || typeof parsed !== 'object') {
        return parsed;
    }

    if (visited.has(parsed)) {
        return '[circular reference]';
    }
    visited.add(parsed);

    if (Array.isArray(parsed)) {
        return parsed.map(item => makeSerializable(item, visited));
    }

    const result = {};
    for (const [key, value] of Object.entries(parsed)) {
        if (typeof value === 'object' && value !== null) {
            result[key] = makeSerializable(value, visited);
        } else {
            result[key] = value;
        }
    }

    return result;
}
