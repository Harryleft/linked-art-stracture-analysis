/**
 * Complete Entity View - Handles the complete entity parsing and display
 */

import { parseEntity, getParsedEntityStats, getEntityHierarchy, getPropertyByPath } from '../complete-parser.js';

export class CompleteEntityView {
    constructor(elements, languageManager) {
        this.elements = elements;
        this.t = languageManager.t.bind(languageManager);
        this.rawJsonData = null;
        this.parsedEntity = null;
    }

    init() {
        // Search
        this.elements.completeSearch.addEventListener('input', () => {
            this.filterPropertyGrid(this.elements.completeSearch.value);
        });

        // Close modal button
        this.elements.closeModalBtn.addEventListener('click', () => this.closeModal());
        this.elements.detailModal.querySelector('.modal-overlay').addEventListener('click', () => this.closeModal());

        // ESC key to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });
    }

    async display(rawData) {
        this.showLoading();
        this.rawJsonData = rawData;  // Save for navigation

        try {
            this.parsedEntity = await parseEntity(
                rawData,
                fetch.bind(window),
                new Set(),
                { resolveReferences: true, maxDepth: Infinity, currentDepth: 0, visited: new Set() }
            );

            const stats = getParsedEntityStats(this.parsedEntity);

            this.updateDashboard(stats);
            this.renderPropertyGrid(this.parsedEntity);

            this.hideLoading();
        } catch (error) {
            this.hideLoading();
            console.error('[CompleteEntityView] Error:', error);
            throw error;
        }
    }

    updateDashboard(stats) {
        this.elements.completeEntityTitle.textContent = stats.label || 'Unnamed Entity';
        this.elements.completeEntityId.textContent = stats.id || 'No ID';
        this.elements.completeStatProperties.textContent = stats.propertyCount;
        this.elements.completeStatNested.textContent = stats.nestedEntityCount;
        this.elements.completeStatArrays.textContent = stats.arrayCount;
        this.elements.completeStatRefs.textContent = stats.hasReferences ? 'Yes' : 'No';
        this.elements.completeStatDepth.textContent = stats.maxDepth;
    }

