import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import HomeScreen from './components/HomeScreen'
import MedicalRecords from './components/MedicalRecords'
import AddRecord from './components/AddRecord';
import MedicalAnalysis from './components/MedicalAnalysis';
import './App.css'

function ProfileView({ profile, onBack }) {
  return (
    <div className="min-h-screen bg-gray-100">
      <MedicalRecords profile={profile} onBack={onBack} />
    </div>
  );
}

function App() {
  const [selectedProfile, setSelectedProfile] = useState(null);

  const handleProfileSelect = (profile) => {
    setSelectedProfile(profile);
  };

  const handleBack = () => {
    setSelectedProfile(null);
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <Routes>
          <Route 
            path="/" 
            element={
              selectedProfile ? (
                <ProfileView profile={selectedProfile} onBack={handleBack} />
              ) : (
                <HomeScreen onProfileSelect={handleProfileSelect} />
              )
            } 
          />
          <Route 
            path="/add-record" 
            element={
              selectedProfile ? (
                <AddRecord profile={selectedProfile} onBack={handleBack} />
              ) : (
                <HomeScreen onProfileSelect={handleProfileSelect} />
              )
            } 
          />
          <Route 
            path="/medical-analysis" 
            element={
              selectedProfile ? (
                <MedicalAnalysis onBack={handleBack} />
              ) : (
                <HomeScreen onProfileSelect={handleProfileSelect} />
              )
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
