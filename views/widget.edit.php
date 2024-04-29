<?php declare(strict_types = 0);

use Modules\DashboardConnector\Includes;
use Modules\DashboardConnector\Includes\CWidgetFieldDashboardPatternSelectView;
use Modules\DashboardConnector\Includes\CWidgetFieldMultiSelectDashboardView;


(new CWidgetFormView($data))
	->addField(
		(new CWidgetFieldDashboardPatternSelectView($data['fields']['dashboards']))
			->setPlaceholder(_('dashboard pattern'))
	)
#	->addField(
#		(new CWidgetFieldMultiSelectDashboardView($data['fields']['dashboardid']))
#	)
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
		'js-row-bg-color'
	)
	->addField(
		new CWidgetFieldColorView($data['fields']['background_color']),
	)
	->includeJsFile('widget.edit.js.php')
	->addJavaScript('widget_dashboard_connector_form.init();')
	->show();

