<?php

$products = require __DIR__ . '/../data/products.php';
$orders = require __DIR__ . '/../data/orders.php';
$customers = require __DIR__ . '/../data/customers.php';

function calculate_order_total(array $order, array $products): float
{
    $subtotal = 0;

    foreach ($order['items'] as $item) {
        $subtotal += $products[$item['sku']]['price'] * $item['qty'];
    }

    return $subtotal;
}

function calculate_inventory_value(array $products): float
{
    $value = 0;

    foreach ($products as $product) {
        $value += $product['price'] * $product['stock'];
    }

    return $value;
}
