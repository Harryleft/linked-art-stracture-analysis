/**
 * Input Handler - Manages URL input and validation
 */

export class InputHandler {
    constructor(elements) {
        this.urlInput = elements.urlInput;
        this.clearBtn = elements.clearBtn;
        this.analyzeBtn = elements.analyzeBtn;
        this.onAnalyzeCallback = null;
    }

    init() {
        this.urlInput.addEventListener('input', () => this.onInput());
        this.urlInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !this.analyzeBtn.disabled) {
                this.triggerAnalyze();
            }
        });

        this.clearBtn.addEventListener('click', () => {
            this.urlInput.value = '';
            this.urlInput.focus();
            this.onInput();
        });

        this.analyzeBtn.addEventListener('click', () => this.triggerAnalyze());
    }

    onAnalyze(callback) {
        this.onAnalyzeCallback = callback;
    }

    onInput() {
        const url = this.urlInput.value.trim();
        this.analyzeBtn.disabled = !this.isValidUrl(url);

        if (url !== this.getUrl()) {
            this.setUrl(url);
            window.dispatchEvent(new CustomEvent('input-changed', { detail: { url } }));
        }
    }

    triggerAnalyze() {
        if (this.onAnalyzeCallback) {
            this.onAnalyzeCallback(this.getUrl());
        }
    }

    getUrl() {
        return this.urlInput.value.trim();
    }

    setUrl(url) {
        this.urlInput.value = url;
    }

    isValidUrl(url) {
        try {
            new URL(url);
            return url.startsWith('http://') || url.startsWith('https://');
        } catch {
            return false;
        }
    }

    setAnalyzeEnabled(enabled) {
        this.analyzeBtn.disabled = !enabled;
    }
}
