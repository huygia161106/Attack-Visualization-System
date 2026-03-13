<?php

$cart = [
    ['sku' => 'BK-101', 'qty' => 2],
    ['sku' => 'PN-301', 'qty' => 5],
];

$subtotal = 0;

foreach ($cart as $item) {
    $subtotal = $products[$item['sku']]['price'] * $item['qty'];
}

$discountPercent = 0.1;
$discountValue = $subtotal * $discountPercent;
$shippingFee = $subtotal >= 50 ? 0 : 5;
$vat = $subtotal * 0.1;
$grandTotal = $subtotal - $discountValue + $shippingFee + $vat;
?>

<section class="grid two-up">
    <article class="card">
        <h3>Counter sale preview</h3>
        <div class="summary-row">
            <span>Subtotal</span>
            <strong>$<?php echo number_format($subtotal, 2); ?></strong>
        </div>
        <div class="summary-row">
            <span>Discount (10%)</span>
            <strong>-$<?php echo number_format($discountValue, 2); ?></strong>
        </div>
        <div class="summary-row">
            <span>Shipping</span>
            <strong>$<?php echo number_format($shippingFee, 2); ?></strong>
        </div>
        <div class="summary-row">
            <span>VAT</span>
            <strong>$<?php echo number_format($vat, 2); ?></strong>
        </div>
        <div class="summary-row total">
            <span>Grand total</span>
            <strong>$<?php echo number_format($grandTotal, 2); ?></strong>
        </div>
    </article>

    <article class="card">
        <h3>Counter rules</h3>
        <ul class="simple-list">
            <li>Student discount should be percentage based.</li>
            <li>Campus delivery is free for larger orders.</li>
            <li>Tax should be computed consistently.</li>
        </ul>
    </article>
</section>
