<?php declare(strict_types = 0);

namespace Modules\DashboardConnector\Includes;

use CPatternSelect,
	CUrl;

/**
 * A CPatternSelect whose type-ahead calls a module-owned action instead of
 * core jsrpc.php (stock jsrpc.php has no 'dashboards' object in
 * patternselect.get).
 */

class CDashboardPatternSelect extends CPatternSelect {

	public function __construct(array $options = []) {
		parent::__construct($options);

		// After CPatternSelect::__construct() this attribute is a JSON string.
		$params = json_decode($this->getAttribute('data-params'), true);

		$params['url'] = (new CUrl('zabbix.php'))
			->setArgument('action', 'dashboardconnector.dashboard.patternselect')
			->setArgument('wildcard_allowed', 1)
			->getUrl();

		$this-setAttribute('data-params', json_encode($params));
	}
}
