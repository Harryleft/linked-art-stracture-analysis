/**
 * Linked Art Analysis Tool - UI Controller
 * Handles user interactions and displays results
 */

import { LinkedArtAnalyzer } from './latool-core.js';
import { JsonLdAnalyzer } from './jsonld-analyzer.js';
import { parseEntity, getParsedEntityStats, getEntityHierarchy, getPropertyByPath } from './complete-parser.js';
import { translations, fieldLabelMapping } from './translations.js';

class UIController {
    constructor() {
        this.analyzer = new LinkedArtAnalyzer();
        this.jsonldAnalyzer = new JsonLdAnalyzer();
        this.currentResult = null;
        this.currentUrl = '';
        this.currentLang = this.detectLanguage();
        this.currentView = 'standard';
        this.rawJsonData = null;
        this.parsedEntity = null;
        this.currentUIMethod = 'sidebar';

        this.initElements();
        this.initLanguage();
        this.initViewTabs();
        this.attachEventListeners();
        this.initCompleteEntityView();
    }

    initElements() {
        // Input elements
        this.urlInput = document.getElementById('url-input');
        this.clearBtn = document.getElementById('clear-btn');
        this.analyzeBtn = document.getElementById('analyze-btn');
        this.exportBtn = document.getElementById('export-btn');
        this.cancelBtn = document.getElementById('cancel-btn');

        // Option checkboxes
        this.conciseMode = document.getElementById('concise-mode');
        this.foundOnly = document.getElementById('found-only');
        this.showLogs = document.getElementById('show-logs');

        // Display elements
        this.loading = document.getElementById('loading');
        this.error = document.getElementById('error');
        this.errorMessage = document.getElementById('error-message');
        this.results = document.getElementById('results');
        this.resultsContainer = document.getElementById('results-container');

        // JSON-LD view elements
        this.jsonldEntityType = document.getElementById('jsonld-entity-type');
        this.jsonldPropertyCount = document.getElementById('jsonld-property-count');
        this.jsonldVocabSources = document.getElementById('jsonld-vocab-sources');
        this.jsonldVocabList = document.getElementById('jsonld-vocab-list');
        this.jsonldTree = document.getElementById('jsonld-tree');

        // Language buttons
        this.langButtons = document.querySelectorAll('.lang-btn');

        // Complete Entity view elements
        this.completeEntityTitle = document.getElementById('complete-entity-title');
        this.completeEntityId = document.getElementById('complete-entity-id');
        this.completeStatProperties = document.getElementById('complete-stat-properties');
        this.completeStatNested = document.getElementById('complete-stat-nested');
        this.completeStatArrays = document.getElementById('complete-stat-arrays');
        this.completeStatRefs = document.getElementById('complete-stat-refs');
        this.completeStatDepth = document.getElementById('complete-stat-depth');
        this.completeDepth = document.getElementById('complete-depth');
        this.completeDepthValue = document.getElementById('complete-depth-value');
        this.completeResolve = document.getElementById('complete-resolve');
        this.completeReanalyze = document.getElementById('complete-reanalyze');
        this.completeSearch = document.getElementById('complete-search');
        this.propertyGrid = document.getElementById('property-grid');
        this.detailSidebar = document.getElementById('detail-sidebar');
        this.detailTitle = document.getElementById('detail-title');
        this.detailSidebarContent = document.getElementById('detail-sidebar-content');
        this.detailBreadcrumb = document.getElementById('detail-breadcrumb');
        this.closeSidebarBtn = document.getElementById('close-sidebar');
        this.detailModal = document.getElementById('detail-modal');
        this.modalTitle = document.getElementById('modal-title');
        this.modalBody = document.getElementById('modal-body');
        this.modalBreadcrumb = document.getElementById('modal-breadcrumb');
        this.closeModalBtn = document.getElementById('close-modal');
    }

