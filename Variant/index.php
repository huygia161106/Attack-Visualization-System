<?php

$allowedPages = [
    'dashboard',
    'orders',
    'checkout',
    'customers',
    'reports',
    'settings',
];

$page = $_GET['page'] ?? 'dashboard';

if (!in_array($page, $allowedPages, true)) {
    $page = 'dashboard';
}

$titleMap = [
    'dashboard' => 'Operations Overview',
    'orders' => 'Order Queue',
    'checkout' => 'Counter Checkout',
    'customers' => 'Member Directory',
    'reports' => 'Shelf Report',
    'settings' => 'Store Config',
];

$pageTitle = $titleMap[$page];

require __DIR__ . '/includes/data.php';
require __DIR__ . '/includes/layout.php';

render_header($pageTitle, $page);
require __DIR__ . '/pages/' . $page . '.php';
render_footer();
