import { useLocation } from "./lib/router";
import { getTenant } from "./lib/store";
import Home from "./pages/Home";
import MenuPage from "./pages/Menu";
import OwnerPage from "./pages/Owner";
import AdminPage from "./pages/Admin";

export default function App() {
  const { path, search } = useLocation();
  const [, section, slug] = path.split("/");
  if (section === "admin") return <AdminPage />;

  if ((section === "m" || section === "owner") && slug && getTenant(slug)) {
    if (section === "m") {
      const table = new URLSearchParams(search).get("t") ?? "";
      return <MenuPage key={slug} slug={slug} table={table} />;
    }
    return <OwnerPage key={slug} slug={slug} />;
  }
  return <Home />;
}
