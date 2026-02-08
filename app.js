// ================= HERO SLIDER =================
const MesaiHeroSlider = (function () {
  let index = 0;
  let images = [];
  let timer = null;
  const INTERVAL = 6000;

  function step() {
    if (!images.length) return;
    images.forEach((img, i) => img.classList.toggle("active", i === index));
    index = (index + 1) % images.length;
  }

  function init() {
    images = Array.from(document.querySelectorAll(".mesai-hero-img"));
    if (!images.length) return;
    step();
    if (timer) clearInterval(timer);
    timer = setInterval(step, INTERVAL);
  }

  
  // Anlamsal yardımcılar (renk eşlemesi sabit):
  // critical -> kırmızı, warning -> sarı, approved -> yeşil
  function critical(message, timeoutMs) { error(message, timeoutMs); }
  function approved(message, timeoutMs) { success(message, timeoutMs); }
return { init };
})();

// ================= USER MANAGEMENT =================
const MesaiUser = (function () {
  const USERS_KEY = "mesai_users_v1";
  const LAST_USER_KEY = "mesai_last_user_v1";
  let currentUser = null;

  function loadUsers() {
    try {
      const raw = localStorage.getItem(USERS_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error("Kullanıcı listesi okunamadı:", e);
      return [];
    }
  }

  function saveUsers(list) {
    try {
      localStorage.setItem(USERS_KEY, JSON.stringify(list));
    } catch (e) {
      console.error("Kullanıcı listesi yazılamadı:", e);
    }
  }

  function normalizeName(name) {
    return (name || "").trim();
  }

  function normalizeCode(code) {
    return (code || "").trim();
  }

  function normalizePhone(phone) {
    return (phone || "").trim();
  }

  function saveLastUser(id) {
    try {
      localStorage.setItem(LAST_USER_KEY, id || "");
    } catch (e) {
      console.error("Son kullanıcı kaydedilemedi:", e);
    }
  }

  function loadLastUserInternal() {
    try {
      const id = localStorage.getItem(LAST_USER_KEY);
      return id || "";
    } catch (e) {
      return "";
    }
  }

  function getAllUsers() {
    return loadUsers();
  }

  function getOrCreateUser(name, code, phone) {
    const n = normalizeName(name);
    const c = normalizeCode(code);
    const p = normalizePhone(phone);
    if (!n) return null;

    const users = loadUsers();
    let user = users.find(u => u.name === n && u.code === c);
    if (!user) {
      user = {
        id: Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36),
        name: n,
        code: c,
        phone: p
      };
      users.push(user);
      saveUsers(users);
    } else {
      user.phone = p;
      saveUsers(users);
    }
    currentUser = user;
    saveLastUser(user.id);
    return user;
  }

  function setCurrentUserById(id) {
    const users = loadUsers();
    const user = users.find(u => u.id === id);
    if (user) {
      currentUser = user;
      saveLastUser(user.id);
    }
    return currentUser;
  }

  function getCurrentUser() {
    return currentUser;
  }

  function initFromLast() {
    const lastId = loadLastUserInternal();
    if (!lastId) return null;
    return setCurrentUserById(lastId);
  }

  function getStorageKey() {
    if (!currentUser) return null;
    return "mesai_kayitlari_user_" + currentUser.id;
  }

  return {
    getAllUsers,
    getOrCreateUser,
    setCurrentUserById,
    getCurrentUser,
    getStorageKey,
    initFromLast
  };
})();

// ================= STORAGE =================
const MesaiStorage = (function () {
  const LEGACY_KEY = "mesai_kayitlari_pro_bootstrap_v3_multi";

  function getKey() {
    if (typeof MesaiUser !== "undefined" && MesaiUser.getStorageKey) {
      const k = MesaiUser.getStorageKey();
      if (k) return k;
    }
    return LEGACY_KEY;
  }

  function load() {
    const KEY = getKey();
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error("localStorage okuma hatası:", e);
      return [];
    }
  }

  function saveAll(list) {
    const KEY = getKey();
    try {
      localStorage.setItem(KEY, JSON.stringify(list));
    } catch (e) {
      console.error("localStorage yazma hatası:", e);
    }
  }

  function add(entry) {
    const list = load();
    list.push(entry);
    saveAll(list);
    return list;
  }

  function remove(id) {
    const list = load().filter((e) => e.id !== id);
    saveAll(list);
    return list;
  }

  function clear() {
    saveAll([]);
    return [];
  }

  function toCSV() {
    const list = load();
    if (!list.length) return "";
    const header = ["Tarih", "Baslangic", "Bitis", "Saat", "Dakika"];
    const lines = [header.join(";")];
    list.forEach((e) => {
      const d = (e.date || "").split("-").reverse().join(".");
      lines.push([d, e.start, e.end, e.hours, e.minutes].join(";"));
    });
    return lines.join("\n");
  }

  function toText() {
    const list = load();
    if (!list.length) return "";
    const lines = [];
    lines.push("Mesai Kayıtları");
    lines.push("================");
    lines.push("");
    list.forEach((e) => {
      const d = (e.date || "").split("-").reverse().join(".");
      lines.push(`${d} | ${e.start} - ${e.end} | ${e.hours}s ${e.minutes}dk`);
    });
    let totalMinutes = list.reduce((acc, e) => acc + e.hours * 60 + e.minutes, 0);
    const totalH = Math.floor(totalMinutes / 60);
    const totalM = totalMinutes % 60;
    lines.push("");
    lines.push(`Toplam: ${totalH} saat ${totalM} dk`);
    return lines.join("\n");
  }

  function mergeFromArray(newEntries) {
    const existing = load();
    const merged = existing.concat(newEntries);
    saveAll(merged);
    return merged;
  }

  return { load, saveAll, add, remove, clear, toCSV, toText, mergeFromArray };
})();