    initViewTabs() {
        const viewTabs = document.querySelectorAll('.view-tab');
        viewTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const view = tab.dataset.view;
                this.switchView(view);
            });
        });
    }

    switchView(view) {
        this.currentView = view;

        // Update tabs
        document.querySelectorAll('.view-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.view === view);
        });

        // Update panels
        document.querySelectorAll('.view-panel').forEach(panel => {
            panel.classList.remove('active');
        });
        document.getElementById(`view-${view}`).classList.add('active');

        // If switching to JSON-LD view and we have raw data, display it
        if (view === 'jsonld' && this.rawJsonData) {
            this.displayJsonLdStructure(this.rawJsonData);
        }

        // If switching to Complete Entity view and we have raw data, parse and display it
        if (view === 'complete' && this.rawJsonData) {
            this.displayCompleteEntity(this.rawJsonData);
        }
    }

    initLanguage() {
        // Set initial language
        this.setLanguage(this.currentLang);

        // Attach language switch listeners
        this.langButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const lang = btn.dataset.lang;
                if (lang !== this.currentLang) {
                    this.setLanguage(lang);
                    // Re-render results if available
                    if (this.currentResult) {
                        this.displayResults(this.currentResult);
                    }
                }
            });
        });
    }

    detectLanguage() {
        // Try to get from localStorage first
        const saved = localStorage.getItem('latool-lang');
        if (saved && (saved === 'en' || saved === 'zh')) {
            return saved;
        }

        // Detect from browser
        const browserLang = navigator.language || navigator.userLanguage;
        if (browserLang.startsWith('zh')) {
            return 'zh';
        }
        return 'en';
    }

    setLanguage(lang) {
        this.currentLang = lang;
        localStorage.setItem('latool-lang', lang);

        // Update active button
        this.langButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === lang);
        });

        // Update HTML lang attribute
        document.documentElement.lang = lang;

        // Update all translatable elements
        this.updateTranslations();
    }

    updateTranslations() {
        const t = translations[this.currentLang];

        // Update elements with data-i18n attribute
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.dataset.i18n;
            if (t[key]) {
                el.textContent = t[key];
            }
        });

        // Update placeholders
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.dataset.i18nPlaceholder;
            if (t[key]) {
                el.placeholder = t[key];
            }
        });

        // Update titles
        document.querySelectorAll('[data-i18n-title]').forEach(el => {
            const key = el.dataset.i18nTitle;
            if (t[key]) {
                el.title = t[key];
            }
        });
    }

    t(key) {
        return translations[this.currentLang][key] || key;
    }

    getTranslatedLabel(label) {
        const mappingKey = fieldLabelMapping[label];
        if (mappingKey) {
            return this.t(mappingKey);
        }
        return label;
    }

    attachEventListeners() {
        // URL input
        this.urlInput.addEventListener('input', () => this.onUrlInput());
        this.urlInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !this.analyzeBtn.disabled) {
                this.analyze();
            }
        });

        // Clear button
        this.clearBtn.addEventListener('click', () => {
            this.urlInput.value = '';
            this.urlInput.focus();
            this.onUrlInput();
        });

        // Analyze button
        this.analyzeBtn.addEventListener('click', () => this.analyze());

        // Export button
        this.exportBtn.addEventListener('click', () => this.exportYaml());

        // Cancel button
        this.cancelBtn.addEventListener('click', () => this.cancel());
    }

    onUrlInput() {
        const url = this.urlInput.value.trim();
        this.analyzeBtn.disabled = !this.isValidUrl(url);

        // Hide previous results when input changes
        if (url !== this.currentUrl) {
            this.hideResults();
            this.hideError();
        }
    }

    isValidUrl(url) {
        try {
            new URL(url);
            return url.startsWith('http://') || url.startsWith('https://');
        } catch {
            return false;
        }
    }

    async analyze() {
        const url = this.urlInput.value.trim();
        if (!this.isValidUrl(url)) return;

        this.currentUrl = url;
        this.showLoading();
        this.hideResults();
        this.hideError();
        this.exportBtn.disabled = true;

        const options = {
            conciseMode: this.conciseMode.checked,
            foundOnly: this.foundOnly.checked,
            logMode: this.showLogs.checked ? 'all' : 'errors'
        };

        try {
            console.log('[UI] Fetching data from:', url);

            // Fetch raw JSON data for JSON-LD analysis
            const rawData = await this.analyzer.fetchJson(url);
            if (!rawData) {
                throw new Error('Failed to fetch data');
            }

            console.log('[UI] Raw data received:', rawData);
            this.rawJsonData = rawData;

            // Run the standard analysis
            console.log('[UI] Running standard analysis...');
            const result = await this.analyzer.analyze(url, options);

            this.hideLoading();

            if (result.success) {
                this.currentResult = result;
                this.displayResults(result);
                this.exportBtn.disabled = false;
            } else {
                this.showError(result.error);
            }
        } catch (error) {
            this.hideLoading();
            console.error('[UI] Error:', error);
            console.error('[UI] Error stack:', error.stack);
            this.showError(error.message);
        }
    }

    cancel() {
        this.analyzer.cancel();
        this.hideLoading();
    }

    displayResults(analysisResult) {
        const formatted = this.analyzer.formatResults(analysisResult);

        this.resultsContainer.innerHTML = '';

        formatted.forEach((field, index) => {
            const card = this.createResultCard(field, index);
            this.resultsContainer.appendChild(card);
        });

        this.showResults();
    }

    displayJsonLdStructure(data) {
        console.log('[UI] displayJsonLdStructure called with data:', data);

        const analysis = this.jsonldAnalyzer.analyze(data, this.currentUrl);

        console.log('[UI] JsonLd analysis result:', analysis);
        console.log('[UI] - type:', analysis.type);
        console.log('[UI] - label:', analysis.label);
        console.log('[UI] - id:', analysis.id);
        console.log('[UI] - properties:', analysis.properties);
        console.log('[UI] - vocabularies:', analysis.vocabularies);
        console.log('[UI] - structure:', analysis.structure);

        // Update summary with label if available
        const typeText = (analysis.type && analysis.type.length) ? analysis.type.join(', ') : 'Unknown';
        const labelText = analysis.label ? `"${analysis.label}"` : '';
        this.jsonldEntityType.textContent = labelText ? `${typeText} (${labelText})` : typeText;

        this.jsonldPropertyCount.textContent = analysis.properties ? analysis.properties.length : 0;
        this.jsonldVocabSources.textContent = (analysis.vocabularies && analysis.vocabularies.length)
            ? analysis.vocabularies.map(v => v.name).join(', ')
            : 'None';

        // Display ID if available
        if (analysis.id) {
            this.jsonldEntityType.innerHTML += `<br><small style="color:var(--color-text-muted)">${this.escapeHtml(analysis.id)}</small>`;
        }

        // Display vocabulary references
        this.displayVocabularies(analysis.vocabularies || []);

        // Display property tree
        this.displayPropertyTree(analysis.structure);
    }

    displayVocabularies(vocabularies) {
        this.jsonldVocabList.innerHTML = '';

        if (vocabularies.length === 0) {
            this.jsonldVocabList.innerHTML = `<div class="result-value not-found">${this.t('notFound')}</div>`;
            return;
        }

        vocabularies.forEach(vocab => {
            const item = document.createElement('div');
            item.className = 'jsonld-vocab-item';

            const header = document.createElement('div');
            header.className = 'jsonld-vocab-header';
            header.innerHTML = `
                <span class="jsonld-vocab-name">${vocab.name}</span>
                <span class="jsonld-vocab-count">${vocab.count} references</span>
            `;

            const examples = document.createElement('div');
            examples.className = 'jsonld-vocab-examples';

            vocab.examples.forEach(example => {
                const exampleDiv = document.createElement('div');
                exampleDiv.className = 'jsonld-vocab-example';

                let labelHtml = '';
                if (example.label) {
                    labelHtml = `<div class="jsonld-vocab-label">🏷️ ${this.escapeHtml(example.label)}</div>`;
                }

                exampleDiv.innerHTML = `
                    <div class="jsonld-vocab-path">${example.path} <span style="color:var(--color-text-light)">(${example.context || 'Property'})</span></div>
                    ${labelHtml}
                    <div class="jsonld-vocab-uri"><a href="${example.uri}" target="_blank" rel="noopener">${example.uri}</a></div>
                `;
                examples.appendChild(exampleDiv);
            });

            item.appendChild(header);
            item.appendChild(examples);

            header.addEventListener('click', () => {
                item.classList.toggle('expanded');
            });

            this.jsonldVocabList.appendChild(item);
        });
    }

    displayPropertyTree(structure) {
        console.log('[UI] displayPropertyTree called with structure:', structure);

        this.jsonldTree.innerHTML = '';

        if (!structure) {
            console.log('[UI] Structure is null/undefined, nothing to display');
            this.jsonldTree.innerHTML = '<div class="not-found">No structure data available</div>';
            return;
        }

        if (!structure.children || structure.children.length === 0) {
            console.log('[UI] Structure has no children:', structure);
            this.jsonldTree.innerHTML = '<div class="not-found">No children in structure</div>';
            return;
        }

        console.log('[UI] Structure has', structure.children.length, 'children');

        const treeHtml = this.buildTreeHtml(structure, 0);
        console.log('[UI] Generated tree HTML length:', treeHtml.length);

        if (!treeHtml) {
            console.log('[UI] buildTreeHtml returned empty string');
            this.jsonldTree.innerHTML = '<div class="not-found">Failed to build tree HTML</div>';
        } else {
            this.jsonldTree.innerHTML = treeHtml;
        }
    }

    buildTreeHtml(node, depth) {
        if (!node || !node.children) {
            console.log('[UI] buildTreeHtml: node is null or has no children', node);
            return '';
        }

        console.log('[UI] buildTreeHtml: node has', node.children.length, 'children at depth', depth);

        let html = '';

        node.children.forEach(child => {
            const hasVocab = child.idType || (child.value && this.jsonldAnalyzer.identifyVocabulary(child.value));
            const vocabClass = hasVocab ? ' jsonld-tree-vocab' : '';

            html += `<div class="jsonld-tree-node ${depth === 0 ? 'root' : ''}">`;

            // Key with optional type label
            html += `<span class="jsonld-tree-key${vocabClass}">${child.key}</span>`;

            // Show array length
            if (child.isArray) {
                html += `<span class="jsonld-tree-type">[${child.length}]</span>`;
            }
            // Show primitive type
            else if (child.type && child.type !== 'object' && child.type !== 'array') {
                html += `<span class="jsonld-tree-type">: ${child.type}</span>`;
            }

            // Show object type if available
            if (child.objectType) {
                html += `<span class="jsonld-tree-type"> (${child.objectType})</span>`;
            }

            // Show label if available
            if (child.label) {
                html += `<span class="jsonld-tree-label"> "${this.escapeHtml(child.label)}"</span>`;
            }

            // Show primitive value
            if (child.value && !child.id) {
                html += `<span class="jsonld-tree-value"> = "${this.escapeHtml(child.value)}"</span>`;
            }

            // Show ID with link
            if (child.id) {
                const vocab = child.idType || this.jsonldAnalyzer.identifyVocabulary(child.id);
                html += `<span class="jsonld-tree-value"> = <a href="${child.id}" target="_blank" rel="noopener">"${this.escapeHtml(child.id)}"</a></span>`;
                if (vocab) {
                    html += `<span class="jsonld-tree-vocab"> [${vocab.toUpperCase()}]</span>`;
                }
            }

            // Show context marker
            if (child.isContext) {
                html += `<span class="jsonld-tree-context"> ${child.value}</span>`;
            }

            // Recursively render children
            if (child.children && child.children.length > 0) {
                html += `<div class="jsonld-tree-children">`;
                child.children.forEach(grandchild => {
                    html += this.buildTreeNodeHtml(grandchild, depth + 1);
                });
                html += `</div>`;
            }

            html += `</div>`;
        });

        return html;
    }

    buildTreeNodeHtml(node, depth) {
        let html = `<div class="jsonld-tree-node">`;

        const hasVocab = node.idType || (node.value && this.jsonldAnalyzer.identifyVocabulary(node.value));
        const vocabClass = hasVocab ? ' jsonld-tree-vocab' : '';

        html += `<span class="jsonld-tree-key${vocabClass}">${node.key}</span>`;

        if (node.isArray) {
            html += `<span class="jsonld-tree-type">[${node.length}]</span>`;
        } else if (node.type && node.type !== 'object' && node.type !== 'array') {
            html += `<span class="jsonld-tree-type">: ${node.type}</span>`;
        }

        if (node.objectType) {
            html += `<span class="jsonld-tree-type"> (${node.objectType})</span>`;
        }

        if (node.label) {
            html += `<span class="jsonld-tree-label"> "${this.escapeHtml(node.label)}"</span>`;
        }

        if (node.value && !node.id) {
            html += `<span class="jsonld-tree-value"> = "${this.escapeHtml(String(node.value))}"</span>`;
        }

        if (node.id) {
            html += `<span class="jsonld-tree-value"> = <a href="${node.id}" target="_blank" rel="noopener">"${this.escapeHtml(node.id)}"</a></span>`;
            if (node.idType) {
                html += `<span class="jsonld-tree-vocab"> [${node.idType.toUpperCase()}]</span>`;
            }
        }

        html += `</div>`;

        return html;
    }

    createResultCard(field, index) {
        const card = document.createElement('div');
        card.className = 'result-card';
        card.dataset.index = index;

        // Translate the field label
        const translatedLabel = this.getTranslatedLabel(field.label);
        const isImageField = field.label.toLowerCase().includes('image') || field.label.toLowerCase().includes('thumbnail');

        const header = document.createElement('div');
        header.className = 'result-card-header';
        header.innerHTML = `
            <span class="result-card-label">${this.escapeHtml(translatedLabel)}</span>
            <span class="result-card-toggle">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
            </span>
        `;

        const content = document.createElement('div');
        content.className = 'result-card-content';

        const values = document.createElement('div');
        values.className = 'result-card-values';

        field.values.forEach(value => {
            const valueDiv = this.createValueDiv(value, isImageField);
            values.appendChild(valueDiv);
        });

        content.appendChild(values);
        card.appendChild(header);
        card.appendChild(content);

        // Toggle expand/collapse
        header.addEventListener('click', () => {
            card.classList.toggle('expanded');
        });

        // Auto-expand first card
        if (index === 0) {
            card.classList.add('expanded');
        }

        return card;
    }

    createValueDiv(value, isImageField) {
        const div = document.createElement('div');

        // Translate "Not found" message
        const notFoundText = this.t('notFound');

        if (value === 'Not found') {
            div.className = 'result-value not-found';
            div.textContent = notFoundText;
            return div;
        }

        div.className = 'result-value';

        // Check if it's a URL
        if (this.isImageUrl(value) && isImageField) {
            const img = document.createElement('img');
            img.src = value;
            img.alt = 'Linked Art image';
            img.className = 'result-image';
            img.loading = 'lazy';

            const link = document.createElement('a');
            link.href = value;
            link.target = '_blank';
            link.rel = 'noopener';
            link.appendChild(img);

            div.appendChild(link);
            div.appendChild(document.createTextNode(' '));
            div.appendChild(link.cloneNode(true));
            link.textContent = value;
        } else if (this.isUrl(value)) {
            const link = document.createElement('a');
            link.href = value;
            link.target = '_blank';
            link.rel = 'noopener';
            link.textContent = value;
            div.appendChild(link);
        } else {
            div.textContent = value;
        }

        return div;
    }

    isUrl(str) {
        try {
            new URL(str);
            return true;
        } catch {
            return false;
        }
    }

    isImageUrl(str) {
        if (!this.isUrl(str)) return false;
        const ext = str.split('.').pop().toLowerCase();
        return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext);
    }

    exportYaml() {
        if (!this.currentResult) return;

        // Convert results to YAML-like format
        let yaml = '# Linked Art Analysis Results\n';
        yaml += `# Source: ${this.currentUrl}\n`;
        yaml += `# Generated: ${new Date().toISOString()}\n\n`;

        const formatted = this.analyzer.formatResults(this.currentResult);

        formatted.forEach(field => {
            const translatedLabel = this.getTranslatedLabel(field.label);
            yaml += `${translatedLabel}:\n`;
            field.values.forEach(value => {
                if (value === 'Not found') {
                    yaml += `  - "${this.t('notFound')}"\n`;
                } else if (value.includes('\n')) {
                    // Handle multiline values
                    const lines = value.split('\n');
                    yaml += `  - |\n`;
                    lines.forEach(line => {
                        yaml += `      ${line}\n`;
                    });
                } else {
                    yaml += `  - ${this.escapeYaml(value)}\n`;
                }
            });
            yaml += '\n';
        });

        // Add log messages if available
        if (this.currentResult.logMessages.length > 0) {
            yaml += `${this.t('fieldLogMessages')}:\n`;
            this.currentResult.logMessages.forEach(msg => {
                yaml += `  - ${this.escapeYaml(msg)}\n`;
            });
        }

        // Download file
        const blob = new Blob([yaml], { type: 'text/yaml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `linked-art-analysis-${Date.now()}.yaml`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    escapeYaml(str) {
        // Escape special YAML characters
        return str
            .replace(/"/g, '\\"')
            .replace(/:/g, '\\:');
    }

    escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    showLoading() {
        this.loading.classList.remove('hidden');
    }

    hideLoading() {
        this.loading.classList.add('hidden');
    }

    showResults() {
        this.results.classList.remove('hidden');
    }

    hideResults() {
        this.results.classList.add('hidden');
        this.resultsContainer.innerHTML = '';
    }

    showError(message) {
        this.errorMessage.textContent = message;
        this.error.classList.remove('hidden');
    }

    hideError() {
        this.error.classList.add('hidden');
    }

    // ============================================
    // Complete Entity View Methods
    // ============================================

    initCompleteEntityView() {
        // Method selector buttons
        const methodBtns = document.querySelectorAll('.method-btn');
        methodBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const method = btn.dataset.method;
                this.switchUIMethod(method);
            });
        });

        // Depth slider
        this.completeDepth.addEventListener('input', () => {
            this.completeDepthValue.textContent = this.completeDepth.value;
        });

        // Re-analyze button
        this.completeReanalyze.addEventListener('click', () => {
            if (this.rawJsonData) {
                this.displayCompleteEntity(this.rawJsonData);
            }
        });

        // Search input
        this.completeSearch.addEventListener('input', () => {
            this.filterPropertyGrid(this.completeSearch.value);
        });

        // Close buttons for detail views
        this.closeSidebarBtn.addEventListener('click', () => this.closeDetailSidebar());
        this.closeModalBtn.addEventListener('click', () => this.closeDetailModal());
        this.detailModal.querySelector('.modal-overlay').addEventListener('click', () => this.closeDetailModal());

        // ESC key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeDetailSidebar();
                this.closeDetailModal();
            }
        });
    }

    switchUIMethod(method) {
        this.currentUIMethod = method;

        // Update method buttons
        document.querySelectorAll('.method-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.method === method);
        });

        // Re-render property grid with new method
        if (this.parsedEntity) {
            this.renderPropertyGrid(this.parsedEntity);
        }
    }

    async displayCompleteEntity(rawData) {
        console.log('[UI] displayCompleteEntity called');
        this.showLoading();

        try {
            const depth = parseInt(this.completeDepth.value) || 3;
            const resolveRefs = this.completeResolve.checked;

            console.log('[UI] Parsing entity with depth:', depth, 'resolveRefs:', resolveRefs);

            // Parse the entity
            this.parsedEntity = await parseEntity(
                rawData,
                fetch.bind(window),
                new Set(),
                { resolveReferences: resolveRefs, maxDepth: depth, currentDepth: 0, visited: new Set() }
            );

            console.log('[UI] Parsed entity:', this.parsedEntity);

            // Get statistics
            const stats = getParsedEntityStats(this.parsedEntity);

            console.log('[UI] Entity stats:', stats);

            // Update dashboard
            this.completeEntityTitle.textContent = stats.label || 'Unnamed Entity';
            this.completeEntityId.textContent = stats.id || 'No ID';
            this.completeStatProperties.textContent = stats.propertyCount;
            this.completeStatNested.textContent = stats.nestedEntityCount;
            this.completeStatArrays.textContent = stats.arrayCount;
            this.completeStatRefs.textContent = stats.hasReferences ? 'Yes' : 'No';
            this.completeStatDepth.textContent = stats.maxDepth;

            // Render property grid
            console.log('[UI] Rendering property grid...');
            this.renderPropertyGrid(this.parsedEntity);

            this.hideLoading();
        } catch (error) {
            this.hideLoading();
            console.error('[UI] Error:', error);
            console.error('[UI] Error stack:', error.stack);
            this.showError(error.message);
        }
    }

    renderPropertyGrid(parsed) {
        console.log('[UI] renderPropertyGrid called with parsed:', parsed);

        this.propertyGrid.innerHTML = '';

        const hierarchy = getEntityHierarchy(parsed);

        console.log('[UI] Entity hierarchy:', hierarchy);

        // Filter by search term if provided
        const searchTerm = this.completeSearch.value.toLowerCase();
        const filtered = searchTerm
            ? hierarchy.filter(item => item.key.toLowerCase().includes(searchTerm))
            : hierarchy;

        // Group by top-level property
        const topLevelProps = new Map();
        filtered.forEach(item => {
            const topLevel = item.path.split('.')[0];
            if (!topLevelProps.has(topLevel)) {
                topLevelProps.set(topLevel, item);
            }
        });

        // Render each property as a card
        topLevelProps.forEach((item, propName) => {
            const card = this.createPropertyCard(item, parsed);
            this.propertyGrid.appendChild(card);
        });

        if (topLevelProps.size === 0) {
            this.propertyGrid.innerHTML = '<div class="not-found">No properties found</div>';
        }
    }

    createPropertyCard(item, parsed) {
        const card = document.createElement('div');
        card.className = 'property-card';

        const header = document.createElement('div');
        header.className = 'property-card-header';

        const name = document.createElement('div');
        name.className = 'property-name';
        name.textContent = item.key;

        const typeBadge = document.createElement('span');
        typeBadge.className = `property-type-badge ${item.type}`;
        typeBadge.textContent = item.isArray ? `array[${item.arrayLength}]` : item.entityType || item.type;

        header.appendChild(name);
        header.appendChild(typeBadge);
        card.appendChild(header);

        const preview = document.createElement('div');
        preview.className = 'property-preview';
        if (item.label) {
            preview.textContent = item.label;
        } else if (item.id) {
            preview.textContent = item.id.substring(0, 50) + '...';
        } else {
            preview.textContent = 'Click to explore';
        }
        card.appendChild(preview);

        // Click handler based on UI method
        card.addEventListener('click', () => {
            this.showPropertyDetail(item.path, parsed);
        });

        return card;
    }

    showPropertyDetail(path, parsed) {
        const property = getPropertyByPath(parsed, path);
        if (!property) return;

        const content = this.buildTreeContent(property, path);

        switch (this.currentUIMethod) {
            case 'sidebar':
                this.showDetailSidebar(path, content);
                break;
            case 'modal':
                this.showDetailModal(path, content);
                break;
            case 'inline':
                this.showDetailInline(path, content);
                break;
        }
    }

    buildTreeContent(property, path) {
        const html = this.buildTreeNode(property, 0, path);
        return `<div class="tree-structure">${html}</div>`;
    }

    buildTreeNode(node, depth, path) {
        if (!node) return '';

        let html = '';

        if (node.type === 'entity') {
            html += `<div class="tree-node ${depth === 0 ? 'root' : ''}">`;
            html += `<div class="tree-header">`;
            html += `<span class="tree-toggle">▶</span>`;
            html += `<span class="tree-key">${node.entityType || 'Entity'}</span>`;
            if (node.label) html += `<span class="tree-value">"${this.escapeHtml(node.label)}"</span>`;
            if (node.id) html += `<span class="tree-value"><a href="${node.id}" target="_blank">${this.escapeHtml(node.id.substring(0, 60))}</a></span>`;
            if (node._truncated) html += `<span class="tree-type">[truncated]</span>`;
            html += `</div>`;
            html += `<div class="tree-children">`;

            for (const [key, value] of Object.entries(node.properties || {})) {
                html += this.buildPropertyNode(key, value, depth + 1);
            }

            html += `</div></div>`;
        } else if (node.type === 'array') {
            html += `<div class="tree-node">`;
            html += `<div class="tree-header">`;
            html += `<span class="tree-toggle">▶</span>`;
            html += `<span class="tree-key">array[${node.items?.length || 0}]</span>`;
            html += `</div>`;
            html += `<div class="tree-children">`;

            node.items?.forEach((item, index) => {
                html += `<div class="tree-node">`;
                html += `<div class="tree-header">`;
                html += `<span class="tree-key">[${index}]</span>`;
                html += `</div>`;
                html += `<div class="tree-children">`;
                html += this.buildTreeNode(item, depth + 1, '');
                html += `</div></div>`;
            });

            html += `</div></div>`;
        } else if (node.type === 'literal') {
            const value = node.value === null ? 'null' : JSON.stringify(node.value);
            html += `<div class="tree-node">`;
            html += `<div class="tree-header">`;
            html += `<span class="tree-value">${this.escapeHtml(String(value))}</span>`;
            html += `</div></div>`;
        }

        return html;
    }

    buildPropertyNode(key, value, depth) {
        let html = `<div class="tree-node">`;
        html += `<div class="tree-header">`;
        html += `<span class="tree-key">${this.escapeHtml(key)}</span>`;

        if (value.type === 'entity') {
            if (value.label) html += `<span class="tree-value">"${this.escapeHtml(value.label)}"</span>`;
            if (value.id) html += `<span class="tree-value"><a href="${value.id}" target="_blank">link</a></span>`;
            html += `<span class="tree-type">${value.entityType}</span>`;
        } else if (value.type === 'array') {
            html += `<span class="tree-type">array[${value.items?.length || 0}]</span>`;
        } else if (value.type === 'literal') {
            const strValue = value.value === null ? 'null' : String(value.value).substring(0, 50);
            html += `<span class="tree-value">: ${this.escapeHtml(strValue)}</span>`;
        }

        html += `</div>`;

        if (value.hasChildren) {
            html += `<div class="tree-children">`;
            if (value.type === 'entity') {
                for (const [k, v] of Object.entries(value.properties || {})) {
                    html += this.buildPropertyNode(k, v, depth + 1);
                }
            } else if (value.type === 'array') {
                value.items?.forEach((item, index) => {
                    html += `<div class="tree-node">`;
                    html += `<div class="tree-header">`;
                    html += `<span class="tree-key">[${index}]</span>`;
                    if (item.type === 'entity') {
                        html += `<span class="tree-type">${item.entityType}</span>`;
                        if (item.label) html += `<span class="tree-value">"${this.escapeHtml(item.label)}"</span>`;
                    }
                    html += `</div>`;
                    if (item.type === 'entity') {
                        html += `<div class="tree-children">`;
                        for (const [k, v] of Object.entries(item.properties || {})) {
                            html += this.buildPropertyNode(k, v, depth + 1);
                        }
                        html += `</div>`;
                    }
                    html += `</div>`;
                });
            }
            html += `</div>`;
        }

        html += `</div>`;
        return html;
    }

    showDetailSidebar(path, content) {
        this.detailTitle.textContent = path;
        this.detailSidebarContent.innerHTML = content;
        this.detailBreadcrumb.innerHTML = this.buildBreadcrumb(path);
        this.detailSidebar.classList.add('open');
        this.attachTreeToggleListeners();
    }

    closeDetailSidebar() {
        this.detailSidebar.classList.remove('open');
    }

    showDetailModal(path, content) {
        this.modalTitle.textContent = path;
        this.modalBody.innerHTML = content;
        this.modalBreadcrumb.innerHTML = this.buildBreadcrumb(path);
        this.detailModal.classList.add('open');
        this.attachTreeToggleListeners();
    }

    closeDetailModal() {
        this.detailModal.classList.remove('open');
    }

    showDetailInline(path, content) {
        // For inline method, find or create the inline detail element
        let inlineDetail = document.getElementById('inline-detail');
        if (!inlineDetail) {
            inlineDetail = document.createElement('div');
            inlineDetail.id = 'inline-detail';
            inlineDetail.className = 'property-inline-detail';
            this.propertyGrid.parentNode.insertBefore(inlineDetail, this.propertyGrid.nextSibling);
        }

        inlineDetail.innerHTML = `<div class="property-inline-content">${content}</div>`;
        inlineDetail.classList.add('expanded');
        this.attachTreeToggleListeners();

        // Scroll into view
        inlineDetail.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    buildBreadcrumb(path) {
        const parts = path.split(/[.\[\]]+/).filter(p => p);
        return parts.map((part, i) => {
            if (!isNaN(parseInt(part))) {
                return `<span>[${part}]</span>`;
            }
            return `<span>${part}</span>`;
        }).join(' › ');
    }

    attachTreeToggleListeners() {
        document.querySelectorAll('.tree-toggle').forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                e.stopPropagation();
                toggle.classList.toggle('expanded');
                const children = toggle.closest('.tree-node').querySelector('.tree-children');
                if (children) {
                    children.classList.toggle('expanded');
                }
            });
        });
    }

    filterPropertyGrid(searchTerm) {
        if (this.parsedEntity) {
            this.renderPropertyGrid(this.parsedEntity);
        }
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    new UIController();
});
