// Fungsi untuk memformat tanggal menjadi format yang diinginkan
export function formatDate(date: Date | string): string {
  const d = new Date(date);
  const day = d.getDate();
  const month = d.getMonth();
  const year = d.getFullYear();
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  return `${day} ${monthNames[month]} ${year}`;
} 