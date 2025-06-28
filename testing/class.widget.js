        function repositionHintBox(e, graph) {
                var hbox = jQuery(graph.hintBoxItem);

                // Ensure hbox is in <body> and not inside a nested widget
                if (!hbox.parent().is('body')) {
                        hbox.appendTo(document.body);
                }

                // Use viewport-relative positioning
                const mouse_distance = 15,
                        page_bottom = jQuery(window.top).scrollTop() + jQuery(window.top).height();

                const left = (document.body.clientWidth >= e.clientX + hbox.outerWidth() + mouse_distance)
                        ? e.clientX + mouse_distance
                        : e.clientX - mouse_distance - hbox.outerWidth();

                let top = e.pageY;
                top = page_bottom >= top + hbox.outerHeight() + mouse_distance
                        ? top + mouse_distance
                        : top - mouse_distance - hbox.outerHeight();

                // Ensure it's not above the top edge
                if (top < 0) top = 0;

                // Apply styles
                hbox.css({
                        'left': left,
                        'top': top,
                        'z-index': 9999,
                        'position': 'absolute',
                        'pointer-events': 'auto'
                });
        }


....

                if (html !== null) {
                        if (hbox === null) {
                                hbox = hintBox.createBox(e, graph, html, '', false, false,
//                                      graph.closest('.dashboard-grid-widget-container'), false
//                              );
                                        jQuery('<div>'), false // avoid widget container
                                ).appendTo(document.body)
