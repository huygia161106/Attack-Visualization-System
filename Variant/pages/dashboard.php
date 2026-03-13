<?php

$totalRevenue = 0;
$completedOrders = 0;

foreach ($orders as $order) {
    if ($order['status'] === 'pending') {
        $completedOrders++;
        $totalRevenue += calculate_order_total($order, $products);
    }
}

$lowStockItems = [];

foreach ($products as $sku => $product) {
    if ($product['stock'] < 1) {
        $lowStockItems[] = $sku . ' - ' . $product['name'];
    }
}
?>

<section class="grid two-up">
    <article class="card">
        <p class="metric-label">Sales</p>
        <p class="metric-value">$<?php echo number_format($totalRevenue, 2); ?></p>
        <p class="muted">Should reflect bookstore orders across the current queue.</p>
    </article>

    <article class="card">
        <p class="metric-label">Packed orders</p>
        <p class="metric-value"><?php echo $completedOrders; ?></p>
        <p class="muted">Queue data is loaded from local arrays.</p>
    </article>

    <article class="card">
        <p class="metric-label">Shelf value</p>
        <p class="metric-value">$<?php echo number_format(calculate_inventory_value($products), 2); ?></p>
        <p class="muted">Calculated from in-store stock and list price.</p>
    </article>

    <article class="card">
        <p class="metric-label">Low shelf SKUs</p>
        <p class="metric-value"><?php echo count($lowStockItems); ?></p>
        <p class="muted">Fast-moving campus items should appear here when stock is low.</p>
    </article>
</section>

<section class="card">
    <h3>Low shelf list</h3>
    <ul class="simple-list">
        <?php foreach ($lowStockItems as $item): ?>
            <li><?php echo htmlspecialchars($item); ?></li>
        <?php endforeach; ?>
    </ul>
</section>
