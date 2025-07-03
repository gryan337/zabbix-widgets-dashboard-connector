diff --git a/actions/MotdForm.php b/actions/MotdForm.php
index 48d46fb..f49f6ad 100644
--- a/actions/MotdForm.php
+++ b/actions/MotdForm.php
@@ -40,7 +40,8 @@ class MotdForm extends BaseAction
             'name' => '',
             'show_since' => '',
             'active_since' => strtotime('now'),
-            'active_till' => strtotime('now + 1 day'),
+           'active_till' => strtotime('now + 1 day'),
+           'active_since_color' => '',
             'repeat' => Message::REPEAT_DISABLED,
             'message' => '',
             'submit_action' => 'motd.form.submit',
diff --git a/actions/MotdFormSubmit.php b/actions/MotdFormSubmit.php
index 2ee23b1..8ddb081 100644
--- a/actions/MotdFormSubmit.php
+++ b/actions/MotdFormSubmit.php
@@ -36,7 +36,8 @@ class MotdFormSubmit extends BaseAction
             'status'                => 'in '.implode(',', [Message::STATUS_DISABLED, Message::STATUS_ENABLED]),
             'name'                  => 'required|not_empty|string',
             'active_since'          => 'required|abs_time',
-            'active_till'           => 'required|abs_time',
+           'active_till'           => 'required|abs_time',
+           'active_since_color'    => 'string',
             'message'               => 'required|not_empty|string'
         ];
 
