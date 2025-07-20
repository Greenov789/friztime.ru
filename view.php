<?php
require_once 'includes/functions.php';

if (!isset($_GET['slug'])) {
    include '404.php';
    exit();
}

$slug = $_GET['slug'];
$post = getPost($slug);

if (!$post) {
    include '404.php';
    exit();
}

if (!empty($post['password'])) {
    if (!isset($_SESSION['post_access'][$post['id']])) {
        if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['password'])) {
            if (password_verify($_POST['password'], $post['password'])) {
                $_SESSION['post_access'][$post['id']] = true;
            } else {
                $error = "Incorrect password";
            }
        } else {
            ?>
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Password Required | Status.bin</title>
                <link rel="stylesheet" href="css/style.css">
            </head>
            <body>
                <header>
                    <div class="container">
                        <h1><a href="<?php echo generateUrl(); ?>">Status.bin</a></h1>
                    </div>
                </header>

                <main class="container">
                    <div class="password-form">
                        <h2>This paste is password protected</h2>
                        
                        <?php if (isset($error)): ?>
                            <div class="alert error"><?php echo $error; ?></div>
                        <?php endif; ?>
                        
                        <form method="POST">
                            <div class="form-group">
                                <label for="password">Enter password</label>
                                <input type="password" id="password" name="password" required>
                            </div>
                            <button type="submit" class="btn">Continue</button>
                        </form>
                    </div>
                </main>

                <footer>
                    <div class="container">
                        <p>&copy; <?php echo date('Y'); ?> Status.bin. All rights reserved.</p>
                    </div>
                </footer>
            </body>
            </html>
            <?php
            exit();
        }
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['comment_content'])) {
    $author = isset($_POST['comment_author']) ? sanitize($_POST['comment_author']) : 'Anonymous';
    $content = sanitize($_POST['comment_content']);
    
    if (!empty($content)) {
        addComment($post['id'], $content, $author);
    }
}

$comments = getComments($post['id']);
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo sanitize($post['title']); ?> | Status.bin</title>
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
        <article class="post-full">
            <div class="post-header">
                <h2><?php echo sanitize($post['title']); ?></h2>
                <div class="post-meta">
                    <span>Posted: <?php echo date('d.m.Y H:i', strtotime($post['created_at'])); ?></span>
                    <?php if ($post['expires_at']): ?>
                        <span>Expires: <?php echo date('d.m.Y H:i', strtotime($post['expires_at'])); ?></span>
                    <?php endif; ?>
                    <span>Syntax: <?php echo $post['language']; ?></span>
                </div>
            </div>
            
            <div class="post-content">
                <pre><code class="language-<?php echo $post['language']; ?>"><?php echo sanitize($post['content']); ?></code></pre>
            </div>
            
            <div class="post-share">
                <p>Paste URL: <input type="text" value="<?php echo generateUrl('view.php?slug=' . $post['slug']); ?>" readonly></p>
            </div>
        </article>

        <section class="comments">
            <h3>Comments (<?php echo count($comments); ?>)</h3>
            
            <?php if (empty($comments)): ?>
                <p>No comments yet. Be the first!</p>
            <?php else: ?>
                <div class="comments-list">
                    <?php foreach ($comments as $comment): ?>
                        <div class="comment">
                            <div class="comment-header">
                                <span class="comment-author"><?php echo sanitize($comment['author']); ?></span>
                                <span class="comment-date"><?php echo date('d.m.Y H:i', strtotime($comment['created_at'])); ?></span>
                            </div>
                            <div class="comment-content">
                                <?php echo nl2br(sanitize($comment['content'])); ?>
                            </div>
                        </div>
                    <?php endforeach; ?>
                </div>
            <?php endif; ?>
            
            <form method="POST" class="comment-form">
                <h4>Add Comment</h4>
                <div class="form-group">
                    <label for="comment_author">Name (optional)</label>
                    <input type="text" id="comment_author" name="comment_author" maxlength="50">
                </div>
                <div class="form-group">
                    <label for="comment_content">Comment</label>
                    <textarea id="comment_content" name="comment_content" rows="4" required></textarea>
                </div>
                <button type="submit" class="btn">Submit</button>
            </form>
        </section>
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