# 🚀 Швидке налаштування Supabase

## Крок 1: Створіть проект
1. Йдіть на https://supabase.com
2. Натисніть "New Project"
3. Введіть назву проекту
4. Створіть пароль
5. Натисніть "Create new project"

## Крок 2: Отримайте ключі
1. Перейдіть в Settings → API
2. Скопіюйте:
   - **Project URL**
   - **anon public key**

## Крок 3: Налаштуйте конфігурацію
Відкрийте файл `supabaseConfig.js` та замініть:
```javascript
url: 'YOUR_SUPABASE_URL', // Вставте ваш Project URL
anonKey: 'YOUR_SUPABASE_ANON_KEY', // Вставте ваш anon key
```

## Крок 4: Створіть таблиці
Є 2 способи:

### Спосіб А - SQL Editor
1. Перейдіть в SQL Editor
2. Скопіюйте SQL з файлу `supabase_tables.sql`
3. Натисніть Run

### Спосіб Б - Table Editor (якщо SQL не працює)
1. Перейдіть в Table Editor
2. Натисніть "Create new table"
3. Створіть таблицю `cards` з полями:
   - id (uuid) - primary key
   - full_name (text) - required
   - ipn (text) - required  
   - organization (text) - required
   - account_open_date (date) - required
   - first_deposit_date (date) - optional
   - card_status (text) - default: 'Manufacturing'
   - comment (text) - optional
   - documents (jsonb) - default: {"contract":false,"survey":false,"passport":false}
   - account_status (text) - default: 'Pending'
   - created_at (timestamptz) - default: now()
   - updated_at (timestamptz) - default: now()

4. Створіть таблицю `archived_cards` з такими ж полями + archived_at

## Крок 5: Перевірте роботу
1. Оновіть сторінку
2. Відкрийте консоль браузера (F12)
3. Якщо бачите "Supabase ініціалізовано" - все працює!

## ❗ Якщо є помилки:
- Перевірте правильність URL та ключа
- Переконайтеся що таблиці створені
- Система автоматично перейде на LocalStorage як fallback
