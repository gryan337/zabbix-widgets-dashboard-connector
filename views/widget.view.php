<?php

use Modules\DashboardConnector\Widget;

function addBlankEntry() {
	$blank_div = [];
	$wrapper_base = new ArrayObject();
	$wrapper_base->append('line-height: 75%');
	$wrapper_base->append('margin-left: 20px');
	$blank_div[] = (new CDiv([NBSP()]))
		->addStyle(implode('; ', (array) $wrapper_base));

	return $blank_div;
}

$output = [];
$output['name'] = '';
$output['body'] = [];

if (array_key_exists('name', $this->data) && $this->data['name'] != 'Dashboard connector') {
	$output['name'] = $this->data['name'];
}
else {
	$output['name'] = 'Navigate to other dashboards:';
}

$list = (new CList());
$list->addItem(
	(new CListItem((new CDiv([addBlankEntry()]))))
);

$ref_cookie = array_key_exists("references", $_COOKIE) ? json_decode($_COOKIE['references'], true) : '';

$cookie_hgids = $ref_cookie ? array_values($ref_cookie['hostgroupids']) : [];
$final_hgids = array_values($this->data['fields_values']['groupids'])
	? array_values($this->data['fields_values']['groupids'])
	: $cookie_hgids;

$cookie_hids = $ref_cookie ? array_values($ref_cookie['hostids']) : [];
$final_hids = array_values($this->data['fields_values']['hostids'])
	? array_values($this->data['fields_values']['hostids'])
	: $cookie_hids;

$final_itids = $ref_cookie ? array_values($ref_cookie['itemids']) : [];

$references = [
	'hostids' => $final_hids,
	'hostgroupids' => $final_hgids,
	'itemids' => $final_itids
];

foreach ($this->data['dashboards'] as $dashboardid => $values) {

	$url = (new CUrl('zabbix.php'))
		->setArgument('action', 'dashboard.view')
		->setArgument('dashboardid', $dashboardid)
		->setArgument('page', $values['page_num'])
		->setArgument('from', $this->data['fields_values']['time_period']['from'])
		->setArgument('to', $this->data['fields_values']['time_period']['to']);

	$url_base = [];
	$wrapper_base = new ArrayObject();
	$wrapper_base->append('color: #' . ($values['is_current']
		? $this->data['fields_values']['font_color_selected']
		: $this->data['fields_values']['font_color'])
	);
	$wrapper_base->append('line-height: 100%');
	$wrapper_base->append('margin-left: 20px');

	$url_base[] = (new CDiv([
		($values['is_current'] ? (new CHtmlEntity('&#10147;')) : BULLET()),
		' ',
		$values['name']
	]))
		->addStyle(implode('; ', (array) $wrapper_base));

	$link = ($values['is_current'] ? (new CDiv($url_base)) : (new CLink($url_base, $url)));

	if (!$values['is_current'] && $this->data['fields_values']['url_target']) {
		$link->setTarget('_blank');
	}

	$list->addItem(
		(new CListItem($link))
	);

	$list->addItem(
		(new ClistItem((new CDiv([addBlankEntry()]))))
	);

}

$wrapper = new CDiv($list);
$wrapper->addClass('dashboard-widget-dashboard-connector-wrapper');
$wrapper->setAttribute('references', json_encode($references));

$wrapper_style = new ArrayObject();
$wrapper_style->append('font-family: ' . Widget::FONT_FAMILY[$this->data['fields_values']['font_family']]);
$wrapper_style->append('font-size: ' . $this->data['fields_values']['font_size'] . 'px');
$wrapper_style->append('font-weight: ' . ((in_array(Widget::FONT_STYLE_BOLD, 
	$this->data['fields_values']['font_style']))
		? 'bold'
		: 'normal'
));
$wrapper_style->append('font-style: '. ((in_array(Widget::FONT_STYLE_ITALIC,
	$this->data['fields_values']['font_style']))
		? 'italic'
		: 'normal'
));
$wrapper_style->append('text-decoration: '. ((in_array(Widget::FONT_STYLE_UNDERLINE,
	$this->data['fields_values']['font_style']))
		? 'underline'
		: 'none'
));
$wrapper_style->append('background-color: #' . $this->data['fields_values']['background_color']);
$wrapper_style->append('text-decoration-color: #'. $this->data['fields_values']['font_color']);
$wrapper_style->append('margin: auto');

$wrapper->addStyle(implode('; ', (array) $wrapper_style));

$output['body'][] = $wrapper->toString();

if ($messages = get_and_clear_messages()) {
	$output['messages'] = array_column($messages, 'message');
}

if (array_key_exists('user', $this->data) && $this->data['user']['debug_mode'] == GROUP_DEBUG_MODE_ENABLED) {
	CProfiler::getInstance()->stop();
	$output['debug'] = CProfiler::getInstance()->make()->toString();
}

echo json_encode($output, JSON_THROW_ON_ERROR);
