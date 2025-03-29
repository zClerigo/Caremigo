import React from 'react';

const MedicalRecords = ({ profile, onBack }) => {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <div className="container mx-auto px-4 py-8 flex-grow">
        <div className="flex items-center mb-8">
          <button
            onClick={onBack}
            className="bg-gray-500 text-white px-6 py-2 rounded-lg mr-4 hover:bg-gray-600 transition-colors"
          >
            Back to Profiles
          </button>
          <h1 className="text-4xl font-bold text-black">
            Medical Records for {profile.name}
          </h1>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-semibold mb-6 text-black">Profile Information</h2>
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
                  <p className="text-sm text-gray-500">
                    Last updated: {new Date(record.updated_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">No medical records available for this profile.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MedicalRecords; 