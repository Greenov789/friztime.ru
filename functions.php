<?php
require_once 'db_connect.php';

function sanitize($data) {
    return htmlspecialchars(strip_tags(trim($data)));
}

function createPost($title, $content, $language = 'plaintext', $expiration = null, $password = null) {
    global $pdo;
    
    $slug = bin2hex(random_bytes(4));
    $ip = $_SERVER['REMOTE_ADDR'];
    
    try {
        $stmt = $pdo->prepare("INSERT INTO posts (slug, title, content, language, ip_address, expires_at, password) 
                              VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$slug, $title, $content, $language, $ip, $expiration, $password]);
        return $slug;
    } catch (PDOException $e) {
        if (DEBUG_MODE) die("Error creating post: " . $e->getMessage());
        return false;
    }
}

function getPost($slug) {
    global $pdo;
    
    try {
        $stmt = $pdo->prepare("SELECT * FROM posts WHERE slug = ? AND (expires_at IS NULL OR expires_at > NOW())");
        $stmt->execute([$slug]);
        return $stmt->fetch();
    } catch (PDOException $e) {
        if (DEBUG_MODE) die("Error fetching post: " . $e->getMessage());
        return false;
    }
}

function getRecentPosts($limit = POSTS_PER_PAGE, $offset = 0) {
    global $pdo;
    
    try {
        $stmt = $pdo->prepare("SELECT * FROM posts 
                              WHERE (expires_at IS NULL OR expires_at > NOW())
                              ORDER BY created_at DESC 
                              LIMIT ? OFFSET ?");
        $stmt->execute([$limit, $offset]);
        return $stmt->fetchAll();
    } catch (PDOException $e) {
        if (DEBUG_MODE) die("Error fetching posts: " . $e->getMessage());
        return [];
    }
}

function searchPosts($query) {
    global $pdo;
    
    try {
        $stmt = $pdo->prepare("SELECT * FROM posts 
                              WHERE (title LIKE ? OR content LIKE ?)
                              AND (expires_at IS NULL OR expires_at > NOW())
                              ORDER BY created_at DESC");
        $stmt->execute(["%$query%", "%$query%"]);
        return $stmt->fetchAll();
    } catch (PDOException $e) {
        if (DEBUG_MODE) die("Search error: " . $e->getMessage());
        return [];
    }
}

function addComment($post_id, $content, $author = 'Anonymous') {
    global $pdo;
    
    try {
        $stmt = $pdo->prepare("INSERT INTO comments (post_id, author, content, ip_address) 
                              VALUES (?, ?, ?, ?)");
        $stmt->execute([$post_id, $author, $content, $_SERVER['REMOTE_ADDR']]);
        return true;
    } catch (PDOException $e) {
        if (DEBUG_MODE) die("Error adding comment: " . $e->getMessage());
        return false;
    }
}

function getComments($post_id) {
    global $pdo;
    
    try {
        $stmt = $pdo->prepare("SELECT * FROM comments WHERE post_id = ? ORDER BY created_at ASC");
        $stmt->execute([$post_id]);
        return $stmt->fetchAll();
    } catch (PDOException $e) {
        if (DEBUG_MODE) die("Error fetching comments: " . $e->getMessage());
        return [];
    }
}

function countPosts() {
    global $pdo;
    
    try {
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM posts WHERE expires_at IS NULL OR expires_at > NOW()");
        return $stmt->fetch()['count'];
    } catch (PDOException $e) {
        if (DEBUG_MODE) die("Count error: " . $e->getMessage());
        return 0;
    }
}

function generateUrl($slug = '') {
    return SITE_URL . '/' . $slug;
}

function redirect($url, $statusCode = 303) {
    header('Location: ' . $url, true, $statusCode);
    die();
}
?>