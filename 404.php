<?php
require_once 'includes/functions.php';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Page Not Found | Status.bin</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <header>
        <div class="container">
            <h1><a href="<?php echo generateUrl(); ?>">Status.bin</a></h1>
            <nav>
                <a href="<?php echo generateUrl(); ?>">Home</a>
                <a href="<?php echo generateUrl('create.php'); ?>">New Paste</a>
            </nav>
        </div>
    </header>

    <main class="container">
        <div class="error-page">
            <h2>404 - Page Not Found</h2>
            <p>The page you requested could not be found.</p>
            <a href="<?php echo generateUrl(); ?>" class="btn">Return Home</a>
        </div>
    </main>

    <footer>
        <div class="container">
            <p>&copy; <?php echo date('Y'); ?> Status.bin. All rights reserved.</p>
        </div>
    </footer>
</body>
</html>