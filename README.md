# RemontPro — сайт компании по ремонту под ключ

Многостраничный статический сайт компании **RemontPro** — ремонт квартир, домов
и коммерческих помещений под ключ в **Геленджике** и **Новороссийске**.

Сделан на чистом HTML, CSS и JavaScript без тяжёлых библиотек. Готов к публикации
на **GitHub Pages**.

## Структура

```
/
├── index.html              Главная страница
├── uslugi/                 Услуги
├── prices/                 Цены и прайс-лист
├── portfolio/              Портфолио проектов
├── goroda/
│   ├── gelendzhik/         Ремонт в Геленджике
│   └── novorossiysk/       Ремонт в Новороссийске
├── blog/                   Блог
├── faq/                    Вопросы и ответы
├── contacts/               Контакты и форма заявки
├── assets/
│   ├── css/style.css       Все стили
│   ├── js/main.js          Меню, FAQ, обработка форм
│   ├── images/             Изображения
│   └── fonts/              Шрифты
├── sitemap.xml             Карта сайта
├── robots.txt              Правила для поисковых роботов
└── .nojekyll               Отключает обработку Jekyll на GitHub Pages
```

## Перед запуском в продакшн

1. **Телефон.** Замените `PLACEHOLDER_PHONE` на реальный номер в международном
   формате без `+`, пробелов и скобок (например, `79180000000`). Он используется
   в ссылках `tel:` и `https://wa.me/`. Также обновите отображаемый номер
   `+7 (XXX) XXX-XX-XX`.
2. **Домен.** Замените `https://remontpro.example/` на ваш реальный домен в
   `<link rel="canonical">`, Open Graph, `sitemap.xml`, `robots.txt` и schema.org.
3. **E-mail.** Замените `info@remontpro.example` на рабочий адрес.
4. **Open Graph картинка.** Положите `assets/images/og-cover.jpg` (рекомендуемый
   размер 1200×630).
5. **Обработка форм.** Сейчас формы показывают сообщение об успехе на стороне
   клиента (демо). Для приёма заявок подключите бэкенд или сервис форм
   (например, Formspree) в `assets/js/main.js`.

## Публикация на GitHub Pages

1. Запушьте репозиторий на GitHub.
2. Settings → Pages → Build and deployment → Source: **Deploy from a branch**.
3. Выберите ветку и папку `/ (root)`, сохраните.
4. Сайт будет доступен по адресу `https://<username>.github.io/<repo>/`.

> Если сайт публикуется не в корне домена (т.е. по пути `/<repo>/`), все ссылки
> уже относительные и продолжат работать.

## SEO

- Уникальные `title` и `description` на каждой странице.
- Корректная структура заголовков `h1` → `h2` → `h3`.
- Open Graph и Twitter Card разметка.
- Микроразметка schema.org: `HomeAndConstructionBusiness` и `FAQPage`.
- `sitemap.xml` и `robots.txt`.
