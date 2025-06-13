Update internal filterState.checked array/set — which stores the checked values for all items, not just visible ones.

Update isAllSelected to reflect the state of the entire dataset, not just visible checkboxes.

Then call renderVisibleCheckboxes() to sync the visible checkboxes with that state.


Update the Select All / Unselect All toggle button

toggleButton.addEventListener('click', () => {
    if (isAllSelected) {
        // Unselect all: clear the checked list
        this.#filterState.checked = [];
        isAllSelected = false;
        toggleButton.textContent = 'Select All';
    } else {
        // Select all: check all values
        this.#filterState.checked = sortedValues.map(v => String(v).toLowerCase());
        isAllSelected = true;
        toggleButton.textContent = 'Uncheck All';
    }
    renderVisibleCheckboxes();  // re-render visible checkboxes based on updated state
    updateSummary();
    updateWarningIcon();
    updateClearFiltersButton();
});


Update the Clear Button (clear filters)

clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    searchInput.dispatchEvent(new Event('input'));

    this.#filterState.checked = [];
    isAllSelected = false;
    toggleButton.textContent = 'Select All';
    
    renderVisibleCheckboxes();
    updateSummary();
    updateWarningIcon();
    updateClearFiltersButton();
});


Update checkboxContainer change handler (when user checks/unchecks any visible checkbox)

checkboxContainer.addEventListener('change', (event) => {
    const cb = event.target;
    const val = cb.value.toLowerCase();

    if (cb.checked) {
        // add to checked if not present
        if (!this.#filterState.checked.includes(val)) {
            this.#filterState.checked.push(val);
        }
    } else {
        // remove from checked
        this.#filterState.checked = this.#filterState.checked.filter(v => v !== val);
    }

    // Update isAllSelected based on full dataset
    isAllSelected = (this.#filterState.checked.length === sortedValues.length);

    toggleButton.textContent = isAllSelected ? 'Uncheck All' : 'Select All';

    updateSummary();
    updateWarningIcon();
    updateClearFiltersButton();
});

Update searchInput input handler
already hide/show checkboxes based on search — in windowed rendering, that means some entries won’t be in the DOM. So  update the checked list to remove any unchecked due to filtering and keep the state consistent:


searchInput.addEventListener('input', () => {
    const query = searchInput.value.toLowerCase();

    // Note: Because of windowing, labels not in DOM won't be filtered here,
    // So just clear search string in your filterState if needed

    // Filter checked items to only those matching search (optional, depends on UX)
    const filteredValues = sortedValues.filter(v => {
        const text = String(v).toLowerCase();
        return this.#matchesFilter(text, query, filterType.value);
    });

    // Remove checked values not in filtered values
    this.#filterState.checked = this.#filterState.checked.filter(v => filteredValues.includes(v));

    // Update isAllSelected if all filtered are checked
    isAllSelected = filteredValues.length > 0 && filteredValues.every(v => this.#filterState.checked.includes(String(v).toLowerCase()));

    toggleButton.textContent = isAllSelected ? 'Uncheck All' : 'Select All';

    renderVisibleCheckboxes();
    updateSummary();
    updateWarningIcon();
    updateClearFiltersButton();
});

Update applyButton stays mostly the same, just ensure reads from this.#filterState.checked

Update renderVisibleCheckboxes function to use the filterState.checked list:

function renderVisibleCheckboxes() {
    const scrollTop = scrollContainer.scrollTop;
    startIndex = Math.floor(scrollTop / 30);
    const endIndex = Math.min(startIndex + visibleCount, sortedValues.length);

    checkboxContainer.innerHTML = '';

    for (let i = startIndex; i < endIndex; i++) {
        const value = sortedValues[i];
        const id = `filter_${String(value).replace(/[^a-zA-Z0-9]/g, '_')}`;
        const label = document.createElement('label');
        label.classList.add('custom-checkbox');
        label.innerHTML = `
            <input type="checkbox" id="${id}" value="${value}">
            <span>${value}</span>
        `;

        const checkbox = label.querySelector('input[type="checkbox"]');
        checkbox.checked = this.#filterState?.checked?.includes(String(value).toLowerCase());

        checkbox.addEventListener('click', checkboxClickHandler); // or 'change' event depending on your code
        checkboxContainer.appendChild(label);
    }
}

