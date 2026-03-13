<?php

function render_header(string $title, string $activePage): void
{
    $navItems = [
        'dashboard' => 'Dashboard',
        'orders' => 'Orders',
        'checkout' => 'Checkout',
        'customers' => 'Customers',
        'reports' => 'Reports',
        'settings' => 'Settings',
    ];
    ?>
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title><?php echo htmlspecialchars($title); ?> | Buggy PHP Lab</title>
        <link rel="stylesheet" href="assets/css/app.css">
    </head>
    <body>
        <div class="shell">
            <aside class="sidebar">
                <h1>Buggy PHP Lab</h1>
                <p class="eyebrow">Student debugging exercise</p>
                <nav>
                    <?php foreach ($navItems as $key => $label): ?>
                        <a
                            class="nav-link <?php echo $activePage === $key ? 'is-active' : ''; ?>"
                            href="?page=<?php echo urlencode($key); ?>"
                        >
                            <?php echo htmlspecialchars($label); ?>
                        </a>
                    <?php endforeach; ?>
                </nav>
            </aside>
            <main class="content">
                <header class="page-header">
                    <div>
                        <p class="eyebrow">Mini project</p>
                        <h2><?php echo htmlspecialchars($title); ?></h2>
                    </div>
                    <a class="ghost-link" href="README.md">Read assignment</a>
                </header>
    <?php
}

function render_footer(): void
{
    ?>
            </main>
        </div>
    </body>
    </html>
    <?php
}
