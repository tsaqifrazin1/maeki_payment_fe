import { Button } from '@mui/material';
import { format } from 'date-fns';
import debounce from "lodash/debounce";
import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import api from "../services/api";
import { formatRupiah } from "../utils/numberFormat";

interface ReceiptItem {
  name: string;
  unitPrice: number;
  quantity: number;
  total: number;
}

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
}

const CreateReceipt: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const isEditMode = Boolean(id);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<ReceiptItem[]>([
    { name: "", unitPrice: 0, quantity: 1, total: 0 },
  ]);
  const [formData, setFormData] = useState({
    customerEmail: "",
    customerName: "",
    customerPhone: "",
    customerAddress: "",
    orderDetails: "",
    date: format(new Date(), 'yyyy-MM-dd'),
    isPaid: false,
  });

  useEffect(() => {
    if (isEditMode) {
      fetchReceipt();
    }
  }, [isEditMode]);

  const fetchReceipt = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/receipts/${id}?token=${token}`);
      const receipt = response.data;
      
      // Set form data
      setFormData({
        customerEmail: receipt.customer.email,
        customerName: receipt.customer.name,
        customerPhone: receipt.customer.phone,
        customerAddress: receipt.customer.address,
        orderDetails: receipt.orderDetails,
        date: format(new Date(receipt.date), 'yyyy-MM-dd'),
        isPaid: receipt.isPaid,
      });

      // Set items
      if (receipt.items && receipt.items.length > 0) {
        setItems(receipt.items.map((item: any) => ({
          name: item.name,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          total: item.total,
        })));
      }
    } catch (error) {
      console.error("Error fetching receipt for edit:", error);
    } finally {
      setLoading(false);
    }
  };

  const getCustomerByEmail = useRef(
    debounce(async (email: string) => {
      if (email.length < 5) return;

      try {
        const response = await api.get(`/customers/search?email=${email}`);
        if (response.data) {
          const customer: Customer = response.data;
          setFormData((prev) => ({
            ...prev,
            customerName: customer.name,
            customerPhone: customer.phone,
            customerAddress: customer.address,
          }));
        }
      } catch (error) {
        console.log("Customer tidak ditemukan");
      }
    }, 500)
  ).current;

  const calculateTotal = (items: ReceiptItem[]) => {
    return items.reduce((sum, item) => sum + item.total, 0);
  };

  const handleItemChange = (
    index: number,
    field: keyof ReceiptItem,
    value: string | number
  ) => {
    let processedValue = value;
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      [field]: processedValue,
      total:
        field === "unitPrice" || field === "quantity"
          ? Number(
              field === "unitPrice" ? processedValue : newItems[index].unitPrice
            ) *
            Number(
              field === "quantity" ? processedValue : newItems[index].quantity
            )
          : newItems[index].total,
    };
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { name: "", unitPrice: 0, quantity: 1, total: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleChange = async (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "customerEmail") {
      getCustomerByEmail(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEditMode) {
        await api.patch(`/receipts/${id}`, {
          ...formData,
          items,
          totalAmount: calculateTotal(items),
        });
      } else {
        await api.post("/receipts", {
          ...formData,
          items,
          totalAmount: calculateTotal(items),
        });
      }
      navigate("/receipts");
    } catch (error) {
      console.error("Error saving receipt:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaid = async () => {
    try {
      setLoading(true);
      await api.patch(`/receipts/${id}`, {
        isPaid: true
      });
      navigate(`/receipts/${id}?token=${token}`);
    } catch (error) {
      console.error("Error marking receipt as paid:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">
            {isEditMode ? 'Ubah Nota' : 'Buat Nota Baru'}
          </h1>
          {isEditMode && !formData.isPaid && (
            <Button
              variant="contained"
              color="success"
              onClick={handleMarkAsPaid}
              disabled={loading}
            >
              Tandai Lunas
            </Button>
          )}
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="mt-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
              <div className="md:grid md:grid-cols-3 md:gap-6">
                <div className="md:col-span-1">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">
                    Informasi Pelanggan
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Masukkan email pelanggan (minimal 5 karakter). Jika email
                    sudah terdaftar, data pelanggan akan otomatis terisi.
                  </p>
                </div>
                <div className="mt-5 md:mt-0 md:col-span-2">
                  <div className="grid grid-cols-6 gap-6">
                    <div className="col-span-6 sm:col-span-3">
                      <label
                        htmlFor="customerEmail"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Email
                      </label>
                      <input
                        type="email"
                        name="customerEmail"
                        id="customerEmail"
                        required
                        minLength={5}
                        value={formData.customerEmail}
                        onChange={handleChange}
                        className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>

                    <div className="col-span-6 sm:col-span-3">
                      <label
                        htmlFor="customerName"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Nama
                      </label>
                      <input
                        type="text"
                        name="customerName"
                        id="customerName"
                        required
                        value={formData.customerName}
                        onChange={handleChange}
                        className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>

                    <div className="col-span-6 sm:col-span-3">
                      <label
                        htmlFor="customerPhone"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Telepon
                      </label>
                      <input
                        type="tel"
                        name="customerPhone"
                        id="customerPhone"
                        required
                        value={formData.customerPhone}
                        onChange={handleChange}
                        className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>

                    <div className="col-span-6">
                      <label
                        htmlFor="customerAddress"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Alamat
                      </label>
                      <input
                        type="text"
                        name="customerAddress"
                        id="customerAddress"
                        required
                        value={formData.customerAddress}
                        onChange={handleChange}
                        className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
              <div className="md:grid md:grid-cols-3 md:gap-6">
                <div className="md:col-span-1">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">
                    Detail Nota
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Masukkan detail pesanan dan item-item yang dibeli.
                  </p>
                </div>
                <div className="mt-5 md:mt-0 md:col-span-2">
                  <div className="grid grid-cols-6 gap-6">
                    <div className="col-span-6">
                      <label
                        htmlFor="orderDetails"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Detail Pesanan
                      </label>
                      <textarea
                        id="orderDetails"
                        name="orderDetails"
                        rows={3}
                        value={formData.orderDetails}
                        onChange={handleChange}
                        required
                        className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>

                    <div className="col-span-6 sm:col-span-3">
                      <label
                        htmlFor="date"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Tanggal
                      </label>
                      <input
                        type="date"
                        name="date"
                        id="date"
                        value={formData.date}
                        onChange={handleChange}
                        required
                        className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
              <div className="md:grid md:grid-cols-3 md:gap-6">
                <div className="md:col-span-1">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">
                    Item
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Tambahkan item-item yang dibeli.
                  </p>
                </div>
                <div className="mt-5 md:mt-0 md:col-span-2">
                  <div className="space-y-4">
                    {items.map((item, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-12 gap-4 items-end"
                      >
                        <div className="col-span-4">
                          <label className="block text-sm font-medium text-gray-700">
                            Nama
                          </label>
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) =>
                              handleItemChange(index, "name", e.target.value)
                            }
                            required
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2.5 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Harga Satuan
                          </label>
                          <div className="mt-1 relative rounded-md shadow-sm flex">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <span className="text-gray-500 sm:text-sm">
                                Rp
                              </span>
                            </div>
                            <input
                              type="number"
                              value={formatRupiah(item.unitPrice, false)}
                              onChange={(e) => {
                                // Hanya izinkan angka
                                let val = e.target.value.replace(/[^0-9]/g, "");
                                // Hapus leading zero
                                val = val.replace(/^0+(?!$)/, "");
                                // Jika kosong, set ke 0
                                if (val === "") val = "0";
                                handleItemChange(index, "unitPrice", val);
                              }}
                              min="1"
                              className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-8 pr-3 sm:text-sm border-gray-300 rounded-md py-2.5"
                            />
                          </div>
                        </div>
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Jumlah
                          </label>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => {
                              // Hanya izinkan angka
                              let val = e.target.value.replace(/[^0-9]/g, "");
                              // Hapus leading zero
                              val = val.replace(/^0+(?!$)/, "");
                              // Jika kosong, set ke 0
                              if (val === "") val = "0";
                              handleItemChange(index, "quantity", val);
                            }}
                            required
                            min="1"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2.5 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          />
                        </div>
                        <div className="col-span-3">
                          <label className="block text-sm font-medium text-gray-700">
                            Total
                          </label>
                          <div className="mt-1 relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <span className="text-gray-500 sm:text-sm">
                                Rp
                              </span>
                            </div>
                            <input
                              type="text"
                              value={formatRupiah(item.total, false)}
                              readOnly
                              className="bg-gray-50 focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-8 pr-3 sm:text-sm border-gray-300 rounded-md py-2.5"
                            />
                          </div>
                        </div>
                        <div className="col-span-1">
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          >
                            <svg
                              className="h-5 w-5"
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-between items-center">
                      <button
                        type="button"
                        onClick={addItem}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Tambah Item
                      </button>
                      <div className="text-right">
                        <span className="text-sm font-medium text-gray-500">
                          Total Jumlah:
                        </span>
                        <span className="ml-2 text-lg font-semibold text-gray-900">
                          {formatRupiah(calculateTotal(items))}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
              <div className="md:grid md:grid-cols-3 md:gap-6">
                <div className="md:col-span-1">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">
                    Total Biaya yang Sudah Dibayarkan
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Masukkan total biaya yang sudah dibayarkan.
                  </p>
                </div>
                <div className="mt-5 md:mt-0 md:col-span-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Biaya yang Sudah Dibayarkan
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm flex">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">Rp</span>
                        </div>
                        <input
                          type="number"
                          value={formatRupiah(formData.isPaid ? calculateTotal(items) : 0, false)}
                          onChange={(e) => {
                            // Hanya izinkan angka
                            let val = e.target.value.replace(/[^0-9]/g, "");
                            // Hapus leading zero
                            val = val.replace(/^0+(?!$)/, "");
                            // Jika kosong, set ke 0
                            if (val === "") val = "0";
                            e.target.value = val;
                            handleChange(e);
                          }}
                          name="isPaid"
                          className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-8 pr-3 sm:text-sm border-gray-300 rounded-md py-2.5"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Biaya yang Akan Dibayarkan
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm flex">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">Rp</span>
                        </div>
                        <input
                          type="number"
                          value={formatRupiah(
                            calculateTotal(items) - (formData.isPaid ? calculateTotal(items) : 0),
                            false
                          )}
                          readOnly
                          className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-8 pr-3 sm:text-sm border-gray-300 rounded-md py-2.5"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 md:mt-0 md:col-span-2">
                    <div className="grid grid-cols-1 gap-4 mt-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Total Biaya
                        </label>
                        <div className="mt-1 relative rounded-md shadow-sm flex">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">Rp</span>
                          </div>
                          <input
                            type="number"
                            value={formatRupiah(calculateTotal(items), false)}
                            readOnly
                            className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-8 pr-3 sm:text-sm border-gray-300 rounded-md py-2.5"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => navigate("/receipts")}
                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {loading ? "Menyimpan..." : isEditMode ? "Simpan Perubahan" : "Buat Nota"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateReceipt;
