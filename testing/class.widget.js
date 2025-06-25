diff --git root/WidgetView.php actions/WidgetView.php
index 8d66d14..5a9ce42 100644
--- root/WidgetView.php
+++ actions/WidgetView.php
@@ -22,6 +22,7 @@ use API,
 	CControllerDashboardWidgetView,
 	CControllerResponseData,
 	CItemHelper,
+	CMacrosResolverHelper,
 	Manager;
 
 use Widgets\PieChart\Includes\{
@@ -479,24 +480,68 @@ class WidgetView extends CControllerDashboardWidgetView {
 	private static function getMetricsData(array &$metrics, array $time_period, bool $legend_aggregation_show,
 			string $templateid, string $override_hostid): void {
 		$dataset_metrics = [];
+		$agg_ds_names = [];
 
-		file_put_contents('/var/log/test.log', print_r($metrics, true));
 		foreach ($metrics as $metric_num => &$metric) {
 			$dataset_num = $metric['data_set'];
+			if (!array_key_exists($dataset_num, $agg_ds_names)) {
+				$agg_ds_names[$dataset_num] = [];
+			}
+
+			$resolved = CMacrosResolverHelper::resolveItemBasedWidgetMacros(
+				[$metric['itemid'] => $metric + ['label' => $metric['options']['data_set_label']]],
+				['label' => 'label']
+			);
+			$resolved_value = $resolved[$metric['itemid']]['label'];
 
 			if ($metric['options']['dataset_aggregation'] == AGGREGATE_NONE) {
 				if ($legend_aggregation_show) {
 					$name = CItemHelper::getAggregateFunctionName($metric['options']['aggregate_function']).
 						'('.$metric['hosts'][0]['name'].NAME_DELIMITER.$metric['name'].')';
+					$ds_func = CItemHelper::getAggregateFunctionName($metric['options']['aggregate_function']);
+					if ($metric['options']['data_set_label'] !== '') {
+						if ($resolved_value !== null && $resolved_value !== '' && $resolved_value !== '*UNKNOWN*') {
+							$name = $ds_func.'('.$resolved_value.')';
+						}
+						else if ($resolved_value === $metric['options']['dataset_label']) {
+							$name = $ds_func.'('.$metric['options']['data_set_label'].')';
+						}
+						else {
+							$name = $ds_func.'('.$metric['hosts'][0]['name'].NAME_DELIMITER.$metric['name'].')';
+						}
+					}
 				}
 				else {
-					$name = $metric['hosts'][0]['name'].NAME_DELIMITER.$metric['name'];
+					if ($metric['options']['data_set_label'] !== '') {
+						if ($resolved_value !== null && $resolved_value !== '' && $resolved_value !== '*UNKNOWN*') {
+							$name = $resolved_value;
+						}
+						else if ($resolved_value === $metric['options']['dataset_label']) {
+							$name = $metric['options']['data_set_label'];
+						}
+						else {
+							$name = $metric['hosts'][0]['name'].NAME_DELIMITER.$metric['name'];
+						}
+					}
+					else {
+						$name = $metric['hosts'][0]['name'].NAME_DELIMITER.$metric['name'];
+					}
 				}
 			}
 			else {
-				$name = $metric['options']['data_set_label'] !== ''
-					? $metric['options']['data_set_label']
-					: _('Data set').' #'.($dataset_num + 1);
+				if ($resolved_value !== null && $resolved_value !== '' && $resolved_value !== '*UNKNOWN*') {
+					$agg_ds_names[$dataset_num][] = $resolved_value;
+				}
+
+				$unique_agg_ds_names = array_unique($agg_ds_names[$dataset_num]);
+				if ($unique_agg_ds_names) {
+					$name = implode(', ', $unique_agg_ds_names);
+				}
+				else {
+					$name = $metric['options']['data_set_label'] !== ''
+						? $metric['options']['data_set_label']
+						: _('Data set').' #'.($dataset_num + 1);
+				}
 			}
 
 			$item = [
@@ -515,12 +560,37 @@ class WidgetView extends CControllerDashboardWidgetView {
 				}
 			}
 			else {
+				$metrics[$dataset_metrics[$dataset_num]]['name'] = $name;
 				$metrics[$dataset_metrics[$dataset_num]]['items'][] = $item;
 				unset($metrics[$metric_num]);
 			}
 		}
 		unset($metric);
 
+		$merged = [];
+		$unmerged = [];
+		foreach ($metrics as $array) {
+			if ($array['options']['itemname_aggregation'] == AGGREGATE_NONE) {
+				$unmerged[] = $array;
+				continue;
+			}
+
+			$key = $array['name'] . '|' . $array['data_set'];
+
+			if (!isset($merged[$key])) {
+				$merged[$key] = $array;
+			}
+			else {
+				$merged[$key]['items'] = array_merge($merged[$key]['items'], $array['items']);
+			}
+		}
+
+		$metrics = $unmerged;
+		foreach ($merged as $a) {
+			$metrics[] = $a;
+		}
+
+		file_put_contents('/var/log/test.log', print_r($metrics, true));
 		foreach ($metrics as &$metric) {
 			if ($templateid !== '' && $override_hostid === '') {
 				continue;
@@ -536,7 +606,16 @@ class WidgetView extends CControllerDashboardWidgetView {
 
 			$values = array_column($values, 'value');
 
-			switch($metric['options']['dataset_aggregation']) {
+			$agg = AGGREGATE_NONE;
+			if (($temp = $metric['options']['itemname_aggregation']) !== AGGREGATE_NONE) {
+				$agg = $temp;
+			}
+
+			if (($temp = $metric['options']['dataset_aggregation']) !== AGGREGATE_NONE) {
+				$agg = $temp;
+			}
+
+			switch($agg) {
 				case AGGREGATE_MAX:
 					$metric['value'] = max($values);
 					break;
diff --git root/CWidgetFieldDataSet.php includes/CWidgetFieldDataSet.php
index 7318fd6..7a49ee0 100644
--- root/CWidgetFieldDataSet.php
+++ includes/CWidgetFieldDataSet.php
@@ -57,6 +57,7 @@ class CWidgetFieldDataSet extends CWidgetField {
 				'references'			=> ['type' => API_STRINGS_UTF8],
 				'color'					=> ['type' => API_COLOR, 'flags' => API_REQUIRED | API_NOT_EMPTY],
 				'aggregate_function'	=> ['type' => API_INT32, 'flags' => API_REQUIRED, 'in' => implode(',', [AGGREGATE_MIN, AGGREGATE_MAX, AGGREGATE_AVG, AGGREGATE_COUNT, AGGREGATE_SUM, AGGREGATE_FIRST, AGGREGATE_LAST])],
+				'itemname_aggregation'	=> ['type' => API_INT32, 'flags' => API_REQUIRED, 'in' => implode(',', [AGGREGATE_NONE, AGGREGATE_MIN, AGGREGATE_MAX, AGGREGATE_AVG, AGGREGATE_COUNT, AGGREGATE_SUM])],
 				'dataset_aggregation'	=> ['type' => API_INT32, 'flags' => API_REQUIRED, 'in' => implode(',', [AGGREGATE_NONE, AGGREGATE_MIN, AGGREGATE_MAX, AGGREGATE_AVG, AGGREGATE_COUNT, AGGREGATE_SUM])],
 				'type'					=> ['type' => API_INTS32, 'flags' => null, 'in' => implode(',', [self::ITEM_TYPE_NORMAL, self::ITEM_TYPE_TOTAL])],
 				'data_set_label'		=> ['type' => API_STRING_UTF8, 'length' => 255]
@@ -81,6 +82,7 @@ class CWidgetFieldDataSet extends CWidgetField {
 			'itemids' => [],
 			'color' => self::DEFAULT_COLOR,
 			'aggregate_function' => AGGREGATE_LAST,
+			'itemname_aggregation' => AGGREGATE_NONE,
 			'dataset_aggregation' => AGGREGATE_NONE,
 			'type' => [],
 			'data_set_label' => ''
@@ -184,9 +186,9 @@ class CWidgetFieldDataSet extends CWidgetField {
 
 		if ($total_item_count > 0) {
 			foreach ($value as $data) {
-				if ($data['dataset_aggregation'] !== AGGREGATE_NONE) {
+				if ($data['dataset_aggregation'] !== AGGREGATE_NONE || $data['itemname_aggregation'] !== AGGREGATE_NONE) {
 					$errors[] =
-						_('Cannot set "Data set aggregation" when item with type "Total" is added to the chart.');
+						_('Cannot set "Data set aggregation" or "Item name aggregation" when item with type "Total" is added to the chart.');
 					break;
 				}
 			}
@@ -203,6 +205,7 @@ class CWidgetFieldDataSet extends CWidgetField {
 		$dataset_fields = [
 			'dataset_type' => ZBX_WIDGET_FIELD_TYPE_INT32,
 			'aggregate_function' => ZBX_WIDGET_FIELD_TYPE_INT32,
+			'itemname_aggregation' => ZBX_WIDGET_FIELD_TYPE_INT32,
 			'dataset_aggregation' => ZBX_WIDGET_FIELD_TYPE_INT32,
 			'data_set_label' => ZBX_WIDGET_FIELD_TYPE_STR
 		];
diff --git root/CWidgetFieldDataSetView.php includes/CWidgetFieldDataSetView.php
index 11dfe0c..f53f666 100644
--- root/CWidgetFieldDataSetView.php
+++ includes/CWidgetFieldDataSetView.php
@@ -315,6 +315,27 @@ class CWidgetFieldDataSetView extends CWidgetFieldView {
 									->setWidth(ZBX_TEXTAREA_TINY_WIDTH)
 							)
 						])
+						->addItem([
+							new CLabel([
+								_('Item name aggregation'),
+								makeHelpIcon(_('Aggregates by item name in the data set.'))
+							], 'label-'.$field_name.'_'.$row_num.'_itemname_aggregation'),
+							new CFormField(
+								(new CSelect($field_name.'['.$row_num.'][itemname_aggregation]'))
+									->setId($field_name.'_'.$row_num.'_itemname_aggregation')
+									->setFocusableElementId('label-'.$field_name.'_'.$row_num.'_itemname_aggregation')
+									->setValue((int) $value['itemname_aggregation'])
+									->addOptions(CSelect::createOptionsFromArray([
+										AGGREGATE_NONE => CItemHelper::getAggregateFunctionName(AGGREGATE_NONE),
+										AGGREGATE_MIN => CItemHelper::getAggregateFunctionName(AGGREGATE_MIN),
+										AGGREGATE_MAX => CItemHelper::getAggregateFunctionName(AGGREGATE_MAX),
+										AGGREGATE_AVG => CItemHelper::getAggregateFunctionName(AGGREGATE_AVG),
+										AGGREGATE_COUNT => CItemHelper::getAggregateFunctionName(AGGREGATE_COUNT),
+										AGGREGATE_SUM => CItemHelper::getAggregateFunctionName(AGGREGATE_SUM)
+									]))
+									->setWidth(ZBX_TEXTAREA_TINY_WIDTH)
+							)
+						])
 						->addItem([
 							new CLabel([
 								_('Data set aggregation'),
diff --git root/widget.edit.js.php views/widget.edit.js.php
index 21c099b..ba45025 100644
--- root/widget.edit.js.php
+++ views/widget.edit.js.php
@@ -750,6 +750,7 @@ window.widget_pie_chart_form = new class {
 			}
 
 			for (let k = 0; k < datasets.length; k++) {
+				document.querySelector(`[name="ds[${k}][itemname_aggregation]"]`).disabled = is_total;
 				document.querySelector(`[name="ds[${k}][dataset_aggregation]"]`).disabled = is_total;
 			}
 		}
