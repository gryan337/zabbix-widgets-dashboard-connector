<?php declare(strict_types = 0);

namespace Modules\DashboardConnector\Includes;

use Zabbix\Widgets\CWidgetField;
use Modules\DashboardConnector\Includes\CWidgetFieldDashboardPatternSelect;
use CWidgetFieldView;
use CPatternSelect;

class CWidgetFieldDashboardPatternSelectView extends CWidgetFieldView {

	private string $placeholder = '';

	public function __construct(CWidgetFieldDashboardPatternSelect $field) {
		$this->field = $field;
	}

	public function setPlaceholder(string $placeholder): self {
		$this->placeholder = $placeholder;

		return $this;
	}

	public function getFocusableElementId(): string {
		return zbx_formatDomId($this->field->getName().'[]').'_ms';
	}

	public function getView(): CPatternSelect {
		return (new CPatternSelect([
			'name' => $this->field->getName().'[]',
			'object_name' => 'dashboards',
			'data' => $this->field->getValue(),
			'placeholder' => $this->placeholder,
			'wildcard_allowed' => 1,
			'popup' => [
				'parameters' => [
					'srctbl' => 'dashboard',
					'srcfld1' => 'dashboardid',
					'dstfrm' => $this->form_name,
					'dstfld1' => zbx_formatDomId($this->field->getName().'[]')
				]
			],
			'add_post_js' => false
		]))
			->setWidth(ZBX_TEXTAREA_STANDARD_WIDTH)
			->setEnabled(!$this->isDisabled())
			->setAriaRequired($this->isRequired());
	}

	public function getJavaScript(): string {
		$field_id = zbx_formatDomId($this->field->getName().'[]');

		return 'jQuery("#'.$field_id.'").multiSelect();';
	}
}
