import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import HomeScreen from './components/HomeScreen';
import AddRecord from './components/AddRecord';
import MedicalAnalysis from './components/MedicalAnalysis';
import MedicalRecords from './components/MedicalRecords';
import './App.css'

function ProfileView() {
  const { profileId } = useParams();
  const [profile, setProfile] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get(`http://localhost:8000/api/profiles/${profileId}/`);
        setProfile(response.data);
      } catch (error) {
        console.error('Error fetching profile:', error);
        navigate('/');
      }
    };
    fetchProfile();
  }, [profileId, navigate]);

  if (!profile) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return <MedicalRecords profile={profile} />;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/profile/:profileId" element={<ProfileView />} />
        <Route path="/add-record/:profileId" element={<AddRecord />} />
        <Route path="/medical-analysis/:profileId/:recordId" element={<MedicalAnalysis />} />
      </Routes>
    </Router>
  );
}

export default App;
