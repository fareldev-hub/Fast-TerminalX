![Dev Ftermx](thumbnail/thumb.png)

## Informasi
Fast-TerminalX (disingkat **Ftermx**) adalah aplikasi tunnel SSH yang berjalan di lingkungan Node.js.

Pastikan Anda telah memenuhi persyaratan berikut sebelum menjalankan Ftermx:
- **Nodejs** - **SSH client**  dan **npm** terinstal di sistem Anda

## Instalasi SSH

Jika SSH belum terinstal, jalankan perintah berikut:

```bash
sudo apt install openssh-client
```

> *Catatan:* Perintah di atas untuk distribusi Linux berbasis Debian/Ubuntu. Untuk sistem operasi lain, sesuaikan dengan package manager masing-masing.

## Instalasi Ftermx

Instal Ftermx secara global menggunakan npm:
```bash
npm install -g f-termx
```

![Install Ftermx](doc/step1.png)


Setelah instalasi selesai, jalankan perintah :
```bash
ftermx
```
Maka tampilannya akan menjadi seperti gambar ini
![Menu](doc/step2.png)


untuk memulai Ftermx Ketik perintah :
```bash
ftermx start
```

![start](doc/step4.png)
Pilih salah satu opsi yang tersedia:
- `local`
- `ngrok` 

Untuk memilih gunakan tombol panah atas/bawah pada keyboard komputer anda

Jika selesai masukkan port (pastikan gunakan port yang belum di jalankan di komputer anda)
![port](doc/step5.png)

Jika selesai hasilnya akan terlihat seperti gambar berikut ;
![result](doc/step6.png)

untuk menjalankan servernya buka tab browser anda dan masukkan alamat localhost anda pada pencarian browser contohnya seperti :

```bash
localhost:1010
```

**PENJELASAN** sesuaikan localhost dengan port yang anda telah input 

Butuh bantuan? Ketik:
```bash
ftermx -help
```

## Akses Admin
Kami menyediakan panel admin di tools ini.

Contoh perintah untuk menambah user:
```bash
ftermx add user
```
Setelah itu isi konfigurasi yang diminta, atau masuk ke halaman Admin Panel dan tambahkan user sesuai kebutuhan.

## Halaman ftermx
saat pertama kali masuk ke website anda harus login terlebih dahulu :
![image](doc/step7.png)

Jika anda belum menambahkan user ke dalam ftermx isi dengan informasi berikut :

Untuk username : 
```bash
Admin
```
untuk password
```bash
admin
```

## Dokumentasi Halaman ftermx
![image](doc/step8.png)

**Akses terminal**
![image](doc/step9.png)

**Install Paket yang di inginkan**
![image](doc/step10.png)

**Admin Panel**
![image](doc/step11.png)

**File Manager**
![image](doc/step12.png)

**Informasi**

![npm downloads](https://img.shields.io/npm/dt/f-termx) ![npm versions](https://img.shields.io/npm/v/f-termx?label=versions)

**Lisensi**
[Apache License 2.0](LICENSE)

---

*Dibuat dengan ❤️ oleh FarelDev*

<a href="https://saweria.co/farelalfareza">
  <img src="https://img.shields.io/badge/donate-FF5C00?style=for-the-badge" />
</a>

<a href="https://farelsite.pages.dev">
  <img src="https://img.shields.io/badge/_Web_Developer-0056D2?style=for-the-badge&logo=googlechrome" />
</a>

<a href="https://trakteer.id/farel_alfarez">
  <img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" width="200" />
</a>