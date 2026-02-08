# 🕒 Mesai Takip Uygulaması (PWA)

Bu proje, bir veya birden fazla kullanıcının **mesai saatlerini hesaplayıp kaydedebildiği**, tamamen tarayıcı üzerinde çalışan bir **frontend mesai takip uygulamasıdır**.  
Tüm veriler **localStorage** üzerinde saklanır; sunucu tarafı yoktur, veriler dışarıya gönderilmez.

---

## 🚀 Genel Özellikler

- ⏱ Başlangıç–bitiş saatine göre otomatik mesai hesaplama
- 🌙 Gece vardiyası gibi **tarihi aşan** (ör. `23:59 → 06:00`) saat aralıklarını otomatik doğru hesaplama
- 💾 Her hesaplamayı tek tıkla kaydedebilme
- 📋 Kayıtlı mesaileri tablo halinde görme, tek tek silme veya tümünü temizleme
- 👤 Zorunlu kullanıcı girişi (isim / kod)
- 🔐 Her cihaz için **tek ana kullanıcı** mantığı (başkasının adına giriş engeli)
- 📤 CSV ve TXT dışa aktarma, TXT içe aktarma
- 📝 “Notlara Gönder” butonu ile **aktif kullanıcının kim olduğunu da içeren** metin çıktısı
- 📱 PWA desteği (Ana ekrana eklenip uygulama gibi kullanılabilir)
- 🎨 Limon yeşili temalı, koyu arka planlı, modern ve responsive tasarım

---

## 📁 Dosya Yapısı

Tüm dosyalar **tek klasör** altında tutulur; alt klasör kullanılmaz:

```text
/
├── index.html        → Uygulamanın tüm arayüzü (login + hesaplama + kayıtlar)
├── login.html        → Eski bağımsız login ekranı (artık sadece yedek / referans)
├── styles.css        → Tema, tipografi, layout, mobil uyum
├── app.js            → İş mantığı (kullanıcı, hesaplama, kayıt, dışa aktarma)
├── manifest.json     → PWA manifest dosyası
├── service-worker.js → PWA service worker
├── icon-192.png      → PWA ikon (192x192)
├── icon-512.png      → PWA ikon (512x512)
└── README.md         → Bu doküman
```

---

## 🔀 Ekran Akışı ve SPA Mantığı

Uygulama **tek sayfa uygulaması (SPA) mantığıyla** çalışır. Tüm akış `index.html` içindedir.

### 1. Login Bölümü (`#loginSection`)

- İlk açılışta **yalnızca login kartı görünür**.
- Kullanıcı şu alanları doldurur:
  - **İsim** (zorunlu)
  - Kod (opsiyonel)
  - Telefon (opsiyonel)
- “Giriş / Kaydet” butonuna basıldığında:
  - Kullanıcı kaydedilir veya güncellenir.
  - Cihazda daha önce tanımlı bir **ana kullanıcı adı** varsa:
    - Farklı bir isimle giriş yapılmasına izin verilmez.
- Başarılı girişten sonra:
  - Login bölümü gizlenir.
  - Hesaplama ve kayıt bölümleri görünür (SPA geçişi).

### 2. Ana İçerik (`#mainContent`)

Login sonrası açılan kısım:

- **Aktif Kullanıcı** kartı
- **Mesai Hesaplama** kartı
- **Kayıtlı Mesailer** kartı

#### Aktif Kullanıcı Kartı

- O an oturum açmış olan kullanıcının adı ve (varsa) kodu gösterilir.
- “⬅️ Geri Dön (Girişe)” butonu:
  - Sayfa yenilenmeden yeniden login bölümüne geçiş sağlar.
  - Başka bir kullanıcı ile tekrar giriş yapmak istersen buradan login ekranına dönebilirsin.

---

## 👥 Kullanıcı Yönetimi

Kullanıcı mantığı `MesaiUser` modülü ile yönetilir.

- Tüm kullanıcılar `localStorage` içinde JSON olarak saklanır.
- **Ana kullanıcı adı** ilk başarılı girişte kaydedilir:
  - `mesai_main_user_name` anahtarında tutulur.
  - Daha sonra farklı bir isimle giriş yapılırsa:
    - Uygulama uyarı verir ve girişe izin vermez.
- Her kullanıcı için:
  - `id` (benzersiz)
  - `name`
  - `code`
  - `phone`
  - gibi alanlar saklanır.
