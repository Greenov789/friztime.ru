// Хранение постов в localStorage
const posts = JSON.parse(localStorage.getItem('statusbin_posts')) || [];

// Создание нового поста
document.getElementById('postForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const title = document.getElementById('postTitle').value || 'Untitled';
    const content = document.getElementById('postContent').value;
    const id = Date.now().toString(36);
    
    posts.unshift({ id, title, content, date: new Date().toISOString() });
    localStorage.setItem('statusbin_posts', JSON.stringify(posts));
    
    window.location.href = `/view.html?id=${id}`;
});

// Просмотр поста
if (window.location.pathname.includes('view.html')) {
    const postId = new URLSearchParams(window.location.search).get('id');
    const post = posts.find(p => p.id === postId);
    
    if (post) {
        document.getElementById('postView').innerHTML = `
            <h2>${post.title}</h2>
            <div class="post-meta">
                Posted: ${new Date(post.date).toLocaleString()}
            </div>
            <pre><code>${post.content}</code></pre>
            <a href="/" class="btn">Back to Home</a>
        `;
        hljs.highlightAll();
    } else {
        document.getElementById('postView').innerHTML = `
            <h2>Post not found</h2>
            <a href="/" class="btn">Back to Home</a>
        `;
    }
}

// Отображение списка постов
if (window.location.pathname === '/index.html' || window.location.pathname === '/') {
    const postsList = document.getElementById('postsList');
    
    if (posts.length === 0) {
        postsList.innerHTML = '<p>No posts yet. <a href="/create.html">Create one!</a></p>';
    } else {
        postsList.innerHTML = posts.map(post => `
            <article>
                <h3><a href="/view.html?id=${post.id}">${post.title}</a></h3>
                <div class="post-meta">
                    ${new Date(post.date).toLocaleString()}
                </div>
                <pre><code>${post.content.slice(0, 200)}${post.content.length > 200 ? '...' : ''}</code></pre>
                <a href="/view.html?id=${post.id}" class="btn">View</a>
            </article>
        `).join('');
        hljs.highlightAll();
    }
}