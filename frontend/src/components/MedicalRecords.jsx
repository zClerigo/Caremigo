import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const MedicalRecords = ({ profile, onBack }) => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRecords();
  }, [profile.id]);

  const fetchRecords = async () => {
    try {
      const response = await axios.get(`http://localhost:8000/api/profiles/${profile.id}/records/`);
      setRecords(response.data);
    } catch (error) {
      console.error('Error fetching records:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  const handleAddRecord = () => {
    navigate(`/add-record/${profile.id}`);
  };

  const handleAnalyzeRecord = (record) => {
    navigate(`/medical-analysis/${profile.id}/${record.id}`);
  };

  const handleDeleteRecord = async (recordId) => {
    if (window.confirm('Are you sure you want to delete this record? This action cannot be undone.')) {
      try {
        await axios.delete(`http://localhost:8000/api/records/${recordId}/`);
        // Update the records list after deletion
        setRecords(records.filter(record => record.id !== recordId));
      } catch (error) {
        console.error('Error deleting record:', error);
        alert('Failed to delete record');
      }
    }
  };

  return (
    <div className="min-h-screen font-source-sans-pro w-full bg-gray-100 flex flex-col">
      <div className="w-full px-8 py-8 flex-grow">
        <div className="flex items-center mb-8">
          <button
            onClick={handleBack}
            className="bg-blue-800 text-white px-6 py-2 rounded-lg mr-4 hover:bg-blue-900 transition-colors"
          >
            Back to Profiles
          </button>
          <h1 className="text-4xl font-source-sans-pro text-black">
            Medical Records for {profile.name}
          </h1>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-source-sans-pro text-black">Profile Information</h2>
            <button 
              onClick={handleAddRecord}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Upload New Record
            </button>
          </div>
          
          <div className="mb-8">
            <p className="text-gray-700 mb-2">Name: {profile.name}</p>
            <p className="text-gray-700">Relationship: {profile.relationship}</p>
          </div>

          <h2 className="text-2xl font-source-sans-pro mb-6 text-black">Previous Records</h2>
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : records.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {records.map((record) => (
                <div key={record.id} className="bg-gray-50 border rounded-lg p-6">
                  <h3 className="text-xl font-source-sans-pro mb-3 text-black">{record.title}</h3>
                  <p className="text-gray-700 mb-4">{record.description}</p>
                  {record.image && (
                    <div className="mb-4">
                      <img 
                        src={`http://localhost:8000${record.image}`} 
                        alt={record.title}
                        className="w-full h-48 object-contain rounded-lg"
                      />
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-500 font-source-sans-pro">
                        Date: {new Date(record.date).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-500 font-source-sans-pro">
                        Added: {new Date(record.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => handleDeleteRecord(record.id)}
                        className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                      >
                        Delete
                      </button>
                      <button 
                        onClick={() => handleAnalyzeRecord(record)}
                        className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                      >
                        View Analysis
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600 font-source-sans-pro">No medical records available for this profile.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MedicalRecords; 