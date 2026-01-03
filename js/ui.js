/**
 * Linked Art Analysis Tool - UI Controller
 * Handles user interactions and displays results
 */

import { LinkedArtAnalyzer } from './latool-core.js';

class UIController {
    constructor() {
        this.analyzer = new LinkedArtAnalyzer();
        this.currentResult = null;
        this.currentUrl = '';

        this.initElements();
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

        this.resultCount.textContent = `${formatted.length} fields found`;
        this.resultsContainer.innerHTML = '';

        formatted.forEach((field, index) => {
            const card = this.createResultCard(field, index);
            this.resultsContainer.appendChild(card);
        });

        this.showResults();
    }

    createResultCard(field, index) {
        const card = document.createElement('div');
        card.className = 'result-card';
        card.dataset.index = index;

        const isImageField = field.label.toLowerCase().includes('image') || field.label.toLowerCase().includes('thumbnail');

        const header = document.createElement('div');
        header.className = 'result-card-header';
        header.innerHTML = `
            <span class="result-card-label">${this.escapeHtml(field.label)}</span>
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

        if (value === 'Not found') {
            div.className = 'result-value not-found';
            div.textContent = value;
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
            yaml += `${field.label}:\n`;
            field.values.forEach(value => {
                if (value === 'Not found') {
                    yaml += `  - "Not found"\n`;
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
            yaml += 'Log Messages:\n';
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
