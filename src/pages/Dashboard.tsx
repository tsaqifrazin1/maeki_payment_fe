import { Card, CardContent, FormControl, Grid, InputLabel, MenuItem, Select, Typography } from "@mui/material";
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip
} from "chart.js";
import React, { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import api from "../services/api";
import { formatRupiah } from "../utils/numberFormat";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface DailyPayment {
  day: string;
  total: number;
  date: string;
}

const Dashboard: React.FC = () => {
  const [dailyPayments, setDailyPayments] = useState<DailyPayment[]>([]);
  const [monthlyTransactions, setMonthlyTransactions] = useState<number>(0);
  const [selectedMonthlyYear, setSelectedMonthlyYear] = useState(new Date().getFullYear());
  const [selectedMonthlyMonth, setSelectedMonthlyMonth] = useState(new Date().getMonth() + 1);
  const [selectedDailyYear, setSelectedDailyYear] = useState(new Date().getFullYear());
  const [selectedDailyMonth, setSelectedDailyMonth] = useState(new Date().getMonth() + 1);
  const [selectedDailyWeek, setSelectedDailyWeek] = useState<string | number>("");
  const [loading, setLoading] = useState(true);

  const getWeeksInMonth = (year: number, month: number) => {
    const weeks = [];
    const firstDayOfMonth = new Date(year, month - 1, 1);
    const lastDayOfMonth = new Date(year, month, 0);

    let currentWeekStart = new Date(firstDayOfMonth);
    const dayOfWeek = currentWeekStart.getDay(); // 0-Minggu, 1-Senin, ..., 6-Sabtu

    // Sesuaikan ke hari Senin dari minggu yang berisi hari pertama bulan tersebut.
    // Jika firstDayOfMonth adalah Senin (1), diffToMonday akan 0.
    // Jika firstDayOfMonth adalah Minggu (0), perlu mundur 6 hari ke Senin sebelumnya.
    // Selain itu (Selasa-Sabtu, 2-6), perlu mundur (dayOfWeek - 1) hari ke Senin.
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    currentWeekStart.setDate(currentWeekStart.getDate() - diffToMonday);

    let weekNum = 1;

    // Loop melalui minggu. Loop berlanjut selama awal minggu saat ini
    // sebelum atau pada hari Minggu dari minggu terakhir yang mengandung bagian dari bulan yang dipilih.
    const endLoopDate = new Date(lastDayOfMonth);
    endLoopDate.setDate(lastDayOfMonth.getDate() + (7 - (lastDayOfMonth.getDay() === 0 ? 7 : lastDayOfMonth.getDay()))); // Pergi sampai hari Minggu dari minggu terakhir yang mengandung lastDayOfMonth

    while (currentWeekStart <= endLoopDate) {
      const currentWeekEnd = new Date(currentWeekStart);
      currentWeekEnd.setDate(currentWeekEnd.getDate() + 6);

      // Periksa apakah minggu saat ini (currentWeekStart hingga currentWeekEnd)
      // memiliki tumpang tindih dengan bulan yang dipilih (firstDayOfMonth hingga lastDayOfMonth)
      if (currentWeekStart <= lastDayOfMonth && currentWeekEnd >= firstDayOfMonth) {
        // Tentukan tanggal awal dan akhir yang sebenarnya untuk label dalam minggu yang dipilih
        // labelStart dan labelEnd akan mencakup tanggal dari bulan sebelumnya/sesudahnya jika minggu melintasi batas bulan.
        const labelStart = currentWeekStart;
        const labelEnd = currentWeekEnd;

        const startLabel = labelStart.toLocaleString('id-ID', { day: 'numeric', month: 'short' });
        const endLabel = labelEnd.toLocaleString('id-ID', { day: 'numeric', month: 'short' });

        weeks.push({ num: weekNum, label: `Minggu ${weekNum} (${startLabel} - ${endLabel})` });
      }

      currentWeekStart.setDate(currentWeekStart.getDate() + 7);
      weekNum++;
    }
    return weeks;
  };

  const weeksInSelectedMonth = getWeeksInMonth(selectedDailyYear, selectedDailyMonth);

  useEffect(() => {
    if (weeksInSelectedMonth.length > 0 && selectedDailyWeek === "") {
      setSelectedDailyWeek(weeksInSelectedMonth[0].num); // Otomatis pilih minggu pertama jika belum ada pilihan
    } else if (weeksInSelectedMonth.length === 0) {
      setSelectedDailyWeek(""); // Kosongkan jika tidak ada minggu
    }
  }, [selectedDailyYear, selectedDailyMonth, weeksInSelectedMonth]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [dailyResponse, monthlyResponse] = await Promise.all([
        api.get(`/receipts/daily-payments?year=${selectedDailyYear}&month=${selectedDailyMonth}${selectedDailyWeek ? `&weekNumber=${selectedDailyWeek}` : ''}`),
        api.get(`/receipts/monthly-transactions?year=${selectedMonthlyYear}&month=${selectedMonthlyMonth}`),
      ]);
      setDailyPayments(dailyResponse.data);
      setMonthlyTransactions(monthlyResponse.data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedMonthlyYear, selectedMonthlyMonth, selectedDailyYear, selectedDailyMonth, selectedDailyWeek]);

  const handleMonthlyYearChange = (event: any) => {
    setSelectedMonthlyYear(event.target.value);
  };

  const handleMonthlyMonthChange = (event: any) => {
    setSelectedMonthlyMonth(event.target.value);
  };

  const handleDailyYearChange = (event: any) => {
    setSelectedDailyYear(event.target.value);
    setSelectedDailyWeek("");
  };

  const handleDailyMonthChange = (event: any) => {
    setSelectedDailyMonth(event.target.value);
    setSelectedDailyWeek("");
  };

  const handleDailyWeekChange = (event: any) => {
    setSelectedDailyWeek(event.target.value);
  };

  const dailyChartData = {
    labels: dailyPayments.map((p) => {
      const [year, month, day] = p.date.split('-');
      return `${p.day} (${day}/${month})`;
    }),
    datasets: [
      {
        label: "Total Pembayaran",
        data: dailyPayments.map((p) => p.total),
        backgroundColor: "rgba(75, 192, 192, 0.6)",
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 1,
      },
    ],
  };

  const dailyChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: false,
        text: "Pembayaran Harian",
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            let label = context.dataset.label || "";
            if (label) {
              label += ": ";
            }
            label += formatRupiah(context.raw as number, false);
            return label;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: {
          autoSkip: false,
        }
      },
      y: {
        beginAtZero: true,
        ticks: {
          callback: function (value: any) {
            return formatRupiah(value as number, false);
          },
          stepSize: 500_000,
        },
      },
    },
  };

  const monthlyChartData = {
    labels: [`${new Date(selectedMonthlyYear, selectedMonthlyMonth - 1).toLocaleString("id-ID", { month: "long" })} ${selectedMonthlyYear}`],
    datasets: [
      {
        label: "Total Transaksi",
        data: [monthlyTransactions],
        backgroundColor: "rgba(153, 102, 255, 0.6)",
        borderColor: "rgba(153, 102, 255, 1)",
        borderWidth: 1,
      },
    ],
  };

  const monthlyChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: false,
        text: "Transaksi Bulanan",
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            let label = context.dataset.label || "";
            if (label) {
              label += ": ";
            }
            label += context.raw;
            return label;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 5,
        },
      },
      x: {
        // Tidak perlu penyesuaian khusus untuk sumbu x karena hanya ada satu label
      }
    },
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Typography variant="h4" className="mb-6">
        Dashboard
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <div className="flex justify-between items-center mb-4">
                <Typography variant="h6">
                  Pembayaran Harian
                </Typography>
                <div className="flex gap-4">
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Tahun</InputLabel>
                    <Select
                      value={selectedDailyYear}
                      label="Tahun"
                      onChange={handleDailyYearChange}
                    >
                      {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                        <MenuItem key={year} value={year}>
                          {year}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Bulan</InputLabel>
                    <Select
                      value={selectedDailyMonth}
                      label="Bulan"
                      onChange={handleDailyMonthChange}
                    >
                      <MenuItem value={1}>Januari</MenuItem>
                      <MenuItem value={2}>Februari</MenuItem>
                      <MenuItem value={3}>Maret</MenuItem>
                      <MenuItem value={4}>April</MenuItem>
                      <MenuItem value={5}>Mei</MenuItem>
                      <MenuItem value={6}>Juni</MenuItem>
                      <MenuItem value={7}>Juli</MenuItem>
                      <MenuItem value={8}>Agustus</MenuItem>
                      <MenuItem value={9}>September</MenuItem>
                      <MenuItem value={10}>Oktober</MenuItem>
                      <MenuItem value={11}>November</MenuItem>
                      <MenuItem value={12}>Desember</MenuItem>
                    </Select>
                  </FormControl>
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Minggu</InputLabel>
                    <Select
                      value={selectedDailyWeek}
                      label="Minggu"
                      onChange={handleDailyWeekChange}
                      disabled={weeksInSelectedMonth.length === 0}
                    >
                      {weeksInSelectedMonth.length === 0 ? (
                        <MenuItem value="">Tidak ada minggu</MenuItem>
                      ) : (
                        weeksInSelectedMonth.map((week) => (
                          <MenuItem key={week.num} value={week.num}>
                            {week.label}
                          </MenuItem>
                        ))
                      )}
                    </Select>
                  </FormControl>
                </div>
              </div>
              <div className="h-64">
                <Bar data={dailyChartData} options={dailyChartOptions} />
              </div>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <div className="flex justify-between items-center mb-4">
                <Typography variant="h6">
                  Transaksi Bulanan
                </Typography>
                <div className="flex gap-4">
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Bulan</InputLabel>
                    <Select
                      value={selectedMonthlyMonth}
                      label="Bulan"
                      onChange={handleMonthlyMonthChange}
                    >
                      <MenuItem value={1}>Januari</MenuItem>
                      <MenuItem value={2}>Februari</MenuItem>
                      <MenuItem value={3}>Maret</MenuItem>
                      <MenuItem value={4}>April</MenuItem>
                      <MenuItem value={5}>Mei</MenuItem>
                      <MenuItem value={6}>Juni</MenuItem>
                      <MenuItem value={7}>Juli</MenuItem>
                      <MenuItem value={8}>Agustus</MenuItem>
                      <MenuItem value={9}>September</MenuItem>
                      <MenuItem value={10}>Oktober</MenuItem>
                      <MenuItem value={11}>November</MenuItem>
                      <MenuItem value={12}>Desember</MenuItem>
                    </Select>
                  </FormControl>
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Tahun</InputLabel>
                    <Select
                      value={selectedMonthlyYear}
                      label="Tahun"
                      onChange={handleMonthlyYearChange}
                    >
                      {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                        <MenuItem key={year} value={year}>
                          {year}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </div>
              </div>
              <div className="h-64">
                <Bar data={monthlyChartData} options={monthlyChartOptions} />
              </div>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </div>
  );
};

export default Dashboard;
