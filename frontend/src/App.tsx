import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import ProductPage from "./pages/ProductPage";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import ImportPage from "./pages/ImportPage";
import NewImportPage from "./pages/NewImportPage";
import ImportDetailPage from "./pages/ImportDetailPage";
import InventoryPage from "./pages/InventoryPage";
import InvoicesPage from "./pages/InvoicesPage";
import NewInvoicePage from "./pages/NewInvoicePage";
import InvoiceDetailPage from "./pages/InvoiceDetailPage";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  const isAuthenticated = sessionStorage.getItem("isAuthenticated") === "true";

  return (
    <>
      <Routes>
        <Route
          path="/login"
          element={
            isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />
          }
        />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/products"
          element={
            <ProtectedRoute>
              <ProductPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/imports"
          element={
            <ProtectedRoute>
              <ImportPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/imports/new"
          element={
            <ProtectedRoute>
              <NewImportPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/imports/:id"
          element={
            <ProtectedRoute>
              <ImportDetailPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/inventory"
          element={
            <ProtectedRoute>
              <InventoryPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/invoices"
          element={
            <ProtectedRoute>
              <InvoicesPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/invoices/new"
          element={
            <ProtectedRoute>
              <NewInvoicePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/invoices/:id"
          element={
            <ProtectedRoute>
              <InvoiceDetailPage />
            </ProtectedRoute>
          }
        />
      </Routes>

      <Toaster position="top-right" richColors />
    </>
  );
}

export default App;