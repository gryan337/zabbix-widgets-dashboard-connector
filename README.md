# zabbix-widgets-dashboard-connector
A Zabbix UI widget that enables one-click navigation to other global dashboards


## Required Zabbix version

 - Zabbix 7.0 or higher. Choose the branch that matches your Zabbix version

## Purpose

- We need one click navigation to other global dashboards. Additionally, we need other features like the ability to preserve the time selection across dashboards. This widget also leverages the cookies created by the [zabbix-widgets-host-and-group-navigator](https://github.com/gryan337/zabbix-widgets-host-and-group-navigator).


## Functionality

 - Enables one-click navigation to global dashboards defined in the configuration
 - Preserves the time selection chosen when clicking to navigate to another dashboard
 - Accepts hosts or hostgroups from connected widgets or from a predefined list (in the widget configuration). The host groups or hosts passed to this widget will cause a cookie to be set. If the destination dashboard is using the [zabbix-widgets-host-and-group-navigator](https://github.com/gryan337/zabbix-widgets-host-and-group-navigator) the passed host groups/hosts will automatically be selected in the destination dashboard. The use case this solves is if you have many global dashboards that require navigating to frequently, and you don't want to have to keep re-selecting the same host group and/or host over and over again.
 - This widget makes the dashboard time selector and dashboard pages/tabs "sticky" on the dashboard. Thus, even if you don't want a one-click navigation widget on your dashboard, but you want a sticky time selector and navigation tabs, this widget can be useful to you.

## Installation Instructions

 - Clone this repo into the `ui/modules/` folder (standard path is `/usr/share/zabbix/modules/` from RPM installations)
 - Go to Zabbix URL -> Administration -> General -> Modules
 - Select `Scan directory` from the top right of the page
 - Find the `Dashboard connector` widget and enable it on the right


## Known issues

Unfortunately, the CPatternSelect field this widget uses calls the jsrpc.php file, which does not have handling for dashboard.get() API calls. Until I can properly handle this entirely in the module, you can optionally modify the /usr/share/zabbix/ui/jsrpc.php file under the section that has case patternselect.get:


    case 'dashboards':
        $options = [
            'output' => ['name'],
            'search' => ['name' => $search.($wildcard_enabled ? '*' : '')],
            'searchWildcardsEnabled' => $wildcard_enabled,
            'sortfield' => 'name',
            'limit' => $limit
        ];

        $db_result = API::Dashboard()->get($options);
        break;

This modification would have to be added everytime you upgrade your Zabbix version.
