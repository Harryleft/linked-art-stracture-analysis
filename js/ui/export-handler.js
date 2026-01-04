/**
 * Export Handler - Handles YAML export functionality
 */

export class ExportHandler {
    constructor(elements, languageManager) {
        this.exportBtn = elements.exportBtn;
        this.currentResult = null;
        this.currentUrl = '';
        this.t = languageManager.t.bind(languageManager);
        this.getTranslatedLabel = languageManager.getTranslatedLabel.bind(languageManager);
    }

    init(analyzer) {
        this.analyzer = analyzer;

        this.exportBtn.addEventListener('click', () => this.export());
    }

    setResult(result, url) {
        this.currentResult = result;
        this.currentUrl = url;
        this.exportBtn.disabled = false;
    }

    clear() {
        this.currentResult = null;
        this.currentUrl = '';
        this.exportBtn.disabled = true;
    }

    export() {
        if (!this.currentResult) return;

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

        if (this.currentResult.logMessages.length > 0) {
            yaml += `${this.t('fieldLogMessages')}:\n`;
            this.currentResult.logMessages.forEach(msg => {
                yaml += `  - ${this.escapeYaml(msg)}\n`;
            });
        }

        this.downloadYaml(yaml);
    }

    escapeYaml(str) {
        return str
            .replace(/"/g, '\\"')
            .replace(/:/g, '\\:');
    }

    downloadYaml(yaml) {
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
}
