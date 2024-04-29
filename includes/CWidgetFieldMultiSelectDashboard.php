<?php declare(strict_types = 0);

namespace Modules\DashboardConnector\Includes;

use Zabbix\Widgets\Fields\CWidgetFieldMultiSelect;

class CWidgetFieldMultiSelectDashboard extends CWidgetFieldMultiSelect {

	public const DEFAULT_VIEW = \CWidgetFieldMultiSelectDashboardView::class;
	public const DEFAULT_VALUE = [];

	public function __construct(string $name, string $label = null) {
		parent::__construct($name, $label);

		$this->inaccessible_caption = _('Inaccessible dashboard');

		$this->setSaveType = ZBX_WIDGET_FIELD_TYPE_ITEM;
	}

	public function validate(bool $strict = false): array {
		$errors = parent::validate($strict);

                if ($errors) {
                        return $errors;
                }

                if (empty($this->getValue())) {
                        $errors[] = _s('Error "%1$s": %2$s.', _('Dashboards'), _('A value is required'));
                }

                return $errors;
        }
}
