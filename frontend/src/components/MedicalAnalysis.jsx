import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import axios from 'axios';

function MedicalAnalysis() {
  const { profileId, recordId } = useParams();
  const location = useLocation();
  const [record, setRecord] = useState(null);
  const [profile, setProfile] = useState(null);
  const [image, setImage] = useState(null);
  const [imageData, setImageData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [medicalSummary, setMedicalSummary] = useState(null);
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
        } else if (recordId === 'new' && location.state?.record) {
          // Handle new record from navigation state
          const tempRecord = location.state.record;
          setRecord(tempRecord);
          setImage(tempRecord.image);
          setImageData(tempRecord.image_data);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        navigate(`/profile/${profileId}`);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [profileId, recordId, navigate, location.state]);

  useEffect(() => {
    if (imageData) {
      analyzeImage(imageData);
    }
  }, [imageData]);

  async function analyzeImage(base64Image) {
    if (!base64Image) {
      return;
    }

    setAnalyzing(true);
    setMedicalSummary(null);

    try {
      // Generate medical summary using Gemini
      const summary = await generateMedicalSummary(base64Image);
      if (summary) {
        setMedicalSummary(summary);
      }
    } catch (error) {
      console.error("Analysis error:", error);
      alert("Error analyzing image: " + (error instanceof Error ? error.message : String(error)));
    } finally {
      setAnalyzing(false);
    }
  }

  // Function to generate medical summary using Gemini
  async function generateMedicalSummary(imageBase64) {
    try {
      // Call Gemini API
      const apiKey = "AIzaSyAfUJbHB5Kr7oL0kvY00FuLo9aEuaE0uYM";
      const apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
      
      const requestData = {
        contents: [
          {
            parts: [
              {
                text: "Analyze this medical record image and provide information in the following three categories:\n\n1. Summary: Brief explanation of the results in simple, layman's terms.\n\n2. What can I do?: Suggest lifestyle changes, diet modifications, or exercises the patient can personally implement.\n\n3. Where to go?: Recommend specific specialist doctors (e.g., cardiologist, endocrinologist) the patient should consult based on any abnormal values.\n\nKeep each section concise, about 1-2 sentences each.\n\nFor each term in each section, if the term is complex, surround the term with ||. For example, ||medical-term||."
              },
              {
                inline_data: {
                  mime_type: "image/jpeg",
                  data: imageBase64
                }
              }
            ]
          }
        ],
        generation_config: {
          temperature: 0.4,
          top_p: 0.95,
          max_output_tokens: 300
        }
      };
      
      const geminiResponse = await fetch(`${apiUrl}?key=${apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestData)
      });

      const geminiData = await geminiResponse.json();
      
      if (geminiData.candidates && geminiData.candidates[0]?.content?.parts[0]?.text) {
        return geminiData.candidates[0].content.parts[0].text;
      } else {
        console.error("Failed to generate medical summary:", geminiData);
        return null;
      }
    } catch (error) {
      console.error("Medical summary generation error:", error);
      return null;
    }
  }

  const formatSummary = (summary) => {
    if (!summary) return null;
    
    // Split by numbered sections (1., 2., 3.)
    const sections = summary.split(/(\d+\.\s+)/);
    const formattedSections = [];
    
    for (let i = 1; i < sections.length; i += 2) {
      const title = sections[i].replace(/^\d+\.\s+/, '');
      const content = sections[i + 1];
      formattedSections.push({ title, content });
    }
    
    return formattedSections;
  };

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

  const formattedSummary = formatSummary(medicalSummary);

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
              {analyzing ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : formattedSummary ? (
                <div className="space-y-6">
                  {formattedSummary.map((section, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-gray-800 mb-2">{section.title}</h3>
                      <p className="text-gray-600">{section.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  No analysis available. Please try analyzing the image again.
                </div>
              )}
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