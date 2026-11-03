export default async function handler(req, res) {
  // Hanya izinkan metode POST
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Metode tidak diizinkan' });
  }

  // Ambil data dari frontend
  const { kode_produk, no_tujuan, nama, kontak, harga_jual } = req.body;

  // Ambil kredensial dari Environment Variables Vercel
  const username = process.env.OK_USERNAME;
  const password = process.env.OK_PASSWORD;
  const apiKey = process.env.OK_APIKEY; // OkeConnect biasanya pakai API Key
  const ipCenter = process.env.OK_IP_CENTER; // URL H2H OkeConnect

  try {
    // 1. Susun parameter untuk OkeConnect
    const params = new URLSearchParams();
    params.append('username', username);
    params.append('password', password);
    params.append('api_key', apiKey);
    params.append('produk', kode_produk);
    params.append('tujuan', no_tujuan);
    params.append('refID', 'WEB-' + Date.now()); // ID unik dari sistem kita

    // 2. Tembak API OkeConnect
    const response = await fetch(ipCenter, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString()
    });

    const data = await response.json();

    // 3. Simpan ke Google Sheets (via Apps Script doPost)
    const appsScriptUrl = process.env.APPS_SCRIPT_URL;
    await fetch(appsScriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nama: nama,
        kontak: kontak,
        kode_produk: kode_produk,
        no_tujuan: no_tujuan,
        harga_jual: harga_jual,
        ref_id: data.refID || 'WEB-' + Date.now()
      })
    });

    // 4. Kembalikan hasil ke website
    return res.status(200).json({
      success: true,
      message: 'Pesanan berhasil diproses',
      data: data
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server',
      error: error.message
    });
  }
}
