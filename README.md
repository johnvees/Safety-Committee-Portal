# 📋 Findings Management System v2

Sistem manajemen temuan & audit multi-halaman. Dibangun dengan **React + React Router + Vite + Tailwind CSS** dan **json-server** sebagai REST API backend.

---

## 🎯 Fitur Utama

### Dari Manajemen:
- ✅ **Deadline & Notifikasi** — Setiap temuan punya target deadline, notifikasi otomatis ke manajemen (overdue, approaching deadline)
- ✅ **Follow-up Berkelanjutan** — Tracking progress berkala dengan catatan timeline per temuan
- ✅ **Seluruh Area Bisa Lihat** — Dashboard menampilkan breakdown per area, semua departemen akses sama
- ✅ **Guideline & Rekomendasi** — Setiap temuan bisa dilengkapi panduan agar tidak terulang di area lain. Halaman khusus untuk browse semua guideline
- ✅ **Cost Tracking** — Estimasi biaya, biaya aktual, catatan biaya, laporan dengan tabel perbandingan

### Fitur Sistem:
- ✅ CRUD Temuan lengkap (nama, jenis, prioritas, area, pelapor, PIC)
- ✅ Upload foto dokumentasi
- ✅ Checklist tindakan (centang langsung)
- ✅ Auto-hide temuan selesai ke Arsip
- ✅ Diskusi per temuan (nama, jabatan, timestamp)
- ✅ Search & filter berdasarkan jenis
- ✅ 6 halaman terpisah dengan React Router

---

## 📄 Halaman

| Halaman | Path | Deskripsi |
|---------|------|-----------|
| Dashboard | `/` | Ringkasan statistik, breakdown kategori, area, overdue |
| Temuan | `/findings` | List temuan aktif + CRUD + checklist + diskusi |
| Detail | `/findings/:id` | Detail lengkap temuan individual |
| Arsip | `/archive` | Temuan selesai (otomatis tersembunyi) |
| Biaya | `/costs` | Laporan estimasi vs realisasi biaya |
| Guideline | `/guidelines` | Panduan & rekomendasi grouped by kategori |
| Notifikasi | `/notifications` | Alert deadline, overdue, status update |

---

## 📦 Prasyarat

- **Node.js** versi 18+ → https://nodejs.org/
- **npm** (otomatis ikut Node.js)

---

## 🚀 Instalasi

```bash
# 1. Masuk ke folder project
cd findings-project

# 2. Install dependencies
npm install

# 3. Jalankan (React + json-server sekaligus)
npm start
```

Buka browser → `http://localhost:3000`

---

## 🛠️ Menjalankan Terpisah (Opsional)

```bash
# Terminal 1 — Backend
npx json-server --watch db.json --port 3001

# Terminal 2 — Frontend
npm run dev
```

---

## 📁 Struktur Project

```
findings-project/
├── db.json                          ← Database (json-server)
├── package.json
├── vite.config.js
├── tailwind.config.js
├── index.html
└── src/
    ├── main.jsx                     ← Entry point
    ├── App.jsx                      ← Router setup
    ├── index.css                    ← Tailwind + animations
    ├── api.js                       ← API helper
    ├── constants.js                 ← Types, priorities, helpers
    ├── context/
    │   └── FindingsContext.jsx      ← Global state management
    ├── components/
    │   ├── Sidebar.jsx              ← Navigation sidebar
    │   ├── Toast.jsx                ← Notification toast
    │   └── DiscussionPanel.jsx      ← Reusable discussion component
    └── pages/
        ├── DashboardPage.jsx        ← Overview & statistik
        ├── FindingsPage.jsx         ← CRUD temuan aktif
        ├── FindingDetailPage.jsx    ← Detail individual temuan
        ├── ArchivePage.jsx          ← Temuan selesai
        ├── CostsPage.jsx            ← Laporan biaya
        ├── GuidelinesPage.jsx       ← Panduan & rekomendasi
        └── NotificationsPage.jsx    ← Alert & notifikasi
```

---

Selamat coding! 🚀