// ================= CALCULATOR =================
const MesaiCalculator = (function () {
  function calculate(start, end) {
    if (!start || !end) {
      return {
        valid: false,
        message: "Lütfen başlangıç ve bitiş saatlerini girin."
      };
    }

    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);

    let s = new Date(2000, 0, 1, sh, sm);
    let e = new Date(2000, 0, 1, eh, em);

    if (e.getTime() < s.getTime()) {
      e.setDate(e.getDate() + 1);
    }

    const diffMinutes = (e.getTime() - s.getTime()) / 60000;
    if (diffMinutes <= 0) {
      return {
        valid: false,
        message: diffMinutes === 0 ? "Hiç çalışmadınız." : "Geçersiz saat aralığı."
      };
    }

    const hours = Math.floor(diffMinutes / 60);
    const minutes = Math.round(diffMinutes % 60);

    return {
      valid: true,
      start,
      end,
      hours,
      minutes,
      text: `Toplam Süre: ${hours} saat ${minutes} dakika`
    };
  }

  return { calculate };
})();

// ================= CSV PARSING (İÇE AKTAR) =================
const MesaiCSV = (function () {
  function parseCSV(text) {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (!lines.length) return [];

    const dataLines = (lines[0].toLowerCase().includes("tarih") ? lines.slice(1) : lines);

    const entries = [];
    dataLines.forEach(line => {
      const parts = line.split(/[;,]/).map(p => p.trim());
      if (parts.length < 5) return;

      let [dateStr, start, end, hoursStr, minutesStr] = parts;

      let date = "";
      if (dateStr.includes(".")) {
        const [d, m, y] = dateStr.split(".");
        if (y && m && d) {
          date = `${y.padStart(4,"0")}-${m.padStart(2,"0")}-${d.padStart(2,"0")}`;
        }
      } else if (dateStr.includes("-")) {
        date = dateStr;
      }

      const hours = parseInt(hoursStr, 10);
      const minutes = parseInt(minutesStr, 10);

      if (!date || !start || !end || isNaN(hours) || isNaN(minutes)) return;

      entries.push({
        id: Date.now() + Math.floor(Math.random() * 1000000),
        date,
        start,
        end,
        hours,
        minutes
      });
    });

    return entries;
  }

  return { parseCSV };
})()
// ================= TEXT PARSING (TXT İÇE/DIŞA AKTAR) =================
const MesaiText = (function () {
  // Beklenen satır formatı (toText çıktısı): "dd.mm.yyyy | HH:MM - HH:MM | Xs Ydk"
  const LINE_REGEX = /^(\d{2}\.\d{2}\.\d{4})\s*\|\s*(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})\s*\|\s*(\d+)s\s*(\d+)dk$/;

  function parse(text) {
    if (!text) return [];
    const lines = text.split(/\r?\n/);
    const entries = [];

    lines.forEach((line) => {
      const trimmed = line.trim();
      const m = LINE_REGEX.exec(trimmed);
      if (!m) return;
      const dateStr = m[1];
      const start = m[2];
      const end = m[3];
      const hoursStr = m[4];
      const minutesStr = m[5];

      let date = "";
      if (dateStr.includes(".")) {
        const [d, mth, y] = dateStr.split(".");
        if (y && mth && d) {
          date = `${y.padStart(4, "0")}-${mth.padStart(2, "0")}-${d.padStart(2, "0")}`;
        }
      }

      const hours = parseInt(hoursStr, 10);
      const minutes = parseInt(minutesStr, 10);
      if (!date || !start || !end || isNaN(hours) || isNaN(minutes)) return;

      entries.push({
        id: Date.now() + Math.floor(Math.random() * 1000000),
        date,
        start,
        end,
        hours,
        minutes
      });
    });

    return entries;
  }

  // Kullanıcı adına özel dosya adı üretir
  function buildFileName(prefix = "mesai_kayitlari") {
    let base = prefix;
    if (typeof MesaiUser !== "undefined" && MesaiUser.getCurrentUser) {
      const u = MesaiUser.getCurrentUser();
      if (u && u.name) {
        const safeName = u.name.replace(/\s+/g, "_");
        if (u.code) {
          base = `${prefix}_${safeName}_${u.code}`;
        } else {
          base = `${prefix}_${safeName}`;
        }
      }
    }
    return base + ".txt";
  }

  return { parse, buildFileName };
})()
// ================= JSON EXPORT/IMPORT =================
const MesaiJson = (function () {
  function buildPayload() {
    const user = (typeof MesaiUser !== "undefined" && MesaiUser.getCurrentUser)
      ? MesaiUser.getCurrentUser()
      : null;
    const records = (typeof MesaiStorage !== "undefined" && MesaiStorage.load)
      ? MesaiStorage.load()
      : [];

    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      user: user ? {
        id: user.id,
        name: user.name,
        code: user.code || "",
        phone: user.phone || ""
      } : null,
      records: records
    };
  }

  function buildFileName(prefix = "mesai_kayitlari") {
    let base = prefix;
    if (typeof MesaiUser !== "undefined" && MesaiUser.getCurrentUser) {
      const u = MesaiUser.getCurrentUser();
      if (u && u.name) {
        const safeName = u.name.replace(/\s+/g, "_");
        if (u.code) {
          base = `${prefix}_${safeName}_${u.code}`;
        } else {
          base = `${prefix}_${safeName}`;
        }
      }
    }
    return base + ".json";
  }

  function parse(jsonText) {
    let obj;
    try {
      obj = JSON.parse(jsonText);
    } catch (e) {
      throw new Error("Geçersiz JSON formatı");
    }
    if (!obj || typeof obj !== "object") {
      throw new Error("Boş veya geçersiz JSON");
    }
    const records = Array.isArray(obj.records) ? obj.records : [];
    const normalized = [];
    records.forEach((r) => {
      if (!r) return;
      const date = r.date;
      const start = r.start;
      const end = r.end;
      const hours = parseInt(r.hours, 10);
      const minutes = parseInt(r.minutes, 10);
      if (!date || !start || !end || isNaN(hours) || isNaN(minutes)) return;
      normalized.push({
        id: Date.now() + Math.floor(Math.random() * 1000000),
        date,
        start,
        end,
        hours,
        minutes
      });
    });
    return { metaUser: obj.user || null, records: normalized };
  }

  return { buildPayload, buildFileName, parse };
})();
;
;

