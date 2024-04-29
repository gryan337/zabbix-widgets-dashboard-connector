<?php declare(strict_types = 0);

namespace Modules\DashboardConnector\Includes;

use Modules\DashboardConnector\Includes\CWidgetFieldMultiSelectDashboard;
use CWidgetFieldMultiSelectView;

class CWidgetFieldMultiSelectDashboardView extends CWidgetFieldMultiSelectView {

	public function __construct(CWidgetFieldMultiSelectDashboard $field) {
		parent::__construct($field);
		$this->field = $field;
	}

	protected function getObjectName(): string {
		return 'dashboard';
	}

	protected function getObjectLabels(): array {
		return ['object' => _('Dashboard'), 'objects' => _('Dashboards')];
	}

	protected function getPopupParameters(): array {
		$parameters = $this->popup_parameters + [
			'srctbl' => 'dashboard',
			'srcfld1' => 'dashboardid',
			'srcfld2' => 'name'
		];

		return $parameters; 
	}
}
