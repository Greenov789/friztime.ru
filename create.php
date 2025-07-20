<?php
require_once 'includes/functions.php';

$languages = [
    'plaintext' => 'Plain Text',
    'html' => 'HTML',
    'css' => 'CSS',
    'javascript' => 'JavaScript',
    'php' => 'PHP',
    'python' => 'Python',
    'java' => 'Java',
    'csharp' => 'C#',
    'cpp' => 'C++',
    'sql' => 'SQL',
    'json' => 'JSON',
    'xml' => 'XML',
    'markdown' => 'Markdown'
];

$expiration_options = [
    null => 'Never',
    '1 HOUR' => '1 Hour',
    '1 DAY' => '1 Day',
    '1 WEEK' => '1 Week',
    '1 MONTH' => '1 Month'
];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $title = sanitize($_POST['title']);
    $content = $_POST['content'];
    $language = isset($_POST['language']) && array_key_exists($_POST['language'], $languages) 
        ? $_POST['language'] 
        : 'plaintext';
    $expiration = isset($_POST['expiration']) && array_key_exists($_POST['expiration'], $expiration_options)
        ? ($_POST['expiration'] ? date('Y-m-d H:i:s', strtotime($_POST['expiration'])) : null)
        : null;
    $password = !empty($_POST['password']) ? password_hash($_POST['password'], PASSWORD_BCRYPT) : null;

    if (empty($title) || empty($content)) {
        $error = "Title and content cannot be empty";
    } elseif (strlen($title) > MAX_TITLE_LENGTH) {
        $error = "Title is too long (max " . MAX_TITLE_LENGTH . " characters)";
    } elseif (strlen($content) > MAX_POST_LENGTH) {
        $error = "Content is too long (max " . MAX_POST_LENGTH . " characters)";
    } else {
        $slug = createPost($title, $content, $language, $expiration, $password);
        if ($slug) {
            redirect(generateUrl('view.php?slug=' . $slug));
        } else {
            $error = "Error creating paste";
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Paste | Status.bin</title>
    <link rel="stylesheet" href="css/style.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/styles/atom-one-dark.min.css">
</head>
<body>
    <header>
        <div class="container">
            <h1><a href="<?php echo generateUrl(); ?>">Status.bin</a></h1>
            <nav>
                <a href="<?php echo generateUrl(); ?>">Home</a>
            </nav>
        </div>
    </header>

    <main class="container">
        <h2>Create New Paste</h2>
        
        <?php if (isset($error)): ?>
            <div class="alert error"><?php echo $error; ?></div>
        <?php endif; ?>
        
        <form method="POST" class="post-form">
            <div class="form-group">
                <label for="title">Title</label>
                <input type="text" id="title" name="title" required maxlength="<?php echo MAX_TITLE_LENGTH; ?>">
            </div>
            
            <div class="form-group">
                <label for="content">Content</label>
                <textarea id="content" name="content" rows="15" required></textarea>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="language">Syntax</label>
                    <select id="language" name="language">
                        <?php foreach ($languages as $key => $name): ?>
                            <option value="<?php echo $key; ?>"><?php echo $name; ?></option>
                        <?php endforeach; ?>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="expiration">Expiration</label>
                    <select id="expiration" name="expiration">
                        <?php foreach ($expiration_options as $key => $name): ?>
                            <option value="<?php echo $key; ?>"><?php echo $name; ?></option>
                        <?php endforeach; ?>
                    </select>
                </div>
            </div>
            
            <div class="form-group">
                <label for="password">Password (optional)</label>
                <input type="password" id="password" name="password">
                <small>If set, paste will require password to view</small>
            </div>
            
            <button type="submit" class="btn">Create Paste</button>
        </form>
    </main>

    <footer>
        <div class="container">
            <p>&copy; <?php echo date('Y'); ?> Status.bin. All rights reserved.</p>
        </div>
    </footer>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/highlight.min.js"></script>
    <script src="js/script.js"></script>
</body>
</html>