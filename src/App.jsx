import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import AnimeDetailPage from './pages/AnimeDetailPage'; 
import AddAnimePage from './pages/AddAnimePage';
import EditAnimePage from './pages/EditAnimePage'; 
import Layout from './components/Layout';
import './App.css'; 

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          
          <Route path="anime/:id" element={<AnimeDetailPage />} />
          <Route path="add" element={<AddAnimePage />} />
          <Route path="anime/editar/:id" element={<EditAnimePage />} />

        </Route>
      </Routes>
    </Router>
  );
}

export default App;