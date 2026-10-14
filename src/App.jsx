import { lazy, Suspense } from "react";
import Spinner from "./components/Spinner";
const AdminRoutes = lazy(() => import("./admin/routes"));
import DataState from "./components/DataState";
import {
  Routes,
  Route,
  useNavigate,
  useLocation,
  useParams,
} from "react-router-dom";
import { useState, useEffect } from "react";
import Header from "./components/Header";
import Footer from "./components/Footer";
import SEO from "./components/SEO";
import Toast from "./components/Toast";
import EmptyState from "./components/EmptyState";
import { Home } from "./pages/Home";
import { Shop } from "./pages/Shop";
import { Detail } from "./pages/ProductDetail";
import { Services } from "./pages/Services";
import { Booking } from "./pages/Book";
import { Project } from "./pages/Quote";
import { About } from "./pages/About";
import { Cart } from "./pages/Cart";
import { useProducts } from "./hooks/useProducts";
import { useSettings } from "./hooks/useSettings";
import { useCart } from "./hooks/useCart";
import { destinations } from "./routes";
import DemoBanner from "./components/DemoBanner";
import Policy from "./pages/Policy";
function ProductRoute({ products, add }) {
  const { id } = useParams(),
    navigate = useNavigate();
  const p = products.find((p) => String(p.id) === id);
  return p ? (
    <Detail key={id} p={p} add={add} onClose={() => navigate("/shop")} />
  ) : (
    <EmptyState title="Product unavailable">
      <a className="btn bp mt-4" href="/shop">
        Back to shop
      </a>
    </EmptyState>
  );
}
export default function App() {
  const navigate = useNavigate(),
    location = useLocation();
  const products = useProducts(),
    settings = useSettings();
  const reloadProducts = products.reload;
  const cart = useCart(products.data, products.loaded && !products.error);
  const [toast, setToast] = useState("");
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(""), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);
  useEffect(() => {
    scrollTo(0, 0);
    if (location.hash === "#contact")
      setTimeout(() => document.getElementById("contact")?.scrollIntoView(), 0);
  }, [location]);
  useEffect(() => {
    reloadProducts();
  }, [location.pathname, reloadProducts]);
  const go = (p) => navigate(destinations[p] || p);
  const add = (p, n) => {
    cart.add(p, n);
    setToast(p.name + " added to cart");
  };
  const props = {
    go,
    add,
    view: (p) => navigate("/shop/" + p.id),
    products: products.data,
    settings: settings.data,
  };
  if (location.pathname === "/admin" || location.pathname.startsWith("/admin/"))
    return (
      <Suspense fallback={<Spinner />}>
        <Routes>
          <Route
            path="/admin/*"
            element={
              <>
                <DemoBanner />
                <AdminRoutes />
              </>
            }
          />
        </Routes>
      </Suspense>
    );
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:z-50 bg-gold text-ink p-3"
      >
        Skip to content
      </a>
      <SEO
        title={
          (location.pathname.startsWith("/shop/")
            ? products.data.find(
                (p) => String(p.id) === location.pathname.split("/")[2],
              )?.name
            : "") ||
          {
            "/": "Home",
            "/shop": "Shop computer parts",
            "/services": "Services",
            "/services/development": "Custom Development",
            "/privacy": "Privacy Policy",
            "/terms": "Orders & Returns",
            "/book": "Book a service",
            "/quote": "Custom projects",
            "/about": "About & contact",
            "/cart": "Cart & checkout",
          }[location.pathname] ||
          "Page not found"
        }
        settings={settings.data}
      />
      <DataState resource={settings}>
        <DemoBanner />
        <Header count={cart.count} settings={settings.data} />
        <main id="main" className="min-h-[60vh]">
          <Routes>
            <Route
              path="/"
              element={
                <DataState resource={products}>
                  <Home {...props} />
                </DataState>
              }
            />
            <Route
              path="/shop"
              element={
                <DataState resource={products}>
                  <Shop {...props} />
                </DataState>
              }
            />
            <Route
              path="/shop/:id"
              element={
                <DataState resource={products}>
                  <ProductRoute products={products.data} add={add} />
                </DataState>
              }
            />
            <Route
              path="/services/*"
              element={
                <Services
                  go={go}
                  book={(id) => navigate("/book?service=" + id)}
                />
              }
            />
            <Route
              path="/book"
              element={
                <Booking
                  key={location.search}
                  pre={new URLSearchParams(location.search).get("service")}
                  go={go}
                />
              }
            />
            <Route path="/quote" element={<Project go={go} />} />
            <Route path="/about" element={<About go={go} />} />
            <Route path="/privacy" element={<Policy type="privacy" />} />
            <Route path="/terms" element={<Policy type="terms" />} />
            <Route
              path="/cart"
              element={
                <DataState resource={products}>
                  <Cart
                    items={cart.items}
                    setQty={cart.setQty}
                    clear={cart.clear}
                    settings={settings.data}
                  />
                </DataState>
              }
            />
            <Route
              path="*"
              element={
                <div className="max-w-6xl mx-auto p-6">
                  <EmptyState title="Page not found">
                    <p>Let's get you back to Two Tech.</p>
                    <a href="/" className="btn bp mt-4">
                      Back to home
                    </a>
                  </EmptyState>
                </div>
              }
            />
          </Routes>
        </main>
        <Footer settings={settings.data} />
        <Toast message={toast} />
      </DataState>
    </>
  );
}
