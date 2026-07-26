
Fast-TerminalX (disingkat **Ftermx**) adalah aplikasi tunnel SSH yang berjalan di lingkungan Node.js.

📋 Prasyarat

Pastikan Anda telah memenuhi persyaratan berikut sebelum menjalankan Ftermx:

- **Node.js** dan **npm** terinstal di sistem Anda
- **SSH client** terinstal

🛠 Instalasi SSH

Jika SSH belum terinstal, jalankan perintah berikut:

```bash
sudo apt install openssh-client
```

> *Catatan:* Perintah di atas untuk distribusi Linux berbasis Debian/Ubuntu. Untuk sistem operasi lain, sesuaikan dengan package manager masing-masing.

📦 Instalasi Ftermx

Instal Ftermx secara global menggunakan npm:
```bash
npm install -g f-termx
```

🚀 Cara Menjalankan Ftermx

```bash
ftermx start
```

Setelah instalasi selesai, jalankan Ftermx dengan:
ftermx
Untuk memulai server:
ftermx start
Pilih salah satu opsi yang tersedia:
- `local`
- `ngrok` 
- `serveo.net`

Butuh bantuan? Ketik:
```bash
ftermx -help
```

## 👑 Akses Admin
Kami menyediakan panel admin di tools ini.

Contoh perintah untuk menambah user:
```bash
ftermx add user
```
Setelah itu isi konfigurasi yang diminta, atau masuk ke halaman Admin Panel dan tambahkan user sesuai kebutuhan.

📄 Lisensi

[Apache License 2.0](LICENSE)

---

*Dibuat dengan ❤️ oleh FarelDev*

<table>
  <tr>
    <td align="center">
      <a href="https://trakteer.id/farel_alfarez" target="_blank">
        <img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Trakteer FarelDev" width="200" />
      </a>
    </td>
    <td align="center">
      <a href="https://farelsite.pages.dev" target="_blank">
        <img src="https://img.shields.io/badge/Kunjungi_Farelsite-0056D2?style=for-the-badge&logo=google-chrome&logoColor=white" alt="Kunjungi" />
      </a>
    </td>
  </tr>
</table>
