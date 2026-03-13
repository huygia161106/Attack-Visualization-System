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
    'dashboard' => 'Dashboard',
    'orders' => 'Orders',
    'checkout' => 'Checkout',
    'customers' => 'Customers',
    'reports' => 'Reports',
    'settings' => 'Settings',
];

$pageTitle = $titleMap[$page];

require __DIR__ . '/includes/data.php';
require __DIR__ . '/includes/layout.php';

render_header($pageTitle, $page);
require __DIR__ . '/pages/' . $page . '.php';
render_footer();
