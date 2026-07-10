import { useState, Suspense } from 'react';
import { useLocation, Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import SearchOverlay from './SearchOverlay';
import CategorySheet from './CategorySheet';
import Footer from './Footer';

function LoadingScreen() {
  return (
    <div className="route-loading" role="status" aria-live="polite">
      <span className="loading-spinner" />
      <span>Loading game…</span>
    </div>
  );
}

export default function Layout() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const location = useLocation();
  const favoritesActive = location.pathname === '/' && location.search.includes('sort=favorites');

  return (
    <div className="app-layout">
      <a className="skip-link" href="#main-content">Skip to main content</a>

      <Sidebar />
      <div className="main-content">
        <Navbar onSearchClick={() => setSearchOpen(true)} />
        <main className="page-container" id="main-content" tabIndex="-1">
          <Suspense fallback={<LoadingScreen />}>
            <Outlet />
          </Suspense>
        </main>
        <Footer />
      </div>

      <BottomNav
        onCategoriesClick={() => setCategoriesOpen(true)}
        onSearchClick={() => setSearchOpen(true)}
        favoritesActive={favoritesActive}
      />

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
      <CategorySheet open={categoriesOpen} onClose={() => setCategoriesOpen(false)} />
    </div>
  );
}
