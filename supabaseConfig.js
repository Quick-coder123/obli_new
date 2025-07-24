// Конфігурація Supabase
const SUPABASE_CONFIG = {
    url: 'https://erbvalpdaibohfwhixpe.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVyYnZhbHBkYWlib2hmd2hpeHBlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzNjYwMTksImV4cCI6MjA2ODk0MjAxOX0.pskoRXUVRTc5_gIcb0oV5u78pwcRjtfXbmY2TGz1TTI',
    
    // Назви таблиць
    tables: {
        cards: 'cards',
        archived_cards: 'archived_cards'
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

// Функція для перевірки та створення таблиць
async function checkAndCreateTables() {
    if (!supabaseClient) {
        console.error('❌ Supabase клієнт не ініціалізований');
        return false;
    }

    try {
        console.log('🔍 Перевіряю наявність таблиць...');
        
        // Перевіряємо чи існує таблиця cards
        const { data: cardsCheck, error: cardsError } = await supabaseClient
            .from('cards')
            .select('count')
            .limit(1);

        if (cardsError && cardsError.code === 'PGRST116') {
            // Таблиця не існує
            console.log('⚠️ Таблиці не знайдено. Потрібно створити таблиці в Supabase');
            showTableCreationMessage();
            return false;
        }

        if (cardsError) {
            throw cardsError;
        }

        console.log('✅ Таблиці знайдено та доступні');
        return true;

    } catch (error) {
        console.error('❌ Помилка перевірки таблиць:', error);
        showTableCreationMessage();
        return false;
    }
}

// Показуємо повідомлення про необхідність створення таблиць
function showTableCreationMessage() {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-white p-6 rounded-lg shadow-lg z-50 max-w-md';
    messageDiv.innerHTML = `
        <div class="text-center">
            <h3 class="font-bold text-lg mb-2">📋 Потрібно створити таблиці в Supabase</h3>
            <p class="mb-4">Перейдіть в Supabase SQL Editor та виконайте SQL з файлу <code>supabase_tables.sql</code></p>
            <button onclick="this.parentElement.parentElement.remove()" class="bg-white text-yellow-600 px-4 py-2 rounded font-semibold">
                Зрозуміло
            </button>
        </div>
    `;
    document.body.appendChild(messageDiv);
}

// Перевірка чи Supabase доступний
function isSupabaseAvailable() {
    return supabaseClient && SUPABASE_CONFIG.url !== 'https://erbvalpdaibohfwhixpe.supabase.co';
}

// Ініціалізація при завантаженні сторінки
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Початок ініціалізації системи...');
    
    // Чекаємо трохи, щоб Supabase SDK точно завантажився
    setTimeout(async () => {
        const isSupabaseReady = initSupabase();
        
        if (isSupabaseReady) {
            console.log('✅ Supabase успішно ініціалізовано');
            
            // Перевіряємо наявність таблиць
            const tablesReady = await checkAndCreateTables();
            
            if (tablesReady) {
                console.log('🎉 Система повністю готова!');
            } else {
                console.log('⚠️ Система готова, але потрібно створити таблиці');
            }
        } else {
            console.error('❌ Помилка: Supabase не ініціалізовано!');
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
    setTimeout(async () => {
        const isSupabaseReady = initSupabase();
        if (isSupabaseReady) {
            await checkAndCreateTables();
        }
    }, 100);
}
