# 🏛️ Latince Ekinoks (Aequinoctium Latinum)

> **İstanbul Üniversitesi Edebiyat Fakültesi Eski Yunan Dili ve Edebiyatı Anabilim Dalı**  
> **Latince Gramer 3** Dersi (Doç. Dr. Ekin Öyken) İçin Özel Olarak Tasarlanmış Dijital Latince Kelime & Flashcard Platformu

---

## 🌟 Proje Amacı ve Özellikleri

Bu platform, Belçika'daki **LASLA** (*Laboratoire d'Analyse Statistique des Langues Anciennes*) verileri kullanılarak **Dickinson College Commentaries (DCC)** tarafından derlenen ve Klasik Latince metinlerde en sık geçen **997 kelimeyi** (Frequency Rank #1 - #997) modern, interaktif ve pedagojik bir sistemle ezberlemenizi sağlar.

### ✨ Temel Yetenekler:
1. **Çift Dilli (Bilingual) Görünüm Sistemi**:
   - 🇹🇷 **Sadece Türkçe**: İ.Ü. mezunları **Mert İnan** ve **Emin Çomoğlu** tarafından hazırlanan resmi Türkçe çeviri.
   - 🇬🇧 **Sadece İngilizce**: Orijinal Dickinson College Commentaries sözlük karşılıkları.
   - 🇹🇷+🇬🇧 **Yan Yana (Side-by-Side)**: Hem Türkçe hem İngilizce karşılıkları aynı anda yan yana görerek nüansları anında kavrayabilme.
2. **20'şerli 50 Set Halinde Flashcard (Bilgi Kartları)**:
   - Sıklık sırasına göre 20'şerli 50 sete bölünmüştür (#1-20, #21-40 ... #381-400 [Dönem Hedefi Sınırı] ... #981-997).
   - **Çift Yönlü Mod**: Latince ➔ Anlam veya Anlam ➔ Latince çalışma seçeneği.
   - 3D kart çevirme animasyonu, klavye kısayolları (`Boşluk`, `Oklar`, `1: Biliyorum`, `2: Tekrar`), mobilde dokunmatik sağa/sola kaydırma (swipe) ve Latince sesletim/telaffuz dinleme.
3. **🎯 Dönem Hedefi (İlk 400 Kelime) Takipçisi**:
   - Ekin Hoca'nın belirttiği *"Dönem sonuna kadar hedefimiz 400 kelime"* amacına odaklı özel takip paneli, % ilerleme göstergesi ve ilk 20 setin durum takibi.
4. **📖 Tek Tıkla Logeion (Lewis & Short / Gaffiot) Entegrasyonu**:
   - Her sözcüğün kartında ve listesinde Chicago Üniversitesi Logeion sözlüğündeki ilgili lemma maddesine doğrudan açılan hızlı bağlantı.
5. **📝 4 Şıklı Çoktan Seçmeli Test (Quiz) Modu**:
   - Her set için aynı sözcük türlerinden oluşturulan akıllı çeldiricilere sahip mini sınav motoru.
6. **⭐ Zorlandıklarım & Favoriler**:
   - Kartlarda veya listede yıldızlanan ya da "Tekrar Et" denilen kelimeleri toplayıp özel flashcard destesi olarak çalışabilme.
7. **🎨 3 Klasik Tema**:
   - 📜 *Klasik Parşömen (Parchment)* (Filolojik el yazması atmosferi)
   - 🌙 *Dark Academia (Gece Modu)* (Koyu lacivert/antrasit göz yormayan tonlar)
   - ☀️ *Açık / Modern*
8. **📱 %100 Mobil ve Masaüstü Uyumlu (Responsive & PWA Ready)**:
   - Masaüstünde tam klavye desteği ve çok sütunlu görünüm.
   - Mobilde ergonomik alt menü (Bottom Navigation Bar) ve dokunmatik hareketler.
   - Sıfır sunucu gereksinimi: İnternetsiz (çevrimdışı) dahi çalışır.

---

## 🚀 GitHub Pages Üzerinde Yayınlama Rehberi

Site tamamen statik dosyalardan (`index.html`, `css/`, `js/`, `data/`) oluştuğu için GitHub Pages üzerinde 1 dakikada yayına alınabilir:

1. **GitHub'da yeni bir repository açın** (Örn: `latince-ekinoks`).
2. Bu klasördeki tüm dosyaları o repository'ye yükleyin:
   ```bash
   git init
   git add .
   git commit -m "İlk sürüm: Latince Ekinoks"
   git branch -M main
   git remote add origin https://github.com/KULLANICI_ADINIZ/latince-ekinoks.git
   git push -u origin main
   ```
3. GitHub reponuzda **Settings (Ayarlar) > Pages** sekmesine gidin.
4. **Branch** kısmından `main` ve `/ (root)` seçip **Save** butonuna tıklayın.
5. 1-2 dakika içinde siteniz `https://KULLANICI_ADINIZ.github.io/latince-ekinoks/` adresinde canlıya geçecektir!

---

## 💻 Bilgisayarda Yerel Olarak Çalıştırma

Herhangi bir sunucu kurulumu yapmadan doğrudan `index.html` dosyasını tarayıcınızda (Chrome, Edge, Safari, Firefox) çift tıklayarak açabilirsiniz.

Dilerseniz basit bir yerel sunucu da başlatabilirsiniz:
```powershell
# PowerShell üzerinden:
python -m http.server 8000
# veya npx serve
```
Ardından tarayıcınızda `http://localhost:8000` adresini açabilirsiniz.

---

## 📚 Kaynakça ve Teşekkür

- **Veri Tabanı:** [Dickinson College Commentaries - Latin Core Vocabulary](https://dcc.dickinson.edu/latin-core-list1) (LASLA verileri)
- **Türkçe Çeviri:** Mert İnan & Emin Çomoğlu (İstanbul Üniversitesi Eski Yunan Dili ve Edebiyatı Mezunları)
- **Sözlük Altyapısı:** [Logeion - University of Chicago](https://logeion.uchicago.edu/) (Lewis & Short, Gaffiot)
- **Ders & İlham:** Doç. Dr. Ekin Öyken (İstanbul Üniversitesi Latince Gramer 3)
