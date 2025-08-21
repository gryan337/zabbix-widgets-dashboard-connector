       processNodes(response) {
                const nodes = this._container.querySelectorAll('[data-group_identifier]');

                for (const node of nodes) {
                        const infoDiv = node.querySelector('.navigation-tree-node-info');
                        const groupNode = infoDiv?.closest('.navigation-tree-node-is-group');

                        if (!infoDiv || !groupNode) continue;

                        const descendantIds = this.#getDescendantItemIds(groupNode);
                        node.setAttribute('data-ids', descendantIds);

                        infoDiv.classList.add('nav-hoverable-itemn');
                }
        
                this._container.addEventListener('click', (event) => {
                        const infoDiv = event.target.closest('.navigation-tree-node-info');
                        if (!infoDiv || event.target.closest('button')) return;
        
                        event.stopPropagation();
                        this.hideGroupNodes();
        
                        const groupNode = infoDiv.closest('.navigation-tree-node-is-group');
                        const descendantIds = groupNode?.getAttribute('data-ids');
        
                        this.#selected_itemid_group = descendantIds;
                        this.markSelected(infoDiv);
                        this.refreshTree();
                });

        }
