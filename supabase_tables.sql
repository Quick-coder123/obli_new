-- Спрощений SQL для Supabase (без кирилиці)
-- Виконувати по частинах

-- 1. Створення таблиці для активних карток
CREATE TABLE IF NOT EXISTS cards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name TEXT NOT NULL,
    ipn TEXT NOT NULL,
    organization TEXT NOT NULL,
    account_open_date DATE NOT NULL,
    first_deposit_date DATE,
    card_status TEXT NOT NULL DEFAULT 'Manufacturing',
    comment TEXT,
    documents JSONB DEFAULT '{"contract": false, "survey": false, "passport": false}',
    account_status TEXT NOT NULL DEFAULT 'Pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Створення таблиці для архівних карток
CREATE TABLE IF NOT EXISTS archived_cards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name TEXT NOT NULL,
    ipn TEXT NOT NULL,
    organization TEXT NOT NULL,
    account_open_date DATE NOT NULL,
    first_deposit_date DATE,
    card_status TEXT NOT NULL DEFAULT 'Manufacturing',
    comment TEXT,
    documents JSONB DEFAULT '{"contract": false, "survey": false, "passport": false}',
    account_status TEXT NOT NULL DEFAULT 'Pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    archived_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Налаштування Row Level Security
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE archived_cards ENABLE ROW LEVEL SECURITY;

-- 4. Створення політик доступу
CREATE POLICY "Enable all operations for cards" ON cards FOR ALL USING (true);
CREATE POLICY "Enable all operations for archived_cards" ON archived_cards FOR ALL USING (true);

-- 5. Створення індексів для швидкості
CREATE INDEX IF NOT EXISTS idx_cards_organization ON cards(organization);
CREATE INDEX IF NOT EXISTS idx_cards_account_open_date ON cards(account_open_date);
CREATE INDEX IF NOT EXISTS idx_cards_account_status ON cards(account_status);
CREATE INDEX IF NOT EXISTS idx_archived_cards_organization ON archived_cards(organization);
CREATE INDEX IF NOT EXISTS idx_archived_cards_account_open_date ON archived_cards(account_open_date);
