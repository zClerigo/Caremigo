import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

function MedicalAnalysis() {
  const { profileId, recordId } = useParams();
  const [record, setRecord] = useState(null);
  const [profile, setProfile] = useState(null);
  const [image, setImage] = useState(null);
  const [imageData, setImageData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch profile data
        const profileResponse = await axios.get(`http://localhost:8000/api/profiles/${profileId}/`);
        setProfile(profileResponse.data);

        // If we have a recordId, fetch the record
        if (recordId && recordId !== 'new') {
          const recordResponse = await axios.get(`http://localhost:8000/api/profiles/${profileId}/records/${recordId}/`);
          setRecord(recordResponse.data);
          if (recordResponse.data.image) {
            setImage(`http://localhost:8000${recordResponse.data.image}`);
            setImageData(recordResponse.data.image_data);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        navigate(`/profile/${profileId}`);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [profileId, recordId, navigate]);

  const handleBack = () => {
    if (recordId === 'new') {
      navigate(`/add-record/${profileId}`);
    } else {
      navigate(`/profile/${profileId}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-red-500">Profile not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center mb-8">
            <button
              onClick={handleBack}
              className="text-blue-500 hover:text-blue-700 flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <h1 className="text-3xl font-bold text-gray-900 ml-4">
              Medical Analysis for {profile.name}
            </h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h2 className="text-xl font-semibold mb-4">Medical Record</h2>
              {image ? (
                <div className="relative">
                  <img
                    src={image}
                    alt="Medical Record"
                    className="w-full h-auto rounded-lg shadow-md"
                  />
                </div>
              ) : (
                <div className="bg-gray-100 rounded-lg p-8 text-center">
                  <p className="text-gray-500">No image available</p>
                </div>
              )}
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">Analysis Results</h2>
              <div className="bg-gray-50 rounded-lg p-6">
                {recordId === 'new' ? (
                  <div className="space-y-4">
                    <p className="text-gray-600">This is a new record being analyzed.</p>
                    <p className="text-gray-600">The analysis will be performed on the uploaded image.</p>
                  </div>
                ) : record ? (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium text-gray-900">Title</h3>
                      <p className="text-gray-600">{record.title}</p>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Date</h3>
                      <p className="text-gray-600">{new Date(record.date).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Description</h3>
                      <p className="text-gray-600">{record.description}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-600">Record not found</p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-8">
            <button
              onClick={() => navigate(`/profile/${profileId}`)}
              className="w-full bg-blue-500 text-white py-3 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Return to Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MedicalAnalysis; 