- Kayıtlı kullanıcılar login ekranunda listelenir (liste bilgi amaçlıdır; oradan kullanıcı değişimi yapılmaz).

Kullanıcıya göre mesai kayıtları da **ayrı anahtarlarla** saklanır:  
`mesai_kayitlari_user_<id>`

---

## ⏱ Mesai Hesaplama

Hesaplama mantığı `MesaiCalculator.calculate(start, end)` fonksiyonuna dayanır:

- Girişler: `"HH:MM"` formatında başlangıç (`start`) ve bitiş (`end`) saatleri
- Eğer bitiş saati, başlangıç saatinden **küçükse**, sistem otomatik olarak **ertesi günü** baz alır:
  - Örn: `23:59 → 06:00` aralığı, bir sonraki güne taşınmış sayılır.
- Fark dakika cinsinden hesaplanır; sonra:
  - Toplam saat (`hours`)
  - Kalan dakika (`minutes`)
  olarak bölünür.
- Negatif veya 0 süre durumlarında uyarı mesajı döner.

Arayüzde:

- “⏱ Hesapla” butonu hesaplama yapar.
- “💾 Kaydet” butonu, son hesaplanan süreyi aktif kullanıcıya ait mesai listesine ekler.

Gece vardiyası için **metinsel örnek**:

- “Gece vardiyası (23:59–06:00) otomatik algılanır.”
- “Örnek: 23:59 → 06:00 girersen, sistem otomatik olarak ertesi güne göre hesaplar ve negatif süreyi engeller.”

---

## 📄 Kayıtlar, Silme ve Toplam Süre

Kayıtlı mesailer `Kayıtlı Mesailer` kartında tablo olarak gösterilir:

- Sütunlar:
  - Tarih
  - Başlangıç
  - Bitiş
  - Süre (saat + dakika)
  - Sil butonu
- Her satırdaki **Sil** butonu sadece o kaydı siler.
- Kartın sağ üstündeki “🧹 Tüm Kayıtları Sil” butonu:
  - Aktif kullanıcıya ait tüm kayıtları temizler.
- Kartın alt kısmında:
  - Tüm kayıtların toplam süresi gösterilir (`Toplam: X saat Y dk`).

---

## 📤 Dışa Aktarım ve İçe Aktarım

### 1. CSV Dışa Aktar / İçe Aktar

- `MesaiStorage.toCSV()` ve `MesaiCSV.parseCSV()` fonksiyonları kullanılır.
- CSV formatı:
  - `Tarih;Başlangıç;Bitiş;Saat;Dakika`
- Dışa aktarılan dosya, daha sonra tekrar uygulamaya içe aktarılabilir.

### 2. TXT Dışa Aktar / İçe Aktar

- `MesaiStorage.toText()` ve `MesaiText.parse(text)` kullanılır.
- TXT formatı insan tarafından okunabilir halde tutulur:
  - Başlık: “Mesai Kayıtları”
  - Her satır: `dd.mm.yyyy | HH:MM - HH:MM | Xs Ydk`
  - En altta toplam süre satırı.

### 3. Notlara Gönder (Aktif Kullanıcı Bilgisi ile)

“📝 Notlara Gönder” butonu `handleExportNotes()` fonksiyonunu tetikler:

- Önce `MesaiStorage.toText()` ile kayıtlar metne çevrilir.
- Ardından **aktif kullanıcının bilgisi** metnin başına eklenir:

```text
Kullanıcı Bilgisi
================
Ad: Yusuf Tekmil | Kod: 1234
Telefon: +49 ...
 
Mesai Kayıtları
================
...
```

- Daha sonra:
  - Cihaz **`navigator.share`** destekliyorsa, doğrudan paylaşım ekranı açılır.
  - Aksi halde:
    - Metin panoya kopyalanır, veya
    - Yedek olarak `.txt` dosyası indirilir.

Bu sayede not defterine aktarılan her kaydın **kime ait olduğu** net şekilde görünür.

---

## 🎨 Tasarım ve Tema

- Ana renk: **Limon yeşili** (accent)
- Arka plan: Koyu gri / siyah tonları
- Metin: Açık renk, yüksek kontrast
- Kayıt tablosu:
  - Koyu satır arka planları
  - Alternatif satır tonları
  - Üzerine gelindiğinde (hover) satır vurgusu
- Butonlar:
  - Birincil aksiyonlar için özel sınıflar (`mesai-btn-primary`, `mesai-btn-danger`, `mesai-btn-ghost`)
  - Kayıtlı Mesailer kartındaki tüm aksiyon butonları başlık kısmının sağında yan yana gruplanmıştır.

