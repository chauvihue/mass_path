import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { UserProvider } from './context/UserContext';
import { Home } from './pages/Home';
import { Camera } from './pages/Camera';
import { Results } from './pages/Results';
import { History } from './pages/History';
import { Profile } from './pages/Profile';
import { MenuBrowserPage } from './pages/MenuBrowser';

function App() {
  return (
    <UserProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/camera" element={<Camera />} />
          <Route path="/results" element={<Results />} />
          <Route path="/history" element={<History />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/menu" element={<MenuBrowserPage />} />
        </Routes>
      </Router>
    </UserProvider>
  );
}

export default App;

