class CWidgetDashboardConnector extends CWidget {
	hasPadding() {
		return false;
	}

	setContents(response) {
		// If we already have a dropdown list, remove it first
		if (this.dropdownList && this.dropdownList.parentNode) {
			this.dropdownList.remove();
		}

		const orphanedLists = document.querySelectorAll('body > .dashboard-dropdown-list[data-dropdown-list="true"]');
		orphanedLists.forEach(list => list.remove());

		super.setContents(response);

		this.theme = jQuery('html').attr('theme') || 'blue-theme';
		this.widgetBody = this._target.getElementsByClassName('dashboard-widget-dashboard-connector-wrapper').item(0);
		this.reference = "references";

		if (this._fields.display_style === 1) {
			this.widgetBody.classList.add('dropdown-display');
			this.widgetBody.classList.remove('list-display');
			this.transformToDropdown();
		}
		else {
			this.widgetBody.classList.add('list-display');
			this.widgetBody.classList.remove('dropdown-display');
			this.setCookiesOnLinkClick();
		}

		this.original_cookie = this.getReferenceFromCookie(this.reference);

		[
			document.querySelector('[data-profile-idx="web.dashboard.filter"]'),
			document.querySelector('[data-profile-idx="web.dashboard.filter"]')?.previousElementSibling,
			document.querySelector(".host-dashboard-header-navigation"),
			document.querySelector(".dashboard-navigation")
		].map(el => el instanceof HTMLElement && el.classList.add('sticky-ts'));

		this.timeContainer = document.querySelector('.time-selection-container');
		this.scrollContainer = document.querySelector('.wrapper');
		if (!this.scrollContainer) {
			// Fallback to window if wrapper not found
			this.scrollContainer = window;
		}

		const observer = new MutationObserver(mutations => {
			mutations.forEach(mutation => {
				if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
					this.boundAdjustNavg();
				}
			});
		});

		try {
			observer.observe(this.timeContainer, {
				attributes: true,
				attributeFilter: ['style']
			});
		}
		catch (error) {
		}

