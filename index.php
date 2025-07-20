<?php
require_once 'includes/functions.php';

$page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
$offset = ($page - 1) * POSTS_PER_PAGE;
$totalPosts = countPosts();
$totalPages = ceil($totalPosts / POSTS_PER_PAGE);

$posts = getRecentPosts(POSTS_PER_PAGE, $offset);
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo SITE_NAME; ?></title>
    <link rel="stylesheet" href="css/style.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/styles/atom-one-dark.min.css">
</head>
<body>
    <header>
        <div class="container">
            <h1><a href="<?php echo generateUrl(); ?>">Status.bin</a></h1>
            <nav>
                <a href="<?php echo generateUrl('create.php'); ?>">New Paste</a>
                <a href="<?php echo generateUrl('search.php'); ?>">Search</a>
            </nav>
        </div>
    </header>

    <main class="container">
        <div class="posts-list">
            <?php if (empty($posts)): ?>
                <div class="empty-message">
                    <p>No pastes yet. Be the first!</p>
                    <a href="<?php echo generateUrl('create.php'); ?>" class="btn">Create Paste</a>
                </div>
            <?php else: ?>
                <?php foreach ($posts as $post): ?>
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
            <?php endif; ?>
        </div>

        <?php if ($totalPages > 1): ?>
            <div class="pagination">
                <?php if ($page > 1): ?>
                    <a href="?page=<?php echo $page - 1; ?>" class="btn">Previous</a>
                <?php endif; ?>
                
                <span>Page <?php echo $page; ?> of <?php echo $totalPages; ?></span>
                
                <?php if ($page < $totalPages): ?>
                    <a href="?page=<?php echo $page + 1; ?>" class="btn">Next</a>
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