const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const ejs = require('ejs');

const app = express();

// Настройки
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: 'statusnet-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// Временная база данных
let users = [];
let servers = [];
let channels = [];
let messages = [];

// Маршруты
app.get('/', (req, res) => {
    res.render('index', { user: req.session.user });
});

app.get('/login', (req, res) => {
    res.render('login', { error: req.query.error });
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
        req.session.user = user;
        res.redirect('/dashboard');
    } else {
        res.redirect('/login?error=1');
    }
});

app.get('/register', (req, res) => {
    res.render('register', { error: req.query.error });
});

app.post('/register', (req, res) => {
    const { username, email, password } = req.body;
    if (users.some(u => u.username === username)) {
        return res.redirect('/register?error=1');
    }
    const newUser = { 
        id: Date.now(), 
        username, 
        email, 
        password,
        avatarColor: getRandomColor(),
        status: 'online',
        bio: '',
        joinDate: new Date()
    };
    users.push(newUser);
    req.session.user = newUser;
    res.redirect('/dashboard');
});

app.get('/dashboard', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    const userServers = servers.filter(s => s.members.includes(req.session.user.id));
    res.render('dashboard', { 
        user: req.session.user, 
        servers: userServers 
    });
});

app.post('/create-server', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    const { name } = req.body;
    const newServer = {
        id: Date.now(),
        name,
        owner: req.session.user.id,
        members: [req.session.user.id],
        channels: [],
        icon: '',
        createdAt: new Date()
    };
    servers.push(newServer);
    res.redirect('/dashboard');
});

app.get('/server/:id', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    const server = servers.find(s => s.id === parseInt(req.params.id));
    if (!server || !server.members.includes(req.session.user.id)) {
        return res.redirect('/dashboard');
    }
    const serverChannels = channels.filter(c => c.serverId === server.id);
    const channelId = req.query.channel || (serverChannels[0]?.id || null);
    const currentChannel = channels.find(c => c.id === parseInt(channelId));
    const channelMessages = messages.filter(m => m.channelId === currentChannel?.id);
    
    res.render('server', {
        user: req.session.user,
        server,
        channels: serverChannels,
        currentChannel,
        messages: channelMessages,
        users
    });
});

app.post('/create-channel', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    const { serverId, name, type } = req.body;
    const server = servers.find(s => s.id === parseInt(serverId));
    if (!server || server.owner !== req.session.user.id) {
        return res.redirect('/dashboard');
    }
    const newChannel = {
        id: Date.now(),
        serverId: parseInt(serverId),
        name,
        type: type || 'text',
        createdAt: new Date()
    };
    channels.push(newChannel);
    server.channels.push(newChannel.id);
    res.redirect(`/server/${serverId}?channel=${newChannel.id}`);
});

app.post('/send-message', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    const { channelId, content } = req.body;
    const channel = channels.find(c => c.id === parseInt(channelId));
    if (!channel) return res.status(404).send('Канал не найден');
    
    const newMessage = {
        id: Date.now(),
        channelId: parseInt(channelId),
        authorId: req.session.user.id,
        content,
        timestamp: new Date(),
        reactions: []
    };
    messages.push(newMessage);
    res.redirect(`/server/${channel.serverId}?channel=${channelId}`);
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

// Функция для случайного цвета аватара
function getRandomColor() {
    const colors = ['#7fffd4', '#48d1cc', '#5fc9a8', '#66cdaa', '#20b2aa'];
    return colors[Math.floor(Math.random() * colors.length)];
}

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Status.net | Social запущен на порту ${PORT}`);
});