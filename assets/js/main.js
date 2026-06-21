/* ============================================================
   RemontPro — публичная часть.
   Загрузка данных (localStorage → JSON → demo fallback),
   рендер портфолио и видео, YouTube-embed с lazy-load,
   before/after слайдер, страница проекта, меню, формы.
   ============================================================ */
(function () {
  "use strict";

  /* ---------- База путей (работает на любой глубине вложенности) ---------- */
  var thisScript = document.currentScript ||
    document.querySelector('script[src*="assets/js/main.js"]');
  var BASE = "./";
  if (thisScript) {
    BASE = thisScript.getAttribute("src").replace(/assets\/js\/main\.js.*$/, "");
    if (BASE === "") BASE = "./";
  }
  var LS_PROJECTS = "remontpro_projects";
  var LS_VIDEOS = "remontpro_videos";

  /* Префикс пути к ассетам с учётом глубины страницы.
     Абсолютные ссылки (http..., //..., /...) и data-URI не трогаем. */
  function withBase(p) {
    if (!p) return p;
    if (/^(https?:)?\/\//.test(p) || p.charAt(0) === "/" || p.indexOf("data:") === 0) return p;
    return BASE + p;
  }

  /* ---------- Demo-данные (fallback, если нет JSON и localStorage) ---------- */
  var DEMO_PROJECTS = [
    {
      id: "morskoy-gelendzhik", title: "Квартира в ЖК «Морской»", city: "Геленджик",
      area: 64, type: "Под ключ", term: "75 дней", budget: "от 1,3 млн ₽",
      status: "done", cover: "", description: "Светлый минимализм в двух шагах от моря.",
      task: "Сделать функциональную квартиру для семьи с учётом влажного климата побережья.",
      did: "Перепланировка, замена коммуникаций, тёплые полы, скрытая подсветка и встроенная мебель.",
      gallery: [], youtube: "https://youtu.be/dQw4w9WgXcQ",
      before: "", after: ""
    },
    {
      id: "center-novorossiysk", title: "Трёшка в центре", city: "Новороссийск",
      area: 82, type: "Капитальный", term: "95 дней", budget: "от 1,7 млн ₽",
      status: "progress", cover: "", description: "Современный ремонт с объединённой кухней-гостиной.",
      task: "Перепланировать типовую трёхкомнатную квартиру под открытое пространство.",
      did: "Снос ненесущих стен, разводка электрики по дизайн-проекту, стяжка, штукатурка по маякам.",
      gallery: [], youtube: "",
      before: "", after: ""
    },
    {
      id: "vanna-gelendzhik", title: "Ванная под ключ", city: "Геленджик",
      area: 6, type: "Ванная", term: "21 день", budget: "от 240 тыс ₽",
      status: "done", cover: "", description: "Крупноформатный керамогранит и скрытые инсталляции.",
      task: "Полностью обновить санузел с надёжной гидроизоляцией.",
      did: "Гидроизоляция, разводка сантехники, укладка плитки крупного формата, монтаж инсталляций.",
      gallery: [], youtube: "",
      before: "", after: ""
    },
    {
      id: "studio-novorossiysk", title: "Студия у моря", city: "Новороссийск",
      area: 38, type: "Косметический", term: "30 дней", budget: "от 460 тыс ₽",
      status: "done", cover: "", description: "Тёплый светлый интерьер для сдачи в аренду.",
      task: "Быстро и недорого обновить студию под посуточную аренду.",
      did: "Покраска, новые покрытия пола, замена сантехники и освещения.",
      gallery: [], youtube: "",
      before: "", after: ""
    }
  ];

  var DEMO_VIDEOS = [
    { id: "v1", title: "Обзор ремонта в ЖК «Морской»", description: "Финальный тур по сданной квартире 64 м² в Геленджике.", youtubeUrl: "https://youtu.be/dQw4w9WgXcQ", preview: "", category: "Объект сдан" },
    { id: "v2", title: "Этап черновых работ", description: "Как мы готовим стены и стяжку перед чистовой отделкой.", youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", preview: "", category: "Процесс" },
    { id: "v3", title: "До и после: трёшка в Новороссийске", description: "Сравнение состояния квартиры до начала и в процессе ремонта.", youtubeUrl: "https://youtu.be/dQw4w9WgXcQ", preview: "", category: "До / После" }
  ];

  /* ---------- Загрузка данных: localStorage → fetch JSON → demo ---------- */
  function loadData(lsKey, fileName, demo) {
    // 1) данные, сохранённые в админке этого браузера
    try {
      var stored = localStorage.getItem(lsKey);
      if (stored) {
        var parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length) return Promise.resolve(parsed);
      }
    } catch (e) { /* ignore */ }
    // 2) JSON-файл
    if (window.fetch) {
      return fetch(BASE + "assets/data/" + fileName, { cache: "no-store" })
        .then(function (r) { if (!r.ok) throw new Error("http " + r.status); return r.json(); })
        .then(function (data) { return (Array.isArray(data) && data.length) ? data : demo; })
        .catch(function () { return demo; });
    }
    // 3) fallback
    return Promise.resolve(demo);
  }

  /* ---------- YouTube ---------- */
  function youtubeId(url) {
    if (!url) return "";
    var m = String(url).match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
    );
    if (m) return m[1];
    if (/^[A-Za-z0-9_-]{11}$/.test(url)) return url; // уже id
    return "";
  }
  function youtubeThumb(id) { return "https://img.youtube.com/vi/" + id + "/hqdefault.jpg"; }

  // Фасад видео с lazy-load: iframe подгружается только по клику
  function buildVideoEmbed(url, previewUrl, title) {
    var id = youtubeId(url);
    var wrap = document.createElement("div");
    wrap.className = "video-embed";
    if (!id) {
      wrap.classList.add("ph");
      wrap.style.aspectRatio = "16/9";
      wrap.textContent = "Видео недоступно";
      return wrap;
    }
    var thumb = withBase(previewUrl) || youtubeThumb(id);
    var img = document.createElement("img");
    img.className = "video-embed__thumb";
    img.loading = "lazy";
    img.alt = title ? ("Превью видео: " + title) : "Превью видео с объекта";
    img.src = thumb;
    var play = document.createElement("span");
    play.className = "video-embed__play";
    play.setAttribute("aria-hidden", "true");
    wrap.appendChild(img);
    wrap.appendChild(play);
    wrap.setAttribute("role", "button");
    wrap.setAttribute("tabindex", "0");
    wrap.setAttribute("aria-label", "Смотреть видео" + (title ? ": " + title : ""));
    function activate() {
      var iframe = document.createElement("iframe");
      iframe.src = "https://www.youtube.com/embed/" + id + "?autoplay=1&rel=0";
      iframe.title = title || "Видео с объекта RemontPro";
      iframe.loading = "lazy";
      iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
      iframe.allowFullscreen = true;
      wrap.innerHTML = "";
      wrap.appendChild(iframe);
    }
    wrap.addEventListener("click", activate);
    wrap.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); activate(); } });
    return wrap;
  }
  window.RP_youtubeId = youtubeId;

  /* ---------- Рендер портфолио (живая лента кейсов) ---------- */
  function statusLabel(s) { return s === "progress" ? "В работе" : "Завершён"; }
  function escapeHtml(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  function caseCard(p) {
    var a = document.createElement("a");
    a.className = "case";
    a.href = BASE + "portfolio/project-template.html?id=" + encodeURIComponent(p.id);
    var statusCls = p.status === "progress" ? "case__status--progress" : "case__status--done";
    var imgStyle = p.cover ? ' style="background-image:url(\'' + encodeURI(withBase(p.cover)) + "')\"" : "";
    a.innerHTML =
      '<span class="case__status ' + statusCls + '">' + statusLabel(p.status) + "</span>" +
      '<div class="case__img"' + imgStyle + ' role="img" aria-label="' + escapeHtml(p.title) + '"></div>' +
      '<div class="case__body">' +
        "<h3>" + escapeHtml(p.title) + "</h3>" +
        '<div class="case__meta">' +
          '<span class="chip">📍 ' + escapeHtml(p.city) + "</span>" +
          '<span class="chip">' + escapeHtml(p.area) + " м²</span>" +
          '<span class="chip">⏱ ' + escapeHtml(p.term) + "</span>" +
          '<span class="chip chip--orange">' + escapeHtml(p.type) + "</span>" +
        "</div>" +
      "</div>";
    return a;
  }

  function renderCases(container, limit) {
    container.innerHTML = '<p class="js-state">Загружаем проекты…</p>';
    loadData(LS_PROJECTS, "projects.json", DEMO_PROJECTS).then(function (list) {
      container.innerHTML = "";
      var items = limit ? list.slice(0, limit) : list;
      if (!items.length) { container.innerHTML = '<p class="js-state">Проекты скоро появятся.</p>'; return; }
      items.forEach(function (p) { container.appendChild(caseCard(p)); });
    });
  }

  /* ---------- Рендер портфолио в новом стиле главной (.project-card) ---------- */
  function projectCard(p, n) {
    var a = document.createElement("a");
    a.className = "project-card";
    a.href = withBase("portfolio/project-template.html?id=" + encodeURIComponent(p.id));
    var bg = p.cover
      ? "linear-gradient(180deg, rgba(0, 0, 0,0.04), rgba(0, 0, 0,0.34)), url('" + encodeURI(withBase(p.cover)) + "')"
      : "";
    var num = ("0" + n).slice(-2);
    a.innerHTML =
      '<div class="project-image"' + (bg ? ' style="background-image:' + bg + '"' : "") + '><span>' + num + "</span></div>" +
      '<div class="project-body">' +
        '<p class="project-meta">' + escapeHtml(p.city) + " · " + escapeHtml(p.type) + " · " + escapeHtml(p.area) + " м²</p>" +
        "<h3>" + escapeHtml(p.title) + "</h3>" +
        "<p>" + escapeHtml(p.description || "") + "</p>" +
      "</div>";
    return a;
  }

  function renderProjectCards(container, limit) {
    container.innerHTML = '<p class="js-state">Загружаем проекты…</p>';
    loadData(LS_PROJECTS, "projects.json", DEMO_PROJECTS).then(function (list) {
      container.innerHTML = "";
      var items = limit ? list.slice(0, limit) : list;
      if (!items.length) { container.innerHTML = '<p class="js-state">Проекты скоро появятся.</p>'; return; }
      items.forEach(function (p, i) { container.appendChild(projectCard(p, i + 1)); });
    });
  }

  /* ---------- Рендер видео ---------- */
  function videoCard(v) {
    var card = document.createElement("article");
    card.className = "video-card";
    var embed = buildVideoEmbed(v.youtubeUrl, v.preview, v.title);
    var body = document.createElement("div");
    body.className = "video-card__body";
    body.innerHTML =
      (v.category ? '<span class="video-card__cat">' + escapeHtml(v.category) + "</span>" : "") +
      "<h3>" + escapeHtml(v.title) + "</h3>" +
      (v.description ? "<p>" + escapeHtml(v.description) + "</p>" : "");
    card.appendChild(embed);
    card.appendChild(body);
    return card;
  }

  function renderVideos(container, limit) {
    container.innerHTML = '<p class="js-state">Загружаем видео…</p>';
    loadData(LS_VIDEOS, "videos.json", DEMO_VIDEOS).then(function (list) {
      container.innerHTML = "";
      var items = limit ? list.slice(0, limit) : list;
      if (!items.length) { container.innerHTML = '<p class="js-state">Видео скоро появятся.</p>'; return; }
      items.forEach(function (v) { container.appendChild(videoCard(v)); });
    });
  }

  /* ---------- Страница проекта (?id=) ---------- */
  function initProjectPage(root) {
    var params = new URLSearchParams(window.location.search);
    var id = params.get("id");
    loadData(LS_PROJECTS, "projects.json", DEMO_PROJECTS).then(function (list) {
      var p = list.filter(function (x) { return String(x.id) === String(id); })[0] || list[0];
      if (!p) { root.innerHTML = '<div class="wrap section"><p class="js-state">Проект не найден.</p></div>'; return; }
      document.title = p.title + " — портфолио RemontPro";
      var set = function (sel, val) { var el = root.querySelector(sel); if (el) el.textContent = val; };
      set("[data-p='title']", p.title);
      set("[data-p='city']", p.city);
      set("[data-p='area']", p.area + " м²");
      set("[data-p='term']", p.term);
      set("[data-p='budget']", p.budget);
      set("[data-p='type']", p.type);
      set("[data-p='task']", p.task || "—");
      set("[data-p='did']", p.did || "—");
      set("[data-p='description']", p.description || "");
      var statusEl = root.querySelector("[data-p='status']");
      if (statusEl) {
        statusEl.textContent = statusLabel(p.status);
        statusEl.className = "case__status " + (p.status === "progress" ? "case__status--progress" : "case__status--done");
        statusEl.style.position = "static";
        statusEl.style.display = "inline-block";
      }
      var cover = root.querySelector("[data-p='cover']");
      if (cover) {
        if (p.cover) {
          // показываем обложку целиком (без обрезки), естественной высотой
          cover.style.aspectRatio = "auto";
          cover.style.minHeight = "0";
          cover.style.background = "none";
          cover.classList.remove("ph");
          cover.innerHTML = '<img src="' + withBase(p.cover) + '" alt="' +
            escapeHtml(p.title) + '" loading="eager" ' +
            'style="width:100%;height:auto;display:block;border-radius:var(--r-lg)">';
        }
        else { cover.textContent = p.title; }
        cover.setAttribute("role", "img");
        cover.setAttribute("aria-label", "Главное фото проекта: " + p.title);
      }
      // галерея
      var gal = root.querySelector("[data-p='gallery']");
      if (gal) {
        var imgs = (p.gallery || []).filter(Boolean);
        if (imgs.length) {
          gal.innerHTML = "";
          imgs.forEach(function (src, i) {
            var im = document.createElement("img");
            im.src = withBase(src); im.loading = "lazy"; im.alt = p.title + " — фото " + (i + 1);
            gal.appendChild(im);
          });
        } else {
          gal.innerHTML = "";
          for (var i = 0; i < 3; i++) {
            var ph = document.createElement("div");
            ph.className = "ph"; ph.textContent = "Фото " + (i + 1);
            ph.setAttribute("aria-label", p.title + " — изображение " + (i + 1));
            gal.appendChild(ph);
          }
        }
      }
      // видео
      var vbox = root.querySelector("[data-p='video']");
      if (vbox) {
        if (youtubeId(p.youtube)) {
          vbox.innerHTML = "";
          vbox.appendChild(buildVideoEmbed(p.youtube, "", p.title));
          // VideoObject schema
          injectVideoSchema(p);
        } else {
          var vsec = vbox.closest("[data-video-section]");
          if (vsec) vsec.style.display = "none";
        }
      }
      // before / after
      var baSec = root.querySelector("[data-ba-section]");
      if (baSec) {
        if (p.before || p.after) {
          var bEl = baSec.querySelector(".ba__before");
          var aEl = baSec.querySelector(".ba__after");
          if (bEl && p.before) bEl.style.backgroundImage = "url('" + withBase(p.before) + "')";
          if (aEl && p.after) aEl.style.backgroundImage = "url('" + withBase(p.after) + "')";
        } else {
          baSec.style.display = "none";
        }
      }
      // CTA whatsapp с названием
      var cta = root.querySelector("[data-p='cta-wa']");
      if (cta) { cta.href = TG_LINK; cta.target = "_blank"; cta.rel = "noopener"; }
    });
  }

  function injectVideoSchema(p) {
    try {
      var id = youtubeId(p.youtube);
      var s = document.createElement("script");
      s.type = "application/ld+json";
      s.textContent = JSON.stringify({
        "@context": "https://schema.org", "@type": "VideoObject",
        name: p.title, description: p.description || p.title,
        thumbnailUrl: p.cover || youtubeThumb(id),
        uploadDate: "2026-01-01",
        embedUrl: "https://www.youtube.com/embed/" + id
      });
      document.head.appendChild(s);
    } catch (e) { /* ignore */ }
  }

  /* ---------- Before/After слайдер ---------- */
  function initBA(stage) {
    var before = stage.querySelector(".ba__before");
    var handle = stage.querySelector(".ba__handle");
    if (!before || !handle) return;
    var dragging = false;
    function setPos(clientX) {
      var rect = stage.getBoundingClientRect();
      var pct = ((clientX - rect.left) / rect.width) * 100;
      pct = Math.max(0, Math.min(100, pct));
      before.style.width = pct + "%";
      handle.style.left = pct + "%";
    }
    handle.addEventListener("pointerdown", function (e) { dragging = true; handle.setPointerCapture(e.pointerId); });
    window.addEventListener("pointerup", function () { dragging = false; });
    window.addEventListener("pointermove", function (e) { if (dragging) setPos(e.clientX); });
    stage.addEventListener("click", function (e) { if (e.target.closest(".ba__handle")) return; setPos(e.clientX); });
  }

  /* ---------- Контакты ---------- */
  var PHONE = "79002721001";
  var LEAD_EMAIL = "prof.remont.25@mail.ru";
  var TG_LINK = "https://t.me/+" + PHONE;
  var MAX_LINK = "https://max.ru/u/" + PHONE;
  /* Telegram-бот для дублирования заявок (тот же, что на dom-kk.ru) */
  var TG_BOT = "8550556751:AAF9LssjvB-5NkCu4yeOO2-eN2zuqqCKP1o";
  var TG_CHAT = "523060537";
  function waLink(text) {
    return "https://wa.me/" + PHONE + (text ? "?text=" + encodeURIComponent(text) : "");
  }

  /* Маска телефона: всегда начинается с +7 (XXX) XXX-XX-XX */
  function fmtPhone(v) {
    var d = String(v).replace(/\D/g, "");
    if (d.charAt(0) === "8") d = "7" + d.slice(1);
    if (d.charAt(0) !== "7") d = "7" + d;
    d = d.slice(0, 11);
    var r = "+7";
    if (d.length > 1) r += " (" + d.slice(1, 4);
    if (d.length >= 4) r += ") " + d.slice(4, 7);
    if (d.length >= 7) r += "-" + d.slice(7, 9);
    if (d.length >= 9) r += "-" + d.slice(9, 11);
    return r;
  }
  function phoneDigits(v) { return String(v).replace(/\D/g, ""); }
  /* Имя — только кириллица, пробел и дефис */
  function filterName(v) { return String(v).replace(/[^А-Яа-яЁё\s-]/g, ""); }

  function attachLeadInputs(form) {
    var ph = form.querySelector('[name="phone"]');
    if (ph) {
      if (!ph.value) ph.value = "+7 ";
      ph.addEventListener("focus", function () { if (!ph.value) ph.value = "+7 "; });
      ph.addEventListener("input", function () { ph.value = fmtPhone(ph.value); });
    }
    var nm = form.querySelector('[name="name"]');
    if (nm) nm.addEventListener("input", function () {
      var s = nm.selectionStart; nm.value = filterName(nm.value); nm.setSelectionRange(s, s);
    });
  }

  /* Отправка заявки: e-mail (FormSubmit) + дубль в Telegram-бот */
  function sendLead(d) {
    var lines = [
      "🛠 <b>Заявка с сайта RemontPro</b>",
      "<b>Имя:</b> " + (d.name || "—"),
      "<b>Телефон:</b> " + (d.phone || "—")
    ];
    if (d.area) lines.push("<b>Площадь:</b> " + d.area + " м²");
    if (d.city) lines.push("<b>Город:</b> " + d.city);
    if (d.message) lines.push("<b>Задача:</b> " + d.message);
    var tasks = [];
    tasks.push(fetch("https://api.telegram.org/bot" + TG_BOT + "/sendMessage", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: TG_CHAT, text: lines.join("\n"), parse_mode: "HTML", disable_web_page_preview: true })
    }).catch(function () {}));
    tasks.push(fetch("https://formsubmit.co/ajax/" + LEAD_EMAIL, {
      method: "POST", headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({
        _subject: "Заявка с сайта RemontPro",
        name: d.name || "—", phone: d.phone || "—",
        "Площадь": d.area ? d.area + " м²" : "—",
        city: d.city || "—", "Задача": d.message || "—",
        _template: "table"
      })
    }).catch(function () {}));
    return Promise.all(tasks);
  }

  function handleLead(form) {
    var name = (form.querySelector('[name="name"]') || {}).value || "";
    var phoneEl = form.querySelector('[name="phone"]') || {};
    var phone = phoneEl.value || "";
    var area = (form.querySelector('[name="area"]') || {}).value || "";
    var city = (form.querySelector('[name="city"]') || {}).value || "";
    var msg = (form.querySelector('[name="message"]') || {}).value || "";
    if (filterName(name).trim().length < 2) { alert("Укажите имя кириллицей."); return; }
    if (phoneDigits(phone).length < 11) { alert("Укажите корректный телефон в формате +7 (___) ___-__-__."); return; }
    if (form.querySelector('[name="area"]') && !String(area).trim()) { alert("Укажите площадь, м²."); return; }
    var btn = form.querySelector('[type="submit"]');
    if (btn) { btn.disabled = true; var bt = btn.textContent; btn.textContent = "Отправляем…"; }
    sendLead({ name: name, phone: phone, area: area, city: city, message: msg }).then(function () {
      var ok = form.querySelector(".form__ok");
      if (ok) { ok.classList.add("show"); setTimeout(function () { ok.classList.remove("show"); }, 8000); }
      else { alert("Спасибо! Заявка отправлена — мы свяжемся с вами."); }
      form.reset();
      var ph = form.querySelector('[name="phone"]'); if (ph) ph.value = "+7 ";
      if (btn) { btn.disabled = false; btn.textContent = bt; }
    });
  }

  /* ---------- Инициализация общих элементов ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    // мобильное меню
    var burger = document.querySelector(".burger");
    var nav = document.querySelector(".main-nav");
    if (burger && nav) {
      burger.addEventListener("click", function () {
        var open = nav.classList.toggle("open");
        burger.classList.toggle("open", open);
        burger.setAttribute("aria-expanded", open ? "true" : "false");
      });
      nav.querySelectorAll("a").forEach(function (l) {
        l.addEventListener("click", function () { nav.classList.remove("open"); burger.classList.remove("open"); });
      });
    }

    // FAQ
    document.querySelectorAll(".faq-item").forEach(function (item) {
      var q = item.querySelector(".faq-q"), a = item.querySelector(".faq-a");
      if (!q || !a) return;
      q.addEventListener("click", function () {
        var open = item.classList.toggle("open");
        q.setAttribute("aria-expanded", open ? "true" : "false");
        a.style.maxHeight = open ? a.scrollHeight + "px" : null;
      });
    });

    // before/after на странице
    document.querySelectorAll(".ba__stage").forEach(initBA);

    // рендер блоков по data-атрибутам
    var casesEl = document.querySelector("[data-render='cases']");
    if (casesEl) renderCases(casesEl, parseInt(casesEl.getAttribute("data-limit"), 10) || 0);

    var projCardsEl = document.querySelector("[data-render='home-projects']");
    if (projCardsEl) renderProjectCards(projCardsEl, parseInt(projCardsEl.getAttribute("data-limit"), 10) || 0);

    var videosEl = document.querySelector("[data-render='videos']");
    if (videosEl) renderVideos(videosEl, parseInt(videosEl.getAttribute("data-limit"), 10) || 0);

    var projectEl = document.querySelector("[data-render='project']");
    if (projectEl) initProjectPage(projectEl);

    // подставить WhatsApp-ссылки с текстом
    // CTA-кнопки мессенджеров: Telegram (data-wa/ data-tg) и MAX (data-max)
    document.querySelectorAll("[data-wa], [data-tg]").forEach(function (el) {
      el.href = TG_LINK; el.target = "_blank"; el.rel = "noopener";
    });
    document.querySelectorAll("[data-max]").forEach(function (el) {
      el.href = MAX_LINK; el.target = "_blank"; el.rel = "noopener";
    });

    // формы заявок (внутренние страницы) → e-mail + Telegram
    document.querySelectorAll(".js-lead").forEach(function (form) {
      attachLeadInputs(form);
      form.addEventListener("submit", function (e) { e.preventDefault(); handleLead(form); });
    });

    // год в футере (старый .js-year и новый #year)
    var y = document.querySelector(".js-year");
    if (y) y.textContent = new Date().getFullYear();
    var y2 = document.getElementById("year");
    if (y2) y2.textContent = new Date().getFullYear();

    // мобильное меню новой главной (.menu-button / .nav)
    var menuBtn = document.querySelector(".menu-button");
    var newNav = document.querySelector(".nav");
    if (menuBtn && newNav) {
      menuBtn.addEventListener("click", function () {
        var open = newNav.classList.toggle("is-open");
        menuBtn.classList.toggle("is-open", open);
        menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
      });
      newNav.querySelectorAll("a").forEach(function (l) {
        l.addEventListener("click", function () { newNav.classList.remove("is-open"); menuBtn.classList.remove("is-open"); });
      });
    }

    // форма заявки на главной → e-mail + Telegram
    var leadForm = document.getElementById("leadForm");
    if (leadForm) {
      attachLeadInputs(leadForm);
      leadForm.addEventListener("submit", function (e) { e.preventDefault(); handleLead(leadForm); });
    }
  });
})();
