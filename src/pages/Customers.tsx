import { useQuery } from "@tanstack/react-query";
import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

interface Customer {
  id: number;
  name: string;
  phone: string;
  email: string;
  address: string;
}

interface CustomersResponse {
  data: Customer[];
  total: number;
  page: number;
  lastPage: number;
}

const Customers: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");

  const { data } = useQuery<CustomersResponse>({
    queryKey: ["customers", currentPage, itemsPerPage, searchQuery],
    queryFn: async () => {
      const response = await api.get(
        `/customers?page=${currentPage}&limit=${itemsPerPage}${
          searchQuery ? `&search=${searchQuery}` : ""
        }`
      );
      return response.data;
    },
  });

  const customersMemo = useMemo(() => {
    if(!data) return [];
    return data?.data;
  }, [data]);

  const totalItemsMemo = useMemo(() => {
    if(!data) return 0;
    return data?.total;
  }, [data]);

  const totalPagesMemo = useMemo(() => {
    if(!data) return 0;
    return data?.lastPage;
  }, [data]);

  const handleNextPage = () => {
    if (data && currentPage < data.lastPage) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleItemsPerPageChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setItemsPerPage(Number(event.target.value));
    setCurrentPage(1);
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    setCurrentPage(1);
  };

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">
          Daftar Pelanggan
        </h1>

        <div className="flex justify-between items-center mb-6">
          <div className="w-1/2">
            <div className="relative rounded-md shadow-sm">
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearch}
                placeholder="Cari berdasarkan nama atau email pelanggan..."
                className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-4 pr-12 sm:text-sm border-gray-300 rounded-md py-2"
              />
            </div>
          </div>
          <div>
            <Link
              to="/customers/new"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Tambah Pelanggan Baru
            </Link>
          </div>
        </div>

        <div className="mt-8 flex flex-col">
          <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                      >
                        Nama
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                      >
                        Telepon
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                      >
                        Email
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                      >
                        Alamat
                      </th>
                      <th
                        scope="col"
                        className="relative py-3.5 pl-3 pr-4 sm:pr-6"
                      >
                        <span className="sr-only">Aksi</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {customersMemo?.map((customer) => (
                      <tr key={customer.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          {customer.name}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {customer.phone}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {customer.email}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {customer.address}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <Link
                            to={`/customers/${customer.id}`}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Lihat
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <nav
                  className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6"
                  aria-label="Pagination"
                >
                  <div className="hidden sm:block">
                    <p className="text-sm text-gray-700">
                      Menampilkan{" "}
                      <span className="font-medium">
                        {(currentPage - 1) * itemsPerPage + 1}
                      </span>{" "}
                      hingga{" "}
                      <span className="font-medium">
                        {Math.min(currentPage * itemsPerPage, totalItemsMemo)}
                      </span>{" "}
                      dari <span className="font-medium">{totalItemsMemo}</span>{" "}
                      hasil
                    </p>
                  </div>
                  <div className="flex items-center">
                    <div className="flex items-center">
                      <label
                        htmlFor="items-per-page"
                        className="text-sm font-medium text-gray-700 mr-2"
                      >
                        Per halaman:
                      </label>
                      <select
                        id="items-per-page"
                        name="items-per-page"
                        className="w-auto pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        value={itemsPerPage}
                        onChange={handleItemsPerPageChange}
                      >
                        {[1, 5, 10, 20, 50, 100].map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center ml-3">
                      <span className="text-sm text-gray-700 mr-2">
                        Halaman{" "}
                        <span className="font-medium">{currentPage}</span> dari{" "}
                        <span className="font-medium">{totalPagesMemo}</span>
                      </span>
                      <button
                        onClick={handlePrevPage}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center rounded-l-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Sebelumnya</span>
                        {"<"}
                      </button>
                      <button
                        onClick={handleNextPage}
                        disabled={currentPage === totalPagesMemo}
                        className="relative -ml-px inline-flex items-center border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Berikutnya</span>
                        {">"}
                      </button>
                      <button
                        onClick={() => setCurrentPage(totalPagesMemo)}
                        disabled={currentPage === totalPagesMemo}
                        className="relative -ml-px inline-flex items-center rounded-r-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Terakhir</span>
                        {">>"}
                      </button>
                    </div>
                  </div>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Customers;
