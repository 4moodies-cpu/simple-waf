const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Поточні правила WAF (пусті за замовчуванням)
let wafRules = {
    ip: '',
    browser: '',
    language: '',
    country: '', // Імітація
    method: ''
};

// Дані останнього відвідувача
let lastVisitor = {
    ip: '-', browser: '-', language: '-', country: '-', method: '-'
};

// 1. Ендпоінт для перевірки доступу користувача
app.get('/api/check-access', (req, res) => {
    // Збираємо параметри запиту
    const userAgent = req.headers['user-agent'] || '';
    let browser = 'Unknown';
    if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) browser = 'Safari';

    const currentVisitor = {
        ip: req.ip === '::1' ? '127.0.0.1' : req.ip,
        browser: browser,
        language: req.headers['accept-language'] ? req.headers['accept-language'].split(',')[0] : 'uk',
        country: req.headers['accept-language']?.includes('uk') ? 'Україна' : 'США', // Спрощена імітація для наочності
        method: req.method
    };

    lastVisitor = currentVisitor; // Оновлюємо лог для адміна

    // Перевірка за правилами WAF (якщо правило задане і збігається — блокуємо)
    let isBlocked = false;
    let matchingReason = '';

    if (wafRules.ip && currentVisitor.ip === wafRules.ip) { isBlocked = true; matchingReason = 'IP адреса в чорному списку'; }
    if (wafRules.browser && currentVisitor.browser === wafRules.browser) { isBlocked = true; matchingReason = 'Цей бравзер заблоковано'; }
    if (wafRules.language && currentVisitor.language.includes(wafRules.language)) { isBlocked = true; matchingReason = 'Мова системи заборонена'; }
    if (wafRules.country && currentVisitor.country === wafRules.country) { isBlocked = true; matchingReason = 'Країна під санкціями'; }
    if (wafRules.method && currentVisitor.method === wafRules.method) { isBlocked = true; matchingReason = 'Цей тип запиту (HTTP Method) заблоковано'; }

    res.json({ blocked: isBlocked, reason: matchingReason, details: currentVisitor });
});

// 2. Ендпоінт для адміна: отримати правила та останнього юзера
app.get('/api/admin/status', (req, res) => {
    res.json({ wafRules, lastVisitor });
});

// 3. Ендпоінт для адміна: оновити правила WAF
app.post('/api/admin/update', (req, res) => {
    wafRules = { ...wafRules, ...req.body };
    res.json({ success: true, message: 'Правила WAF успішно оновлено!' });
});

app.listen(PORT, () => {
    console.log(`🚀 Симуляція WAF запущена!`);
    console.log(`👤 Інтерфейс користувача: http://localhost:${PORT}/user.html`);
    console.log(`👑 Консоль адміна: http://localhost:${PORT}/admin.html`);
});
