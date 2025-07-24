# Інструкції по деплою на Vercel

## Крок 1: Підготовка проекту

Переконайтеся, що всі файли проекту знаходяться в корневій директорії:
- `index.html`
- `archive.html`
- `report.html`
- `cardManager.js`
- `archiveManager.js`
- `reportGenerator.js`
- `styles.css`
- `testData.js`
- `package.json`
- `vercel.json`

## Крок 2: Деплой через Vercel CLI

```bash
# Встановити Vercel CLI глобально
npm install -g vercel

# Увійти в аккаунт Vercel
vercel login

# Деплой проекту
vercel --prod
```

## Крок 3: Деплой через GitHub

1. Завантажте проект на GitHub
2. Увійдіть на https://vercel.com
3. Натисніть "New Project"
4. Виберіть ваш GitHub репозиторій
5. Натисніть "Deploy"

## Крок 4: Налаштування маршрутів

Файл `vercel.json` вже налаштований для правильної роботи маршрутів:
- `/` → `index.html`
- `/archive` → `archive.html`
- `/report` → `report.html`

## Крок 5: Перевірка деплою

Після успішного деплою перевірте:
- Головну сторінку (облік карток)
- Сторінку архіву
- Сторінку звітів
- Функціональність додавання/редагування карток
- Роботу фільтрів
- Автоматичне архівування

## Альтернативні хостинги

### Netlify
1. Перетягніть папку проекту на https://app.netlify.com/drop
2. Налаштуйте redirects у файлі `_redirects`:
```
/archive    /archive.html   200
/report     /report.html    200
/*          /index.html     200
```

### GitHub Pages

1. Завантажте файли в репозиторій
2. Увімкніть GitHub Pages в налаштуваннях репозиторію
3. Виберіть source branch (зазвичай `main`)
4. Сайт буде доступний за адресою: `https://username.github.io/repository-name`

## Структура URL після деплою

- Головна сторінка: `https://your-domain.vercel.app/`
- Архів: `https://your-domain.vercel.app/archive`
- Звіти: `https://your-domain.vercel.app/report`

## Важливі примітки

- Всі дані зберігаються в localStorage браузера
- При першому відвідуванні завантажуються тестові дані
- Система повністю клієнтська, не потребує бази даних
