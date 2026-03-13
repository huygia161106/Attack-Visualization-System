<?php

$pendingOnly = [];

foreach ($orders as $order) {
    if ($order['status'] != 'completed') {
        $pendingOnly[] = $order;
    }
}

usort($pendingOnly, function (array $left, array $right): int {
    return $right['id'] <=> $left['id'];
});
?>

<section class="card">
    <h3>Pending orders</h3>
    <p class="muted">Only pending items should be listed, newest first.</p>

    <table>
        <thead>
            <tr>
                <th>ID</th>
                <th>Customer</th>
                <th>Status</th>
                <th>Total</th>
            </tr>
        </thead>
        <tbody>
            <?php foreach ($pendingOnly as $order): ?>
                <tr>
                    <td>#<?php echo $order['id']; ?></td>
                    <td><?php echo htmlspecialchars($order['customer']); ?></td>
                    <td><?php echo htmlspecialchars(strtoupper($order['status'])); ?></td>
                    <td>$<?php echo number_format(calculate_order_total($order, $products), 2); ?></td>
                </tr>
            <?php endforeach; ?>
        </tbody>
    </table>
</section>
