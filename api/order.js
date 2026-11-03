export default async function handler(req, res) {
  // Hanya izinkan metode POST
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Metode tidak diizinkan' });
  }

  // Ambil data yang dikirim dari form website
  const { kode_produk, no_tujuan, nama, kontak, harga_jual } = req.body;

  // Ambil kunci rahasia dari Environment Variables Vercel
  const username = process.env.OK_USERNAME;
  const password = process.env.OK_PASSWORD;
  const ipCenter = process.env.OK_IP_CENTER; 
  const appsScriptUrl = process.env.APPS_SCRIPT_URL;

  try {
    // 1. Susun data untuk dikirim ke OkeConnect
    const params = new URLSearchParams();
    params.append('username', username);
    params.append('password', password);
    params.append('produk', kode_produk);
    params.append('tujuan', no_tujuan);
    params.append('refID', 'WEB-' + Date.now());

    // 2. Tembak API OkeConnect
    const response = await fetch(ipCenter, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString()
    });

    // 3. Baca respons dari OkeConnect (berjaga-jaga jika formatnya bukan JSON)
    const textData = await response.text();
    let dataOke;
    
    try {
        dataOke = JSON.parse(textData);
    } catch (err) {
        // Jika OkeConnect mengembalikan teks biasa (bukan JSON)
        dataOke = { status: "error", message: textData };
    }

    // 4. Simpan riwayat transaksi ke Google Sheets (via Apps Script)
    await fetch(appsScriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nama: nama,
        kontak: kontak,
        kode_produk: kode_produk,
        no_tujuan: no_tujuan,
        harga_jual: harga_jual,
        ref_id: dataOke.refID || 'WEB-' + Date.now()
      })
    });

    // 5. Kembalikan jawaban ke website pengguna
    return res.status(200).json({
      success: true,
      message: 'Pesanan berhasil diproses',
      data: dataOke
    });

  } catch (error) {
    console.error('Error Sistem:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server',
      error: error.message
    });
  }
}
