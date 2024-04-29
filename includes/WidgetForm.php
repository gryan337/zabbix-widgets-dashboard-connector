<?php declare(strict_types = 0);

namespace Modules\DashboardConnector\Includes;

use Modules\DashboardConnector\Widget;
use Modules\DashboardConnector\Includes\CWidgetFieldDashboardPatternSelect;
use Modules\DashboardConnector\Includes\CWidgetFieldMultiSelectDashboard;
use Zabbix\Widgets\CWidgetField;
use Zabbix\Widgets\CWidgetForm;
use Zabbix\Widgets\Fields\{
	CWidgetFieldCheckBox,
	CWidgetFieldCheckBoxList,
	CWidgetFieldColor,
	CWidgetFieldIntegerBox,
	CWidgetFieldPatternSelect,
	CWidgetFieldSelect
};


class WidgetForm extends CWidgetForm {

	public function addFields(): self {

		return $this
			->addField(
				(new CWidgetFieldDashboardPatternSelect('dashboards', _('Dashboard pattern')))
					->setFlags(CWidgetField::FLAG_NOT_EMPTY | CWidgetField::FLAG_LABEL_ASTERISK)
			)
#			->addField(
#				(new CWidgetFieldMultiSelectDashboard('dashboardid', _('Dashboards')))
#					->setFlags(CWidgetField::FLAG_NOT_EMPTY | CWidgetField::FLAG_LABEL_ASTERISK)
#					->setMultiple(1)
#			)
			->addField(
				(new CWidgetFieldCheckBox('url_target', _('Open in new tab')))
					->setDefault(0)
			)
			->addField(
				(new CWidgetFieldSelect('font_family', _('Font family'), Widget::FONT_FAMILY))
						->setDefault(3)
			)
			->addField(
				(new CWidgetFieldIntegerBox('font_size', _('Font size'), 10, 48))
					->setDefault(12)
			)
			->addField(
				new CWidgetFieldCheckBoxList('font_style', _('Font style'), [
					Widget::FONT_STYLE_BOLD => _('Bold'),
					Widget::FONT_STYLE_UNDERLINE => _('Underline'),
					Widget::FONT_STYLE_ITALIC => _('Italic'),
				])
			)
			->addField(
				new CWidgetFieldColor('font_color', _('Font color'))
			)
			->addField(
				new CWidgetFieldColor('background_color', _('Background color'))
			)
		;
	}

}
