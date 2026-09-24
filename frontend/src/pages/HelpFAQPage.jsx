import React, { useState } from 'react'
import { ChevronDown, HelpCircle, Settings, BookOpen } from 'lucide-react'
import './HelpFAQPage.css'

const FAQ_CATEGORIES = [
  {
    id: 'umum',
    icon: HelpCircle,
    title: 'Bantuan Umum',
    description: 'Pertanyaan dasar tentang aplikasi',
    items: [
      {
        id: 'umum-1',
        question: 'Data keuangan aku aman gak?',
        answer: 'Ya, semua data keuangan anda tersimpan dengan enkripsi tingkat bank. Data hanya tersimpan di server aman dan tidak akan dibagikan ke pihak ketiga tanpa izin anda.'
      },
      {
        id: 'umum-2',
        question: 'Bisa dipakai bareng pasangan/keluarga?',
        answer: 'Ya, fitur "Berdua" memungkinkan anda berbagi akses dengan pasangan. Setiap orang dapat melihat dan menambah transaksi sesuai hak akses yang diberikan.'
      },
      {
        id: 'umum-3',
        question: 'Lupa PIN gimana?',
        answer: 'Anda dapat mereset PIN melalui menu Pengaturan > Keamanan > Reset PIN. Pilih opsi "Lupa PIN" dan ikuti proses verifikasi identitas.'
      },
      {
        id: 'umum-4',
        question: 'Bisa export data ke Excel?',
        answer: 'Ya, di menu Laporan > Export Data, anda dapat mengekspor semua transaksi dalam format Excel (.xlsx) untuk dianalisis lebih lanjut.'
      },
      {
        id: 'umum-5',
        question: 'Cara reset data gimana?',
        answer: 'Reset data dapat dilakukan di Pengaturan > Bantuan > Reset Data. Perhatian: proses ini akan menghapus semua data secara permanen dan tidak dapat dikembalikan.'
      },
      {
        id: 'umum-6',
        question: 'Ganti mata uang akun gimana?',
        answer: 'Pengaturan mata uang dapat diubah di Menu Pengaturan > Regional > Pilih Mata Uang. Aplikasi akan otomatis mengkonversi tampilan nilai dengan mata uang pilihan anda.'
      }
    ]
  },
  {
    id: 'settings',
    icon: Settings,
    title: 'Setting Awal Aplikasi',
    description: 'Cara setup awal dan konfigurasi aplikasi',
    items: [
      {
        id: 'settings-1',
        question: 'Gimana cara daftar & verifikasi pembayaran?',
        answer: 'Untuk daftar: buka app > klik "Daftar" > isi email & password > verifikasi email. Untuk verifikasi pembayaran, pilih metode pembayaran di Pengaturan > Billing > dan ikuti petunjuk verifikasi.'
      },
      {
        id: 'settings-2',
        question: 'Login pertama kali & bikin PIN gimana?',
        answer: 'Setelah login pertama kali, akan muncul halaman setup PIN. Masukkan 6 digit angka yang mudah diingat (hindari 000000 atau 111111). PIN ini digunakan untuk akses cepat ke aplikasi.'
      },
      {
        id: 'settings-3',
        question: 'Cara setup Kantong Uang & kategori Anggaran pertama?',
        answer: 'Di halaman Keuangan, pilih "Tambah Kantong Uang" dan isi nama serta saldo awal. Untuk kategori anggaran, buka Anggaran > Tambah Kategori > isi target bulanan > simpan.'
      },
      {
        id: 'settings-4',
        question: 'Untung/rugi aset masih Rp0, cara update nilainya?',
        answer: 'Buka halaman Aset > pilih aset > klik "Update Nilai Terkini" > masukkan nilai pasar terbaru > simpan. Keuntungan/kerugian akan otomatis terhitung.'
      },
      {
        id: 'settings-5',
        question: 'Cara pakai Alokasi Pendapatan?',
        answer: 'Di menu Keuangan > Alokasi Pendapatan > atur persentase untuk setiap kantong (misal 50% kebutuhan, 20% investasi, 30% gaya hidup). Sistem akan otomatis membagi pendapatan sesuai alokasi.'
      }
    ]
  },
  {
    id: 'howto',
    icon: BookOpen,
    title: 'How-To',
    description: 'Panduan cara menggunakan fitur-fitur',
    items: [
      {
        id: 'howto-1',
        question: 'Cara catat transaksi (manual & scan struk)?',
        answer: 'Manual: Keuangan > + Transaksi > pilih Pemasukan/Pengeluaran > isi detail. Scan Struk: pilih icon kamera > ambil foto struk > sistem otomatis ekstrak data > review & simpan.'
      },
      {
        id: 'howto-2',
        question: 'Cara catat Utang/Piutang?',
        answer: 'Buka menu Keuangan > Hutang > + Hutang Baru > pilih tipe (utang/piutang) > isi nama orang & jumlah > atur tanggal jatuh tempo > sistem akan mengingatkan saat jatuh tempo.'
      },
      {
        id: 'howto-3',
        question: 'Cara pakai Kalkulator Simulasi Cicilan?',
        answer: 'Keuangan > Tools > Kalkulator Cicilan > masukkan jumlah pinjaman, bunga, dan bulan cicilan > sistem akan menampilkan simulasi pembayaran bulanan & total bunga.'
      },
      {
        id: 'howto-4',
        question: 'Cara tambah kategori Anggaran baru?',
        answer: 'Keuangan > Anggaran > + Kategori > isi nama kategori & target bulanan > atur alert threshold > simpan. Kategori akan muncul di form pencatatan transaksi.'
      },
      {
        id: 'howto-5',
        question: 'Cara bikin Goal/Nabung?',
        answer: 'Keuangan > Tujuan Tabungan > + Tujuan Baru > isi nama tujuan (misal: liburan), target nominal, deadline > sistem tracking otomatis progress dengan visualisasi progress bar.'
      },
      {
        id: 'howto-6',
        question: 'Cara pakai Conversation Cards (Berdua)?',
        answer: 'Berdua > Conversation Cards > "Mulai Percakapan" > sistem akan menampilkan pertanyaan menarik untuk pasangan > setiap orang jawab > lihat ringkasan jawaban bersama.'
      },
      {
        id: 'howto-7',
        question: 'Cara tambah Jurnal Keluarga?',
        answer: 'Berdua > Jurnal Keluarga > + Entri Baru > tulis kenangan/catatan hari ini > pilih tanggal & mood > opsional: upload foto > simpan. Jurnal akan tersimpan dengan waktu dan pembuat.'
      },
      {
        id: 'howto-8',
        question: 'Cara pakai Maintenance scheduler?',
        answer: 'Lainnya > Maintenance > + Jadwal Baru > pilih tipe (rumah/kendaraan) > isi detail pekerjaan & interval > sistem akan mengingatkan kapan saatnya maintenance.'
      }
    ]
  }
]

