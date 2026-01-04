/**
 * Results Renderer - Handles standard results display
 */

export class ResultsRenderer {
    constructor(container, languageManager) {
        this.container = container;
        this.t = languageManager.t.bind(languageManager);
        this.getTranslatedLabel = languageManager.getTranslatedLabel.bind(languageManager);
    }

    clear() {
        this.container.innerHTML = '';
    }

    render(formatted) {
        this.clear();

        formatted.forEach((field, index) => {
            const card = this.createCard(field, index);
            this.container.appendChild(card);
        });
    }

    createCard(field, index) {
        const card = document.createElement('div');
        card.className = 'result-card';
        card.dataset.index = index;

        const translatedLabel = this.getTranslatedLabel(field.label);
        const isImageField = field.label.toLowerCase().includes('image') ||
                            field.label.toLowerCase().includes('thumbnail');

        const header = this.createCardHeader(translatedLabel);
        const content = this.createCardContent(field.values, isImageField);

        card.appendChild(header);
        card.appendChild(content);

        header.addEventListener('click', () => {
            card.classList.toggle('expanded');
        });

        if (index === 0) {
            card.classList.add('expanded');
        }

        return card;
    }

    createCardHeader(label) {
        const header = document.createElement('div');
        header.className = 'result-card-header';
        header.innerHTML = `
            <span class="result-card-label">${this.escapeHtml(label)}</span>
            <span class="result-card-toggle">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
            </span>
        `;
        return header;
    }

    createCardContent(values, isImageField) {
        const content = document.createElement('div');
        content.className = 'result-card-content';

        const valuesDiv = document.createElement('div');
        valuesDiv.className = 'result-card-values';

        values.forEach(value => {
            const valueDiv = this.createValueDiv(value, isImageField);
            valuesDiv.appendChild(valueDiv);
        });

        content.appendChild(valuesDiv);
        return content;
    }

    createValueDiv(value, isImageField) {
        const div = document.createElement('div');
        const notFoundText = this.t('notFound');

        if (value === 'Not found') {
            div.className = 'result-value not-found';
            div.textContent = notFoundText;
            return div;
        }

        div.className = 'result-value';

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

            const textLink = link.cloneNode(true);
            textLink.textContent = value;
            div.appendChild(textLink);
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

    escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
}
