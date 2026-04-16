# Issue: Implementasi Unit Test untuk API Backend

## Deskripsi Tugas
Tugas kamu (Gemini 3 Flash) adalah mengimplementasikan **Unit Test** menggunakan framework **bun test** untuk semua endpoint API yang ada di aplikasi ini. Tes yang ditulis harus komprehensif, mencakup skenario *success* (berhasil) maupun skenario gagal (*error handling*).

## Aturan dan Panduan Utama
1. **Lokasi File**: Semua file pengujian (testing) harus disimpan di dalam folder terpisah bernama `tests`.
2. **Framework**: Gunakan fungsionalitas bawaan dari `bun test` untuk eksekusi maupun penulisan assert.
3. **Konsistensi State (Data Cleanup)**: **Sangat Penting!** Pada setiap awal dan akhir skenario (misalnya menggunakan mekanisme `beforeEach` atau *setup block* per-skenario), pastikan kamu menghapus seluruh data pada tabel terkait (seperti `users` dan `sessions`). Ini untuk menjaga agar setiap eksekusi tes berjalan dalam state database yang bersih, konsisten, dan tidak bergantung pada tes lainnya.
4. **Detail Implementasi**: Bebas. Dokumen ini hanya memberikan daftar skenario secara *high level*. Silakan tulis dan implementasikan kode detail HTTP Request-nya secara terstruktur (misal memanfaatkan `app.handle(new Request(...))` dari instance Elysia).

## Daftar Skenario Pengujian Minimum

Berikut adalah skenario utama yang harus dipastikan aman oleh *test suite*:

### 1. Registrasi User (`POST /api/users`)
- **[Success]** Sistem berhasil melakukan registrasi *user* baru dengan kelengkapan data yang valid (nama, email, password).
- **[Error]** Sistem menolak pendaftaran jika email yang dipakai sudah terdaftar dalam sistem (harus menghasilkan *bad request*).
- **[Error]** Sistem menolak permintaan jika *input payload* melanggar skema perbatasan yang ada (contoh: panjang `name` atau karakter melebihi *maxLength* 255 karakter, atau format email invalid).

### 2. Login User (`POST /api/users/login`)
- **[Success]** Sistem berhasil mengautentikasi pengguna dan mengembalikan sebuah *Token Session* untuk login yang valid.
- **[Error]** Sistem menolak proses login jika pengguna memasukkan email yang belum terdaftar.
- **[Error]** Sistem menolak proses login jika antara email benar namun memasukkan password yang salah.

### 3. Get Current User (`GET /api/users/current`)
- **[Success]** Dapat mengambil informasi/profil pengguna secara sukses dengan melampirkan token valid lewat *Header Authorization*.
- **[Error]** Akses diblokir / mengembalikan `Unauthorized` jika permintaan sama sekali tidak menyertakan Header Authorization yang valid.
- **[Error]** Akses diblokir / mengembalikan `Unauthorized` jika menyertakan token namun *token session* itu sendiri tidak terdaftar/salah/sudah dihapus.

### 4. Logout User (`DELETE /api/users/logout`)
- **[Success]** Pengguna berhasil dihapus sesi amannya setelah *logout*. (Pastikan bahwa memanggil *logout* ini betul-betul menghapus kaitan token di tabel `sessions`).
- **[Success]** Bersifat *Idempotent*: Saat pengguna me-logout dua kali pada token yang sudah pernah di-*logout*, sistem sebaiknya tidak melempar tipe 500 error, melainkan tetap memproses secara standar.
- **[Error]** Gagal logout akibat tiadanya validasi Token, dan server merespons kelayakan 401.

### 5. API Umum & Pemeriksaan Standar (`GET /` dan `GET /users`)
- **[Success]** Pastikan *ping* server membalas status "ok".
- **[Success]** Pastikan mekanisme *fetch API* baca data untuk Endpoint list users berjalan tanpa *delay* internal error walau saat kondisi DB kosong.

Tugas kamu adalah merealisasikan semua list poin periksa di atas menjadi format barisan sintaks `describe()` dan `it()` / `test()` yang fungsional di lingkungan Bun.
