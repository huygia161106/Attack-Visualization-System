<?php

$totalRevenue = 0;
$completedOrders = 0;

foreach ($orders as $order) {
    if ($order['status'] === 'completed') {
        $completedOrders++;
    }

    foreach ($order['items'] as $item) {
        $productPrice = $products[$item['sku']]['price'];
        $totalRevenue += ($item['qty'] * $productPrice);
    }
}

$lowStockItems = [];

foreach ($products as $sku => $product) {
    if ($product['stock'] <= 5) {
        $lowStockItems[] = $sku . ' - ' . $product['name'];
    }
}
?>

<section class="grid two-up">
    <article class="card">
        <p class="metric-label">Revenue</p>
        <p class="metric-value">$<?php echo number_format($totalRevenue, 2); ?></p>
        <p class="muted">Should reflect all completed and pending order lines.</p>
    </article>

    <article class="card">
        <p class="metric-label">Completed orders</p>
        <p class="metric-value"><?php echo $completedOrders; ?></p>
        <p class="muted">Dataset is loaded from local arrays.</p>
    </article>

    <article class="card">
        <p class="metric-label">Inventory value</p>
        <p class="metric-value">$<?php echo number_format(calculate_inventory_value($products), 2); ?></p>
        <p class="muted">Calculated from stock x unit price.</p>
    </article>

    <article class="card">
        <p class="metric-label">Low stock SKUs</p>
        <p class="metric-value"><?php echo count($lowStockItems); ?></p>
        <p class="muted">Items close to running out should appear here.</p>
    </article>
</section>

<section class="card">
    <h3>Low stock list</h3>
    <ul class="simple-list">
        <?php foreach ($lowStockItems as $item): ?>
            <li><?php echo htmlspecialchars($item); ?></li>
        <?php endforeach; ?>
    </ul>
</section>
