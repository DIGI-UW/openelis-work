# Bahasa Indonesia summary — Reagent Usage v1

**For:** #indonesia-openelis
**Length:** ≤ 6 sentences for Slack
**Tone:** "Per our discussion today" — informal-professional

---

## Draft

Halo tim 👋 — sesuai diskusi tadi, ini ringkasan singkat fitur **Reagent Usage v1** untuk Result Entry.

Kita menambahkan satu baris baru bernama **"Reagent"** di panel hasil tes (di antara baris _Methods_ dan baris _Storage_). Analis bisa mencari reagen berdasarkan **nama** atau **nomor lot** dalam satu kotak pencarian, lalu memilih lot (dengan saran FIFO untuk lot terlama yang masih berlaku) dan mengisi **jumlah yang digunakan**. Saat hasil disimpan, sistem otomatis mengurangi stok lot tersebut di modul Reagent Inventory dan mengirim data ke Reagent Forecasting — tidak perlu input manual lagi.

Versi v1 ini sengaja dibuat sederhana dan **opsional** karena katalog tes belum terhubung dengan reagen. Saat hubungan itu sudah dibangun, akan diganti dengan versi v2.1 yang lebih lengkap (dengan daftar reagen per tes). Data dari v1 tidak akan hilang — bentuk event-nya sama persis dengan v2.1.

Issue lengkap di GitHub: **{ISSUE_URL}**
Dokumen FRS, mockup React/Carbon, dan preview HTML sudah saya simpan; bisa kirim langsung kalau mau lihat.

Mohon koreksi kalau ada bagian yang kurang tepat sebelum tim engineering mulai pengerjaan 🙏
