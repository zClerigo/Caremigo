import React, { useState, useEffect } from 'react';
import axios from 'axios';

const HomeScreen = ({ onProfileSelect }) => {
  const [profiles, setProfiles] = useState([]);
  const [newProfile, setNewProfile] = useState({ name: '', relationship: '' });
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/profiles/');
      setProfiles(response.data);
    } catch (error) {
      console.error('Error fetching profiles:', error);
    }
  };

  const handleCreateProfile = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:8000/api/profiles/', newProfile);
      setNewProfile({ name: '', relationship: '' });
      setShowForm(false);
      fetchProfiles();
    } catch (error) {
      console.error('Error creating profile:', error);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gray-100 flex flex-col">
      <div className="w-full px-8 py-8 flex-grow">
        <h1 className="text-4xl font-bold mb-8 text-black">Your Profiles</h1>
        
        {showForm && (
          <form onSubmit={handleCreateProfile} className="mb-8 p-6 bg-white rounded-lg shadow-md">
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Name:</label>
              <input
                type="text"
                value={newProfile.name}
                onChange={(e) => setNewProfile({ ...newProfile, name: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Relationship:</label>
              <input
                type="text"
                value={newProfile.relationship}
                onChange={(e) => setNewProfile({ ...newProfile, relationship: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-blue-800 text-white px-6 py-2 rounded hover:bg-blue-900 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-800 text-white px-6 py-2 rounded hover:bg-blue-900 transition-colors"
              >
                Create Profile
              </button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {profiles.map((profile) => (
            <div
              key={profile.id}
              onClick={() => onProfileSelect(profile)}
              className="p-6 bg-white border rounded-lg cursor-pointer hover:shadow-lg transition-shadow"
            >
              <h2 className="text-xl font-semibold mb-2 text-black">{profile.name}</h2>
              <p className="text-gray-600">Relationship: {profile.relationship}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="w-full bg-white border-t">
        <div className="w-full px-8 py-6">
          <button
            onClick={() => setShowForm(!showForm)}
            className="w-full bg-blue-800 text-white px-6 py-3 rounded-lg hover:bg-blue-900 transition-colors"
          >
            {showForm ? 'Cancel' : 'Create New Profile'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomeScreen; 