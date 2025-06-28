import React from 'react';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import CreateCustomer from './pages/CreateCustomer';
import CreateReceipt from './pages/CreateReceipt';
import CustomerDetail from './pages/CustomerDetail';
import Customers from './pages/Customers';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import ReceiptDetail from './pages/ReceiptDetail';
import Receipts from './pages/Receipts';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token } = useAuth();
  return token ? <>{children}</> : <Navigate to="/login" />;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/customers"
            element={
              <PrivateRoute>
                <Layout>
                  <Customers />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/customers/new"
            element={
              <PrivateRoute>
                <Layout>
                  <CreateCustomer />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/customers/:id"
            element={
              <PrivateRoute>
                <Layout>
                  <CustomerDetail />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/receipts"
            element={
              <PrivateRoute>
                <Layout>
                  <Receipts />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/receipts/new"
            element={
              <PrivateRoute>
                <Layout>
                  <CreateReceipt />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/receipts/:id"
            element={
              <PrivateRoute>
                <Layout>
                  <ReceiptDetail />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/receipts/edit/:id"
            element={
              <PrivateRoute>
                <Layout>
                  <CreateReceipt />
                </Layout>
              </PrivateRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
