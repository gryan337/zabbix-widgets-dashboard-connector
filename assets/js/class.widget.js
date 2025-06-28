class CWidgetDashboardConnector extends CWidget {
	hasPadding() {
		return false;
	}

	setContents(response) {
		super.setContents(response);

		this.lastScrollY = window.scrollY;
		this.widgetBody = this._target.getElementsByClassName('dashboard-widget-dashboard-connector-wrapper').item(0);
		this.reference = "references";
		this.setCookiesOnLinkClick();

		this.original_cookie = this.getReferenceFromCookie(this.reference);

		[
			document.querySelector('[data-profile-idx="web.dashboard.filter"]'),
			document.querySelector('[data-profile-idx="web.dashboard.filter"]')?.previousElementSibling,
			document.querySelector(".host-dashboard-header-navigation"),
			document.querySelector(".dashboard-navigation")
		].map(el => el instanceof HTMLElement && el.classList.add('sticky-ts'));

		this.timeContainer = document.querySelector('.time-selection-container');

		const observer = new MutationObserver(mutations => {
			mutations.forEach(mutation => {
				if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
					const currentHeight = window.getComputedStyle(this.timeContainer).height;
					this.adjustDashboardNavigation();
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
		this.attachListeners();
	}

	attachListeners() {
		document.addEventListener('wheel', this.boundOnScroll);
		document.addEventListener('scroll', this.boundOnScroll);
		document.addEventListener('mouseup', this.boundOnMouseUp);
		document.addEventListener('mousedown', this.boundOnMouseDown);
	}

	removeListeners() {
		document.removeEventListener('wheel', this.boundOnScroll);
		document.removeEventListener('scroll', this.boundOnScroll);
		document.removeEventListener('mouseup', this.boundOnMouseUp);
		document.removeEventListener('mousedown', this.boundOnMouseDown);
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
		requestAnimationFrame(this.adjustDashboardNavigation);
	}

	onMouseDownDc() {
		this.pollScrollPosition();
	}

	onMouseUpDc() {
		if (this.rafId) {
			cancelAnimationFrame(this.rafId);
			this.rafId = null;
		}
		requestAnimationFrame(this.adjustDashboardNavigation);
	}

	pollScrollPosition() {
		this.rafId = requestAnimationFrame(() => this.checkScrollPosition());
	}

	checkScrollPosition() {
		this.adjustDashboardNavigation();
		this.pollScrollPosition();
	}

	adjustDashboardNavigation() {
		const firstElem = document.querySelector('[data-profile-idx="web.dashboard.filter"]');
		const secondElem = document.querySelector('.dashboard-navigation');

		const firstElemBottom = firstElem.getBoundingClientRect().bottom;
		const secondElemTop = secondElem.getBoundingClientRect().top;

		if (secondElemTop <= firstElemBottom) {
			secondElem.style.position = 'absolute';
			secondElem.style.top = `${firstElemBottom}px`;
			secondElem.style.zIndex = '99';
		}
		else {
			secondElem.style.position = '';
			secondElem.style.top = '';
			secondElem.style.zIndex = '';
		}
	}
}
