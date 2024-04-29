<?php declare(strict_types = 0);

namespace Modules\DashboardConnector\Includes;

use Zabbix\Widgets\CWidgetField;

class CWidgetFieldDashboardPatternSelect extends CWidgetField {

	public const DEFAULT_VIEW = \CWidgetFieldDashboardPatternSelectView::class;
	public const DEFAULT_VALUE = [];

	public function __construct(string $name, string $label = null) {
		parent::__construct($name, $label);

		$this
			->setDefault(self::DEFAULT_VALUE)
			->setValidationRules(['type' => API_STRINGS_UTF8]);
	}

	public function validate(bool $strict = false): array {
		$errors = parent::validate($strict);

		if ($errors) {
			return $errors;
		}

		if (empty($this->getValue())) {
			$errors[] = _s('Error "%1$s": %2$s.', _('Dashboard pattern'), _('A value is required'));
		}

		return $errors;
	}
}