diff --git a/assets/css/motd.css b/assets/css/motd.css
index 413b040..2588606 100644
--- a/assets/css/motd.css
+++ b/assets/css/motd.css
@@ -31,13 +31,13 @@ body output.motd-box .msg-details {
 
 .motd-box .msg-details .list-dashed::before {
     content: '';
-    background: url('../img/initmax-free.svg');
-    background-position: left center;
+/*    background: url('../img/initmax-free.svg'); */
+    background-position: left;
     background-size: contain;
     background-repeat: no-repeat;
     background-clip: padding-box;
     height: 1.5rem;
-    width: 7rem;
+/*    width: 7rem; */
     margin-left: 0.5rem;
 }
 
@@ -63,12 +63,12 @@ output.motd-box {
 
 body:has(#motd-list-page) .header-title::before {
     content: '';
-    background: url('../img/initmax-free.svg');
+/*    background: url('../img/initmax-free.svg'); */
     background-position: left center;
     background-size: contain;
     background-repeat: no-repeat;
     background-clip: padding-box;
     height: 1.5rem;
-    width: 7rem;
+/*    width: 7rem; */
     margin-left: 0.5rem;
 }
diff --git a/assets/js/motd.js b/assets/js/motd.js
index 062cebc..b9618fb 100644
--- a/assets/js/motd.js
+++ b/assets/js/motd.js
@@ -18,7 +18,7 @@ document.addEventListener('DOMContentLoaded', () => {
             <datetime>#{active_till}</datetime>
         </div>
     `);
-    const el = makeMessageBox(message.type, [message.message], null, true)[0];
+    const el = makeMessageBoxPrivate(message.type, [message.message], null, true)[0];
 
     el.classList.add('motd-box');
     el.querySelector('.msg-details').appendChild(tmpl.evaluateToElement(message));
@@ -26,4 +26,68 @@ document.addEventListener('DOMContentLoaded', () => {
     bel.parentNode.insertBefore(el, bel);
 
     function base64_decode(t){var r,e,o,c,f,a,d="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",h="",C=0;for(t=t.replace(/[^A-Za-z0-9\+\/\=]/g,"");C<t.length;)r=d.indexOf(t.charAt(C++))<<2|(c=d.indexOf(t.charAt(C++)))>>4,e=(15&c)<<4|(f=d.indexOf(t.charAt(C++)))>>2,o=(3&f)<<6|(a=d.indexOf(t.charAt(C++))),h+=String.fromCharCode(r),64!=f&&(h+=String.fromCharCode(e)),64!=a&&(h+=String.fromCharCode(o));utftext=h;for(var n="",i=(C=0,c1=c2=0);C<utftext.length;)(i=utftext.charCodeAt(C))<128?(n+=String.fromCharCode(i),C++):i>191&&i<224?(c2=utftext.charCodeAt(C+1),n+=String.fromCharCode((31&i)<<6|63&c2),C+=2):(c2=utftext.charCodeAt(C+1),c3=utftext.charCodeAt(C+2),n+=String.fromCharCode((15&i)<<12|(63&c2)<<6|63&c3),C+=3);return n}
+
+    function makeMessageBoxPrivate(type, messages, title = null, show_close_box = true, show_details = null) {
+        const classes = {good: 'msg-good', bad: 'msg-bad', warning: 'msg-warning'};
+        const aria_labels = {good: t('Success message'), bad: t('Error message'), warning: t('Warning message')};
+
+        if (show_details === null) {
+                show_details = type === 'bad' || type === 'warning';
+        }
+
+        var     $list = jQuery('<ul>', {class: 'list-dashed'}),
+                $msg_details = jQuery('<div>', {class: 'msg-details'}).append($list),
+                $msg_box = jQuery('<output>')
+                        .addClass(classes[type])
+                        .attr('role', 'contentinfo')
+                        .attr('aria-label', aria_labels[type]),
+                $link_details = jQuery('<a>')
+                        .addClass('link-action')
+                        .attr('aria-expanded', show_details ? 'true' : 'false')
+                        .attr('role', 'button')
+                        .attr('href', 'javascript:void(0)')
+                        .append(t('Details'), jQuery('<span>', {class: show_details ? 'arrow-up' : 'arrow-down'}));
+
+                $link_details.click((e) => toggleMessageBoxDetails(e.target));
+
+        if (title !== null) {
+                if (Array.isArray(messages) && messages.length > 0) {
+                        $msg_box.prepend($link_details);
+                        $msg_box.addClass(ZBX_STYLE_COLLAPSIBLE);
+                }
+                jQuery('<span>')
+                        .text(title)
+                        .appendTo($msg_box);
+
+                if (!show_details) {
+                        $msg_box.addClass(ZBX_STYLE_COLLAPSED);
+                }
+        }
+
+        if (Array.isArray(messages) && messages.length > 0) {
+                jQuery.map(messages, function (message) {
+                       $list.html(message); // Use HTML directly instead of wrapping in <li>
+                        return null;
+                });
+
+                $msg_box.append($msg_details);
+        }
+
+        if (show_close_box) {
+                $msg_box.append(
+                        jQuery('<button>')
+                                .addClass('btn-overlay-close')
+                                .attr('type', 'button')
+                                .attr('title', t('Close'))
+                                .click(function() {
+                                        jQuery(this)
+                                                .closest(`.${classes[type]}`)
+                                                .remove();
+                                })
+                );
+        }
+
+        return $msg_box;
+}
+
 });
diff --git a/service/Message.php b/service/Message.php
index e74f97d..fd79203 100644
--- a/service/Message.php
+++ b/service/Message.php
@@ -43,6 +43,7 @@ class Message
         'name',
         'usrgrpids',
         'active_since',
+        'active_since_color',
         'active_till',
         'message',
     ];
@@ -76,7 +77,7 @@ class Message
             'message' => $message['message'],
             'active_since' => date('Y-m-d H:i', $message['active_since']),
             'active_till' => date('Y-m-d H:i', $message['active_till']),
-            'color' => '1f65f4'
+            'color' => $message['active_since_color']
         ];
 
         setcookie('motd_message', base64_encode(json_encode($data)), 0);
diff --git a/views/motd.form.php b/views/motd.form.php
index 95e5429..f553852 100644
--- a/views/motd.form.php
+++ b/views/motd.form.php
@@ -62,11 +62,11 @@ else {
     ];
 }
 
-$form->addItem([
-    new CSpan(''),
-    (new CImg($this->getAssetsPath() . '/img/initmax-free.svg'))
-        ->addClass('initmax-logo'),
-]);
+#$form->addItem([
+#    new CSpan(''),
+#    (new CImg($this->getAssetsPath() . '/img/initmax-free.svg'))
+#        ->addClass('initmax-logo'),
+#]);
 
 $form->addItem([
     new CLabel(_('Enabled'), 'status'),
@@ -83,18 +83,18 @@ $form->addItem([
         ->setAttribute('autofocus', 'autofocus')
 )]);
 
-$form->addItem([
-    new CLabel(_('Show since'), 'show_since'),
-    new CFormField([
-        (new CDateSelector('show_since', $data['show_since'] === '' ? '' : date(ZBX_DATE_TIME, $data['show_since'])))
-            ->setDateFormat(ZBX_DATE_TIME)
-            ->setPlaceholder(ZBX_DATE_TIME)
-            ->addClass(ZBX_STYLE_FORM_INPUT_MARGIN)
-            ->setEnabled(false),
-        (new CColor('show_since_color', $data['show_since_color']))
-            ->setEnabled(false),
-    ])
-]);
+#$form->addItem([
+#    new CLabel(_('Show since'), 'show_since'),
+#    new CFormField([
+#        (new CDateSelector('show_since', $data['show_since'] === '' ? '' : date(ZBX_DATE_TIME, $data['show_since'])))
+#            ->setDateFormat(ZBX_DATE_TIME)
+#            ->setPlaceholder(ZBX_DATE_TIME)
+#            ->addClass(ZBX_STYLE_FORM_INPUT_MARGIN)
+#            ->setEnabled(false),
+#        (new CColor('show_since_color', $data['show_since_color']))
+#            ->setEnabled(false),
+#    ])
+#]);
 
 $form->addItem([
     (new CLabel(_('Active since'), 'active_since'))->setAsteriskMark(),
@@ -105,7 +105,7 @@ $form->addItem([
             ->setAriaRequired()
             ->addClass(ZBX_STYLE_FORM_INPUT_MARGIN),
         (new CColor('active_since_color', $data['active_since_color']))
-            ->setEnabled(false),
+            ->setEnabled(true),
     ])
 ]);
 
@@ -145,25 +145,25 @@ $form->addItem([
     )
 ]);
 
-$form->addItem([
-    (new CSpan(_('PRO version')))->addClass(ZBX_STYLE_RIGHT)->addStyle('font-weight: bold;'),
-    (new CDiv([
-        new CSpan(_('➕ Unlimited number of messages created in module')),
-        new CTag('br'),
-        new CSpan(_('➕ Show since feature')),
-        new CTag('br'),
-        new CSpan(_('➕ Repeat feature')),
-        new CTag('br'),
-        new CSpan(_('➕ Message bar color settings')),
-        new CTag('br'),
-        new CSpan(_('➕ Removing initMAX logo from message bar')),
-    ]))->addStyle('color: #7150f7;')
-]);
-
-$form->addItem([
-    new CSpan(''),
-    (new CDiv([(new CSpan('Get PRO: '))->addStyle('font-weight: bold;'), new CLink('info@initmax.com', 'mailto:info@initmax.com?subject=Inquiry%20Message%20of%20the%20Day%20PRO%20version')]))->addStyle('padding-top: 2rem;'),
-]);
+#$form->addItem([
+#    (new CSpan(_('PRO version')))->addClass(ZBX_STYLE_RIGHT)->addStyle('font-weight: bold;'),
+#    (new CDiv([
+#        new CSpan(_('➕ Unlimited number of messages created in module')),
+#        new CTag('br'),
+#        new CSpan(_('➕ Show since feature')),
+#        new CTag('br'),
+#        new CSpan(_('➕ Repeat feature')),
+#        new CTag('br'),
+#        new CSpan(_('➕ Message bar color settings')),
+#        new CTag('br'),
+#        new CSpan(_('➕ Removing initMAX logo from message bar')),
+#    ]))->addStyle('color: #7150f7;')
+#]);
+
+#$form->addItem([
+#    new CSpan(''),
+#    (new CDiv([(new CSpan('Get PRO: '))->addStyle('font-weight: bold;'), new CLink('info@initmax.com', 'mailto:info@initmax.com?subject=Inquiry%20Message%20of%20the%20Day%20PRO%20version')]))->addStyle('padding-top: 2rem;'),
+#]);
 
 
 $js_data['switcher'] = $switcher;
@@ -182,4 +182,4 @@ if ($data['user']['debug_mode'] == GROUP_DEBUG_MODE_ENABLED) {
     $output['debug'] = CProfiler::getInstance()->make()->toString();
 }
 
-echo json_encode($output);
\ No newline at end of file
+echo json_encode($output);
diff --git a/views/motd.list.php b/views/motd.list.php
index c6a5962..d30db99 100644
--- a/views/motd.list.php
+++ b/views/motd.list.php
@@ -110,9 +110,8 @@ $form->addItem(
             (new CList())
                 ->addItem(
                     (new CSubmitButton(_('Create message of the day')))
-                        ->setEnabled($data['messages']?false:true)
                 )
-                ->onClick($data['messages']?'':'document.dispatchEvent(new CustomEvent("motd.form.edit", {detail:{}}))')
+                ->onClick('document.dispatchEvent(new CustomEvent("motd.form.edit", {detail:{}}))')
         ))->setAttribute('aria-label', _('Content controls'))
     )
     ->addItem(new CPartial('motd.list.filter', $data['filter'] + [
