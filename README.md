# Vibe Coding Backend API

## Tentang Aplikasi Ini
Aplikasi ini adalah *backend server* yang menyediakan fungsionalitas REST API untuk manajemen pengguna, termasuk registrasi, login, autentikasi berbasis sesi (*session token*), mendapatkan informasi profil terkini (*current user*), dan logout. Proyek ini dibangun dengan ringan dan cepat menggunakan *environment runtime* **Bun**.

## Technology Stack & Library
- **Runtime**: [Bun](https://bun.sh/)
- **Framework Web**: [ElysiaJS](https://elysiajs.com/)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **Dabatase**: MySQL
- **Library Tambahan**: 
  - `mysql2`: Driver koneksi database MySQL.
  - `bun test`: Framework *unit testing* bawaan Bun untuk pengujian skenario.

## Struktur Arsitektur dan Folder
Aplikasi ini menggunakan pola arsitektur *Separation of Concerns* untuk memisahkan fungsionalitas HTTP (*router*) dengan *business logic*.

- `src/` : Kumpulan *source code* utama aplikasi.
  - `routes/` : Tempat mendefinisikan seluruh *router/endpoint* API (contoh: `users-route.ts`). Fokus utamanya adalah validasi rute HTTP.
  - `services/` : Tempat menjabarkan logika bisnis (contoh: `users-service.ts`). Kode di dalam modul ini yang akan berinteraksi langsung dengan sistem dan database, bisa dipanggil oleh *routes*.
  - `db/` : Tempat inisiasi utilitas database (`index.ts`) dan penjabaran tabel arsitektur ORM (`schema.ts`).
  - `index.ts` : File *entry point* (titik awal) aplikasi yang melakukan deklarasi dan menjalankan peladen (server) ElysiaJS.
- `tests/` : Tempat file *unit testing* dari tiap API berada (contoh: `user.test.ts`).
- `drizzle.config.ts` : File untuk menyimpan konfigurasi *schema deployment* ORM (migrasi / perbaruan).

## Skema Database
Sistem ini terdiri dari dua tabel utama (*relational*) yang diatur melalui Drizzle:

1. **Table `users`**
   - `id`: INT (Primary key, Serial / *auto-increment*)
   - `name`: VARCHAR(255)
   - `email`: VARCHAR(255) (*Unique*, tidak boleh duplikat)
   - `password`: VARCHAR(255) (Tersimpan sebagai hashing)
   - `created_at`: TIMESTAMP (*Default Now*)

2. **Table `sessions`**
   - `id`: INT (Primary key, Serial / *auto-increment*)
   - `token`: VARCHAR(255)
   - `userId`: BIGINT (Foreign key yang direlasikan dengan `users.id`)
   - `created_at`: TIMESTAMP (*Default Now*)

## API Endpoints Server
Berikut daftar API yang dilayani:

- `GET /` : Endpoint pengecekan status server (*healthcheck* - mengembalikan status "ok").
- `GET /users` : Mengambil atau mengecek seluruh data tabel `users` untuk administrasi atau debug sederhana.
- `POST /api/users` : Registrasi *user* baru menggunakan data `name`, `email` dan `password`.
- `POST /api/users/login` : Login dengan kredensial `email` dan `password` untuk menghasilkan Token Sesi (tersimpan ke tabel `sessions`).
- `GET /api/users/current` : Mendapatkan detail data penggguna yang sedang masuk akses (harus menyisipkan Header `Authorization: <token_session>`).
- `DELETE /api/users/logout` : Logout akses (*delete token session*) untuk profil saat ini (menyisipkan Header validasi mirip di atas).

## Cara Setup Project
1. Pastikan Anda sudah menginstall `bun` di mesin Anda, serta tersedia sistem *database MySQL* lokal.
2. Tarik kode (*clone*) repository ke mesin komputer Anda.
3. Lakukan instalasi semua *dependencies* via terminal:
   ```bash
   bun install
   ```
4. Salin file *environment variables* template:
   ```bash
   cp .env.example .env
   ```
   *Lalu buka file `.env` untuk menyesuaikan variabel `DATABASE_URL` sesuai dengan *credential* database MySQL Anda.*
5. Lakukan migrasi *schema* Drizzle secara dorongan otomatis agar terbentuk di DB Anda:
   ```bash
   bun run db:push
   ```

## Cara Menjalankan Aplikasi
Jika proses instalasi dan sinkronisasi DB sudah berhasil, terminal siap menjalankan *runtime local server*.
Jalankan aplikasi ini dalam mode *development* (*auto-watch/reload*):
```bash
bun run dev
```
Secara otomatis peladen aktif di `http://localhost:3000` (atau port env yang dikonfigurasi).

## Cara Menjalankan Test
Aplikasi ini sudah terlindungi menggunakan integrasi pelacak bawaan `bun test`. Setiap memulai tes, sistem dirancang untuk menghapus (*setup/tear down*) sisa *users* dan *sessions* agar database bersih demi konsistensi setiap skenario pengujian.

Untuk mengeksekusi tes, cukup jalankan:
```bash
bun test
```

Bisa pula mengkhususkan nama file seperti:
```bash
bun test tests/user.test.ts
```
