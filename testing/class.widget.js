Render Only Visible Items (Windowed Rendering)
Wrap checkboxContainer in a scrollable element and only render, say, 50 items at a time based on the scroll position.



Changes to JavaScript
Right after creating checkboxContainer:


const visibleCount = 50; // number of items to show at once
let startIndex = 0;

const scrollContainer = document.createElement('div');
scrollContainer.style.maxHeight = '300px';
scrollContainer.style.overflowY = 'auto';
scrollContainer.style.position = 'relative';
scrollContainer.style.paddingRight = '6px';
scrollContainer.style.boxSizing = 'border-box';

const spacer = document.createElement('div');
spacer.style.height = `${sortedValues.length * 30}px`; // assume 30px height per item
spacer.style.position = 'relative';

checkboxContainer.style.position = 'absolute';
checkboxContainer.style.top = '0';
checkboxContainer.style.left = '0';
checkboxContainer.style.right = '0';

scrollContainer.appendChild(spacer);
spacer.appendChild(checkboxContainer);


Then replace:
popup.appendChild(checkboxContainer);
With:
popup.appendChild(scrollContainer);


Render Items Based on Scroll Position
Add a function:


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

		checkbox.addEventListener('click', checkboxClickHandler); // reuse your existing logic
		checkboxContainer.appendChild(label);
	}
}

And then:


scrollContainer.addEventListener('scroll', () => {
	renderVisibleCheckboxes();
});

renderVisibleCheckboxes();
