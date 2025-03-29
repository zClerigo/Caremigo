import React from 'react';
import { Link } from 'react-router-dom';

const MedicalRecords = ({ profile, onBack }) => {
  return (
    <div className="min-h-screen w-full bg-gray-100 flex flex-col">
      <div className="w-full px-8 py-8 flex-grow">
        <div className="flex items-center mb-8">
          <button
            onClick={onBack}
            className="bg-blue-800 text-white px-6 py-2 rounded-lg mr-4 hover:bg-blue-900 transition-colors"
          >
            Back to Profiles
          </button>
          <h1 className="text-4xl font-bold text-black">
            Medical Records for {profile.name}
          </h1>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-semibold text-black">Profile Information</h2>
            <Link 
              to="/add-record"
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add New Record
            </Link>
          </div>
          
          <div className="mb-8">
            <p className="text-gray-700 mb-2">Name: {profile.name}</p>
            <p className="text-gray-700">Relationship: {profile.relationship}</p>
          </div>

          <h2 className="text-2xl font-semibold mb-6 text-black">Medical Records</h2>
          {profile.medical_records && profile.medical_records.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {profile.medical_records.map((record) => (
                <div key={record.id} className="bg-gray-50 border rounded-lg p-6">
                  <h3 className="text-xl font-semibold mb-3 text-black">{record.title}</h3>
                  <p className="text-gray-700 mb-4">{record.description}</p>
                  {record.image && (
                    <div className="mb-4">
                      <img 
                        src={record.image} 
                        alt={record.title}
                        className="w-full h-48 object-contain rounded-lg"
                      />
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-500">
                      Last updated: {new Date(record.updated_at).toLocaleDateString()}
                    </p>
                    <Link 
                      to="/medical-analysis"
                      state={{ image: record.image, imageData: record.image_data }}
                      className="text-blue-500 hover:text-blue-700 text-sm"
                    >
                      Analyze Record
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">No medical records available for this profile.</p>
              <Link 
                to="/add-record"
                className="inline-block bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Add Your First Record
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MedicalRecords; 