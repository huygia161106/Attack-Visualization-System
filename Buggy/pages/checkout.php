<?php

$cart = [
    ['sku' => 'BK-101', 'qty' => 2],
    ['sku' => 'PN-301', 'qty' => 5],
];

$subtotal = 0;

foreach ($cart as $item) {
    $subtotal += $products[$item['sku']]['price'] * $item['qty'];
}

$discountPercent = 10;
$discountValue = $subtotal * ($discountPercent/100);
$shippingFee = $subtotal >= 50 ? 5 : 0;
$vat = $subtotal * 0.1;
$grandTotal = $subtotal - $discountValue + $shippingFee + $vat;
?>

<section class="grid two-up">
    <article class="card">
        <h3>Checkout preview</h3>
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
        <h3>Notes</h3>
        <ul class="simple-list">
            <li>Discount should be percentage based.</li>
            <li>Shipping is free for larger orders.</li>
            <li>VAT should be computed consistently.</li>
        </ul>
    </article>
</section>