Arayüz mobil ve masaüstü için **responsive** olarak tasarlanmıştır.

---

## 📱 PWA Desteği

Uygulama, modern tarayıcılarda **PWA** olarak kurulabilir:

- `manifest.json`:
  - `name`, `short_name`, `start_url: "index.html"`
  - İkonlar (192px, 512px)
  - Ekran yönü, tema rengi vb.
- `service-worker.js`:
  - Temel önbellekleme mantığı
  - Çevrimdışı kullanım için statik dosyaların cache’lenmesi

Tarayıcıdan:

- “Ana ekrana ekle” veya “Install App” seçeneği ile uygulama gibi cihazına kurulabilir.

---

## 🧾 Sürüm Geçmişi (Özet)

> Not: Aşağıdaki sürüm notları, bu proje boyunca yapılan önemli değişiklikleri özetler.  
> Eski sürümler arasındaki küçük ara değişiklikler, ana başlıklar altında birleştirilmiştir.

### v19 – TXT'den Eksik Alanların '-' ile İşaretlenmesi ve Mesaj Süresinin Kısaltılması
- TXT içe aktarma sırasında, her kayıt ayrıntılı olarak analiz edilir; tarih, başlangıç ve bitiş alanlarından herhangi biri eksikse bu kayıtlar **eksik alanlı** olarak işaretlenir.
- Eksik alanlı kayıtlarda ilgili alanlar otomatik olarak `"-"` ile doldurulur; saat/dakika alanı boş ise `0s 0dk` olarak normalize edilir.
- Eğer TXT dosyasından gelen kayıtlarda eksik alanlar varsa, içe aktarma sonrasında kullanıcıya şu anlama gelen bir bilgilendirme mesajı gösterilir: veriler sisteme eklendi, ancak bazı alanlar boş olduğu için `"-"` ile işaretlendi.
- Uygulama içi mesajların varsayılan görünme süresi **yaklaşık 5 saniyeye** düşürüldü; böylece bilgiyi okuyup ekrana takılmadan çalışmaya devam etmek daha kolay hale getirildi.

### v18 – Mesaj Renklerinin Anlamsal Standartlaştırılması
- Uygulama içi mesajlarda **anlamsal renk standardı** netleştirildi:
  - **Kritik mesajlar** (hata, engelleyici durumlar) → **kırmızı** (`critical / error`).
  - **Uyarı mesajları** (eksik bilgi, dikkat gerektiren durumlar) → **sarı** (`warning`).
  - **Onaylanan / başarılı işlemler** → **yeşil** (`approved / success`).
- Mesaj sistemi (MesaiMessage) içine anlamsal yardımcı fonksiyonlar eklendi:
  - `MesaiMessage.critical(...)`
  - `MesaiMessage.warning(...)`
  - `MesaiMessage.approved(...)`
- Böylece kod tarafında mesajların anlamı ile kullanıcıya yansıyan renkler birebir eşleştirilmiş oldu.

### v17 – Mesajların Otomatik ve Efektli Kaybolması, TXT Uzantı Kontrolü
- Uygulama içi mesaj kutusu (MesaiMessage) artık **yaklaşık 10 saniye** sonra kendiliğinden kaybolacak şekilde yapılandırıldı; kaybolma sırasında opaklık ve konumda yumuşak bir geçiş (fade-out / slide-up) animasyonu uygulanır.
- Mesaj kutusu görünürlüğü `opacity` ve `transform` üzerinden yönetilir; `mesai-message--hidden` sınıfı, mesajın yumuşak bir şekilde ortadan kaybolmasını sağlar.
- TXT içe aktarma bölümünde, dosya seçiminde artık yalnızca **.txt uzantılı dosyalar** kabul edilir; farklı bir uzantı seçilirse, işlem yapılmaz ve kullanıcıya **“Lütfen yalnızca .txt uzantılı dosya seçiniz.”** şeklinde uyarı gösterilir.
- İlgili dosya input'u HTML tarafında da `accept=".txt"` ile sınırlandırılmıştır; böylece hem tarayıcı düzeyinde hem de uygulama mantığı düzeyinde yanlış dosya seçimi engellenmiş olur.

