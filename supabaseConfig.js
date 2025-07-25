// Конфігурація Supabase
const SUPABASE_CONFIG = {
    url: 'https://erbvalpdaibohfwhixpe.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVyYnZhbHBkYWlib2hmd2hpeHBlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzNjYwMTksImV4cCI6MjA2ODk0MjAxOX0.pskoRXUVRTc5_gIcb0oV5u78pwcRjtfXbmY2TGz1TTI',
    
    // Назви таблиць
    tables: {
        cards: 'cards',
        archivedCards: 'archivedCards'
    }
};

// Ініціалізація Supabase клієнта
let supabaseClient = null;

// Функція для ініціалізації Supabase
function initSupabase() {
    try {
        // Перевіряємо чи Supabase SDK завантажений
        if (typeof window !== 'undefined' && window.supabase) {
            supabaseClient = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
            console.log('✅ Supabase успішно ініціалізовано');
            return true;
        } else {
            console.warn('⚠️ Supabase SDK не завантажено, використовується LocalStorage');
            return false;
        }
    } catch (error) {
        console.error('❌ Помилка ініціалізації Supabase:', error);
        return false;
    }
}

// Перевірка чи Supabase доступний
function isSupabaseAvailable() {
    return supabaseClient && SUPABASE_CONFIG.url === 'https://erbvalpdaibohfwhixpe.supabase.co';
}

// Ініціалізація при завантаженні сторінки
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Початок ініціалізації системи...');
    
    // Чекаємо трохи, щоб Supabase SDK точно завантажився
    setTimeout(() => {
        const isSupabaseReady = initSupabase();
        
        if (isSupabaseReady) {
            console.log('✅ Система готова з Supabase');
        } else {
            console.error('❌ Помилка: Supabase не ініціалізовано! Перевірте підключення.');
        }
    }, 100);
});

// Додаткова перевірка для старих браузерів
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        console.log('📱 Система завантажена (fallback)');
    });
} else {
    console.log('📱 Сторінка вже завантажена, ініціалізуємо...');
    setTimeout(() => {
        initSupabase();
    }, 100);
}
