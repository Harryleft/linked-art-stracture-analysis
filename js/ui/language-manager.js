/**
 * Language Manager - Handles internationalization
 */

import { translations, fieldLabelMapping } from '../translations.js';

export class LanguageManager {
    constructor() {
        this.currentLang = this.detectLanguage();
        this.langButtons = null;
    }

    detectLanguage() {
        const saved = localStorage.getItem('latool-lang');
        if (saved && (saved === 'en' || saved === 'zh')) {
            return saved;
        }

        const browserLang = navigator.language || navigator.userLanguage;
        return browserLang.startsWith('zh') ? 'zh' : 'en';
    }

    init(langButtons) {
        this.langButtons = langButtons;
        this.setLanguage(this.currentLang);

        this.langButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const lang = btn.dataset.lang;
                if (lang !== this.currentLang) {
                    this.setLanguage(lang);
                    window.dispatchEvent(new CustomEvent('language-changed', { detail: { lang } }));
                }
            });
        });
    }

    setLanguage(lang) {
        this.currentLang = lang;
        localStorage.setItem('latool-lang', lang);

        this.langButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === lang);
        });

        document.documentElement.lang = lang;
        this.updateTranslations();
    }

    updateTranslations() {
        const t = translations[this.currentLang];

        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.dataset.i18n;
            if (t[key]) {
                el.textContent = t[key];
            }
        });

        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.dataset.i18nPlaceholder;
            if (t[key]) {
                el.placeholder = t[key];
            }
        });

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
}
