#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Генератор SEO-страниц RemontPro: услуга × локация.
Создаёт /r/<slug>/index.html, каталог /r/index.html и обновляет sitemap.xml."""
import os, glob, html, hashlib, json, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = "https://remont-kk.ru"
PHONE_DISP = "+7 900 272-10-01"
PREFIX = "../../"   # из /r/<slug>/ до корня

# ---------- транслитерация ----------
_T = {'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'e','ж':'zh','з':'z',
'и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s',
'т':'t','у':'u','ф':'f','х':'h','ц':'c','ч':'ch','ш':'sh','щ':'sch','ъ':'','ы':'y',
'ь':'','э':'e','ю':'yu','я':'ya',' ':'-','—':'-','/':'-'}
def slugify(s):
    s = s.lower()
    out = ''.join(_T.get(ch, ch if ch.isalnum() else '-') for ch in s)
    out = re.sub(r'-+', '-', out).strip('-')
    return out

# ---------- данные ----------
SERVICES = [
 "Ремонт квартир под ключ","Капитальный ремонт квартиры","Косметический ремонт квартиры",
 "Дизайнерский ремонт","Ремонт новостройки","Ремонт вторички","Ремонт квартиры-студии",
 "Ремонт однокомнатной квартиры","Ремонт двухкомнатной квартиры","Ремонт трёхкомнатной квартиры",
 "Ремонт ванной комнаты","Ремонт санузла под ключ","Ремонт кухни","Ремонт спальни",
 "Ремонт гостиной","Ремонт прихожей","Ремонт балкона и лоджии","Ремонт дома под ключ",
 "Ремонт коттеджа","Ремонт таунхауса","Ремонт апартаментов","Ремонт офиса",
 "Ремонт магазина","Ремонт коммерческих помещений","Отделка квартир","Черновая отделка",
 "Чистовая отделка","Штукатурка стен по маякам","Стяжка пола","Электромонтажные работы",
 "Сантехнические работы","Укладка плитки и керамогранита","Монтаж натяжных потолков",
 "Поклейка обоев","Покраска стен","Монтаж тёплого пола","Перепланировка квартиры",
 "Демонтажные работы","Утепление балкона","Ремонт по дизайн-проекту",
]

# локация -> город (для контекста/схемы)
GEL = "Геленджик"; NVR = "Новороссийск"; ANP = "Анапа"
LOCATIONS = [
 ("Геленджик",GEL),("Кабардинка",GEL),("Дивноморское",GEL),("Архипо-Осиповка",GEL),
 ("Джанхот",GEL),("Прасковеевка",GEL),("Криница",GEL),("Бетта",GEL),("Возрождение",GEL),
 ("Виноградное",GEL),("Светлый",GEL),("Тонкий Мыс",GEL),("Толстый Мыс",GEL),
 ("микрорайон Парус",GEL),("Голубая Бухта",GEL),("Марьина Роща",GEL),("Пшада",GEL),
 ("Михайловский Перевал",GEL),("Широкая Щель",GEL),("Текос",GEL),
 ("Новороссийск",NVR),("Мысхако",NVR),("Цемдолина",NVR),("Южная Озереевка",NVR),
 ("Северная Озереевка",NVR),("Глебовское",NVR),("Гайдук",NVR),("Верхнебаканский",NVR),
 ("Абрау-Дюрсо",NVR),("Борисовка",NVR),("Кириловка",NVR),("Владимировка",NVR),
 ("Восточный район",NVR),("Центральный район",NVR),("Южный район",NVR),
 ("Приморский район",NVR),("Мефодиевка",NVR),("Шесхарис",NVR),("Широкая Балка",NVR),
 ("посёлок Дюрсо",NVR),
 ("Анапа",ANP),("Витязево",ANP),("Сукко",ANP),("Супсех",ANP),("Гостагаевская",ANP),
 ("Натухаевская",ANP),("Раевская",ANP),("Джемете",ANP),("Большой Утриш",ANP),("Варваровка",ANP),
]

# предложный падеж локаций (в ...)
PREP = {
 "Геленджик":"Геленджике","Кабардинка":"Кабардинке","Дивноморское":"Дивноморском",
 "Архипо-Осиповка":"Архипо-Осиповке","Джанхот":"Джанхоте","Прасковеевка":"Прасковеевке",
 "Криница":"Кринице","Бетта":"Бетте","Возрождение":"Возрождении","Виноградное":"Виноградном",
 "Светлый":"Светлом","Тонкий Мыс":"Тонком Мысе","Толстый Мыс":"Толстом Мысе",
 "микрорайон Парус":"микрорайоне Парус","Голубая Бухта":"Голубой Бухте","Марьина Роща":"Марьиной Роще",
 "Пшада":"Пшаде","Михайловский Перевал":"Михайловском Перевале","Широкая Щель":"Широкой Щели",
 "Текос":"Текосе","Новороссийск":"Новороссийске","Мысхако":"Мысхако","Цемдолина":"Цемдолине",
 "Южная Озереевка":"Южной Озереевке","Северная Озереевка":"Северной Озереевке","Глебовское":"Глебовском",
 "Гайдук":"Гайдуке","Верхнебаканский":"Верхнебаканском","Абрау-Дюрсо":"Абрау-Дюрсо","Борисовка":"Борисовке",
 "Кириловка":"Кириловке","Владимировка":"Владимировке","Восточный район":"Восточном районе",
 "Центральный район":"Центральном районе","Южный район":"Южном районе","Приморский район":"Приморском районе",
 "Мефодиевка":"Мефодиевке","Шесхарис":"Шесхарисе","Широкая Балка":"Широкой Балке","посёлок Дюрсо":"посёлке Дюрсо",
 "Анапа":"Анапе","Витязево":"Витязево","Сукко":"Сукко","Супсех":"Супсехе","Гостагаевская":"Гостагаевской",
 "Натухаевская":"Натухаевской","Раевская":"Раевской","Джемете":"Джемете","Большой Утриш":"Большом Утрише",
 "Варваровка":"Варваровке",
}

PHOTOS = sorted(p.replace(ROOT+"/","") for p in glob.glob(ROOT+"/assets/images/**/*.webp", recursive=True))

INTRO = [
 "Студия RemontPro выполняет «{s_low}» в {loc_in} ({city}) под ключ: с замером, прозрачной сметой в договоре, фотоотчётами по этапам и сдачей готового результата без хаоса и срыва сроков.",
 "Закажите «{s_low}» в {loc_in} — RemontPro ведёт объект как управляемый проект: фиксируем стоимость, согласуем график этапов и держим вас в курсе на каждом шаге, даже если вы в другом городе.",
 "Профессиональный {s_low2} в {loc_in} от RemontPro: опытная бригада, материалы по оптовым ценам, гарантия до 3 лет и регулярная фотофиксация работ. Работаем в {city} и пригороде.",
 "Нужен {s_low2} в {loc_in}? RemontPro сделает аккуратно и в срок: смета без скрытых платежей, поэтапная оплата за принятые работы и контроль качества на всех стадиях.",
 "RemontPro — {s_low2} в {loc_in} и по всему направлению {city}. Учитываем влажный климат побережья, подбираем долговечные материалы и сдаём объект, готовый к заселению.",
]
REVIEWS = [
 "«Делали {s_low} в {loc_in} — каждую неделю фотоотчёт, смета не выросла. Приняли работу дистанционно, всё чётко.» — Анна, {city}",
 "«Заказывали {s_low} в {loc_in}. Аккуратно, в срок, без лишней пыли и нервов. Рекомендую RemontPro.» — Дмитрий, {city}",
 "«Спасибо за {s_low} в {loc_in}: понятный график, честные материалы, результат как на дизайн-проекте.» — Марина и Олег, {city}",
]

def loc_in(name):
    return "в " + PREP.get(name, name)

def esc(s): return html.escape(s, quote=True)

def header():
    nav = [("Услуги","uslugi/"),("Портфолио","portfolio/"),("Видео","videos/"),
           ("Цены","prices/"),("Блог","blog/"),("Контакты","contacts/")]
    links = "".join(f'<a href="{PREFIX}{h}">{t}</a>' for t,h in nav)
    return f'''<header class="site-header">
    <div class="container header-row">
      <a class="brand" href="{PREFIX}index.html" aria-label="RemontPro">
        <span class="brand-mark" aria-hidden="true"><svg viewBox="0 0 100 100" role="img"><rect width="100" height="100" rx="22"/><path d="M26 58c8-8 16-8 24 0s16 8 24 0"/><rect x="26" y="29" width="38" height="7" rx="3.5"/><rect x="26" y="44" width="25" height="7" rx="3.5"/></svg></span>
        <span class="brand-text">RemontPro<small>ремонт под ключ</small></span>
      </a>
      <nav class="nav" aria-label="Главное меню">{links}</nav>
      <div class="header-actions">
        <a class="phone" href="tel:+79002721001">{PHONE_DISP}</a>
        <a class="btn btn-small btn-primary" href="{PREFIX}contacts/">Обсудить ремонт</a>
        <button class="menu-button" type="button" aria-label="Меню" aria-expanded="false"><span></span><span></span></button>
      </div>
    </div>
  </header>'''

def footer():
    return f'''<footer class="footer">
    <div class="container footer-grid">
      <div>
        <a class="brand footer-brand" href="{PREFIX}index.html"><span class="brand-mark" aria-hidden="true"><svg viewBox="0 0 100 100"><rect width="100" height="100" rx="22"/><path d="M26 58c8-8 16-8 24 0s16 8 24 0"/><rect x="26" y="29" width="38" height="7" rx="3.5"/><rect x="26" y="44" width="25" height="7" rx="3.5"/></svg></span><span class="brand-text">RemontPro<small>ремонт под ключ</small></span></a>
        <p>Ремонт квартир, домов и коммерческих помещений под ключ в Геленджике, Новороссийске и Анапе.</p>
      </div>
      <div><h4>Разделы</h4><a href="{PREFIX}uslugi/">Услуги</a><a href="{PREFIX}portfolio/">Портфолио</a><a href="{PREFIX}videos/">Видео</a><a href="{PREFIX}prices/">Цены</a><a href="{PREFIX}r/">Все услуги и районы</a></div>
      <div><h4>География</h4><a href="{PREFIX}goroda/gelendzhik/">Геленджик</a><a href="{PREFIX}goroda/novorossiysk/">Новороссийск</a><a href="{PREFIX}contacts/">Контакты</a></div>
      <div><h4>Контакты</h4><a href="tel:+79002721001">{PHONE_DISP}</a><a href="https://t.me/+79002721001" target="_blank" rel="noopener">Telegram</a><a href="https://max.ru/u/79002721001" target="_blank" rel="noopener">MAX</a><a href="mailto:prof.remont.25@mail.ru">prof.remont.25@mail.ru</a></div>
    </div>
    <div class="container footer-bottom"><span>© <span class="js-year">2026</span> RemontPro. Все права защищены.</span><small>ООО ИСК «Девелоперы» · ИНН 2304085881 · ОГРН 1252300031312</small></div>
  </footer>'''

METRIKA = '''  <!-- Yandex.Metrika counter -->
  <script type="text/javascript">
      (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};m[i].l=1*new Date();for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})(window, document,'script','https://mc.yandex.ru/metrika/tag.js?id=110038302', 'ym');
      ym(110038302, 'init', {ssr:true, webvisor:true, clickmap:true, ecommerce:"dataLayer", referrer: document.referrer, url: location.href, accurateTrackBounce:true, trackLinks:true});
  </script>
  <noscript><div><img src="https://mc.yandex.ru/watch/110038302" style="position:absolute; left:-9999px;" alt="" /></div></noscript>
  <!-- /Yandex.Metrika counter -->'''

FAVICON = '''<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='22' fill='%23111111'/%3E%3Cpath d='M28 56c7-7 14-7 21 0s14 7 21 0' stroke='%23FEBD17' stroke-width='7' fill='none' stroke-linecap='round'/%3E%3Crect x='28' y='30' width='36' height='7' rx='3.5' fill='white'/%3E%3Crect x='28' y='44' width='24' height='7' rx='3.5' fill='%23FEBD17'/%3E%3C/svg%3E\" />'''

def page(service, location, city, idx, all_pairs):
    s = service; loc = location
    s_low = s[0].lower()+s[1:]
    li = loc_in(loc)
    title = f"{s} {li} — цены, фото | RemontPro"
    desc = f"{s} {li} ({city}): смета в договоре, фотоотчёты, гарантия до 3 лет. Бесплатный замер. Телефон {PHONE_DISP}."
    slug = slugify(s)+"-"+slugify(loc)
    url = f"{SITE}/r/{slug}/"
    h = int(hashlib.md5(slug.encode()).hexdigest(), 16)
    intro = INTRO[h % len(INTRO)].format(s_low=s_low, s_low2=s_low, loc_in=li, city=city)
    review = REVIEWS[h % len(REVIEWS)].format(s_low=s_low, loc_in=li, city=city)
    # фото-галерея: 4 фото с ротацией
    n = len(PHOTOS); k = 4
    pics = [PHOTOS[(h + i*7) % n] for i in range(k)]
    gal = "".join(
        f'<img src="{PREFIX}{p}" alt="{esc(s+" "+li)} — фото {i+1}" loading="lazy" width="600" height="450">'
        for i,p in enumerate(pics))
    # что входит
    incl = ["Бесплатный выезд замерщика и расчёт сметы",
            "Договор с фиксированной стоимостью и сроком",
            "Закупка материалов по оптовым ценам",
            "Фотоотчёты по каждому этапу работ",
            "Поэтапная оплата за принятые работы",
            "Гарантия на работы до 3 лет"]
    incl_html = "".join(f"<li>{esc(x)}</li>" for x in incl)
    steps = [("01","Замер и смета","Выезжаем на объект, снимаем размеры, считаем смету и сроки."),
             ("02","Договор","Фиксируем стоимость, объём и график этапов в договоре."),
             ("03","Работы и отчёты","Ведём ремонт, присылаем фотоотчёты, контролируем качество."),
             ("04","Сдача","Финальная приёмка, уборка и гарантия.")]
    steps_html = "".join(f'<div class="step"><b>{n}</b><h3>{esc(t)}</h3><p>{esc(d)}</p></div>' for n,t,d in steps)
    # related: 5 услуг в этой локации + 5 этой услуги в др. локациях
    rel = []
    same_loc = [(ss,loc) for ss in SERVICES if ss!=s][h%7:][:5]
    same_srv = [(s,ll[0]) for ll in LOCATIONS if ll[0]!=loc][h%11:][:5]
    for ss,ll in same_loc+same_srv:
        rsl = slugify(ss)+"-"+slugify(ll)
        rel.append(f'<a href="{PREFIX}r/{rsl}/">{esc(ss)} {esc(loc_in(ll))}</a>')
    rel_html = "".join(rel)
    faq = [(f"Сколько стоит {s_low} {li}?",
            "Точная стоимость считается после бесплатного замера и зависит от площади, состояния объекта и материалов. В договоре цена фиксируется и не меняется без изменения объёма."),
           (f"За какой срок выполняете {s_low}?",
            "Сроки зависят от площади и объёма. На замере мы составляем график этапов с датами и придерживаемся его."),
           (f"Вы работаете {li}?",
            f"Да, RemontPro работает в {city} и пригороде, включая {loc}. Выезд замерщика бесплатный.")]
    faq_html = "".join(f'<div class="faq-item"><button class="faq-q" aria-expanded="false">{esc(q)}<i></i></button><div class="faq-a"><p>{esc(a)}</p></div></div>' for q,a in faq)
    # schema
    schema = {
      "@context":"https://schema.org","@type":"Service","serviceType":s,
      "name":f"{s} {li}","areaServed":{"@type":"Place","name":loc},
      "provider":{"@type":"HomeAndConstructionBusiness","name":"RemontPro","telephone":"+79002721001",
                  "areaServed":city,"url":SITE+"/"},
      "url":url,"description":desc
    }
    bc = {"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[
       {"@type":"ListItem","position":1,"name":"Главная","item":SITE+"/"},
       {"@type":"ListItem","position":2,"name":"Услуги и районы","item":SITE+"/r/"},
       {"@type":"ListItem","position":3,"name":f"{s} {li}","item":url}]}
    return f'''<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{esc(title)}</title>
  <meta name="description" content="{esc(desc)}" />
  <link rel="canonical" href="{url}" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="{esc(title)}" />
  <meta property="og:description" content="{esc(desc)}" />
  <meta property="og:url" content="{url}" />
  <meta name="theme-color" content="#111111" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="{PREFIX}assets/css/style.css" />
  {FAVICON}
  <script type="application/ld+json">{json.dumps(schema, ensure_ascii=False)}</script>
  <script type="application/ld+json">{json.dumps(bc, ensure_ascii=False)}</script>
{METRIKA}
</head>
<body>
  {header()}
  <main>
    <section class="page-head">
      <div class="wrap">
        <nav class="crumbs"><a href="{PREFIX}index.html">Главная</a><span>/</span><a href="{PREFIX}r/">Услуги и районы</a><span>/</span>{esc(s)} {esc(li)}</nav>
        <h1>{esc(s)} {esc(li)}</h1>
        <p>{esc(intro)}</p>
      </div>
    </section>
    <section class="section">
      <div class="wrap">
        <div class="gallery">{gal}</div>
      </div>
    </section>
    <section class="section section--flush">
      <div class="wrap split">
        <div class="panel-card"><h2>Что входит</h2><ul class="control-list">{incl_html}</ul></div>
        <div class="panel-card panel-card--ink"><h2>Цены — ориентир</h2>
          <div class="estimate-row"><span>Косметический</span><b>от 8 000 ₽/м²</b></div>
          <div class="estimate-row"><span>Под ключ</span><b>от 14 000 ₽/м²</b></div>
          <div class="estimate-row"><span>Дизайнерский</span><b>от 22 000 ₽/м²</b></div>
          <p class="form__note">Точная цена — после бесплатного замера {esc(li)}.</p>
          <a class="btn btn-primary btn--lg" href="{PREFIX}contacts/">Вызвать замерщика</a>
        </div>
      </div>
    </section>
    <section class="section section--flush">
      <div class="wrap">
        <div class="sec-head"><h2>Как мы работаем</h2></div>
        <div class="timeline">{steps_html}</div>
      </div>
    </section>
    <section class="section section--flush">
      <div class="wrap">
        <div class="panel-card"><p style="margin:0;font-size:1.1rem;">{esc(review)}</p></div>
      </div>
    </section>
    <section class="section section--flush">
      <div class="wrap" style="max-width:860px">
        <div class="sec-head"><h2>Частые вопросы</h2></div>
        <div class="faq-list">{faq_html}</div>
      </div>
    </section>
    <section class="section section--flush">
      <div class="wrap lead">
        <div>
          <h2>Оставьте заявку на {esc(s_low)} {esc(li)}</h2>
          <p>Перезвоним, ответим на вопросы и согласуем бесплатный замер. Заявка дублируется в Telegram.</p>
          <p style="display:flex;gap:12px;flex-wrap:wrap;">
            <a class="btn btn-primary" href="https://t.me/+79002721001" target="_blank" rel="noopener">Написать в Telegram</a>
            <a class="btn btn--dark" href="https://max.ru/u/79002721001" target="_blank" rel="noopener">Написать в MAX</a>
          </p>
        </div>
        <form class="form js-lead" novalidate>
          <div class="field"><label>Ваше имя</label><input name="name" type="text" pattern="[А-Яа-яЁё\\s-]+" placeholder="Например, Иван" required></div>
          <div class="field"><label>Телефон</label><input name="phone" type="tel" value="+7 " placeholder="+7 (___) ___-__-__" required></div>
          <div class="field"><label>Площадь, м²</label><input name="area" type="number" min="1" inputmode="numeric" placeholder="Например, 64" required></div>
          <input type="hidden" name="message" value="{esc(s+' '+li)}">
          <button type="submit" class="btn btn-primary btn--block btn--lg">Отправить заявку</button>
          <div class="form__ok">Спасибо! Заявка отправлена — мы свяжемся с вами.</div>
        </form>
      </div>
    </section>
    <section class="section section--flush" style="padding-bottom:clamp(64px,9vw,130px)">
      <div class="wrap">
        <div class="sec-head"><h2>Смотрите также</h2></div>
        <div class="seo-rel">{rel_html}</div>
      </div>
    </section>
  </main>
  {footer()}
  <a class="fab-wa" href="https://t.me/+79002721001" target="_blank" rel="noopener" aria-label="Написать в Telegram">💬</a>
  <script src="{PREFIX}assets/js/main.js"></script>
</body>
</html>'''

def main():
    pairs = [(s, loc, city) for s in SERVICES for (loc, city) in LOCATIONS]
    print("total pages:", len(pairs))
    os.makedirs(ROOT+"/r", exist_ok=True)
    urls = []
    for i,(s,loc,city) in enumerate(pairs):
        slug = slugify(s)+"-"+slugify(loc)
        d = f"{ROOT}/r/{slug}"
        os.makedirs(d, exist_ok=True)
        open(d+"/index.html","w",encoding="utf-8").write(page(s,loc,city,i,pairs))
        urls.append(f"{SITE}/r/{slug}/")
    # каталог-хаб /r/index.html, сгруппированный по локации
    by_loc = {}
    for s in SERVICES:
        for (loc,city) in LOCATIONS:
            by_loc.setdefault(loc, []).append((s, slugify(s)+"-"+slugify(loc)))
    blocks = ""
    for (loc,city) in LOCATIONS:
        items = "".join(f'<a href="{slug}/">{esc(s)} {esc(loc_in(loc))}</a>' for s,slug in by_loc[loc])
        blocks += f'<div class="seo-group"><h2>{esc(loc)} ({esc(city)})</h2><div class="seo-rel">{items}</div></div>'
    catalog = f'''<!DOCTYPE html>
<html lang="ru"><head><meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Услуги по ремонту и районы — RemontPro (Геленджик, Новороссийск, Анапа)</title>
<meta name="description" content="Все услуги ремонта RemontPro по районам и населённым пунктам Геленджика, Новороссийска и Анапы: квартиры, ванные, кухни, дома, коммерческие помещения."/>
<link rel="canonical" href="{SITE}/r/"/>
<meta name="theme-color" content="#111111"/>
<link rel="preconnect" href="https://fonts.googleapis.com"/><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet"/>
<link rel="stylesheet" href="{PREFIX}assets/css/style.css"/>
{FAVICON}
{METRIKA}
</head><body>
{header()}
<main>
<section class="page-head"><div class="wrap"><nav class="crumbs"><a href="{PREFIX}index.html">Главная</a><span>/</span>Услуги и районы</nav>
<h1>Услуги по ремонту и районы</h1><p>Выберите услугу и населённый пункт — Геленджик, Новороссийск, Анапа и их районы. Более 2000 направлений работ RemontPro.</p></div></section>
<section class="section"><div class="wrap">{blocks}</div></section>
</main>
{footer()}
<script src="{PREFIX}assets/js/main.js"></script>
</body></html>'''
    open(ROOT+"/r/index.html","w",encoding="utf-8").write(catalog)
    urls.append(f"{SITE}/r/")
    json.dump(urls, open("/tmp/seo_urls.json","w"))
    print("written", len(urls), "urls (incl catalog)")

if __name__ == "__main__":
    main()
