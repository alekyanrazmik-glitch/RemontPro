/* ============================================================
   RemontPro — демо-админка (без сервера).
   Данные хранятся в localStorage. Экспорт/импорт JSON для
   замены файлов в assets/data/. Для боевой версии нужен backend
   или headless CMS (см. README).
   ============================================================ */
(function () {
  "use strict";

  var LS_PROJECTS = "remontpro_projects";
  var LS_VIDEOS = "remontpro_videos";

  /* база путей: admin.js лежит в assets/js/ */
  var thisScript = document.currentScript || document.querySelector('script[src*="assets/js/admin.js"]');
  var BASE = "../";
  if (thisScript) {
    BASE = thisScript.getAttribute("src").replace(/assets\/js\/admin\.js.*$/, "");
    if (BASE === "") BASE = "./";
  }

  /* ---------- helpers ---------- */
  function $(s, r) { return (r || document).querySelector(s); }
  function $all(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  function slugify(s) {
    var map = { а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "c", ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya", " ": "-" };
    return String(s).toLowerCase().split("").map(function (ch) { return map[ch] !== undefined ? map[ch] : ch; }).join("")
      .replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-").replace(/^-|-$/g, "") || ("project-" + Date.now());
  }

  function toast(msg) {
    var t = $(".toast");
    if (!t) { t = document.createElement("div"); t.className = "toast toast--ok"; document.body.appendChild(t); }
    t.textContent = msg; t.classList.add("show");
    clearTimeout(t._tm); t._tm = setTimeout(function () { t.classList.remove("show"); }, 2600);
  }

  function youtubeId(url) {
    if (!url) return "";
    var m = String(url).match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
    if (m) return m[1];
    if (/^[A-Za-z0-9_-]{11}$/.test(url)) return url;
    return "";
  }

  /* ---------- storage ---------- */
  function read(key) { try { var s = localStorage.getItem(key); return s ? JSON.parse(s) : null; } catch (e) { return null; } }
  function write(key, val) { localStorage.setItem(key, JSON.stringify(val)); }

  // Загружает из localStorage; при первом запуске — сидирует из JSON-файлов.
  function ensureData() {
    var p = read(LS_PROJECTS), v = read(LS_VIDEOS);
    var tasks = [];
    if (!p) tasks.push(fetch(BASE + "assets/data/projects.json", { cache: "no-store" }).then(function (r) { return r.json(); }).then(function (d) { write(LS_PROJECTS, d); }).catch(function () { write(LS_PROJECTS, []); }));
    if (!v) tasks.push(fetch(BASE + "assets/data/videos.json", { cache: "no-store" }).then(function (r) { return r.json(); }).then(function (d) { write(LS_VIDEOS, d); }).catch(function () { write(LS_VIDEOS, []); }));
    return Promise.all(tasks);
  }

  function getProjects() { return read(LS_PROJECTS) || []; }
  function getVideos() { return read(LS_VIDEOS) || []; }

  /* ---------- экспорт / импорт ---------- */
  function download(filename, dataObj) {
    var blob = new Blob([JSON.stringify(dataObj, null, 2)], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url; a.download = filename; document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  }

  function importFile(file, key, cb) {
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var data = JSON.parse(reader.result);
        if (!Array.isArray(data)) throw new Error("Ожидается массив");
        write(key, data); cb && cb(data); toast("Импортировано: " + data.length + " шт.");
      } catch (e) { alert("Ошибка импорта JSON: " + e.message); }
    };
    reader.readAsText(file);
  }

  function bindExportImport() {
    var ep = $("#exportProjects"); if (ep) ep.addEventListener("click", function () { download("projects.json", getProjects()); toast("projects.json выгружен"); });
    var ev = $("#exportVideos"); if (ev) ev.addEventListener("click", function () { download("videos.json", getVideos()); toast("videos.json выгружен"); });
    var ip = $("#importProjects"); if (ip) ip.addEventListener("change", function (e) { if (e.target.files[0]) importFile(e.target.files[0], LS_PROJECTS, function () { renderProjectsTable(); renderDashboard(); }); });
    var iv = $("#importVideos"); if (iv) iv.addEventListener("change", function (e) { if (e.target.files[0]) importFile(e.target.files[0], LS_VIDEOS, function () { renderVideosTable(); renderDashboard(); }); });
    var reset = $("#resetData");
    if (reset) reset.addEventListener("click", function () {
      if (!confirm("Сбросить данные и перезагрузить из JSON-файлов? Локальные изменения будут потеряны.")) return;
      localStorage.removeItem(LS_PROJECTS); localStorage.removeItem(LS_VIDEOS);
      ensureData().then(function () { location.reload(); });
    });
  }

  /* ---------- Dashboard ---------- */
  function renderDashboard() {
    var pr = getProjects(), vd = getVideos();
    var elP = $("#kpiProjects"); if (elP) elP.textContent = pr.length;
    var elDone = $("#kpiDone"); if (elDone) elDone.textContent = pr.filter(function (p) { return p.status === "done"; }).length;
    var elProg = $("#kpiProgress"); if (elProg) elProg.textContent = pr.filter(function (p) { return p.status === "progress"; }).length;
    var elV = $("#kpiVideos"); if (elV) elV.textContent = vd.length;
    var recent = $("#recentProjects");
    if (recent) {
      recent.innerHTML = pr.slice(0, 5).map(function (p) {
        return '<tr><td><b>' + esc(p.title) + '</b></td><td>' + esc(p.city) + '</td><td>' + esc(p.area) + ' м²</td><td><span class="badge badge--' + (p.status === "progress" ? "progress" : "done") + '">' + (p.status === "progress" ? "В работе" : "Завершён") + '</span></td><td><a class="btn-sm" href="project-edit.html?id=' + encodeURIComponent(p.id) + '">Открыть</a></td></tr>';
      }).join("") || '<tr><td colspan="5" style="color:var(--muted)">Пока нет проектов.</td></tr>';
    }
  }

  /* ---------- Список проектов ---------- */
  function renderProjectsTable() {
    var tb = $("#projectsTable tbody"); if (!tb) return;
    var pr = getProjects();
    tb.innerHTML = pr.map(function (p) {
      var cover = p.cover ? '<img class="admin-thumb" src="' + esc(p.cover) + '" alt="' + esc(p.title) + '">' : '<div class="admin-thumb"></div>';
      return '<tr>' +
        '<td>' + cover + '</td>' +
        '<td><b>' + esc(p.title) + '</b><br><small style="color:var(--muted)">' + esc(p.id) + '</small></td>' +
        '<td>' + esc(p.city) + '</td>' +
        '<td>' + esc(p.area) + ' м²</td>' +
        '<td>' + esc(p.type) + '</td>' +
        '<td><span class="badge badge--' + (p.status === "progress" ? "progress" : "done") + '">' + (p.status === "progress" ? "В работе" : "Завершён") + '</span></td>' +
        '<td style="white-space:nowrap"><a class="btn-sm" href="project-edit.html?id=' + encodeURIComponent(p.id) + '">Изменить</a> ' +
        '<button class="btn-sm btn-sm--danger" data-del="' + esc(p.id) + '">Удалить</button></td>' +
        '</tr>';
    }).join("") || '<tr><td colspan="7" style="color:var(--muted)">Проектов пока нет. Нажмите «Добавить проект».</td></tr>';

    $all("[data-del]", tb).forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (!confirm("Удалить проект?")) return;
        var id = btn.getAttribute("data-del");
        write(LS_PROJECTS, getProjects().filter(function (p) { return p.id !== id; }));
        renderProjectsTable(); toast("Проект удалён");
      });
    });
  }

  /* ---------- Репитер ссылок (галерея) ---------- */
  function addRepeaterRow(container, value) {
    var row = document.createElement("div");
    row.className = "repeater__row";
    row.innerHTML = '<input type="url" placeholder="https://…/photo.jpg" value="' + esc(value || "") + '"><button type="button" class="btn-sm btn-sm--danger" aria-label="Удалить">✕</button>';
    row.querySelector("button").addEventListener("click", function () { row.remove(); });
    container.appendChild(row);
  }

  /* ---------- Форма проекта (добавление/редактирование) ---------- */
  function initProjectForm() {
    var form = $("#projectForm"); if (!form) return;
    var gallery = $("#galleryRepeater");
    var addBtn = $("#addGalleryRow");
    if (addBtn) addBtn.addEventListener("click", function () { addRepeaterRow(gallery, ""); });

    var params = new URLSearchParams(location.search);
    var editId = params.get("id");
    var existing = editId ? getProjects().filter(function (p) { return p.id === editId; })[0] : null;

    if (existing) {
      $("#formTitle").textContent = "Редактирование проекта";
      form.title.value = existing.title || "";
      form.city.value = existing.city || "";
      form.area.value = existing.area || "";
      form.type.value = existing.type || "Под ключ";
      form.term.value = existing.term || "";
      form.budget.value = existing.budget || "";
      form.status.value = existing.status || "done";
      form.description.value = existing.description || "";
      form.task.value = existing.task || "";
      form.did.value = existing.did || "";
      form.cover.value = existing.cover || "";
      form.youtube.value = existing.youtube || "";
      form.before.value = existing.before || "";
      form.after.value = existing.after || "";
      (existing.gallery && existing.gallery.length ? existing.gallery : [""]).forEach(function (g) { addRepeaterRow(gallery, g); });
      form.dataset.editId = existing.id;
    } else {
      addRepeaterRow(gallery, "");
    }

    // живое превью YouTube
    var ytPreview = $("#ytPreview");
    function refreshYt() {
      if (!ytPreview) return;
      var id = youtubeId(form.youtube.value);
      ytPreview.innerHTML = id
        ? '<img src="https://img.youtube.com/vi/' + id + '/hqdefault.jpg" alt="Превью видео" style="border-radius:10px;max-width:240px;border:1px solid var(--line)"><div style="font-size:.85rem;color:var(--muted);margin-top:6px">embed: youtube.com/embed/' + id + '</div>'
        : '<span style="color:var(--muted);font-size:.9rem">Вставьте ссылку YouTube — появится превью</span>';
    }
    if (form.youtube) form.youtube.addEventListener("input", refreshYt);
    refreshYt();

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.title.value.trim()) { alert("Укажите название проекта."); return; }
      var galleryUrls = $all("input", gallery).map(function (i) { return i.value.trim(); }).filter(Boolean);
      var id = form.dataset.editId || slugify(form.title.value);
      var list = getProjects();
      // уникальность id при создании
      if (!form.dataset.editId) {
        var base = id, n = 2;
        while (list.some(function (p) { return p.id === id; })) { id = base + "-" + n++; }
      }
      var proj = {
        id: id,
        title: form.title.value.trim(),
        city: form.city.value.trim(),
        area: Number(form.area.value) || form.area.value,
        type: form.type.value,
        term: form.term.value.trim(),
        budget: form.budget.value.trim(),
        status: form.status.value,
        cover: form.cover.value.trim(),
        description: form.description.value.trim(),
        task: form.task.value.trim(),
        did: form.did.value.trim(),
        gallery: galleryUrls,
        youtube: form.youtube.value.trim(),
        before: form.before.value.trim(),
        after: form.after.value.trim()
      };
      var idx = list.findIndex(function (p) { return p.id === id; });
      if (idx >= 0) list[idx] = proj; else list.unshift(proj);
      write(LS_PROJECTS, list);
      toast("Проект сохранён");
      setTimeout(function () { location.href = "portfolio.html"; }, 700);
    });
  }

  /* ---------- Видео ---------- */
  function renderVideosTable() {
    var tb = $("#videosTable tbody"); if (!tb) return;
    var vids = getVideos();
    tb.innerHTML = vids.map(function (v, i) {
      var id = youtubeId(v.youtubeUrl);
      var thumb = id ? '<img class="admin-thumb" src="https://img.youtube.com/vi/' + id + '/default.jpg" alt="' + esc(v.title) + '">' : '<div class="admin-thumb"></div>';
      return '<tr>' +
        '<td>' + thumb + '</td>' +
        '<td><b>' + esc(v.title) + '</b><br><small style="color:var(--muted)">' + esc(v.youtubeUrl) + '</small></td>' +
        '<td>' + esc(v.category || "") + '</td>' +
        '<td><button class="btn-sm btn-sm--danger" data-delv="' + i + '">Удалить</button></td>' +
        '</tr>';
    }).join("") || '<tr><td colspan="4" style="color:var(--muted)">Видео пока нет.</td></tr>';

    $all("[data-delv]", tb).forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (!confirm("Удалить видео?")) return;
        var i = Number(btn.getAttribute("data-delv"));
        var vids = getVideos(); vids.splice(i, 1); write(LS_VIDEOS, vids);
        renderVideosTable(); toast("Видео удалено");
      });
    });
  }

  function initVideoForm() {
    var form = $("#videoForm"); if (!form) return;
    var prev = $("#videoYtPreview");
    function refresh() {
      if (!prev) return;
      var id = youtubeId(form.youtubeUrl.value);
      prev.innerHTML = id ? '<img src="https://img.youtube.com/vi/' + id + '/hqdefault.jpg" alt="Превью" style="border-radius:10px;max-width:240px;border:1px solid var(--line)">' : '<span style="color:var(--muted);font-size:.9rem">Вставьте ссылку YouTube</span>';
    }
    form.youtubeUrl.addEventListener("input", refresh); refresh();

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.title.value.trim()) { alert("Укажите название видео."); return; }
      if (!youtubeId(form.youtubeUrl.value)) { alert("Укажите корректную ссылку YouTube."); return; }
      var vids = getVideos();
      vids.unshift({
        id: "v" + Date.now(),
        title: form.title.value.trim(),
        description: form.description.value.trim(),
        youtubeUrl: form.youtubeUrl.value.trim(),
        preview: form.preview.value.trim(),
        category: form.category.value.trim()
      });
      write(LS_VIDEOS, vids);
      form.reset(); refresh(); renderVideosTable(); toast("Видео добавлено");
    });
  }

  /* ---------- init ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    ensureData().then(function () {
      renderDashboard();
      renderProjectsTable();
      renderVideosTable();
      initProjectForm();
      initVideoForm();
      bindExportImport();
    });
  });
})();
