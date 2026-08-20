<?php declare(strict_types = 0);

namespace Modules\DashboardConnector\Actions;

use API,
	CController,
	CControllerResponseData,
	CSettingsHelper;

/**
 * Autocomplete backend for the dashboard pattern-select field.
 *
 * Reproduces jsrpc.php?method=patternselect.get with object_name=dashboards
 * so the module does not depend on a patched core jsrpc.php
 *
 * Response shape (consumed by js/multiselect.js):
 *    { "result": [ { "name": "...", "id": "..." }, ... ] }
 */

class DashboardPatternSelect extends CController {

	protected function init(): void {
		$this->disableCsrfValidation();
	}

	protected function checkInput(): bool {
		$fields = [
			'search' =>				'string',
			'limit' =>				'int32',
			'wildcard_allowed' =>			'in 0,1'
		];

		$ret = $this->validateInput($fields);

		if (!$ret) {
			$this->setResponse(new CControllerResponseData([
				'main_block' => json_encode(['result' => []])
			]));
		}

		return $ret;
	}

	protected function checkPermissions(): bool {
		// Match jsrpc.php: no explicit gate; API::Dashboard()->get() enforces
		// per-object visibility for the current user.
		return true;
	}

	protected function doAction(): void {
		$search = $this->getInput('search', '');
		$search = ($search !== '') ? $search : null;

		$wildcard_enabled = $this->getInput('wildcard_allowed', 0) == 1
			&& $search !== null
			&& strpos($search, '*') !== false;

		$options = [
			'output' => ['name'],
			'search' => ['name' => $search.($wildcard_enabled ? '*' : '')],
			'searchWildcardsEnabled' => $wildcard_enabled,
			'preservekeys' => true,
			'sortfield' => 'name',
			'limit' => CSettingsHelper::get(CSettingsHelper::SEARCH_LIMIT)
		];

		$db_result = API::Dashboard()->get($options);

		// The typed pattern itself is always the first suggestion (mirrors the
		// shared post-processing at the tail of core patternselect.get).
		$result = [[
			'name' => (string) $search,
			'id' => (string) $search
		]];

		if ($db_result) {
			$names = array_flip(array_column($db_result, 'name'));
			unset($names[$search]);

			if ($this->hasInput('limit')) {
				$names = array_slice($names, 0, (int) $this->getInput('limit'));
			}

			foreach (array_keys($names) as $name) {
				$result[] = [
					'name' => (string) $name,
					'id' => (string) $name
				];
			}
		}

		$this->setResponse(new CControllerResponseData([
			'main_block' => json_encode(['result' => $result])
		]));
	}
}
