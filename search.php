<?php
require_once 'includes/functions.php';

$query = isset($_GET['q']) ? sanitize($_GET['q']) : '';
$results = [];

if (!empty($query)) {
    $results = searchPosts($query);
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Search | Status.bin</title>
    <link rel="stylesheet" href="css/style.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/styles/atom-one-dark.min.css">
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
        <h2>Search Pastes</h2>
        
        <form method="GET" class="search-form">
            <div class="form-group">
                <input type="text" name="q" value="<?php echo $query; ?>" placeholder="Enter search query..." required>
                <button type="submit" class="btn">Search</button>
            </div>
        </form>
        
        <?php if (!empty($query)): ?>
            <div class="search-results">
                <h3>Results for "<?php echo $query; ?>" (<?php echo count($results); ?>)</h3>
                
                <?php if (empty($results)): ?>
                    <p>No results found. Try different keywords.</p>
                <?php else: ?>
                    <div class="posts-list">
                        <?php foreach ($results as $post): ?>
                            <article class="post-preview">
                                <h2><a href="<?php echo generateUrl('view.php?slug=' . $post['slug']); ?>"><?php echo sanitize($post['title']); ?></a></h2>
                                <div class="post-meta">
                                    <span>Posted: <?php echo date('d.m.Y H:i', strtotime($post['created_at'])); ?></span>
                                    <?php if ($post['expires_at']): ?>
                                        <span>Expires: <?php echo date('d.m.Y H:i', strtotime($post['expires_at'])); ?></span>
                                    <?php endif; ?>
                                </div>
                                <div class="post-content-preview">
                                    <pre><code class="language-<?php echo $post['language']; ?>"><?php echo substr(sanitize($post['content']), 0, 200); ?></code></pre>
                                </div>
                                <a href="<?php echo generateUrl('view.php?slug=' . $post['slug']); ?>" class="btn">View</a>
                            </article>
                        <?php endforeach; ?>
                    </div>
                <?php endif; ?>
            </div>
        <?php endif; ?>
    </main>

    <footer>
        <div class="container">
            <p>&copy; <?php echo date('Y'); ?> Status.bin. All rights reserved.</p>
        </div>
    </footer>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/highlight.min.js"></script>
    <script>hljs.highlightAll();</script>
    <script src="js/script.js"></script>
</body>
</html>