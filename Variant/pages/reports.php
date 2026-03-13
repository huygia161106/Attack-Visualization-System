<?php

$reportRows = [];
$totalsByCategory = [];

foreach ($products as $product) {
    $category = $product['name'];

    if (!isset($totalsByCategory[$category])) {
        $totalsByCategory[$category] = 0;
    }

    $totalsByCategory[$category] += $product['stock'] * $product['price'];
}

foreach ($totalsByCategory as $category => $total) {
    $reportRows[] = strtoupper($category) . ': $' . number_format($total, 2);
}
?>

<section class="card">
    <h3>Shelf report</h3>
    <ul class="simple-list">
        <?php foreach ($reportRows as $row): ?>
            <li><?php echo htmlspecialchars($row); ?></li>
        <?php endforeach; ?>
    </ul>
</section>
