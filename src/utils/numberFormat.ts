// Fungsi untuk memformat angka dengan pemisah ribuan (3 digit)
export function formatRupiah(value: number | string, withPrefix: boolean = true): string {
  const number = typeof value === 'string' ? parseInt(value, 10) : value;
  if (isNaN(number)) return withPrefix ? 'Rp 0' : '0';
  return (
    (withPrefix ? 'Rp ' : '') + number.toLocaleString('id-ID')
  );
} 