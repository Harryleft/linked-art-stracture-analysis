/**
 * Linked Art Analysis Tool - UI Controller
 * Handles user interactions and displays results
 */

import { LinkedArtAnalyzer } from './latool-core.js';
import { JsonLdAnalyzer } from './jsonld-analyzer.js';
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

        this.initElements();
        this.initLanguage();
        this.initViewTabs();
        this.attachEventListeners();
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
        this.resultCount = document.getElementById('result-count');

        // JSON-LD view elements
        this.jsonldEntityType = document.getElementById('jsonld-entity-type');
        this.jsonldPropertyCount = document.getElementById('jsonld-property-count');
        this.jsonldVocabSources = document.getElementById('jsonld-vocab-sources');
        this.jsonldVocabList = document.getElementById('jsonld-vocab-list');
        this.jsonldTree = document.getElementById('jsonld-tree');

        // Language buttons
        this.langButtons = document.querySelectorAll('.lang-btn');
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
            // Fetch raw JSON data for JSON-LD analysis
            const rawData = await this.analyzer.fetchJson(url);
            if (!rawData) {
                throw new Error('Failed to fetch data');
            }
            this.rawJsonData = rawData;

            // Run the standard analysis
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
            this.showError(error.message);
        }
    }

    cancel() {
        this.analyzer.cancel();
        this.hideLoading();
    }

    displayResults(analysisResult) {
        const formatted = this.analyzer.formatResults(analysisResult);

        // Update result count with translation (hide count in standard view)
        this.resultCount.textContent = '';

        this.resultsContainer.innerHTML = '';

        formatted.forEach((field, index) => {
            const card = this.createResultCard(field, index);
            this.resultsContainer.appendChild(card);
        });

        this.showResults();
    }

    displayJsonLdStructure(data) {
        const analysis = this.jsonldAnalyzer.analyze(data, this.currentUrl);

        // Update summary with label if available
        const typeText = analysis.type.join(', ') || 'Unknown';
        const labelText = analysis.label ? `"${analysis.label}"` : '';
        this.jsonldEntityType.textContent = labelText ? `${typeText} (${labelText})` : typeText;

        this.jsonldPropertyCount.textContent = analysis.properties.length;
        this.jsonldVocabSources.textContent = analysis.vocabularies.map(v => v.name).join(', ') || 'None';

        // Display ID if available
        if (analysis.id) {
            this.jsonldEntityType.innerHTML += `<br><small style="color:var(--color-text-muted)">${this.escapeHtml(analysis.id)}</small>`;
        }

        // Display vocabulary references
        this.displayVocabularies(analysis.vocabularies);

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
        this.jsonldTree.innerHTML = '';
        const treeHtml = this.buildTreeHtml(structure, 0);
        this.jsonldTree.innerHTML = treeHtml;
    }

    buildTreeHtml(node, depth) {
        if (!node || !node.children) return '';

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
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    new UIController();
});