// ================= UI =================
const MesaiUI = (function () {
  let workDateEl,
    startTimeEl,
    endTimeEl,
    resultEl,
    btnCalc,
    btnSave,
    tableBodyEl,
    totalBoxEl,
    btnExport,
    btnClearAll,
    btnImport,
    csvInputEl,
    btnExportNotes,
    btnExportTxt,
    btnImportTxt,
    txtInputEl,
    btnExportJson,
    btnImportJson,
    jsonInputEl;

  let currentCalc = null;

  function init() {
    workDateEl = document.getElementById("workDate");
    startTimeEl = document.getElementById("startTime");
    endTimeEl = document.getElementById("endTime");
    resultEl = document.getElementById("resultText");
    btnCalc = document.getElementById("btnCalc");
    btnSave = document.getElementById("btnSave");
    tableBodyEl = document.getElementById("tableBody");
    totalBoxEl = document.getElementById("totalBox");
    btnExport = document.getElementById("btnExport");
    btnClearAll = document.getElementById("btnClearAll");
    btnImport = document.getElementById("btnImport");
    csvInputEl = document.getElementById("csvInput");
    btnExportNotes = document.getElementById("btnExportNotes");
    btnExportTxt = document.getElementById("btnExportTxt");
    btnImportTxt = document.getElementById("btnImportTxt");
    txtInputEl = document.getElementById("txtInput");
    btnExportJson = document.getElementById("btnExportJson");
    btnImportJson = document.getElementById("btnImportJson");
    jsonInputEl = document.getElementById("jsonInput");

    const today = new Date();
    if (workDateEl) {
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, "0");
      const dd = String(today.getDate()).padStart(2, "0");
      workDateEl.value = `${yyyy}-${mm}-${dd}`;
    }

    if (btnCalc) btnCalc.addEventListener("click", handleCalculate);
    if (btnSave) btnSave.addEventListener("click", handleSave);
    if (btnExport) btnExport.addEventListener("click", handleExportCSV);
    if (btnClearAll) btnClearAll.addEventListener("click", handleClearAll);
    if (btnImport && csvInputEl) {
      btnImport.addEventListener("click", () => csvInputEl.click());
      csvInputEl.addEventListener("change", handleImportCSV);
    }
    if (btnExportNotes) {
      btnExportNotes.addEventListener("click", handleExportNotes);
    }
    if (btnExportTxt) {
      btnExportTxt.addEventListener("click", handleExportTxt);
    }
    if (btnImportTxt && txtInputEl) {
      btnImportTxt.addEventListener("click", () => txtInputEl.click());
      txtInputEl.addEventListener("change", handleImportTxt);
    }
    if (btnExportJson) {
      btnExportJson.addEventListener("click", handleExportJson);
    }
    if (btnImportJson && jsonInputEl) {
      btnImportJson.addEventListener("click", () => jsonInputEl.click());
      jsonInputEl.addEventListener("change", handleImportJson);
    }

    renderTable();
  }

  function handleCalculate() {
    if (!startTimeEl || !endTimeEl || !resultEl || !btnSave) return;
    const start = startTimeEl.value;
    const end = endTimeEl.value;
    const result = MesaiCalculator.calculate(start, end);

    if (!result.valid) {
      resultEl.textContent = result.message;
      btnSave.disabled = true;
      currentCalc = null;
      return;
    }

    currentCalc = result;
    resultEl.textContent = result.text;
    btnSave.disabled = false;
  }

  function handleSave() {
    if (!currentCalc || !workDateEl || !resultEl || !btnSave) return;
    if (!workDateEl.value) {
      MesaiMessage.warning("Lütfen bir tarih seçin.");
      return;
    }

    const entry = {
      id: Date.now(),
      date: workDateEl.value,
      start: currentCalc.start,
      end: currentCalc.end,
      hours: currentCalc.hours,
      minutes: currentCalc.minutes
    };

    MesaiStorage.add(entry);
    currentCalc = null;
    btnSave.disabled = true;
    resultEl.textContent = "✅ Kayıt başarıyla eklendi.";
    renderTable();
  }

  function renderTable() {
    if (!tableBodyEl || !totalBoxEl) return;
    const list = MesaiStorage.load();
    tableBodyEl.innerHTML = "";
    let totalMinutes = 0;

    if (!list.length) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 6;
      td.className = "mesai-table-empty py-3";
      td.textContent = "Henüz kayıt yok. Önce mesai girişi yapın.";
      tr.appendChild(td);
      tableBodyEl.appendChild(tr);
      totalBoxEl.textContent = "Toplam: 0 saat 0 dk";
      return;
    }

    const sorted = [...list].sort((a, b) => {
      if (a.date === b.date) return a.start > b.start ? -1 : 1;
      return a.date > b.date ? -1 : 1;
    });

    sorted.forEach((e, index) => {
      totalMinutes += e.hours * 60 + e.minutes;
      const tr = document.createElement("tr");
      const dateStr = (e.date || "").split("-").reverse().join(".");

      tr.innerHTML = `
        <td>${index + 1}</td>
        <td>${dateStr}</td>
        <td>${e.start}</td>
        <td>${e.end}</td>
        <td>${e.hours}s ${e.minutes}dk</td>
        <td class="text-end">
          <button type="button" class="btn mesai-btn-danger mesai-btn-xs" data-id="${e.id}">Sil</button>
        </td>
      `;

      tableBodyEl.appendChild(tr);
    });

    const totalH = Math.floor(totalMinutes / 60);
    const totalM = totalMinutes % 60;
    totalBoxEl.textContent = `Toplam: ${totalH} saat ${totalM} dk`;

    tableBodyEl.querySelectorAll("button[data-id]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = Number(btn.getAttribute("data-id"));
        MesaiConfirm.show("Bu kaydı silmek istediğinize emin misiniz?").then((ok) => {
          if (!ok) return;
          MesaiStorage.remove(id);
          renderTable();
          MesaiMessage.success("Kayıt silindi.");
        });
      });
    });
  }

  function handleExportCSV() {
    const csv = MesaiStorage.toCSV();
    if (!csv) {
      MesaiMessage.warning("Dışa aktarılacak kayıt bulunamadı.");
      return;
    }
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "mesai_kayitlari.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function handleClearAll() {
    const list = MesaiStorage.load();
    if (!list.length) {
      MesaiMessage.warning("Silinecek kayıt bulunamadı.");
      return;
    }
    MesaiConfirm.show("Tüm mesai kayıtlarını silmek istediğinize emin misiniz?").then((ok) => {
      if (!ok) return;
      MesaiStorage.clear();
      renderTable();
      MesaiMessage.success("Tüm kayıtlar silindi.");
    });
  }

  function handleImportCSV(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
      const text = e.target.result;
      try {
        const importedEntries = MesaiCSV.parseCSV(text);
        if (!importedEntries.length) {
          MesaiMessage.warning("CSV dosyasından geçerli kayıt bulunamadı.");
          return;
        }
        MesaiStorage.mergeFromArray(importedEntries);
        renderTable();
        MesaiMessage.success(`CSV'den ${importedEntries.length} kayıt içe aktarıldı.`);
      } catch (err) {
        console.error("CSV içe aktarma hatası:", err);
        MesaiMessage.error("CSV içe aktarılırken bir hata oluştu. Dosya formatını kontrol edin.");
      } finally {
        event.target.value = "";
      }
    };
    reader.readAsText(file, "utf-8");
  }

  function handleExportNotes() {
    const baseText = MesaiStorage.toText();
    if (!baseText) { MesaiMessage.warning('Lütfen önce mesai kaydı ekleyiniz.'); return; }
    if (!baseText) {
      MesaiMessage.warning("Not defterine aktarılacak kayıt bulunamadı.");
      return;
    }

    // Aktif kullanıcının bilgilerini metnin başına ekle
    let headerLines = [];
    if (typeof MesaiUser !== "undefined" && MesaiUser.getCurrentUser) {
      const u = MesaiUser.getCurrentUser();
      if (u && (u.name || u.code || u.phone)) {
        headerLines.push("Kullanıcı Bilgisi");
        headerLines.push("================");
        const lineParts = [];
        if (u.name) lineParts.push(`Ad: ${u.name}`);
        if (u.code) lineParts.push(`Kod: ${u.code}`);
        if (lineParts.length) headerLines.push(lineParts.join(" | "));
        if (u.phone) headerLines.push(`Telefon: ${u.phone}`);
        headerLines.push("");
      }
    }

    const text = headerLines.length ? headerLines.join("\n") + baseText : baseText;

    if (navigator.share) {
      navigator
        .share({
          title: "Mesai Kayıtları",
          text
        })
        .catch(() => {});
      return;
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(text)
        .then(() => {
          MesaiMessage.success("Mesai kayıtları panoya kopyalandı. Telefonunuzdaki not defterine yapıştırabilirsiniz.");
        })
        .catch(() => {
          fallbackDownloadText(text);
        });
      return;
    }

    fallbackDownloadText(text);
  }

