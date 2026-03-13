<?php

$activeCustomers = [];

foreach ($customers as $customer) {
    if ($customer['active']) {
        $activeCustomers[] = $customer;
    }
}
?>

<section class="card">
    <h3>Active customers</h3>
    <ul class="simple-list">
        <?php foreach ($activeCustomers as $customer): ?>
            <li>
                <?php echo htmlspecialchars($customer['name']); ?>
                -
                <?php echo htmlspecialchars($customer['tier']); ?>
            </li>
        <?php endforeach; ?>
    </ul>
</section>
