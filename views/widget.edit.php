<?php declare(strict_types = 0);

use Modules\DashboardConnector\Includes;
use Modules\DashboardConnector\Includes\CWidgetFieldDashboardPatternSelectView;

$groupids = array_key_exists('groupids', $data['fields'])
	? new CWidgetFieldMultiSelectGroupView($data['fields']['groupids'])
	: null;

(new CWidgetFormView($data))
	->addField(
		(new CWidgetFieldDashboardPatternSelectView($data['fields']['dashboards']))
			->setPlaceholder(_('dashboard pattern'))
	)
	->addField(
		($groupids)
			->setFieldHint(
				makeHelpIcon(_('Host groups specified will be passed to the host navigator widget when clicking the link to the destination dashboard'))
			)
	)
	->addField(array_key_exists('hostids', $data['fields'])
		? (new CWidgetFieldMultiSelectHostView($data['fields']['hostids']))
			->setFilterPreselect([
				'id' => $groupids->getId(),
				'accept' => CMultiSelect::FILTER_PRESELECT_ACCEPT_ID,
				'submit_as' => 'groupid'
			])
			->setFieldHint(
				makeHelpIcon(_('Hosts specified will be passed to the host navigator widget when clicking the link to the destination dashboard'))
			)
		: null
	)
	->addField(
		(new CWidgetFieldCheckBoxView($data['fields']['url_target']))
			->setFieldHint(
				makeHelpIcon(_('Check the box to open the page in a new browser tab'))
			)
	)
	->addField(
		new CWidgetFieldSelectView($data['fields']['font_family'])
	)
	->addField(
		new CWidgetFieldIntegerBoxView($data['fields']['font_size'])
	)
	->addField(
		(new CWidgetFieldCheckBoxListView($data['fields']['font_style']))
			 ->setColumns(3)
	)
	->addField(
		new CWidgetFieldColorView($data['fields']['font_color']),
	)
	->addField(
		new CWidgetFieldColorView($data['fields']['background_color']),
	)
	->addField(
		(new CWidgetFieldColorView($data['fields']['font_color_selected']))
			->setFieldHint(
				makeHelpIcon(_('Selected dashboards will be highlighted with this color.'))
			)
	)
	->includeJsFile('widget.edit.js.php')
	->addJavaScript('widget_dashboard_connector_form.init();')
	->show();