function handleExportTxt() {
  const text = MesaiStorage.toText();
  if (!text) {
    MesaiMessage.warning("TXT olarak dışa aktarılacak kayıt bulunamadı.");
    return;
  }
  const fileName = (typeof MesaiText !== "undefined" && MesaiText.buildFileName)
    ? MesaiText.buildFileName("mesai_kayitlari")
    : "mesai_kayitlari.txt";

  const blob = new Blob([text], { type: "text/plain;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function handleImportTxt(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  const name = (file.name || "").toLowerCase();
  if (!name.endsWith(".txt")) {
    MesaiMessage.warning("Lütfen yalnızca .txt uzantılı dosya seçiniz.");
    event.target.value = "";
    return;
  }

  const reader = new FileReader();
  reader.onload = function (e) {
    const text = e.target.result;
    try {
      if (typeof MesaiText === "undefined" || !MesaiText.parse) {
        MesaiMessage.error("TXT içe aktarma özelliği kullanılamıyor.");
        return;
      }

      const importedEntries = MesaiText.parse(text);
      if (!importedEntries.length) {
        MesaiMessage.warning("TXT dosyasından geçerli kayıt bulunamadı.");
        return;
      }

      // TXT içeriğinde eksik alanları tespit etmek için sayaç
      let missingFieldCount = 0;

      const existing = MesaiStorage.load ? MesaiStorage.load() : [];

      // Eğer mevcut listede hiç veri yoksa -> direkt hepsini ekle
      if (!existing.length) {
        // Eksik alanları normalize et
        importedEntries.forEach((entry) => {
          if (!entry.date || !entry.start || !entry.end) {
            missingFieldCount++;
          }
          entry.date = entry.date || "";
          entry.start = entry.start || "-";
          entry.end = entry.end || "-";
          if (entry.hours == null) entry.hours = 0;
          if (entry.minutes == null) entry.minutes = 0;
        });

        MesaiStorage.saveAll(importedEntries);
        renderTable();

        if (missingFieldCount > 0) {
          MesaiMessage.info(
            `TXT'den ${importedEntries.length} kayıt eklendi. Bazı kayıtlarda eksik alanlar bulunduğu için bu alanlar '-' ile işaretlendi.`
          );
        } else {
          MesaiMessage.success(`TXT'den ${importedEntries.length} kayıt eklendi.`);
        }
        return;
      }

      // Aksi halde: tekrar kontrolü yap
      const keyOf = (e) => `${e.date || ""}|${e.start || ""}|${e.end || ""}|${e.hours}|${e.minutes}`;
      const existingKeys = new Set(existing.map(keyOf));

      const newOnes = [];
      const duplicates = [];

      importedEntries.forEach((entry) => {
        // Eksik alanları kontrol et + normalize et
        if (!entry.date || !entry.start || !entry.end) {
          missingFieldCount++;
        }
        entry.date = entry.date || "";
        entry.start = entry.start || "-";
        entry.end = entry.end || "-";
        if (entry.hours == null) entry.hours = 0;
        if (entry.minutes == null) entry.minutes = 0;

        const k = keyOf(entry);
        if (existingKeys.has(k)) {
          duplicates.push(entry);
        } else {
          existingKeys.add(k);
          newOnes.push(entry);
          existing.push(entry);
        }
      });

      if (newOnes.length) {
        MesaiStorage.saveAll(existing);
      }

      renderTable();

      let msg = "";
      if (!newOnes.length && duplicates.length) {
        msg = `TXT dosyasındaki tüm ${duplicates.length} kayıt zaten mevcut. Yeni kayıt eklenmedi.`;
      } else if (newOnes.length && duplicates.length) {
        msg = `TXT'den ${newOnes.length} yeni kayıt eklendi. ${duplicates.length} kayıt zaten mevcuttu.`;
      } else if (newOnes.length && !duplicates.length) {
        msg = `TXT'den ${newOnes.length} yeni kayıt eklendi.`;
      }

      if (missingFieldCount > 0 && newOnes.length) {
        msg += (msg ? " " : "") + "Bazı kayıtlarda eksik alanlar bulunduğu için bu alanlar '-' ile işaretlendi.";
      }

      if (msg) MesaiMessage.info(msg);

    } catch (err) {
      console.error("TXT içe aktarma hatası:", err);
      MesaiMessage.error("TXT içe aktarılırken bir hata oluştu.");
    } finally {
      event.target.value = "";
    }
  };
  reader.readAsText(file, "utf-8");
}
e.error("JSON dışa aktarma özelliği kullanılamıyor.");
    return;
  }
  const payload = MesaiJson.buildPayload();
  const fileName = MesaiJson.buildFileName("mesai_kayitlari");
  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: "application/json;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function handleImportJson(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const text = e.target.result;
    try {
      if (typeof MesaiJson === "undefined" || !MesaiJson.parse) {
        MesaiMessage.error("JSON içe aktarma özelliği kullanılamıyor.");
        return;
      }
      const parsed = MesaiJson.parse(text);
      const importedEntries = parsed.records || [];
      if (!importedEntries.length) {
        MesaiMessage.warning("JSON dosyasından geçerli kayıt bulunamadı.");
        return;
      }
      MesaiStorage.mergeFromArray(importedEntries);
      renderTable();
      MesaiMessage.success(`JSON'dan ${importedEntries.length} kayıt içe aktarıldı.`);
    } catch (err) {
      console.error("JSON içe aktarma hatası:", err);
      MesaiMessage.error("JSON içe aktarılırken bir hata oluştu. Dosya formatını kontrol edin.");
    } finally {
      event.target.value = "";
    }
  };
  reader.readAsText(file, "utf-8");
}

  function fallbackDownloadText(text) {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "mesai_kayitlari_not.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return { init, renderTable };
})();

