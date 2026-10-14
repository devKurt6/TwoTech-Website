import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "../hooks/useAuth";
import SEO from "../components/SEO";
import RequireAdmin from "./RequireAdmin";
import Login from "./Login";
import AdminLayout from "./AdminLayout";
import Dashboard from "./Dashboard";
import Products from "./Products";
import Settings from "./Settings";
import Inbox from "./Inbox";
export default function AdminRoutes() {
  return (
    <AuthProvider>
      <SEO title="Admin" />
      <Routes>
        <Route path="login" element={<Login />} />
        <Route element={<RequireAdmin />}>
          <Route element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="products" element={<Products />} />
            <Route path="inbox" element={<Inbox />} />
            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<p>Admin page not found.</p>} />
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  );
}