		this.removeListeners();
		this.boundOnScroll = this.onScrollDc.bind(this);
		this.boundOnMouseUp = this.onMouseUpDc.bind(this);
		this.boundOnMouseDown = this.onMouseDownDc.bind(this);
		this.boundAdjustNav = this.adjustDashboardNavigation.bind(this);
		this.attachListeners();
	}

	transformToDropdown() {
		const ul = this.widgetBody.querySelector('ul');
		if (!ul) {
			return;
		}

		// Extract all links and their data
		const items = [];
		const listItems = ul.querySelectorAll('li');

		listItems.forEach(li => {
			const link = li.querySelector('a');
			const textDiv = li.querySelector('div[style*="color"]');

			if (link) {
				const textContent = link.textContent.trim().replace('•', '').trim();
				items.push({
					text: textContent,
					href: link.href,
					type: 'link',
					isCurrentDashboard: false
				});
			}
			else if (textDiv && textDiv.textContent.trim() && textDiv.textContent.trim() !== ' ') {
				const textContent = textDiv.textContent.trim().replace('➣', '').trim();
				if (textContent) {
					items.push({
						text: textContent,
						href: null,
						type: 'current',
						isCurrentDashboard: true
					});
				}
			}
		});

		// Clear existing content
		this.widgetBody.innerHTML = '';

		// Create dropdown container
		const dropdownContainer = document.createElement('div');
		dropdownContainer.className = 'dashboard-dropdown-container';
		dropdownContainer.setAttribute('data-dropdown-widget', 'true');

		// Create search input wrapper with icon
		const searchWrapper = document.createElement('div');
		searchWrapper.className = 'dashboard-search-wrapper';

		const searchIcon = document.createElement('span');
		searchIcon.className = 'dashboard-search-icon';
		searchIcon.innerHTML = `
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" role="img">
		  <title>Search</title>
		  <circle cx="11" cy="11" r="6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
		  <path d="M21 21l-4.35-4.35" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
		</svg>`;

		const searchInput = document.createElement('input');
		searchInput.type = 'text';
		searchInput.className = 'dashboard-search-input';
		searchInput.placeholder = 'Search dashboards...';
		searchInput.setAttribute('autocomplete', 'off');

		searchWrapper.appendChild(searchIcon);
		searchWrapper.appendChild(searchInput);

		// Create dropdown toggle button
		const dropdownToggle = document.createElement('button');
		dropdownToggle.className = 'dashboard-dropdown-toggle';
		dropdownToggle.type = 'button';
		dropdownToggle.setAttribute('aria-haspopup', 'listbox');
		dropdownToggle.setAttribute('aria-expanded', 'false');

		// Find current dashboard for button text
		const currentDashboard = items.find(item => item.isCurrentDashboard);
		dropdownToggle.innerHTML = `
			<span class="dropdown-toggle-text">Browse dashboards</span>
			<span class="dropdown-toggle-arrow">
			    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" style="transform: scaleY(2.2);" aria-hidden="true">
			      <path fill="currentColor" d="M7 10l5 5 5-5z"/>
			    </svg>
			</span>
		`;

		// Assemble the dropdown container
		dropdownContainer.appendChild(searchWrapper);
		dropdownContainer.appendChild(dropdownToggle);
		this.widgetBody.appendChild(dropdownContainer);

		// Create dropdown list container
		const dropdownList = document.createElement('ul');
		dropdownList.className = 'dashboard-dropdown-list';
		dropdownList.style.display = 'none';
		dropdownList.setAttribute('role', 'listbox');
		dropdownList.setAttribute('data-dropdown-list', 'true');
		dropdownList.tabIndex = -1;

		// Populate dropdown list
		let currentIndex = -1;
		// In transformToDropdown(), create items WITHOUT title attribute
		items.forEach((item, index) => {
			const dropdownItem = document.createElement('li');
			dropdownItem.className = 'dashboard-dropdown-item';
			dropdownItem.setAttribute('role', 'option');
			// No title attribute needed

			if (item.isCurrentDashboard) {
				dropdownItem.classList.add('current-dashboard');
				dropdownItem.innerHTML = `
					<span class="dashboard-item-content">
						<span class="current-marker">
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
							    <path d="M5 13l4 4 10-10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
							</svg>
						</span>
						<span class="dashboard-item-text">${item.text}</span>
					</span>
				`;
			}
			else {
				dropdownItem.innerHTML = `
					<span class="dashboard-item-content">
						<span class="dashboard-item-text">${item.text}</span>
					</span>
				`;
				dropdownItem.setAttribute('data-href', item.href);
			}

			dropdownItem.setAttribute('data-text', item.text.toLowerCase());
			dropdownItem.setAttribute('data-index', index);
			dropdownList.appendChild(dropdownItem);
		});

		// Helper function to get first visible item
		const getFirstVisibleItem = () => {
			const allItems = dropdownList.querySelectorAll('.dashboard-dropdown-item');
			for (let item of allItems) {
				if (!item.classList.contains('hidden-by-search')) {
					return item;
				}
			}
			return null;
		};

		// Position dropdown list function (handles viewport overflow)
		const positionDropdownList = () => {
			if (!document.body.contains(dropdownToggle)) {
				return;
			}

			const rect = dropdownToggle.getBoundingClientRect();
			dropdownList.style.position = 'fixed';

			let left = Math.round(rect.left);
			let top = Math.round(rect.bottom + 4);
			const minWidth = Math.round(rect.width);

			// Let the dropdown expand naturally based on content
			dropdownList.style.left = `${left}px`;
			dropdownList.style.top = `${top}px`;
			dropdownList.style.minWidth = `${minWidth}px`;
			dropdownList.style.width = 'auto'; // Changed from fixed width

			// Re-measure and adjust for viewport overflow
			const mRect = dropdownList.getBoundingClientRect();

			if (mRect.right > window.innerWidth) {
				const shift = mRect.right - window.innerWidth + 8;
				left = Math.max(8, left - shift);
				dropdownList.style.left = `${left}px`;
			}

			if (mRect.bottom > window.innerHeight) {
				const altTop = Math.round(rect.top - mRect.height - 4);
				if (altTop > 8) {
					dropdownList.style.top = `${altTop}px`;
					dropdownList.classList.add('dropdown-above');
				}
				else {
					dropdownList.classList.remove('dropdown-above');
				}
			}
		};

		// RAF-based repositioning
		const rafPlace = () => {
			if (this._dropdownRafId) {
				cancelAnimationFrame(this._dropdownRafId);
			}
			this._dropdownRafId = requestAnimationFrame(() => {
				positionDropdownList();
				this._dropdownRafId = null;
			});
		};

		// Setup reposition handlers
		const setupRepositionHandlers = () => {
			// Clean up any existing handlers first
			if (this._dropdownRepositionHandler) {
				window.removeEventListener('scroll', this._dropdownRepositionHandler, true);
				window.removeEventListener('resize', this._dropdownRepositionHandler, true);
				this._dropdownRepositionHandler = null;
			}

			// Create new handler
			this._dropdownRepositionHandler = () => {
				rafPlace();
			};

			// Attach listeners
			window.addEventListener('scroll', this._dropdownRepositionHandler, true);
			window.addEventListener('resize', this._dropdownRepositionHandler, true);
		};

		// Cleanup reposition handlers
		const cleanupRepositionHandlers = () => {
			if (this._dropdownRepositionHandler) {
				window.removeEventListener('scroll', this._dropdownRepositionHandler, true);
				window.removeEventListener('resize', this._dropdownRepositionHandler, true);
				this._dropdownRepositionHandler = null;
			}

			if (this._dropdownRafId) {
				cancelAnimationFrame(this._dropdownRafId);
				this._dropdownRafId = null;
			}
		};

		// Setup outside click handler
		const setupOutsideClickHandler = () => {
			// Cleanup any existing handler first
			if (this._dropdownOutsideClickHandler) {
				document.removeEventListener('click', this._dropdownOutsideClickHandler);
				this._dropdownOutsideClickHandler = null;
			}

			// Create new handler
			this._dropdownOutsideClickHandler = (e) => {
				// Check if click target or any parent has our dropdown attributes
				let element = e.target;
				let isOurDropdown = false;

				while (element && element !== document) {
					if (element.hasAttribute && (element.hasAttribute('data-dropdown-widget') ||
							element.hasAttribute('data-dropdown-list'))) {
						isOurDropdown = true;
						break;
					}
					element = element.parentElement;
				}

				if (!isOurDropdown) {
					closeList();
				}
			};

			// Attach with a slight delay to avoid immediate triggering
			setTimeout(() => {
				document.addEventListener('click', this._dropdownOutsideClickHandler);
			}, 10);
		};

		// Cleanup outside click handler
		const cleanupOutsideClickHandler = () => {
			if (this._dropdownOutsideClickHandler) {
				document.removeEventListener('click', this._dropdownOutsideClickHandler);
				this._dropdownOutsideClickHandler = null;
			}
		};

		// Open list function
		const openList = (skipFocus = false) => {
			this._pauseUpdating();
			// Ensure list is in DOM
			if (!document.body.contains(dropdownList)) {
				document.body.appendChild(dropdownList);
			}

			// Setup scroll handlers BEFORE showing the dropdown
			setupRepositionHandlers();

			requestAnimationFrame(() => {
				// Position and show
				positionDropdownList();
				dropdownList.style.display = 'block';
				dropdownToggle.classList.add('open');
				dropdownToggle.setAttribute('aria-expanded', 'true');

				// Setup outside click handler AFTER showing dropdown
				setupOutsideClickHandler();

				if (!skipFocus) {
					const firstVisible = getFirstVisibleItem();
					if (firstVisible) {
						const idx = parseInt(firstVisible.getAttribute('data-index'));
						focusItem(idx);
					}
					dropdownList.focus();
				}
			});
		};

		// Close list function
		const closeList = () => {
			dropdownList.style.display = 'none';
			dropdownToggle.classList.remove('open');
			dropdownToggle.setAttribute('aria-expanded', 'false');
			currentIndex = -1;
			const allItems = dropdownList.querySelectorAll('.dashboard-dropdown-item');
			allItems.forEach(item => item.classList.remove('focused'));

			// Clean up handlers when closing
			cleanupRepositionHandlers();
			cleanupOutsideClickHandler();

			this._resumeUpdating();
		};

		// Focus item function
		const focusItem = (index) => {
			const allItems = dropdownList.querySelectorAll('.dashboard-dropdown-item');
			if (allItems.length === 0) return;

			allItems.forEach(item => item.classList.remove('focused'));

			if (index >= 0 && index < allItems.length) {
				const itemToFocus = allItems[index];
				if (!itemToFocus.classList.contains('hidden-by-search')) {
					currentIndex = index;
					itemToFocus.classList.add('focused');
					itemToFocus.scrollIntoView({ block: 'nearest' });
				}
			}
		};

		// Toggle dropdown - ONLY stop propagation on the button itself
		dropdownToggle.addEventListener('click', (e) => {
			e.stopPropagation();
			e.preventDefault();
			const isOpen = dropdownList.style.display === 'block';

			if (isOpen) {
				closeList();
			}
			else {
				openList();
			}
		});

		// Add click handlers to dropdown items = only stop propagation on actual item clicks
		dropdownList.querySelectorAll('.dashboard-dropdown-item').forEach((dropdownItem, index) => {
			const item = items[index];

			if (!item.isCurrentDashboard) {
				dropdownItem.addEventListener('click', (e) => {
					e.stopPropagation();
					this.handleDropdownItemClick(e, item.href);
					closeList();
				});

				// Add mousedown handler to catch middle-click early
				dropdownItem.addEventListener('mousedown', (e) => {
					if (e.button === 1) {
						e.preventDefault();
						e.stopPropagation();
					}
				});

				dropdownItem.addEventListener('auxclick', (e) => {
					if (e.button === 1) {
						e.preventDefault();
						e.stopPropagation();
						this.handleDropdownItemClick(e, item.href, true);
						closeList();
					}
				});
			}
		});

		dropdownList.querySelectorAll('.dashboard-dropdown-item').forEach((dropdownItem, index) => {
			dropdownItem.addEventListener('mouseenter', () => {
				focusItem(index);
			});
		});

		// Keyboard navigation for toggle button
		dropdownToggle.addEventListener('keydown', (e) => {
			const visibleItems = Array.from(dropdownList.querySelectorAll('.dashboard-dropdown-item:not(.hidden-by-search)'));

			switch (e.key) {
				case ' ':
				case 'Enter':
					e.preventDefault();
					if (dropdownList.style.display === 'none') {
						openList();
					}
					else {
						closeList();
					}
					break;
				case 'ArrowDown':
					e.preventDefault();
					openList();
					break;
				case 'ArrowUp':
					e.preventDefault();
					openList();
					if (visibleItems.length > 0) {
						const lastIdx = parseInt(visibleItems[visibleItems.length - 1].getAttribute('data-index'));
						focusItem(lastIdx);
					}
					break;
				case 'Escape':
					e.preventDefault();
					closeList();
					break;
			}
		});

		// Keyboard navigation for list
		dropdownList.addEventListener('keydown', (e) => {
			const visibleItems = Array.from(dropdownList.querySelectorAll('.dashboard-dropdown-item:not(.hidden-by-search)'));

			if (visibleItems.length === 0) return;

			const visibleIndices = visibleItems.map(item => parseInt(item.getAttribute('data-index')));
			const currentVisibleIndex = visibleIndices.indexOf(currentIndex);

			switch (e.key) {
				case 'ArrowDown':
					e.preventDefault();
					let nextVisibleIndex = currentVisibleIndex + 1;
					if (nextVisibleIndex >= visibleIndices.length) {
						nextVisibleIndex = 0;
					}
					focusItem(visibleIndices[nextVisibleIndex]);
					break;
				case 'ArrowUp':
					e.preventDefault();
					let prevVisibleIndex = currentVisibleIndex - 1;
					if (prevVisibleIndex < 0) {
						prevVisibleIndex = visibleIndices.length - 1;
					}
					focusItem(visibleIndices[prevVisibleIndex]);
					break;
				case 'Enter':
					e.preventDefault();
					if (currentIndex >= 0) {
						const currentItem = dropdownList.querySelector(`[data-index="${currentIndex}"]`);
						if (currentItem && !currentItem.classList.contains('current-dashboard')) {
							currentItem.click();
						}
					}
					break;
				case 'Escape':
					e.preventDefault();
					closeList();
					dropdownToggle.focus();
					break;
				case 'Tab':
					closeList();
					break;
			}
		});

		// Search functionality
		searchInput.addEventListener('focus', (e) => {
			this._pauseUpdating();
		});

		searchInput.addEventListener('blur', (e) => {
			this._resumeUpdating();
		});

		searchInput.addEventListener('input', (e) => {
			const searchTerm = e.target.value.toLowerCase().trim();
			const allItems = dropdownList.querySelectorAll('.dashboard-dropdown-item');
			let visibleCount = 0;

			allItems.forEach(item => {
				const text = item.getAttribute('data-text');
				const matches = text.includes(searchTerm);

				if (matches) {
					item.classList.remove('hidden-by-search');
					visibleCount++;
				}
				else {
					item.classList.add('hidden-by-search');
				}
			});

			if (searchTerm.length > 0 && visibleCount > 0) {
				if (dropdownList.style.display !== 'block') {
					openList(true);
				}
				else {
					positionDropdownList();
				}
			}
			else if (searchTerm.length === 0) {
				allItems.forEach(item => item.classList.remove('hidden-by-search'));
				closeList();
			}
		});

		// Search input keyboard handling
		searchInput.addEventListener('keydown', (e) => {
			if (e.key === 'ArrowDown') {
				e.preventDefault();
				if (dropdownList.style.display !== 'block') {
					openList();
				}
				else {
					const firstVisible = getFirstVisibleItem();
					if (firstVisible) {
						const idx = parseInt(firstVisible.getAttribute('data-index'));
						focusItem(idx);
					}
				}
				dropdownList.focus();
			}
			else if (e.key === 'Escape') {
				e.preventDefault();
				closeList();
				searchInput.value = '';
				const allItems = dropdownList.querySelectorAll('.dashboard-dropdown-item');
				allItems.forEach(item => item.classList.remove('hidden-by-search'));
				searchInput.blur();
			}
			else if (e.key === 'Enter') {
				e.preventDefault();
				const firstVisible = getFirstVisibleItem();
				if (firstVisible && !firstVisible.classList.contains('current-dashboard')) {
					firstVisible.click();
				}
			}
		});

		// Store references for later cleanup
		this.dropdownList = dropdownList;
		this.searchInput = searchInput;
		this.dropdownToggle = dropdownToggle;
		this.dropdownContainer = dropdownContainer;
	}

	handleDropdownItemClick(event, href, openInNewTab = false) {
		event.preventDefault();
		event.stopPropagation();

		// Check if ctrl/cmd key is pressed
		const shouldOpenInNewTab = openInNewTab || event.ctrlKey || event.metaKey;

		let prelim_references = this.widgetBody.getAttribute(this.reference);
		var references = this.checkReferences(prelim_references);
		this.setCookie(this.reference, references);

		if (this._fields.url_target || shouldOpenInNewTab) {
			window.open(href, '_blank');
		}
		else {
			window.location.href = href;
		}
	}	

	attachListeners() {
		const scrollTarget = this.scrollContainer || document;

		scrollTarget.addEventListener('wheel', this.boundOnScroll, true);
		scrollTarget.addEventListener('scroll', this.boundOnScroll, true);
		document.addEventListener('mouseup', this.boundOnMouseUp);
		document.addEventListener('mousedown', this.boundOnMouseDown);

		this.boundOnResize = () => {
			this.boundAdjustNav();
		};
		window.addEventListener('resize', this.boundOnResize);
	}

	removeListeners() {
		const scrollTarget = this.scrollContainer || document;

		scrollTarget.removeEventListener('wheel', this.boundOnScroll, true);
		scrollTarget.removeEventListener('scroll', this.boundOnScroll, true);

		document.removeEventListener('mouseup', this.boundOnMouseUp);
		document.removeEventListener('mousedown', this.boundOnMouseDown);

		if (this.boundOnResize) {
			window.removeEventListener('resize', this.boundOnResize);
		}

		if (this._dropdownOutsideClickHandler) {
			document.removeEventListener('click', this._dropdownOutsideClickHandler);
			this._dropdownOutsideClickHandler = null;
		}

		if (this._dropdownRepositionHandler) {
			window.removeEventListener('scroll', this._dropdownRepositionHandler, true);
			window.removeEventListener('resize', this._dropdownRepositionHandler, true);
			this._dropdownOutsideClickHandler = null;
		}

		// Cancel any pending RAF
		if (this._dropdownRafId) {
			cancelAnimationFrame(this._dropdownRafId);
			this._dropdownRafId = null;
		}

		if (this.dropdownList && this.dropdownList.parentNode) {
			this.dropdownList.remove();
			this.dropdownList = null;
		}
	}

	setCookiesOnLinkClick() {
		const allLinks = this._target.querySelectorAll('a');
		allLinks.forEach((link) => {
			link.addEventListener('click', this.createBoundedHandler());
			link.addEventListener('auxclick', this.createBoundedHandler(true));
		});
	}

	createBoundedHandler(aux=false) {
		return this.setCookieOnClick.bind(this, aux);
	}

	setCookieOnClick(t, event) {
		event.preventDefault();
		let prelim_references = this.widgetBody.getAttribute(this.reference);
		const references = this.checkReferences(prelim_references);
		this.setCookie(this.reference, references);
		if (this._fields.url_target || t) {
			window.open(event.currentTarget.href, '_blank');
		}
		else {
			window.location.href = event.currentTarget.href;
		}
	}

	setCookie(name, value) {
		let currentTime = new Date();
		currentTime.setTime(currentTime.getTime() + (7 * 24 * 60 * 60 * 1000));
		document.cookie = name + "=" + (value || "") + "; expires=" + currentTime.toUTCString() + "; path=/";
	}

	checkReferences(p) {
		const currentCookie = this.getReferenceFromCookie(this.reference);
		if (currentCookie) {
			if (this._fields.groupids.length == 0 && this._fields.hostids.length == 0) {
				return currentCookie;
			}
		}
		return p;
	}

	getReferenceFromCookie(name) {
		let cookieString = document.cookie;
		let cookies = cookieString.split(';');
		for (let i = 0; i < cookies.length; i++) {
			const cookie = cookies[i].trim();
			if (cookie.startsWith(this.reference + '=')) {
				const value = cookie.substring(this.reference.length + 1);
				return decodeURIComponent(value);
			}
		}
		return null;
	}

	onScrollDc() {
		requestAnimationFrame(this.boundAdjustNav);
	}

	onMouseDownDc() {
		// Only start polling if we're actually in a scroll area
		// Don't adjust on every click
		this.isMouseDown = true;
		this.pollScrollPosition();
	}

	onMouseUpDc() {
		this.isMouseDown = false;
		if (this.rafId) {
			cancelAnimationFrame(this.rafId);
			this.rafId = null;
		}
		// Don't think we need to adjust on mouse up - it's not needed and can cause problems
		// requestAnimationFrame(this.boundAdjustNav);
	}

	pollScrollPosition() {
		if (!this.isMouseDown) {
			return;
		}
		this.boundAdjustNav();
		this.rafId = requestAnimationFrame(() => this.checkScrollPosition());
	}

	checkScrollPosition() {
		if (!this.isMouseDown) {
			return;
		}
		this.boundAdjustNav();
		this.pollScrollPosition();
	}

	adjustDashboardNavigation() {
		const firstElem = document.querySelector('[data-profile-idx="web.dashboard.filter"]');
		const secondElem = document.querySelector('.dashboard-navigation');

		if (!firstElem || !secondElem) {
			return;
		}

		// Get scroll position from the actual scroll container
		const scrollY = this.scrollContainer === window ? window.scrollY : this.scrollContainer.scrollTop;

		// Get the current position
		const scrollContainerRect = this.scrollContainer.getBoundingClientRect();
		const firstElemRect = firstElem.getBoundingClientRect();
		const secondElemRect = secondElem.getBoundingClientRect();

		// Check if firstElem is stuck at the top (position 0 relative to scroll container)
		const firstElemTopRelative = firstElemRect.top - scrollContainerRect.top;
		const firstElemIsStuck = firstElemTopRelative <= 0;

		// If firstElem is stuck, secondElem should be positioned right below it
		if (firstElemIsStuck) {
			// Use fixed positioning to place it below the filter
			if (secondElem.style.position !== 'fixed') {
				secondElem.style.position = 'fixed';
				secondElem.style.left = `${secondElemRect.left}px`;
				secondElem.style.width = `${secondElem.offsetWidth}px`;
				secondElem.style.zIndex = '501';
				firstElem.style.zIndex = '100';
			}
			// Position it right below the filter element
			secondElem.style.top = `${firstElemRect.bottom}px`;
		}
		else {
			// Filter is not stuck yet, so secondElem can use its natural sticky behavior
			if (secondElem.style.position) {
				secondElem.style.position = '';
				secondElem.style.top = '';
				secondElem.style.left = '';
				secondElem.style.width = '';
				secondElem.style.zIndex = '';
			}
		}
	}
}
