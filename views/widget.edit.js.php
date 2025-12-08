<?php declare(strict_types = 0);

use Modules\DashboardConnector\Includes\WidgetForm;

?>

window.widget_dashboard_connector_form = new class extends CWidgetForm {

	init() {
		this._form = this.getForm();
		this._display_style_select = this._form.querySelector('#display_style');
		this._display_style_input = this._form.querySelector('input[name="display_style"]');

		this._fields_to_toggle = [
			'font_family',
			'font_size',
			'font_style',
			'font_color',
			'background_color',
			'font_color_selected'
		];

		this.updateForm();

		this._display_style_input.addEventListener('change', () => {
			this.updateForm();
		});

		const display_style_list = this._display_style_select.querySelector('ul.list');
		if (display_style_list) {
			display_style_list.addEventListener('click', (e) => {
				if (e.target.tagName === 'LI') {
					setTimeout(() => {
						this.updateForm();
					}, 50);
				}
			});
		}

	}

	updateForm() {
		const display_style_value = this._display_style_input.value;
		const should_hide = display_style_value === '1';

		this._fields_to_toggle.forEach(field_id => {
			this.toggleField(field_id, should_hide);
		});
	}

	toggleField(field_id, should_hide) {
		let label = null;

		if (field_id === 'font_style') {
			label = this._form.querySelector(`label[for="${field_id}"]`);
		}
		else if (field_id.includes('color')) {
			label = this._form.querySelector(`label[for="lbl_${field_id}"]`);
		}
		else {
			label = this._form.querySelector(`label[for="label-${field_id}"]`) ||
				this._form.querySelector(`label[for="${field_id}"]`);
		}

		let form_field = null;
		if (label) {
			form_field = label.nextElementSibling;
			while (form_field && !form_field.classList.contains('form-field')) {
				form_field = form_field.nextElementSibling;
			}
		}

		if (label) {
			label.style.display = should_hide ? 'none' : '';
		}

		if (form_field) {
			form_field.style.display = should_hide ? 'none' : '';
		}

		if (form_field) {
			const inputs = form_field.querySelectorAll('input, select, button, textarea');
			inputs.forEach(input => {
				if (field_id === 'font_style' && input.type === 'hidden' && input.name === 'font_style') {
					return;
				}

				if (should_hide) {
					input.disabled = true;
				}
				else {
					input.disabled = false;
				}
			});
		}
	}

};
