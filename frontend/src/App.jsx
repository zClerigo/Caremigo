import { useState } from 'react'
import HomeScreen from './components/HomeScreen'
import MedicalRecords from './components/MedicalRecords'
import './App.css'

function App() {
  const [selectedProfile, setSelectedProfile] = useState(null);

  const handleProfileSelect = (profile) => {
    setSelectedProfile(profile);
  };

  const handleBack = () => {
    setSelectedProfile(null);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {selectedProfile ? (
        <MedicalRecords profile={selectedProfile} onBack={handleBack} />
      ) : (
        <HomeScreen onProfileSelect={handleProfileSelect} />
      )}
    </div>
  )
}

export default App
