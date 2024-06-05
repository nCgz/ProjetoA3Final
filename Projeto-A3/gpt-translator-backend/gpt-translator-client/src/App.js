import React from 'react';
import './App.css';
import Translate from './Translate';
import Chat from './Chat';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';

function App() {
  return (
    <Router>
      <div className="App">
        <nav>
          <ul>
            <li>
              <Link to="/">Tradutor</Link>
            </li>
            <li>
              <Link to="/chat">Chat Interativo</Link>
            </li>
          </ul>
        </nav>
        <Routes>
          <Route path="/" element={<Translate />} />
          <Route path="/chat" element={<Chat />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
