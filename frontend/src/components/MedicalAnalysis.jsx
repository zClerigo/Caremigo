import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

function MedicalAnalysis() {
  const [analyzing, setAnalyzing] = useState(false);
  const [medicalSummary, setMedicalSummary] = useState(null);
  const [currentTab, setCurrentTab] = useState(0);
  const location = useLocation();
  const { image, imageData } = location.state || {};

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
                text: "Analyze this medical record image and provide information in the following three categories:\n\n1. Summary: Brief explanation of the results in simple, layman's terms.\n\n2. What can I do?: Suggest lifestyle changes, diet modifications, or exercises the patient can personally implement.\n\n3. Where to go?: Recommend specific specialist doctors (e.g., cardiologist, endocrinologist) the patient should consult based on any abnormal values.\n\nKeep each section concise, about 1-2 sentences each."
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
      
      console.log("Sending request to Gemini API for medical summary...");
      
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
      const sectionNumber = sections[i];
      const sectionContent = sections[i + 1] || '';
      
      // Extract title and content
      const titleMatch = sectionContent.match(/^([^:]+):(.*)/s);
      if (titleMatch) {
        const [, title, content] = titleMatch;
        formattedSections.push({ title: title.trim(), content: content.trim() });
      } else {
        formattedSections.push({ title: '', content: sectionContent.trim() });
      }
    }
    
    return formattedSections;
  };

  const formattedSummary = formatSummary(medicalSummary);

  return (
    <div className="container mx-auto p-8 bg-white rounded-lg shadow-md max-w-5xl">
      <div className="flex items-center mb-6 border-b pb-4">
        <Link to="/add-record" className="text-blue-500 hover:text-blue-700 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Record
        </Link>
        <h1 className="text-2xl font-semibold text-center flex-1">Medical Analysis</h1>
      </div>

      {/* Tab navigation */}
      <div className="flex border-b mb-6">
        <button 
          className={`py-3 px-6 font-medium ${currentTab === 0 ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
          onClick={() => setCurrentTab(0)}
        >
          Image
        </button>
        <button 
          className={`py-3 px-6 font-medium ${currentTab === 1 ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
          onClick={() => setCurrentTab(1)}
        >
          Analysis
        </button>
      </div>

      {currentTab === 0 ? (
        <div className="flex flex-col items-center">
          {image ? (
            <div className="w-full max-w-3xl mb-6">
              <img 
                src={image} 
                alt="Medical record" 
                className="w-full h-auto rounded-lg border border-gray-200"
              />
            </div>
          ) : (
            <div className="w-full max-w-3xl h-80 bg-gray-100 rounded-lg flex items-center justify-center mb-6">
              <p className="text-gray-500">No image available</p>
            </div>
          )}
          
          <button 
            className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition duration-200 flex items-center mt-4"
            onClick={() => setCurrentTab(1)}
          >
            View Analysis
          </button>
        </div>
      ) : (
        <div>
          {analyzing ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-lg text-blue-600">Analyzing your medical record...</p>
            </div>
          ) : medicalSummary ? (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800">Medical Summary</h2>
                <p className="text-sm text-gray-600">AI-generated analysis of your medical record</p>
              </div>
              
              <div className="p-6">
                {formattedSummary ? (
                  <div className="space-y-6">
                    {formattedSummary.map((section, index) => (
                      <div key={index} className="pb-4 border-b border-gray-100 last:border-0">
                        <h3 className="font-bold text-gray-800 mb-2">{section.title}</h3>
                        <p className="text-gray-700">{section.content}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-700 whitespace-pre-line">{medicalSummary}</p>
                )}
                
                <div className="mt-6 pt-4 border-t border-gray-100">
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-yellow-700">
                          This analysis is for informational purposes only and should not replace professional medical advice.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No analysis available</h3>
              <p className="text-gray-500 mb-6">We couldn't analyze the medical record or no image was provided.</p>
              <button 
                className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition duration-200"
                onClick={() => setCurrentTab(0)}
              >
                Return to Image
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default MedicalAnalysis; 