// ================= USER UI =================

// Uygulama içi mesaj kutusu yöneticisi
const MesaiMessage = (function () {
  let box, textEl, closeBtn, hideTimeout;

  function ensureElements() {
    if (box) return;
    box = document.getElementById("mesaiMessage");
    textEl = document.getElementById("mesaiMessageText");
    closeBtn = document.querySelector("#mesaiMessage .mesai-message__close");
    if (closeBtn) {
      closeBtn.addEventListener("click", hide);
    }
  }

  function clearTypes() {
    if (!box) return;
    box.classList.remove(
      "mesai-message--hidden",
      "mesai-message--info",
      "mesai-message--success",
      "mesai-message--warning",
      "mesai-message--error"
    );
  }

  function show(message, type = "info", timeoutMs = 5000) {
    ensureElements();
    if (!box || !textEl) {
      // Güvenlik için, DOM bulunamazsa son çare olarak alert kullan
      window.alert(message);
      return;
    }

    clearTypes();
    const variantClass = "mesai-message--" + type;
    box.classList.add(variantClass);
    textEl.textContent = message;

    if (hideTimeout) clearTimeout(hideTimeout);
    if (timeoutMs > 0) {
      hideTimeout = setTimeout(hide, timeoutMs);
    }
  }

  function hide() {
    if (!box) return;
    box.classList.add("mesai-message--hidden");
  }

  function info(message, timeoutMs) {
    show(message, "info", timeoutMs);
  }

  function success(message, timeoutMs) {
    show(message, "success", timeoutMs);
  }

  function warning(message, timeoutMs) {
    show(message, "warning", timeoutMs);
  }

  function error(message, timeoutMs) {
    show(message, "error", timeoutMs);
  }

  return {
    show,
    hide,
    info,
    success,
    warning,
    error
  };
})()
// Silme işlemleri için uygulama içi onay yöneticisi
const MesaiConfirm = (function () {
  let backdrop, textEl, okBtn, cancelBtn, pendingResolve;

  function ensureElements() {
    if (backdrop) return;
    backdrop = document.getElementById("mesaiConfirmBackdrop");
    textEl = document.getElementById("mesaiConfirmText");
    okBtn = document.getElementById("mesaiConfirmOk");
    cancelBtn = document.getElementById("mesaiConfirmCancel");

    if (!backdrop) return;

    function handleCancel() {
      hide();
      if (pendingResolve) {
        const resolve = pendingResolve;
        pendingResolve = null;
        resolve(false);
      }
    }

    function handleOk() {
      hide();
      if (pendingResolve) {
        const resolve = pendingResolve;
        pendingResolve = null;
        resolve(true);
      }
    }

    if (cancelBtn) cancelBtn.addEventListener("click", handleCancel);
    if (okBtn) okBtn.addEventListener("click", handleOk);

    // backdrop'a tıklayınca da iptal say
    backdrop.addEventListener("click", (ev) => {
      if (ev.target === backdrop) {
        handleCancel();
      }
    });
  }

  function show(message) {
    ensureElements();
    if (!backdrop) {
      // Son çare – DOM yoksa sessizce onay kabul et
      return Promise.resolve(true);
    }
    if (textEl) textEl.textContent = message;
    backdrop.classList.add("mesai-confirm-backdrop--visible");

    return new Promise((resolve) => {
      pendingResolve = resolve;
    });
  }

  function hide() {
    if (!backdrop) return;
    backdrop.classList.remove("mesai-confirm-backdrop--visible");
  }

  return {
    show,
    hide
  };
})();
;
const MesaiUserUI = (function () {
  let nameInput,
    codeInput,
    phoneInput,
    btnLogin,
    userSelect,
    currentUserLabel,
    userListEl,
    backToLoginButton;

  function init() {
    nameInput = document.getElementById("userName");
    codeInput = document.getElementById("userCode");
    phoneInput = document.getElementById("userPhone");
    btnLogin = document.getElementById("btnUserLogin");
    userSelect = document.getElementById("userSelect");
    currentUserLabel = document.getElementById("currentUserLabel");
    userListEl = document.getElementById("userList");
    backToLoginButton = document.getElementById("btnBackToLogin");

    if (btnLogin) {
      btnLogin.addEventListener("click", handleLogin);
    }

    if (backToLoginButton) {
      backToLoginButton.addEventListener("click", function () {
        showLoginView();
      });
    }

    // Son kullanılan kullanıcıyı otomatik yükle (sadece görüntü için)
    if (typeof MesaiUser !== "undefined" && MesaiUser.initFromLast) {
      const u = MesaiUser.initFromLast();
      if (u) {
        if (nameInput) nameInput.value = u.name || "";
        if (codeInput) codeInput.value = u.code || "";
        if (phoneInput) phoneInput.value = u.phone || "";
      }
    }

    refreshUserSelect();
    updateCurrentUserLabel();
    renderUserList();

    // Sayfa ilk açıldığında login bölümü açık, ana içerik gizli olsun
    showLoginView();

    if (typeof MesaiUI !== "undefined" && MesaiUI.renderTable) {
      MesaiUI.renderTable();
    }
  }

  function showLoginView() {
    const loginSection = document.getElementById("loginSection");
    const mainContent = document.getElementById("mainContent");
    if (loginSection) {
      loginSection.classList.remove("mesai-main-hidden");
    }
    if (mainContent) {
      mainContent.classList.add("mesai-main-hidden");
    }
  }

  function showMainView() {
    const loginSection = document.getElementById("loginSection");
    const mainContent = document.getElementById("mainContent");
    if (loginSection) {
      loginSection.classList.add("mesai-main-hidden");
    }
    if (mainContent) {
      mainContent.classList.remove("mesai-main-hidden");
    }
  }

  function updateCurrentUserLabel() {
    if (!currentUserLabel || typeof MesaiUser === "undefined") return;
    const u = MesaiUser.getCurrentUser();
    if (!u) {
      currentUserLabel.textContent = "Aktif kullanıcı: seçilmemiş";
      return;
    }
    const parts = [];
    if (u.name) parts.push(u.name);
    if (u.code) parts.push(`#${u.code}`);
    currentUserLabel.textContent = "Aktif kullanıcı: " + parts.join(" ");
  }

  // Kayıtlı kullanıcılar listesi gösterilir ama seçim yapılarak
  // başkasının hesabına geçişe izin verilmez.
  function refreshUserSelect() {
    if (!userSelect || typeof MesaiUser === "undefined") return;
    userSelect.innerHTML = "";
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = "Kayıtlı kullanıcılar (liste)";
    opt.disabled = true;
    opt.selected = true;
    userSelect.appendChild(opt);

    const users = MesaiUser.getAllUsers ? MesaiUser.getAllUsers() : [];
    users.forEach((u) => {
      const o = document.createElement("option");
      o.value = u.id || "";
      o.textContent = u.code ? `${u.name} (${u.code})` : u.name;
      o.disabled = true;
      userSelect.appendChild(o);
    });
  }

  function renderUserList() {
    if (!userListEl || typeof MesaiUser === "undefined") return;
    userListEl.innerHTML = "";
    const users = MesaiUser.getAllUsers ? MesaiUser.getAllUsers() : [];
    users.forEach((u) => {
      const li = document.createElement("li");
      li.className = "mesai-user-list-item";

      const left = document.createElement("div");
      left.className = "mesai-user-list-main";

      const nameSpan = document.createElement("span");
      nameSpan.className = "mesai-user-name";
      nameSpan.textContent = u.name || "-";
      left.appendChild(nameSpan);

      if (u.code) {
        const tag = document.createElement("span");
        tag.className = "mesai-user-tag";
        tag.textContent = `#${u.code}`;
        left.appendChild(tag);
      }

      const right = document.createElement("div");
      right.className = "mesai-user-list-meta";

      if (u.phone) {
        const phoneSpan = document.createElement("span");
        phoneSpan.className = "mesai-user-phone";
        phoneSpan.textContent = u.phone;
        right.appendChild(phoneSpan);
      }

      li.appendChild(left);
      li.appendChild(right);
      userListEl.appendChild(li);
    });
  }

  function handleLogin() {
    if (typeof MesaiUser === "undefined") return;
    const name = nameInput ? nameInput.value : "";
    const code = codeInput ? codeInput.value : "";
    const phone = phoneInput ? phoneInput.value : "";

    if (!name || !name.trim()) {
      MesaiMessage.warning("Lütfen en az bir isim girin.");
      return;
    }

    // Daha önce bu cihazda tanımlanmış ana kullanıcı adı varsa,
    // başkasının adına girişe izin verme.
    const MAIN_KEY = "mesai_main_user_name";
    const normalized = (s) => (s || "").trim().toLowerCase();
    const existingMain = localStorage.getItem(MAIN_KEY);

    if (existingMain && normalized(name) !== normalized(existingMain)) {
      MesaiMessage.error("Bu cihazda daha önce farklı bir kullanıcı adı ile giriş yapılmış. Başkasının adına giriş yapamazsın.");
      return;
    }

    const user = MesaiUser.getOrCreateUser(name, code, phone);
    if (!user) {
      MesaiMessage.warning("Lütfen en az bir isim girin.");
      return;
    }

    if (!existingMain) {
      localStorage.setItem(MAIN_KEY, name);
    }

    updateCurrentUserLabel();
    refreshUserSelect();
    renderUserList();
    if (typeof MesaiUI !== "undefined" && MesaiUI.renderTable) {
      MesaiUI.renderTable();
    }

    showMainView();
  }

  return { init, refreshUserSelect, updateCurrentUserLabel, renderUserList };
})();
// ================= INIT =================
document.addEventListener("DOMContentLoaded", function () {
  MesaiHeroSlider.init();
  MesaiUI.init();
  if (typeof MesaiUserUI !== "undefined") {
    MesaiUserUI.init();
  }
});


document.addEventListener("DOMContentLoaded", () => {
  if (typeof MesaiUser !== "undefined" && MesaiUser.getCurrentUser) {
    const u = MesaiUser.getCurrentUser();
    const el = document.getElementById("loginCurrentUser");
    if (u && el) {
      el.textContent = `Kayıtlı kullanıcı: ${u.name}${u.code ? " (" + u.code + ")" : ""}`;
    }
  }
});
