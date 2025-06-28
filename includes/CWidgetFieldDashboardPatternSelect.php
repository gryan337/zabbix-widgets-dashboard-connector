<?php declare(strict_types = 0);

namespace Modules\DashboardConnector\Includes;

use Zabbix\Widgets\CWidgetField;
use API;

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

		$value = $this->getValue();
		if (empty($value)) {
			$errors[] = _s('Error "%1$s": %2$s.', _('Dashboard pattern'), _('A value is required'));
		}

		$field_value = [];
		foreach ($value as $val) {
			if (is_numeric($val)) {
				$db = API::Dashboard()->get([
					'dashboardids' => $val,
					'output' => ['name']
				]);

				if ($db) {
					$field_value[] = $db[0]['name'];
				}
				else {
					$field_value[] = $val;
				}
			}
			else {
				$field_value[] = $val;
			}
		}

		$this->setValue($field_value);

		return $errors;
	}
}
