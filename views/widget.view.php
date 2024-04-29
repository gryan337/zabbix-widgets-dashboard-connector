<?php

use Modules\DashboardConnector\Widget;
use Modules\DashboardConnector\Includes\CDivRawHtml;


$output = [];
$output['name'] = '';
$output['body'] = [];

$title = array_key_exists('name', $this->data) && $this->data['name'] != 'Dashboard connector'
	? $this->data['name']
	: 'Navigate to other dashboards:';

$title_style = new ArrayObject();
$title_style->append('line-height: normal');
$title_base = [
	(new CDiv($title))
		->addStyle(implode('; ', (array) $title_style))
];

$list = (new CList([
	(new CListItem([$title_base, BR()]))
]));

foreach ($this->data['dashboards'] as $dashboardid => $values) {

	$url = (new CUrl('zabbix.php'))
		->setArgument('action', 'dashboard.view')
		->setArgument('dashboardid', $dashboardid)
		->setArgument('page', $values['page_num']);

	$url_base = [];
	$wrapper_base = new ArrayObject();
	$wrapper_base->append('color: #' . $this->data['fields_values']['font_color']);
	$wrapper_base->append('line-height: 170%');
	$wrapper_base->append('margin-left: 20px');
	$wrapper_base->append(ZBX_STYLE_LIST_DASHED);

	$url_base[] = (new CDiv([BULLET(), ' ', $values['name']]))
		->addStyle(implode('; ', (array) $wrapper_base));

	$link = (new CLink($url_base, $url));
	if ($this->data['fields_values']['url_target']) {
		$link->setTarget('_blank');
	}

	$list->addItem(
		(new CListItem([$link]))
	);

}

$wrapper = new CDiv($list);
$wrapper->addClass('dashboard-widget-dashboard-connector-wrapper');

$wrapper_style = new ArrayObject();
$wrapper_style->append('font-family: ' . Widget::FONT_FAMILY[$this->data['fields_values']['font_family']]);
$wrapper_style->append('font-size: ' . $this->data['fields_values']['font_size'] . 'px');
$wrapper_style->append('font-weight: ' . ((in_array(Widget::FONT_STYLE_BOLD, $this->data['fields_values']['font_style']))
	? 'bold'
	: 'normal'));

$wrapper_style->append('font-style: '. ((in_array(Widget::FONT_STYLE_ITALIC, $this->data['fields_values']['font_style']))
	? 'italic'
	: 'normal'));

$wrapper_style->append('text-decoration: '. ((in_array(Widget::FONT_STYLE_UNDERLINE, $this->data['fields_values']['font_style']))
	? 'underline'
	: 'none'));

$wrapper_style->append('background-color: #' . $this->data['fields_values']['background_color']);
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
