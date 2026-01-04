/**
 * Main UI Controller - Coordinates all UI modules
 */

import { JsonLdAnalyzer } from '../jsonld-analyzer.js';
import { LanguageManager } from './language-manager.js';
import { InputHandler } from './input-handler.js';
import { ViewManager } from './view-manager.js';
import { CompleteEntityView } from './complete-entity-view.js';

export class UIController {
    constructor() {
        this.jsonldAnalyzer = new JsonLdAnalyzer();
        this.currentUrl = '';
        this.rawJsonData = null;

        this.initElements();
        this.initModules();
        this.attachEventListeners();
    }

    initElements() {
        // Input elements
        this.urlInput = document.getElementById('url-input');
        this.clearBtn = document.getElementById('clear-btn');
        this.analyzeBtn = document.getElementById('analyze-btn');
        this.cancelBtn = document.getElementById('cancel-btn');

        // Display elements
        this.loading = document.getElementById('loading');
        this.error = document.getElementById('error');
        this.errorMessage = document.getElementById('error-message');
        this.results = document.getElementById('results');

        // JSON-LD view elements
        const jsonldElements = {
            jsonldEntityType: document.getElementById('jsonld-entity-type'),
            jsonldPropertyCount: document.getElementById('jsonld-property-count'),
            jsonldVocabSources: document.getElementById('jsonld-vocab-sources'),
            jsonldVocabList: document.getElementById('jsonld-vocab-list'),
            jsonldTree: document.getElementById('jsonld-tree')
        };

        // Complete Entity view elements
        const completeElements = {
            completeEntityTitle: document.getElementById('complete-entity-title'),
            completeEntityId: document.getElementById('complete-entity-id'),
            completeStatProperties: document.getElementById('complete-stat-properties'),
            completeStatNested: document.getElementById('complete-stat-nested'),
            completeStatArrays: document.getElementById('complete-stat-arrays'),
            completeStatRefs: document.getElementById('complete-stat-refs'),
            completeStatDepth: document.getElementById('complete-stat-depth'),
            completeDepth: document.getElementById('complete-depth'),
            completeDepthValue: document.getElementById('complete-depth-value'),
            completeResolve: document.getElementById('complete-resolve'),
            completeReanalyze: document.getElementById('complete-reanalyze'),
            completeSearch: document.getElementById('complete-search'),
            propertyGrid: document.getElementById('property-grid'),
            detailSidebar: document.getElementById('detail-sidebar'),
            detailTitle: document.getElementById('detail-title'),
            detailSidebarContent: document.getElementById('detail-sidebar-content'),
            detailBreadcrumb: document.getElementById('detail-breadcrumb'),
            closeSidebarBtn: document.getElementById('close-sidebar'),
            detailModal: document.getElementById('detail-modal'),
            modalTitle: document.getElementById('modal-title'),
            modalBody: document.getElementById('modal-body'),
            modalBreadcrumb: document.getElementById('modal-breadcrumb'),
            closeModalBtn: document.getElementById('close-modal'),
            loading: this.loading
        };

        this.jsonldElements = jsonldElements;
        this.completeElements = completeElements;
    }

    initModules() {
        // Language Manager
        this.languageManager = new LanguageManager();
        this.languageManager.init(document.querySelectorAll('.lang-btn'));

        // Input Handler
        this.inputHandler = new InputHandler({
            urlInput: this.urlInput,
            clearBtn: this.clearBtn,
            analyzeBtn: this.analyzeBtn
        });
        this.inputHandler.init();
        this.inputHandler.onAnalyze((url) => this.analyze(url));

        // View Manager
        this.viewManager = new ViewManager(
            this.jsonldElements,
            this.jsonldAnalyzer,
            this.languageManager
        );
        this.viewManager.init();

        // Complete Entity View
        this.completeEntityView = new CompleteEntityView(
            this.completeElements,
            this.languageManager
        );
        this.completeEntityView.init();

        // Event listeners for view changes
        window.addEventListener('view-changed', (e) => this.onViewChanged(e.detail.view));
    }

    attachEventListeners() {
        this.cancelBtn.addEventListener('click', () => this.cancel());
    }

    onViewChanged(view) {
        if (view === 'jsonld' && this.rawJsonData) {
            this.viewManager.displayJsonLdStructure(this.rawJsonData);
        }

        if (view === 'complete' && this.rawJsonData) {
            this.completeEntityView.display(this.rawJsonData);
        }
    }

    async analyze(url) {
        this.showLoading();
        this.hideResults();
        this.hideError();

        try {
            console.log('[UI] Fetching data from:', url);

            // Fetch raw JSON data
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const rawData = await response.json();
            console.log('[UI] Raw data received:', rawData);
            this.rawJsonData = rawData;
            this.viewManager.setRawData(rawData);

            this.hideLoading();
            this.showResults();

            // Display JSON-LD view by default
            this.viewManager.displayJsonLdStructure(rawData);

        } catch (error) {
            this.hideLoading();
            console.error('[UI] Error:', error);
            this.showError(error.message);
        }
    }

    cancel() {
        this.hideLoading();
    }

    showResults() {
        this.results.classList.remove('hidden');
    }

    hideResults() {
        this.results.classList.add('hidden');
    }

    showError(message) {
        this.errorMessage.textContent = message;
        this.error.classList.remove('hidden');
    }

    hideError() {
        this.error.classList.add('hidden');
    }

    showLoading() {
        this.loading.classList.remove('hidden');
    }

    hideLoading() {
        this.loading.classList.add('hidden');
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    new UIController();
});
