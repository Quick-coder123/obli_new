# Налаштування Supabase

## Крок 1: Створення проекту в Supabase

1. Перейдіть на https://supabase.com
2. Натисніть "Start your project"
3. Увійдіть в аккаунт або створіть новий
4. Натисніть "New project"
5. Оберіть організацію
6. Введіть назву проекту (наприклад, "card-accounting")
7. Створіть надійний пароль для бази даних
8. Оберіть регіон (найближчий до вас)
9. Натисніть "Create new project"

## Крок 2: Отримання URL та ключів

1. Після створення проекту перейдіть в "Settings" → "API"
2. Скопіюйте:
   - **Project URL** 
   - **anon public** ключ

## Крок 3: Налаштування конфігурації

Відкрийте файл `supabaseConfig.js` та замініть:

```javascript
const SUPABASE_CONFIG = {
    url: 'YOUR_SUPABASE_URL', // Вставте ваш Project URL
    anonKey: 'YOUR_SUPABASE_ANON_KEY', // Вставте ваш anon public ключ
    
    // Назви таблиць
    tables: {
        cards: 'cards',
        archived_cards: 'archived_cards'
    }
};
```

## Крок 4: Створення таблиць

1. В Supabase Dashboard перейдіть в "SQL Editor"
2. Скопіюйте та виконайте наступний SQL код:

```sql
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
```

3. Натисніть "Run" для виконання запиту

## Крок 5: Перевірка роботи

1. Після налаштування оновіть сторінку
2. Відкрийте консоль браузера (F12)
3. Якщо ви побачите "Supabase ініціалізовано" - все працює
4. Якщо "Використовується LocalStorage" - перевірте налаштування

## Крок 6: Тестування

1. Спробуйте додати нову картку
2. Перейдіть в Supabase Dashboard → "Table Editor"
3. Оберіть таблицю "cards"
4. Ви повинні побачити додану картку

## Переваги Supabase над LocalStorage

✅ **Синхронізація між пристроями**
✅ **Збереження даних в хмарі**
✅ **Автоматичні бекапи**
✅ **Можливість командної роботи**
✅ **SQL запити для складних звітів**
✅ **Real-time оновлення (можна додати)**

## Fallback режим

Якщо Supabase недоступний, система автоматично використовуватиме LocalStorage як резервний варіант.

## Безпека (для продакшену)

Для продакшн середовища рекомендуємо:
1. Налаштувати RLS політики з автентифікацією
2. Обмежити доступ по IP
3. Використовувати змінні середовища для ключів