### v16 – Kayıtlı Mesailer İçin Onay Diyalogları ve Ek Boş Liste Uyarıları
- Kayıtlı Mesailer tablosundaki satır silme butonuna basıldığında, tarayıcı `confirm(...)` penceresi yerine uygulama içinde temaya uygun bir **onay penceresi** (MesaiConfirm) açılır; kullanıcı “Vazgeç” veya “Evet, sil” seçeneklerini kullanabilir.
- Aynı şekilde, “Tüm Kayıtları Sil” butonu da artık uygulama içi bir onay diyalogu ile çalışır; işlem onaylanmazsa hiçbir kayıt silinmez.
- Tüm kayıtları silme işleminde, kayıt listesi boşsa kullanıcıya **“Silinecek kayıt bulunamadı.”** uyarısı gösterilir.
- Tekil kayıt silme işleminden sonra, başarılı silme durumu için yeşil tonlu bir başarı mesajı gösterilir.
- Böylece kayıt listesiyle ilgili tüm kritik işlemler, tarayıcı pop-up'ları kullanılmadan, tamamen uygulamanın kendi tasarımı içinde ve kullanıcıya daha net geri bildirimlerle yönetilir.

### v15 – Tarayıcı Alert Yerine Tema Uyumlu Mesaj Kutusu
- Tüm `alert(...)` çağrıları kaldırılarak, uygulama içinde tasarımla uyumlu özel bir **mesaj kutusu bileşeni** (MesaiMessage) kullanıldı.
- Mesajlar artık sayfanın üst kısmında, kart tarzında gösteriliyor ve kullanıcı isterse çarpı (×) butonuyla kapatabiliyor.
- Mesaj türüne göre arka plan ve kenarlık renkleri değişiyor:
  - Bilgi / özet mesajları: nötr koyu arka plan, yeşil vurgu.
  - Başarılı işlemler (ör. CSV/TXT/JSON içe aktarıldı): yeşil tonlu arka plan.
  - Uyarılar (eksik tarih, isim, kayıt yok vb.): sarı / kehribar tonlu arka plan.
  - Hatalar (içe aktarma / format / özellik kullanılamıyor vb.): kırmızı tonlu arka plan.
- Böylece kullanıcıya gösterilen tüm geri bildirimler, tarayıcı pop-up'ı yerine uygulamanın kendi temasıyla bütünleşik bir şekilde iletilmiş oldu.

### v14 – Kayıtlı Mesailer Tablosuna Sıra Numarası Sütunu
- Kayıtlı Mesailer tablosuna, her bir mesai kaydını 1'den başlayarak sıralayan bir **"#" sütunu** eklendi.
- Tablo başlığına sıra numarasını gösteren yeni bir sütun eklendi ve boş liste durumunda da sütun sayısı buna göre güncellendi.
- Artık kullanıcılar, her mesai kaydını 1, 2, 3... şeklinde numaralandırılmış olarak görebiliyor; bu numaralar yalnızca ekrandaki tabloya özeldir, CSV/TXT dışa aktarma formatı değiştirilmemiştir.

### v13 – TXT İçe/Dışa Aktarım Kontrolleri ve Login Bilgilendirmesi
- TXT içe aktarma sırasında, eğer kayıtlı mesailer listesi **boşsa**, dışarıdan gelen tüm veriler otomatik olarak içeri aktarılır.
- Kayıtlı mesailer mevcutsa, TXT içe aktarma sırasında her kayıt tek tek kontrol edilir; aynı olan kayıtlar tekrar eklenmez.
- TXT dışa aktarma / Notlara Gönder işlemi sırasında, eğer listede hiç kayıt yoksa kullanıcıya “Lütfen önce mesai kaydı ekleyiniz.” uyarısı gösterilir.
- Login ekranında, kullanıcının daha önce bu cihazda kayıtlı olduğu kullanıcı adı küçük bir bilgi satırı olarak gösterilir.

### v12 – Masaüstü, Tablet ve Mobil İçin Responsive İyileştirmeler
- Bootstrap 5 grid yapısı korunarak, tüm ana kartlar (`login`, `Aktif Kullanıcı`, `Mesai Hesaplama`, `Kayıtlı Mesailer`) küçük ekranlarda tam genişlikte, tablet ve masaüstünde ise dengeli kolon yapısında gösterilecek şekilde ayarlandı.
- `mesai-shell`, `mesai-navbar` ve `mesai-table-wrapper` için ek medya sorguları tanımlanarak telefon, tablet ve geniş ekranlarda boşluklar ve yükseklikler optimize edildi.
- Küçük ekranlarda kart köşeleri ve tipografi boyutları biraz daha kompakt hale getirildi; büyük ekranlarda içerik 1100px civarında bir maksimum genişlik ile ortalanarak okunabilirlik artırıldı.
- Tüm bu iyileştirmeler yalnızca CSS düzeyinde yapıldığı için, uygulamanın mevcut fonksiyonelliği (login, kayıt, TXT/CSV içe-dışa aktarma, notlara gönderme) aynen korunarak farklı cihazlarda daha tutarlı bir görünüm elde edilmesi sağlandı.