const FAQItem = ({ item, isOpen, onToggle }) => {
  return (
    <div className="faq-item">
      <button className="faq-question" onClick={onToggle}>
        <span>{item.question}</span>
        <ChevronDown size={20} className={`chevron ${isOpen ? 'open' : ''}`} />
      </button>
      {isOpen && (
        <div className="faq-answer">
          {item.answer}
        </div>
      )}
    </div>
  )
}

const HelpFAQPage = () => {
  const [expandedItems, setExpandedItems] = useState({})

  const toggleItem = (itemId) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }))
  }

  return (
    <div className="help-page">
      <div className="page-header">
        <h1>Bantuan & FAQ</h1>
        <p>Panduan setting awal, cara pakai, dan pertanyaan yang sering diajukan.</p>
      </div>

      <div className="faq-categories">
        {FAQ_CATEGORIES.map(category => {
          const Icon = category.icon
          return (
            <div key={category.id} className="faq-category">
              <div className="category-header">
                <div className="category-icon">
                  <Icon size={20} />
                </div>
                <div className="category-info">
                  <h2>{category.title}</h2>
                  <p>{category.description}</p>
                </div>
              </div>

              <div className="faq-list">
                {category.items.map(item => (
                  <FAQItem
                    key={item.id}
                    item={item}
                    isOpen={expandedItems[item.id] || false}
                    onToggle={() => toggleItem(item.id)}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <div className="faq-footer">
        <p>Masih ada pertanyaan lain? Hubungi kami lewat WhatsApp di menu Tentang Pundi.</p>
      </div>
    </div>
  )
}

export default HelpFAQPage
