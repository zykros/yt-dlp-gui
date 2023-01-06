import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import { Stack, Button } from '@mui/material';
import YouTubeDL from './Core/YouTubeDL';
import icon from '../../assets/icon.svg';
import './App.css';

const Routing = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<YouTubeDL />} />
      </Routes>
    </Router>
  );
};

export default Routing;