---

Bu doküman, hem gelecekte bu projeyi geliştirecek olanlar için, hem de günlük kullanımda davranışın anlaşılması için **tek referans noktası** olarak tasarlanmıştır.  

Gerekirse ilerleyen sürümlerde daha detaylı teknik notlar ve örnek JSON / CSV / TXT çıktıları da eklenebilir.

### v11 – Login Arayüzü Sadeleştirme ve TXT İçe Aktarım Kontrolü
- Login ekranı sadeleştirildi; artık yalnızca **kullanıcı adı** ve **kod** alanları bulunuyor. Telefon alanı ve kayıtlı kullanıcılar listesi arayüzden kaldırıldı.
- `currentUserLabel` sadece "Aktif Kullanıcı" kartında kullanılır hale getirildi; hesaplama ekranında aktif kullanıcının adı daha tutarlı şekilde gösterilir.
- TXT içe aktarma fonksiyonu, içeri aktarılan kayıtları mevcut listeyle karşılaştırarak yinelenen kayıtları eklemiyor.
- Aynı olan kayıtlar için kullanıcıya, hangi kayıtların zaten mevcut olduğu bilgisini satır satır içeren bir özet mesaj gösteriliyor.
- Yeni eklenen kayıt sayısı ayrıca kullanıcıya bildirilerek (ör. "TXT'den 8 yeni kayıt eklendi.") içe aktarma işlemi şeffaf hale getirildi.

### v10 – Not Defteri Çıktısı ve README Yeniden Yazımı
- “Notlara Gönder” fonksiyonu aktif kullanıcının **ad, kod ve telefon bilgilerini** metnin başına ekleyecek şekilde güncellendi.
- Gece vardiyası açıklama metninde örnek aralık **23:59–06:00** olarak revize edildi.
- README.md baştan sona yeniden yazıldı; tüm önemli mimari ve akış detayları net şekilde dokümante edildi.

### v9 – Kayıtlı Mesailer Buton Yerleşimi
- “Tüm Kayıtları Sil”, “TXT İçe Aktar”, “Notlara Gönder”, “TXT Olarak Dışa Aktar” butonları kart başlığının sağına alındı.
- Kayıt tablosu kart gövdesinin alt kısmında, butonlardan bağımsız bir blok olarak konumlandırıldı.

### v8 – Tek Sayfa Yapısı (SPA)
- `login.html` içeriği `index.html` içine taşındı (SPA düzenine geçildi).
- `#loginSection` ve `#mainContent` bölümleri ile görünürlük kontrollü yapı kuruldu.
- PWA `start_url` değeri `index.html` olarak güncellendi.

### v7 – Login Akışı ve Geri Dön Davranışı
- Giriş ekranı ile hesaplama ekranı arasındaki yönlendirmeler stabilize edildi.
- “Geri Dön (Girişe)” butonunun güvenilir şekilde login ekranına dönmesi sağlandı.

### v6 – Tek Kullanıcı Odaklı Giriş
- Bir cihazda tek “ana kullanıcı” mantığı getirildi.
- Farklı bir isimle giriş denendiğinde uyarı verilip engellenmesi sağlandı.
- Kullanıcı listesi sadece bilgi amaçlı gösterilir hale getirildi.

### v5 – Kayıt Kartı ve Buton Düzeni
- Kayıtlı Mesailer kartı içindeki tablo ve aksiyonlar tek kartta toplandı.
- Kart başlığı, toplam süre etiketi ve buton stilleri limon yeşili tema ile uyumlu hale getirildi.

### v3 – PWA ve Kayıt Tablosu Kontrastı
- PWA temelleri eklendi (`manifest.json`, `service-worker.js`).
- Kayıtlı Mesailer tablosu koyu tema ile uyumlu hale getirildi.
- Satır ve yazı renkleri iyileştirildi, beyaz arka plan problemi giderildi.
