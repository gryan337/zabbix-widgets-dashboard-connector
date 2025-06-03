/*
** Copyright (C) 2001-2025 Zabbix SIA
**
** This program is free software: you can redistribute it and/or modify it under the terms of
** the GNU Affero General Public License as published by the Free Software Foundation, version 3.
**
** This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
** without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
** See the GNU Affero General Public License for more details.
**
** You should have received a copy of the GNU Affero General Public License along with this program.
** If not, see <https://www.gnu.org/licenses/>.
**/


class CWidgetSvgGraph extends CWidget {

	static DATASET_TYPE_SINGLE_ITEM = 0;

	#seconds_per_day = 86400;
        #seconds_per_hour = 3600;
        #seconds_per_min = 60;

        #Multiplier = new Map([
                ['Y', 1000**8],
                ['Z', 1000**7],
                ['E', 1000**6],
                ['P', 1000**5],
                ['T', 1000**4],
                ['G', 1000**3],
                ['M', 1000**2],
                ['K', 1000],
                ['B', 1]
        ]);

        #sMultiplier = new Map([
                ['y', 86400 * 365],
                ['M', 86400 * 30],
                ['d', 86400],
                ['h', 3600],
                ['m', 60],
                ['s', 1],
                ['ms', 0.001]
        ]);

	onInitialize() {
		this._has_contents = false;
		this._svg_options = {};
		this._selected_metrics = new Set();
		this.initMetricOverrides();
		this._legend_sort = null;
	}

	initMetricOverrides() {
		this._selected_metric_overrides = {
			units: '',
			min: 0,
			max: 0
		}
	}

	onActivate() {
		this._activateGraph();
	}

	onDeactivate() {
		this._deactivateGraph();
	}

	onResize() {
		if (this._state === WIDGET_STATE_ACTIVE) {
			this._startUpdating();
		}
	}

	onEdit() {
		this._deactivateGraph();
	}

	onFeedback({type, value}) {
		if (type === CWidgetsData.DATA_TYPE_TIME_PERIOD) {
			this._startUpdating();

			this.feedback({time_period: value});

			return true;
		}

		return false;
	}

	promiseUpdate() {
		const time_period = this.getFieldsData().time_period;

		if (!this.hasBroadcast(CWidgetsData.DATA_TYPE_TIME_PERIOD) || this.isFieldsReferredDataUpdated('time_period')) {
			this.broadcast({
				[CWidgetsData.DATA_TYPE_TIME_PERIOD]: time_period
			});
		}

		return super.promiseUpdate();
	}

	getUpdateRequestData() {
		const request_data = super.getUpdateRequestData();

		if (this._selected_metrics.size > 0) {
			request_data.fields.lefty_min_js_override = "0";
			request_data.fields.lefty_max_js_override = this._selected_metric_overrides['max'];
			request_data.fields.lefty_units_js_override = this._selected_metric_overrides['units'];
		}

		for (const [dataset_key, dataset] of request_data.fields.ds.entries()) {
			if (dataset.dataset_type != CWidgetSvgGraph.DATASET_TYPE_SINGLE_ITEM) {
				continue;
			}

			const dataset_new = {
				...dataset,
				itemids: [],
				color: []
			};

			for (const [item_index, itemid] of dataset.itemids.entries()) {
				if (Array.isArray(itemid)) {
					if (itemid.length === 1) {
						dataset_new.itemids.push(itemid[0]);
						dataset_new.color.push(dataset.color[item_index]);
					}
				}
				else {
					dataset_new.itemids.push(itemid);
					dataset_new.color.push(dataset.color[item_index]);
				}
			}

			request_data.fields.ds[dataset_key] = dataset_new;
		}

		if (!this.getFieldsReferredData().has('time_period')) {
			request_data.has_custom_time_period = 1;
		}

		return request_data;
	}

	processUpdateResponse(response) {
		this.clearContents();

		super.processUpdateResponse(response);

		if (response.svg_options !== undefined) {
			this._has_contents = true;

			this._initGraph({
				sbox: false,
				show_problems: true,
				show_simple_triggers: true,
				hint_max_rows: 20,
				min_period: 60,
				...response.svg_options.data
			});
		}
		else {
			this._has_contents = false;
		}
	}

	onClearContents() {
		if (this._has_contents) {
			this._deactivateGraph();

			this._has_contents = false;
		}
	}

	_initGraph(options) {
		this._svg_options = options;
		this._svg = this._body.querySelector('svg');
		this._svg.style.visibility = 'hidden';
		jQuery(this._svg).svggraph(this);

		this._activateGraph();
		this._applyInitialLineVisibility();
		this._setupLegendClickHandlers();
		this._svg.style.visibility = 'visible';

		setTimeout(() => {
			if (this._selected_metrics.size === 0) return;

			const legendContainer = this._body.querySelector('.svg-graph-legend');
			if (!legendContainer) return;

			const legendItems = legendContainer.querySelectorAll('.svg-graph-legend-item');
			const selectedItem = Array.from(legendItems).find(item =>
				this._selected_metrics.has(item.querySelector('span')?.textContent)
			);

			if (selectedItem) {
				const containerRect = legendContainer.getBoundingClientRect();
				const itemRect = selectedItem.getBoundingClientRect();
	
				const offset = itemRect.top - containerRect.top - (containerRect.height / 2) + (itemRect.height / 2);
				legendContainer.scrollTop += offset;
			}
		}, 0);
	}

	_applyInitialLineVisibility() {
		if (this._selected_metrics.size === 0) return;

		const svg = this._svg;
		const allGraphElements = svg.querySelectorAll(
			'g[data-set="line"], g[data-set="bar"], g[data-set="points"], g[data-set="staircase"]'
		);

		allGraphElements.forEach(g => {
			const metric = g.getAttribute('data-metric');
			if (!this._selected_metrics.has(metric)) {
				g.style.display = 'none'; // hide non-selected lines immediately
			}
			else {
				g.style.display = 'block'; // ensure selected line is visible
			}
		});
	}

	_activateGraph() {
		if (this._has_contents) {
			jQuery(this._svg).svggraph('activate');
		}
	}

	_deactivateGraph() {
		if (this._has_contents) {
			jQuery(this._svg).svggraph('deactivate');
		}
	}

	getActionsContextMenu({can_copy_widget, can_paste_widget}) {
		const menu = super.getActionsContextMenu({can_copy_widget, can_paste_widget});

		if (this.isEditMode()) {
			return menu;
		}

		let menu_actions = null;

		for (const search_menu_actions of menu) {
			if ('label' in search_menu_actions && search_menu_actions.label === t('Actions')) {
				menu_actions = search_menu_actions;

				break;
			}
		}

		if (menu_actions === null) {
			menu_actions = {
				label: t('Actions'),
				items: []
			};

			menu.unshift(menu_actions);
		}

		menu_actions.items.push({
			label: t('Download image'),
			disabled: !this._has_contents,
			clickCallback: () => {
				downloadSvgImage(this._svg, 'image.png', '.svg-graph-legend');
			}
		});

		return menu;
	}

	hasPadding() {
		return true;
	}

	_setupLegendClickHandlers() {
		const svg = this._svg;
		const legendItems = this._body.querySelectorAll('.svg-graph-legend-item');
		const hiddenLines = new Map();

		const style = document.createElement('style');
		style.textContent = `
			.svg-graph-legend-item {
				display: flex;
				align-items: center;
				gap: 6px;
			}

			.svg-graph-legend-item span {
				display: inline-block;
				white-space: nowrap;
				overflow: hidden;
				text-overflow: ellipsis;
				max-width: 100%;
				flex: 1;
			}
		`;

		document.head.appendChild(style);

		const tooltip = document.createElement('div');
		Object.assign(tooltip.style, {
			position: 'absolute',
			backgroundColor: 'rgba(60, 60, 60, 0.95)',
			color: 'white',
			padding: '6px 10px',
			borderRadius: '4px',
			fontSize: '13px',
			pointerEvents: 'none',
			whiteSpace: 'nowrap',
			zIndex: '1000',
			boxShadow: '0 2px 6px rgba(0, 0, 0, 0.3)',
			opacity: '0',
			transition: 'opacity 0.2s ease',
		});
		document.body.appendChild(tooltip);

		const showTooltip = (text, event) => {
			tooltip.textContent = text;
			tooltip.style.opacity = '1';
			tooltip.style.left = `${event.pageX + 10}px`;
			tooltip.style.top = `${event.pageY + 10}px`;
		};

		const hideTooltip = () => {
			tooltip.style.opacity = '0';
		};

		const isTextTruncated = (el) => {
			return el.scrollWidth > el.clientWidth;
		};

		const getGraphLine = (metric) => svg.querySelector(`g[data-metric="${metric}"]`);

		const grayOutLegend = (metric, gray = true) => {
			legendItems.forEach(item => {
				const isTarget = item.querySelector('span').textContent === metric;
				item.style.opacity = (gray && !isTarget) ? '0.4' : '1';
			});
		};

		const restoreAllLines = () => {
			hiddenLines.forEach((g, metric) => {
				svg.appendChild(g);
				g.style.display = 'block';
			});
			hiddenLines.clear();
			this._selected_metrics.clear();
			this.initMetricOverrides();
			grayOutLegend(null, false);
		};

		const showOnly = (metric, forceApply = false) => {
			restoreAllLines();
			let rawValues = [];
			const graphLine = getGraphLine(metric);
			this._selected_metric_overrides['units'] = graphLine?.getAttribute('data-units') || '';
			if (graphLine) {
				const labeledElements = graphLine.querySelectorAll('[label]');
				labeledElements.forEach(el => {
					const label = el.getAttribute('label');
					if (label) {
						rawValues.push(...label.split(',').map(s => s.trim()));
					}
				});
			}
			const newValues = rawValues.map(x => this._getNumValue(x));
			this._selected_metric_overrides['max'] = Math.max(...newValues);

			const allGraphElements = svg.querySelectorAll(
				'g[data-set="line"], g[data-set="bar"], g[data-set="points"], g[data-set="staircase"]'
			);

			allGraphElements.forEach(g => {
				const gMetric = g.getAttribute('data-metric');
				if (!forceApply) {
					g.remove();
				}
				else {
					if (gMetric !== metric) {
						hiddenLines.set(gMetric, g);
						g.remove();
					}
				}
			});

			this._selected_metrics.clear();
			this._selected_metrics.add(metric);
			grayOutLegend(metric, true);
		};

		legendItems.forEach(item => {
			item.style.cursor = 'pointer';
			const span = item.querySelector('span');
			const metric = span.textContent;

			item.addEventListener('mouseover', (e) => {
				item.style.backgroundColor = '#3a3f44';
				item.style.color = '#ffffff';

				if (isTextTruncated(span)) {
					showTooltip(metric, e);
				}
			});

			item.addEventListener('mousemove', (e) => {
				if (tooltip.style.opacity === '1') {
					showTooltip(metric, e);
				}
			});

			item.addEventListener('mouseout', () => {
				item.style.backgroundColor = '';
				item.style.color = '';
				hideTooltip();
			});

			item.addEventListener('click', (event) => {
				if (event.ctrlKey) {
					if (this._selected_metrics.size > 0) {
						if (this._selected_metrics.has(metric)) {
							// deselect clicked metric and remove it from this._selected_metrics set
						}
						else {
							// add clicked metric to the this._selected_metrics set
						}
					}
					else {
						// add all metrics to the this._selected_metrics set and remove the clicked metric
					}
				}

				if (this._selected_metrics.has(metric)) {
					this._selected_metrics.clear();
					this.initMetricOverrides();
					this._startUpdating();
				}
				else {
					showOnly(metric);
					this._startUpdating();
				}
			});
		});

		const legendMetrics = Array.from(legendItems).map(item => item.querySelector('span').textContent);

		if (this._selected_metrics.size > 0) {
			const selectedMetric = [...this._selected_metrics][0];

			if (!legendMetrics.includes(selectedMetric)) {
				restoreAllLines();
				this._startUpdating();
			}
			else {
				showOnly(selectedMetric, true);
			}
		}

		this._setupLegendSorting();
	}


	_setupLegendSorting() {
		const legend = this._body.querySelector('.svg-graph-legend-statistic');
		if (!legend) return;

		const headers = Array.from(legend.querySelectorAll('.svg-graph-legend-header'));
		if (headers.length < 3) return;

		headers.forEach(header => {
			header.style.color = '#007bff'; // blue
			header.style.cursor = 'pointer';
			header.style.userSelect = 'none';
			header.style.position = 'relative';
			header.style.paddingRight = '15px';
		});

		headers.forEach(header => {
			const arrow = document.createElement('span');
			arrow.style.position = 'absolute';
			arrow.style.right = '5px';
			arrow.style.top = '50%';
			arrow.style.transform = 'translateY(-50%)';
			arrow.style.fontSize = '0.75em';
			arrow.style.userSelect = 'none';
			arrow.textContent = '↕';
			header.appendChild(arrow);
		});

		let currentSort = { colIndex: null, direction: 1 };

		const sortLegend = (colIndex, forceApply = false) => {
			if (!forceApply) {
				if (this._legend_sort?.colIndex === colIndex) {
					this._legend_sort.direction *= -1;
				}
				else {
					this._legend_sort = {
						colIndex: colIndex,
						direction: 1
					};
				}
			}
			else {
				this._legend_sort = this._legend_sort || {
					colIndex: colIndex,
					direction: 1
				};
			}

			const { colIndex: sortedCol, direction } = this._legend_sort;

			headers.forEach((header, i) => {
				const arrow = header.querySelector('span');
				arrow.textContent = (i === sortedCol)
					? (direction === 1 ? '▲' : '▼')
					: '↕';
			});

			const allDivs = Array.from(legend.children);
			const dataDivs = allDivs.slice(3);

			const groups = [];
			let i = 0;

			while (i < dataDivs.length) {
				const group = [];
				const itemDiv = dataDivs[i];

				if (!itemDiv.classList.contains('svg-graph-legend-item')) {
					break;
				}

				group.push(itemDiv);
				i++;

				while (i < dataDivs.length && !dataDivs[i].classList.contains('svg-graph-legend-item')) {
					group.push(dataDivs[i]);
					i++;
				}

				groups.push(group);
			}

			const isNoDataGroup = (group) => {
				return group.some(div => div.textContent.trim().toLowerCase() === '[no data]');
			};

			const noDataGroups = [];
			const dataGroups = [];

			groups.forEach(group => {
				if (isNoDataGroup(group)) {
					noDataGroups.push(group);
				}
				else {
					dataGroups.push(group);
				}
			});

			dataGroups.sort((a, b) => {
				const aText = a[sortedCol + 1]?.textContent ?? '';
				const bText = b[sortedCol + 1]?.textContent ?? '';

				const aVal = this._getNumValue(aText);
				const bVal = this._getNumValue(bText);

				if (aVal === null && bVal === null) return 0;
				if (aVal === null) return 1 * direction;
				if (bVal === null) return -1 * direction;

				return (aVal < bVal ? -1 : aVal > bVal ? 1 : 0) * direction;
			});

			groups.forEach(group => {
				group.forEach(div => legend.removeChild(div));
			});

			dataGroups.forEach(group => {
				group.forEach(div => legend.appendChild(div));
			});
			noDataGroups.forEach(group => {
				group.forEach(div => legend.appendChild(div));
			});
		};

		headers.forEach((header, idx) => {
			header.addEventListener('click', () => {
				sortLegend(idx);
			});
		});

		if (this._legend_sort) {
			sortLegend(this._legend_sort.colIndex, true);
		}
	}

	_handleDateStr(x, regex) {
                var datematch = x.matchAll(regex);
                for (const match of datematch) {
                        if (match.length > 0) {
                                var epoch = new Date(match.input);
                                return String(Math.floor(epoch.getTime() / 1000));
                        }
                }

                return x;
        }


	_isUptime(x) {
		var uptime_reone = /^([0-9]+)\s*(days?,)\s*([0-9]{2}):([0-9]{2}):([0-9]{2})/g;
		var uptime_retwo = /^([0-9]{2}):([0-9]{2}):([0-9]{2})/g;
		var uptime_matchone = x.matchAll(uptime_reone);
		var uptime_matchtwo = x.matchAll(uptime_retwo);
		for (const match of uptime_matchone) {
			if (match.length > 0) {
				var days = parseInt(match[1]) * this.#seconds_per_day;
				var hours = parseInt(match[3]) * this.#seconds_per_hour;
				var mins = parseInt(match[4]) * this.#seconds_per_min;
				var uptime = days + hours + mins + parseInt(match[5]);
				return String(uptime);
			}
		}

		for (const match of uptime_matchtwo) {
			if (match.length > 0) {
				var hours = parseInt(match[1]) * this.#seconds_per_hour;
				var mins = parseInt(match[2]) * this.#seconds_per_min;
				var uptime = hours + mins + parseInt(match[3]);
				return String(uptime);
			}
		}

		return null;
	}

	_isUnixtime(x) {
		if (x == 'Never') {
			return '0';
		}

		var date_reone = /^(Mon|Tue|Wed|Thus|Fri|Sat|Sun)\s+([0-9]{2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s*([0-9]{4})/g;
		x = this._handleDateStr(x, date_reone);
		if (this._isNumeric(x)) {
			return x;
		}

		var date_retwo = /^([0-9]{4})-([0-9]{2})-([0-9]{2})\s{1,}([0-9]{2}):([0-9]{2}):([0-9]{2})\s*(AM|PM)?/g;
		x = this._handleDateStr(x, date_retwo);
		if (this._isNumeric(x)) {
			return x;
		}

		return null;
	}

	_isSeconds(x) {
		var s_reone = /^(\-?\d*\.?\d*E?\-?\d*)(ms|y|M|d|h|m|s)\s{0,}(\d*\.?\d*)(ms|y|M|d|h|m|s){0,1}\s{0,}(\d*\.?\d*)(ms|y|M|d|h|m|s){0,1}/g;
		var s_retwo = /^< 1 ms/g;
		var s_matchone = x.matchAll(s_reone);
		var s_matchtwo = x.matchAll(s_retwo);
		for (const match of s_matchone) {
			if (match.length > 0) {
				var one = parseFloat(match[1]) * this.#sMultiplier.get(match[2]);
				var two = 0;
				if (match[3] && match[4]) {
					var two = parseFloat(match[3]) * this.#sMultiplier.get(match[4]);
				}

				var three = 0;
				if (match[5] && match[6]) {
					var three = parseFloat(match[5]) * this.#sMultiplier.get(match[6]);
				}

				var s = one + two + three;
				return String(s);
			}
		}

		for (const match of s_matchtwo) {
			if (match.length > 0) {
				return '0';
			}
		}

		return null;
	}


	_checkIfDate(x) {

		let value = x;

		value = this._isUptime(x);
		if (value !== null) return value;

		value = this._isUnixtime(x);
		if (value !== null) return value;

		value = this._isSeconds(x);
		if (value !== null) return value;

		return x;

	}

	_isNumeric(x) {
		return !isNaN(parseFloat(x)) && isFinite(x);
	}

	_getNumValue(x, units = '') {

		if (this._isNumeric(x)) {
			return x;
		}

		if (!units) {
			x = this._checkIfDate(x);
			if (this._isNumeric(x)) {
				return x;
			}
		}
		else {
			switch (units) {
				case 's':
					x = this._isSeconds(x);
					if (x !== null) return parseFloat(value);
				case 'uptime':
					x = this._isUptime(x);
					if (x !== null) return parseFloat(value);
				case 'unixtime':
					x = this._isUnixtime(x);
					if (x !== null) return parseFloat(value);
			}
		}

		if (x == '' || x == null) {
			return 0;
		}

		var splitx = x.split(' ');
		if (splitx.length == 2) {
			var numValue = splitx[0];
			if (!units) {
				var units_in_display = splitx[1];
			}
			else {
				var units_in_display = units;
			}

			if (this._isNumeric(numValue)) {
				if (units_in_display !== undefined) {
					var multiplier = this.#Multiplier.get(units_in_display.charAt(0));

					if (multiplier) {
						return parseFloat(numValue) * multiplier;
					}

					return parseFloat(numValue);
				}

				return parseFloat(numValue);
			}

			return 0;
		}
		else {
			if (splitx.length == 1) {
				var numValue = splitx[0];
				if (this._isNumeric(numValue)) {
					return parseFloat(numValue);
				}

				return 0;
			}

			return 0;
		}

		return 0;

	}

}
