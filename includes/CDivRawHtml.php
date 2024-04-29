<?php

namespace Modules\DashboardConnector\Includes;

use CTag;

class CDivRawHtml extends CTag
{
    public function __construct($items = null)
    {
        parent::__construct('div', true);

		$this->addItem($items);
    }

    public function addRawHtml($value)
	{
		array_push($this->items, $value);

		return $this;
	}
}
