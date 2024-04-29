# zabbix-widgets-dashboard-connector
A Zabbix UI widget that enables one-click navigation to other global dashboards

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
