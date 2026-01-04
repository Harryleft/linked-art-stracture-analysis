/**
 * View Manager - Handles view switching (Standard/JSON-LD/Complete)
 */

export class ViewManager {
    constructor(elements, jsonldAnalyzer, languageManager) {
        this.elements = elements;
        this.jsonldAnalyzer = jsonldAnalyzer;
        this.t = languageManager.t.bind(languageManager);
        this.currentView = 'standard';
        this.rawJsonData = null;
    }

    init() {
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

        document.querySelectorAll('.view-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.view === view);
        });

        document.querySelectorAll('.view-panel').forEach(panel => {
            panel.classList.remove('active');
            panel.classList.add('hidden');
        });
        const activePanel = document.getElementById(`view-${view}`);
        activePanel.classList.add('active');
        activePanel.classList.remove('hidden');

        window.dispatchEvent(new CustomEvent('view-changed', { detail: { view } }));
    }

    setRawData(data) {
        this.rawJsonData = data;
    }

    displayJsonLdStructure(data) {
        const analysis = this.jsonldAnalyzer.analyze(data, this.currentUrl);

        const typeText = (analysis.type && analysis.type.length)
            ? analysis.type.join(', ')
            : 'Unknown';
        const labelText = analysis.label ? `"${analysis.label}"` : '';

        this.elements.jsonldEntityType.textContent = labelText
            ? `${typeText} (${labelText})`
            : typeText;

        this.elements.jsonldPropertyCount.textContent = analysis.properties ? analysis.properties.length : 0;
        this.elements.jsonldVocabSources.textContent = (analysis.vocabularies && analysis.vocabularies.length)
            ? analysis.vocabularies.map(v => v.name).join(', ')
            : 'None';

        if (analysis.id) {
            this.elements.jsonldEntityType.innerHTML += `<br><small style="color:var(--color-text-muted)">${this.escapeHtml(analysis.id)}</small>`;
        }

        this.displayVocabularies(analysis.vocabularies || []);
        this.displayPropertyTree(analysis.structure);
    }

    displayVocabularies(vocabularies) {
        this.elements.jsonldVocabList.innerHTML = '';

        if (vocabularies.length === 0) {
            this.elements.jsonldVocabList.innerHTML =
                `<div class="result-value not-found">${this.t('notFound')}</div>`;
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

            this.elements.jsonldVocabList.appendChild(item);
        });
    }

    displayPropertyTree(structure) {
        this.elements.jsonldTree.innerHTML = '';

        if (!structure || !structure.children || structure.children.length === 0) {
            this.elements.jsonldTree.innerHTML = '<div class="not-found">No structure data available</div>';
            return;
        }

        const treeHtml = this.buildTreeHtml(structure, 0);
        if (!treeHtml) {
            this.elements.jsonldTree.innerHTML = '<div class="not-found">Failed to build tree HTML</div>';
        } else {
            this.elements.jsonldTree.innerHTML = treeHtml;
            this.attachArrayToggleListeners(); // Bind array toggle events
        }
    }

    attachArrayToggleListeners() {
        const toggles = this.elements.jsonldTree.querySelectorAll('.jsonld-tree-toggle');
        toggles.forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                e.stopPropagation();

                // Toggle expanded state
                const isExpanded = toggle.classList.toggle('expanded');

                // Update icon
                toggle.textContent = isExpanded ? '▼' : '▶';

                // Toggle children container visibility
                const treeNode = toggle.closest('.jsonld-tree-node');
                const children = treeNode?.querySelector('.jsonld-tree-children');
                if (children) {
                    children.classList.toggle('collapsed');
                }
            });
        });
    }

    buildTreeHtml(node, depth) {
        if (!node || !node.children) return '';

        let html = '';

        node.children.forEach(child => {
            const hasVocab = child.idType || (child.value && this.jsonldAnalyzer.identifyVocabulary(child.value));
            const vocabClass = hasVocab ? ' jsonld-tree-vocab' : '';

            html += `<div class="jsonld-tree-node ${depth === 0 ? 'root' : ''}">`;
            html += `<span class="jsonld-tree-key${vocabClass}">${child.key}</span>`;

            if (child.isArray) {
                // Add expand/collapse toggle icon (default collapsed)
                html += `<span class="jsonld-tree-toggle">▶</span>`;
                html += `<span class="jsonld-tree-type">[${child.length}]</span>`;

                // Create collapsible container for array items
                if (child.arrayItems && child.arrayItems.length > 0) {
                    html += `<div class="jsonld-tree-children collapsed">`;
                    child.arrayItems.forEach((arrayItem) => {
                        html += `<div class="jsonld-tree-node">`;
                        // Show index [0], [1], [2]...
                        html += `<span class="jsonld-tree-key">[${arrayItem.index}]</span>`;

                        if (arrayItem.isPrimitive) {
                            html += `<span class="jsonld-tree-value">: ${this.escapeHtml(String(arrayItem.value))}</span>`;
                        } else if (arrayItem.node && arrayItem.node.children) {
                            // Recursively render nested object children
                            arrayItem.node.children.forEach(nestedChild => {
                                html += this.buildTreeNodeHtml(nestedChild, depth + 2);
                            });
                        }
                        html += `</div>`;
                    });
                    html += `</div>`;
                }
            } else if (child.type && child.type !== 'object' && child.type !== 'array') {
                html += `<span class="jsonld-tree-type">: ${child.type}</span>`;
            }

            if (child.objectType) {
                html += `<span class="jsonld-tree-type"> (${child.objectType})</span>`;
            }

            if (child.label) {
                html += `<span class="jsonld-tree-label"> "${this.escapeHtml(child.label)}"</span>`;
            }

            if (child.value && !child.id && !child.isContext) {
                html += `<span class="jsonld-tree-value"> = "${this.escapeHtml(child.value)}"</span>`;
            }

            if (child.id) {
                const vocab = child.idType || this.jsonldAnalyzer.identifyVocabulary(child.id);
                html += `<span class="jsonld-tree-value"> = <a href="${child.id}" target="_blank" rel="noopener">"${this.escapeHtml(child.id)}"</a></span>`;
                if (vocab) {
                    html += `<span class="jsonld-tree-vocab"> [${vocab.toUpperCase()}]</span>`;
                }
            }

            if (child.isContext) {
                if (child.contextType === 'external') {
                    // External context URL
                    html += `<span class="jsonld-tree-context"> = <a href="${this.escapeHtml(child.value)}" target="_blank" rel="noopener">"${this.escapeHtml(child.value)}"</a></span>`;
                } else if (child.contextType === 'embedded' && child.contextMappings) {
                    // Embedded context with mappings - show as expandable list
                    html += `<span class="jsonld-tree-toggle">▶</span>`;
                    html += `<span class="jsonld-tree-context"> [${child.contextMappings.length} terms]</span>`;
                    html += `<div class="jsonld-tree-children collapsed">`;
                    child.contextMappings.forEach(mapping => {
                        html += `<div class="jsonld-tree-node">`;
                        html += `<span class="jsonld-tree-key">${mapping.term}</span>`;
                        html += `<span class="jsonld-tree-value"> → ${this.escapeHtml(mapping.mapping)}</span>`;
                        html += `</div>`;
                    });
                    html += `</div>`;
                } else {
                    html += `<span class="jsonld-tree-context"> = ${this.escapeHtml(String(child.value))}</span>`;
                }
            }

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
            // Add expand/collapse toggle icon (default collapsed)
            html += `<span class="jsonld-tree-toggle">▶</span>`;
            html += `<span class="jsonld-tree-type">[${node.length}]</span>`;

            // Create collapsible container for array items
            if (node.arrayItems && node.arrayItems.length > 0) {
                html += `<div class="jsonld-tree-children collapsed">`;
                node.arrayItems.forEach((arrayItem) => {
                    html += `<div class="jsonld-tree-node">`;
                    // Show index [0], [1], [2]...
                    html += `<span class="jsonld-tree-key">[${arrayItem.index}]</span>`;

                    if (arrayItem.isPrimitive) {
                        html += `<span class="jsonld-tree-value">: ${this.escapeHtml(String(arrayItem.value))}</span>`;
                    } else if (arrayItem.node && arrayItem.node.children) {
                        // Recursively render nested object children
                        arrayItem.node.children.forEach(nestedChild => {
                            html += this.buildTreeNodeHtml(nestedChild, depth + 1);
                        });
                    }
                    html += `</div>`;
                });
                html += `</div>`;
            }
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

    escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
}
