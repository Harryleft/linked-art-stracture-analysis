/**
 * Main UI Controller - Simplified for Complete Entity View only
 */

import { LanguageManager } from './language-manager.js';
import { InputHandler } from './input-handler.js';
import { CompleteEntityView } from './complete-entity-view.js';

export class UIController {
    constructor() {
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

        // Complete Entity view elements
        const completeElements = {
            completeSearch: document.getElementById('complete-search'),
            propertyGrid: document.getElementById('property-grid'),
            detailModal: document.getElementById('detail-modal'),
            modalTitle: document.getElementById('modal-title'),
            modalBody: document.getElementById('modal-body'),
            modalBreadcrumb: document.getElementById('modal-breadcrumb'),
            closeModalBtn: document.getElementById('close-modal'),
            loading: this.loading
        };

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

        // Complete Entity View
        this.completeEntityView = new CompleteEntityView(
            this.completeElements,
            this.languageManager
        );
        this.completeEntityView.init();
    }

    attachEventListeners() {
        this.cancelBtn.addEventListener('click', () => this.cancel());
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

            this.hideLoading();
            this.showResults();

            // Display Complete Entity view
            this.completeEntityView.display(rawData);

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

// Initialize immediately when DOM is ready, or wait for DOMContentLoaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.uiController = new UIController();
    });
} else {
    // DOM is already ready
    window.uiController = new UIController();
}
