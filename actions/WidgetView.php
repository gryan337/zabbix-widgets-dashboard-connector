<?php

namespace Modules\DashboardConnector\Actions;

use API;
use CControllerDashboardWidgetView;
use CControllerResponseData;
use CProfile;
use CArrayHelper;

class WidgetView extends CControllerDashboardWidgetView {

	protected function doAction(): void {
		$dashboards = [];
		$dashboard_form_patterns = $this->fields_values['dashboards'];

		// Get Current Dashboard Info
		$url_args = explode('&', $_SERVER['HTTP_REFERER']);
		$current_dashboard_id = '';
		$current_page = '1';
		
		foreach ($url_args as $arg) {
			if (substr($arg, 0, 12) === 'dashboardid=') {
				$db = explode('=', $arg);
				$current_dashboard_id = end($db);
			}
			elseif (substr($arg, 0, 5) === 'page=') {
				$pg = explode('=', $arg);
				$current_page = end($pg);
			}
		}

		// If the URL has no dashboardid, then get it from the user's profile
		if (!$current_dashboard_id) {
			$current_dashboard_id = CProfile::get('web.dashboard.dashboardid');
		}

		$my_dashboard = API::Dashboard()->get([
			'dashboardids' => $current_dashboard_id,
			'selectPages' => ['name']
		]);


		// Get the current dashboard's page name
		foreach ($my_dashboard as $db_details) {
			$page_name_referer = $db_details['pages'][$current_page - 1]['name'];
		}


		// Retrieve all dashboards that the user specified in the form
		foreach ($dashboard_form_patterns as $pattern) {
			$dashboards += API::Dashboard()->get([
				'output' => ['dashboardid', 'name'],
				'search' => [
					'name' => $pattern
				],
				'selectPages' => ['name'],
				'searchWildcardsEnabled' => true,
				'preservekeys' => true
			]);
		}


		// For each dashboard, check if there is a page with the current
		// page name. If so, get that page number. That's the page
		// we'll generate the link for in the view
		$destination_dashboards = [];
		foreach ($dashboards as $dashboardid => $values) {
			$destination_page_num = '0';
			foreach ($values['pages'] as $page_num => $page_values) {
				if ($page_values['name'] == $page_name_referer) {
					$destination_page_num = $page_num;
					break;
				}
			}
			$destination_dashboards[$dashboardid]['page_num'] = $destination_page_num + 1;
			$destination_dashboards[$dashboardid]['name'] = $values['name'];
		}

		// sort ascendingly by dashboard name
		CArrayHelper::sort($destination_dashboards, [['field' => 'name', 'order' => ZBX_SORT_UP]]);

		$this->setResponse(new CControllerResponseData([
			'name' => $this->getInput('name', $this->widget->getName()),
			'fields_values' => $this->fields_values,
			'user' => [
				'debug_mode' => $this->getDebugMode()
			],
			'dashboards' => $destination_dashboards,
		]));
	}


}
