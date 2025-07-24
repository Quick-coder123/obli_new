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

// Перевірка чи Supabase доступний
function isSupabaseAvailable() {
    return supabaseClient && SUPABASE_CONFIG.url !== 'YOUR_SUPABASE_URL';
}

// SQL для створення таблиць (виконати в Supabase SQL Editor)
const CREATE_TABLES_SQL = `
-- Таблиця для активних карток
CREATE TABLE IF NOT EXISTS cards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name TEXT NOT NULL,
    ipn TEXT NOT NULL,
    organization TEXT NOT NULL,
    account_open_date DATE NOT NULL,
    first_deposit_date DATE,
    card_status TEXT NOT NULL DEFAULT 'Виготовляється',
    comment TEXT,
    documents JSONB DEFAULT '{"contract": false, "survey": false, "passport": false}',
    account_status TEXT NOT NULL DEFAULT 'Очікує активацію',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблиця для архівних карток
CREATE TABLE IF NOT EXISTS archived_cards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name TEXT NOT NULL,
    ipn TEXT NOT NULL,
    organization TEXT NOT NULL,
    account_open_date DATE NOT NULL,
    first_deposit_date DATE,
    card_status TEXT NOT NULL DEFAULT 'Виготовляється',
    comment TEXT,
    documents JSONB DEFAULT '{"contract": false, "survey": false, "passport": false}',
    account_status TEXT NOT NULL DEFAULT 'Очікує активацію',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    archived_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS (Row Level Security) політики
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE archived_cards ENABLE ROW LEVEL SECURITY;

-- Дозволити всім операції (для простоти, в продакшені слід налаштувати безпеку)
CREATE POLICY "Enable all operations for cards" ON cards FOR ALL USING (true);
CREATE POLICY "Enable all operations for archived_cards" ON archived_cards FOR ALL USING (true);

-- Індекси для оптимізації
CREATE INDEX IF NOT EXISTS idx_cards_organization ON cards(organization);
CREATE INDEX IF NOT EXISTS idx_cards_account_open_date ON cards(account_open_date);
CREATE INDEX IF NOT EXISTS idx_cards_account_status ON cards(account_status);
CREATE INDEX IF NOT EXISTS idx_archived_cards_organization ON archived_cards(organization);
CREATE INDEX IF NOT EXISTS idx_archived_cards_account_open_date ON archived_cards(account_open_date);
`;

console.log('SQL для створення таблиць:', CREATE_TABLES_SQL);

// Ініціалізація при завантаженні сторінки
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Початок ініціалізації системи...');
    
    // Чекаємо трохи, щоб Supabase SDK точно завантажився
    setTimeout(() => {
        const isSupabaseReady = initSupabase();
        
        if (isSupabaseReady) {
            console.log('✅ Система готова з Supabase');
        } else {
            console.log('⚠️ Система працює в режимі LocalStorage');
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