    renderPropertyGrid(parsed) {
        this.elements.propertyGrid.innerHTML = '';

        const hierarchy = getEntityHierarchy(parsed);
        const searchTerm = this.elements.completeSearch.value.toLowerCase();
        const filtered = searchTerm
            ? hierarchy.filter(item => item.key.toLowerCase().includes(searchTerm))
            : hierarchy;

        const topLevelProps = new Map();
        filtered.forEach(item => {
            // Extract the top-level property name, removing array indices like [0], [1], etc.
            const topLevel = item.path.replace(/\[.*?\]/g, '').split('.')[0];
            if (!topLevelProps.has(topLevel)) {
                topLevelProps.set(topLevel, item);
            }
        });

        topLevelProps.forEach((item, propName) => {
            const card = this.createPropertyCard(item, parsed);
            this.elements.propertyGrid.appendChild(card);
        });

        if (topLevelProps.size === 0) {
            this.elements.propertyGrid.innerHTML = '<div class="not-found">No properties found</div>';
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

        card.addEventListener('click', () => {
            this.showPropertyDetail(item.path, parsed);
        });

        return card;
    }

    showPropertyDetail(path, parsed) {
        const property = getPropertyByPath(parsed, path);
        if (!property) return;

        const content = this.buildTreeContent(property, path);
        this.showModal(path, content);
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

    buildPropertyNode(key, value, depth, parentPath = '') {
        // Build current path for this node
        const currentPath = parentPath ? `${parentPath}.${key}` : key;
        const hasChildren = value.hasChildren ||
            (value.type === 'entity' && value.properties && Object.keys(value.properties).length > 0) ||
            (value.type === 'array' && value.items && value.items.length > 0);

        let html = `<div class="tree-node" data-path="${this.escapeHtml(currentPath)}">`;
        html += `<div class="tree-header">`;

        // Add click handler for nodes with children
        if (hasChildren && (value.type === 'entity' || value.type === 'array')) {
            html += `<span class="tree-toggle">▶</span>`;
            html += `<span class="tree-key tree-node-clickable" data-node-path="${this.escapeHtml(currentPath)}">${this.escapeHtml(key)}</span>`;
        } else {
            html += `<span class="tree-key">${this.escapeHtml(key)}</span>`;
        }

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

        if (hasChildren) {
            html += `<div class="tree-children">`;
            if (value.type === 'entity') {
                for (const [k, v] of Object.entries(value.properties || {})) {
                    html += this.buildPropertyNode(k, v, depth + 1, currentPath);
                }
            } else if (value.type === 'array') {
                value.items?.forEach((item, index) => {
                    const itemPath = `${currentPath}[${index}]`;
                    html += `<div class="tree-node" data-path="${this.escapeHtml(itemPath)}">`;
                    html += `<div class="tree-header">`;

                    if (item.type === 'entity' || item.type === 'array' || (item.properties && Object.keys(item.properties).length > 0)) {
                        html += `<span class="tree-toggle">▶</span>`;
                        html += `<span class="tree-key tree-node-clickable" data-node-path="${this.escapeHtml(itemPath)}">[${index}]</span>`;
                    } else {
                        html += `<span class="tree-key">[${index}]</span>`;
                    }

                    if (item.type === 'entity') {
                        html += `<span class="tree-type">${item.entityType}</span>`;
                        if (item.label) html += `<span class="tree-value">"${this.escapeHtml(item.label)}"</span>`;
                    } else if (item.type === 'array') {
                        html += `<span class="tree-type">array[${item.items?.length || 0}]</span>`;
                    }
                    html += `</div>`;
                    if (item.type === 'entity' || item.type === 'array') {
                        html += `<div class="tree-children">`;
                        if (item.type === 'entity') {
                            for (const [k, v] of Object.entries(item.properties || {})) {
                                html += this.buildPropertyNode(k, v, depth + 1, itemPath);
                            }
                        } else if (item.type === 'array') {
                            item.items?.forEach((subItem, subIndex) => {
                                const subItemPath = `${itemPath}[${subIndex}]`;
                                html += `<div class="tree-node" data-path="${this.escapeHtml(subItemPath)}">`;
                                html += `<div class="tree-header">`;
                                if (subItem.type === 'entity' || subItem.type === 'array') {
                                    html += `<span class="tree-toggle">▶</span>`;
                                    html += `<span class="tree-key tree-node-clickable" data-node-path="${this.escapeHtml(subItemPath)}">[${subIndex}]</span>`;
                                } else {
                                    html += `<span class="tree-key">[${subIndex}]</span>`;
                                }
                                if (subItem.type === 'entity') {
                                    html += `<span class="tree-type">${subItem.entityType}</span>`;
                                    if (subItem.label) html += `<span class="tree-value">"${this.escapeHtml(subItem.label)}"</span>`;
                                } else if (subItem.type === 'array') {
                                    html += `<span class="tree-type">array[${subItem.items?.length || 0}]</span>`;
                                }
                                html += `</div>`;
                                if (subItem.type === 'entity') {
                                    html += `<div class="tree-children">`;
                                    for (const [k, v] of Object.entries(subItem.properties || {})) {
                                        html += this.buildPropertyNode(k, v, depth + 1, subItemPath);
                                    }
                                    html += `</div>`;
                                }
                                html += `</div>`;
                            });
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

    showModal(path, content) {
        this.elements.modalTitle.textContent = path;
        this.elements.modalBody.innerHTML = content;
        this.elements.modalBreadcrumb.innerHTML = this.buildBreadcrumb(path);
        this.elements.detailModal.classList.add('open');
        this.attachTreeToggleListeners();
    }

    closeModal() {
        this.elements.detailModal.classList.remove('open');
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
        // Tree toggle for expand/collapse
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

        // Node click for navigation
        document.querySelectorAll('.tree-node-clickable').forEach(node => {
            node.addEventListener('click', (e) => {
                e.stopPropagation();
                const path = node.dataset.nodePath;
                if (path && this.parsedEntity) {
                    this.showPropertyDetail(path, this.parsedEntity);
                }
            });
        });
    }

    filterPropertyGrid(searchTerm) {
        if (this.parsedEntity) {
            this.renderPropertyGrid(this.parsedEntity);
        }
    }

    escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    showLoading() {
        this.elements.loading?.classList.remove('hidden');
    }

    hideLoading() {
        this.elements.loading?.classList.add('hidden');
    }
}
