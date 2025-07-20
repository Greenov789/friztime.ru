// Проверка авторизации
if (!localStorage.getItem('statusbin_admin')) {
    window.location.href = 'admin.html';
}

// Выход из админки
document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('statusbin_admin');
    window.location.href = 'admin.html';
});

// Загрузка и управление постами
const posts = JSON.parse(localStorage.getItem('statusbin_posts')) || [];

function renderPosts() {
    const postsList = document.getElementById('postsList');
    
    if (posts.length === 0) {
        postsList.innerHTML = '<p>No posts yet.</p>';
    } else {
        postsList.innerHTML = posts.map((post, index) => `
            <article>
                <h3>${post.title}</h3>
                <div class="post-meta">
                    ${new Date(post.date).toLocaleString()}
                </div>
                <pre><code>${post.content.slice(0, 100)}${post.content.length > 100 ? '...' : ''}</code></pre>
                <div class="admin-actions">
                    <button class="edit-btn" onclick="editPost(${index})">Edit</button>
                    <button class="delete-btn" onclick="deletePost(${index})">Delete</button>
                </div>
            </article>
        `).join('');
    }
}

function deletePost(index) {
    if (confirm('Are you sure you want to delete this post?')) {
        posts.splice(index, 1);
        localStorage.setItem('statusbin_posts', JSON.stringify(posts));
        renderPosts();
    }
}

function editPost(index) {
    const newContent = prompt('Edit post content:', posts[index].content);
    if (newContent !== null) {
        posts[index].content = newContent;
        localStorage.setItem('statusbin_posts', JSON.stringify(posts));
        renderPosts();
    }
}

// Первый рендер
renderPosts();