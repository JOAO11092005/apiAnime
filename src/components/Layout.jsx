import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Zap, PlusSquare } from 'lucide-react';

const Layout = () => {
  return (
    <div className="app-layout">
      <header className="app-header">
        <nav className="container nav-container">
          <Link to="/" className="logo">
            <Zap className="logo-icon" />
            <span>MAXPLAY ANIME</span> 
          </Link>
          <Link to="/add" className="nav-link">
            <PlusSquare size={20} />
            <span>Adicionar Anime</span>
          </Link>
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
      <footer className="app-footer">
        <div className="container">
          <p>MAXPLAY ANIME &copy; 2025. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;