<?php

$config = [
    'currency' => 'USD',
    'timezone' => 'Asia/Ho_Chi_Minh',
    'language' => 'en',
];
?>

<section class="card">
    <h3>Store settings</h3>
    <dl class="settings-list">
        <?php foreach ($config as $key => $value): ?>
            <dt><?php echo htmlspecialchars($key); ?></dt>
            <dd><?php echo htmlspecialchars($value); ?></dd>
        <?php endforeach; ?>
    </dl>
</section>
