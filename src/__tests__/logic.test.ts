/**
 * Utility/helper function tests
 * These tests don't rely on DOM or Next.js - they test pure logic functions.
 */

// --- Test: Kalkulasi Kasir ---
describe('Kalkulator Kasir', () => {
  const hitungNetTotal = (cash: number, transfer: number, qris: number, expense: number) => {
    return (cash + transfer + qris) - expense;
  };

  it('harus menghitung Net Total dengan benar', () => {
    expect(hitungNetTotal(1000000, 500000, 200000, 150000)).toBe(1550000);
  });

  it('Net Total tidak boleh negatif jika expense lebih kecil dari gross', () => {
    const result = hitungNetTotal(500000, 0, 0, 300000);
    expect(result).toBeGreaterThanOrEqual(0);
  });

  it('Net Total harus 0 jika semua nilai adalah 0', () => {
    expect(hitungNetTotal(0, 0, 0, 0)).toBe(0);
  });
});

// --- Test: Saldo Cuti ---
describe('Kalkulasi Saldo Cuti', () => {
  const hitungSaldoCuti = (total: number, used: number) => {
    return total - used;
  };

  it('harus menghitung saldo cuti dengan benar', () => {
    expect(hitungSaldoCuti(12, 3)).toBe(9);
  });

  it('saldo cuti yang sudah habis harus bernilai 0', () => {
    expect(hitungSaldoCuti(12, 12)).toBe(0);
  });
});

// --- Test: Persentase KPI ---
describe('Kalkulasi KPI', () => {
  const hitungPersentaseKPI = (current: number, target: number): number => {
    if (target === 0) return 0;
    return Math.min(Math.round((current / target) * 100), 100);
  };

  it('harus menghitung persentase KPI dengan benar', () => {
    expect(hitungPersentaseKPI(75, 100)).toBe(75);
  });

  it('KPI tidak boleh melebihi 100%', () => {
    expect(hitungPersentaseKPI(120, 100)).toBe(100);
  });

  it('KPI dengan target 0 harus mengembalikan 0 (tidak boleh error)', () => {
    expect(hitungPersentaseKPI(50, 0)).toBe(0);
  });
});

// --- Test: Format Stok Gudang ---
describe('Validasi Stok Gudang', () => {
  const isStokRendah = (current: number, minStock: number): boolean => {
    return current <= minStock;
  };

  it('harus mendeteksi stok rendah dengan benar', () => {
    expect(isStokRendah(5, 10)).toBe(true);
    expect(isStokRendah(10, 10)).toBe(true);
    expect(isStokRendah(15, 10)).toBe(false);
  });
});
