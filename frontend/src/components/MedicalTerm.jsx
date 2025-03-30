import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import ScrollFadeIn from './ScrollFadeIn';

// Define hints array
const hints = [
  'Hint: Click on a medical term within an analysis to find Specialists in your area.',
  'Hint: You can drag and drop profile cards on the home screen to reorder them!',
  'Hint: Add new medical records for any profile by clicking the \'+\' button on their board.',
  'Hint: Click on a profile card to view their medical records.'
];

const AISearchPopup = ({ text, onClose, explanation }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-semibold">Simplified Explanation</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">Selected text:</p>
          <p className="italic text-gray-800 mb-4">"{text}"</p>
          <p className="text-sm text-gray-600 mb-2">Simple explanation:</p>
          <p className="text-gray-800">{explanation}</p>
        </div>
      </div>
    </div>
  );
};

const SearchPrompt = ({ position, onClick }) => {
  return (
    <button
      className="fixed bg-blue-600 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-700 transition-colors shadow-lg"
      style={{
        position: 'absolute',
        top: `${position.y}px`,
        left: `${position.x}px`,
        transform: 'translate(-50%, -100%)',
        pointerEvents: 'auto',
        zIndex: 1000
      }}
      onClick={onClick}
    >
      Search with AI
    </button>
  );
};

function MedicalTerm() {
  const location = useLocation();
  const term = location.state?.term;
  const isSpecialist = location.state?.isSpecialist;

  // Add a check for term existence
  if (!term) {
    return (
      <div className="text-red-600 text-xl p-8 text-left">
        No medical term provided. Please try again.
      </div>
    );
  }

  const [definition, setDefinition] = useState(null);
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [specialistList, setSpecialistList] = useState(null); // Add a new state for specialist list
  const [specialists, setSpecialists] = useState([]); // Add a new state for specialists
  const [userLocation, setUserLocation] = useState(null); // Add new state for user location
  const [locationError, setLocationError] = useState(null); // Add new state for location error
  const [showPrompt, setShowPrompt] = useState(false);
  const [promptPosition, setPromptPosition] = useState({ x: 0, y: 0 });
  const [selectedText, setSelectedText] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [aiExplanation, setAiExplanation] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // State for cycling hints
  const [currentHintIndex, setCurrentHintIndex] = useState(0);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          setLocationError(error.message);
          console.log('Geolocation error:', error);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      setLocationError('Geolocation is not supported by this browser.');
    }
  }, []);

  // Effect for cycling hints during loading
  useEffect(() => {
    let intervalId = null;
    if (loading) {
      // Start interval only when loading
      intervalId = setInterval(() => {
        setCurrentHintIndex((prevIndex) => (prevIndex + 1) % hints.length);
      }, 5000); // Change hint every 5 seconds
    }

    // Cleanup function to clear the interval
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [loading]); // Rerun effect if loading state changes

  useEffect(() => {
    const fetchDefinition = async () => {
      // Reset hint index when starting a new fetch
      setCurrentHintIndex(0);
      setLoading(true);
      setError(null);

      try {
        // Replace this with your Perplexity API key
        const apiKey = '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';
        const apiUrl = 'https://api.perplexity.ai/chat/completions';

        // Prepare the request payload
        const payload = {
          model: isSpecialist ? `sonar-pro`:`sonar`,
          messages: [
            {
              role: 'system',
              content: isSpecialist
                // UNCOMMENT TO USE LOCATION DATA
                // ? `You are a helpful assistant that provides information about medical specialists. First list the top 5 specialists ${
                //     userLocation ? "near the user's location" : 'in the area'
                //   } with their Name, Address, Phone Number, and make sure to include WEBSITE specific to doctor (not list)with information in a clear format. Then explain their role and what conditions they treat. Divide the two with __ (two underscores). MAKE SURE TO KEEP SOURCES`
                ? `You are a helpful assistant that provides information about medical specialists. First list the top 5 specialists near Hoboken, NJ with their Name, Address, Phone Number, and make sure to include WEBSITE specific to doctor (not list)with information in a clear format. Then explain their role and what conditions they treat. Divide the two with __ (two underscores). MAKE SURE TO KEEP SOURCES`
                : 'You are a helpful assistant that provides concise medical definitions. Explain in simple terms that a high-schooler could understand. If possible, break down into bullet points. Use only single returns. Make sure to keep sources. If you cannot find a definition, say "Definition not found." and do not return any other text.',
            },
            {
              role: 'user',
            //   UNCOMMENT TO USE LOCATION DATA
            //   content: isSpecialist
            //     ? `List the top 5 ${term}s ${
            //         userLocation
            //           ? `near coordinates (${userLocation.lat.toFixed(
            //               4
            //             )}, ${userLocation.lng.toFixed(4)})`
            //           : 'in the area'
            //       } with their contact information:`
            //     : `Define the medical term: ${term}`,
                content: isSpecialist
                ? `List the top 5 ${term}s in Hoboken, NJ with their contact information:`
                : `Define the medical term: ${term}`,
            },
          ],
        };

        // Make the API request using axios
        const response = await axios.post(apiUrl, payload, {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        });

        console.log('API Response:', JSON.stringify(response.data)); // Log the full response for debugging
        // Extract and set the definition from the API response
        const completion = response.data.choices[0].message.content;

        if (isSpecialist) {
          // Split the content using the __ separator
          const [list, description] = completion.split('__');
          setSpecialistList(list.trim());
          setDefinition(description.trim());

          // Process the list to extract specialist information
          const specialistsData = list
            .split('\n\n')
            .filter((s) => s.includes('Address:'))
            .map((specialist) => {
              const lines = specialist.split('\n');
              return {
                name: lines[0].trim(),
                address:
                  lines
                    .find((l) => l.includes('Address:'))
                    ?.replace('Address:', '')
                    .trim() || '',
                phone:
                  lines
                    .find((l) => l.includes('Phone:'))
                    ?.replace('Phone:', '')
                    .trim() || '',
                website:
                  lines
                    .find((l) => l.includes('Website:'))
                    ?.replace('Website:', '')
                    .trim() || '',
              };
            });
          setSpecialists(specialistsData);
        } else {
          setDefinition(completion);
        }

        const citations = response.data.citations || [];
        const formattedSources = citations.map((citation, index) => ({
          id: `source-${index}`, // Create a more unique id
          url: citation,
          text: `Source ${index + 1}`,
        }));
        setSources(formattedSources);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    if (term) {
      fetchDefinition();
    }
  }, [term, isSpecialist]);

  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();

    if (selectedText) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      setPromptPosition({
        x: rect.left + (rect.width / 2),
        y: rect.top + window.pageYOffset
      });
      setSelectedText(selectedText);
      setShowPrompt(true);
    } else {
      setShowPrompt(false);
    }
  }, []);

  const handleAISearch = async () => {
    setShowPrompt(false);
    setIsLoading(true);
    setShowPopup(true);

    try {
      const apiKey = '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';
      const apiUrl = 'https://api.perplexity.ai/chat/completions';

      const payload = {
        model: 'sonar',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful medical assistant that explains medical terms in very simple language, using analogies when possible. Explain in simple terms that a high-schooler could understand.'
          },
          {
            role: 'user',
            content: `Please explain "${selectedText}" in the simplest possible terms, as if explaining to someone with no medical knowledge. Keep it to a maximum of 3 sentences total.`
          }
        ]
      };

      const response = await axios.post(apiUrl, payload, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      setAiExplanation(response.data.choices[0].message.content);
    } catch (error) {
      console.error('Error fetching AI explanation:', error);
      setAiExplanation('Error getting explanation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mouseup', handleTextSelection);
    return () => {
      document.removeEventListener('mouseup', handleTextSelection);
    };
  }, [handleTextSelection]);

  if (loading) {
    return (
      // Center the content vertically and horizontally
      <div className="min-h-[calc(100vh-100px)] flex flex-col items-center justify-center text-center p-8">
        {/* Optional: Add a subtle loading spinner */}
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-4"></div> 
        {/* Display the current hint */}
        <p className="text-lg text-gray-600 italic">
          {hints[currentHintIndex]}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 text-xl p-8 text-left">
        Error fetching definition: {error.message}
      </div>
    );
  }

  if (!definition) {
    return (
      <div className="text-gray-600 text-xl p-8 text-left">
        No definition found for {term}.
      </div>
    );
  }

  return (
    <ScrollFadeIn className="container mx-auto px-4 py-8 max-w-4xl">
      <ScrollFadeIn>
        <h1 className="text-4xl font-bold text-gray-800 mb-8 text-left">
          {isSpecialist ? `About ${term}s` : `Definition of ${term}`}
        </h1>
      </ScrollFadeIn>
      <ScrollFadeIn className="bg-white rounded-lg shadow-lg p-8">
        {isSpecialist && specialistList && (
          <ScrollFadeIn className="mb-8 pb-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 text-left">
              Here are the top 5 {term}s {userLocation ? 'near you' : 'in Hoboken, NJ'} with their contact information:
            </h2>
            <div className="text-gray-700 text-lg text-left space-y-4">
              {specialists.map((specialist, index) => (
                <div key={index} className="border-b border-gray-200 pb-4 last:border-b-0">
                  <p className="font-semibold">{specialist.name}</p>
                  {specialist.address && <p>Address: {specialist.address}</p>}
                  {specialist.phone && <p>Phone: {specialist.phone}</p>}
                  {specialist.website && (
                    <p>
                      Website:{' '}
                      <a
                        href={specialist.website.startsWith('http') ? specialist.website : `http://${specialist.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {specialist.website}
                      </a>
                    </p>
                  )}
                </div>
              ))}
              <p className="mt-4 text-sm text-gray-600">
                Note: Please verify availability and insurance coverage before scheduling an appointment.
              </p>
            </div>
          </ScrollFadeIn>
        )}
        <ScrollFadeIn className="prose max-w-none text-gray-700 text-lg mb-8 whitespace-pre-wrap text-left">
          <ReactMarkdown>{definition}</ReactMarkdown>
        </ScrollFadeIn>
        {sources.length > 0 && (
          <ScrollFadeIn className="mt-8 pt-6 border-t border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 text-left">
              Sources
            </h2>
            <ul className="space-y-2 text-left">
              {sources.map((source) => (
                <li key={source.id} className="text-gray-600 text-sm">
                  {source.text}:{' '}
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {source.url}
                  </a>
                </li>
              ))}
            </ul>
          </ScrollFadeIn>
        )}
      </ScrollFadeIn>

      {showPrompt && (
        <SearchPrompt
          position={promptPosition}
          onClick={handleAISearch}
        />
      )}

      {showPopup && (
        <AISearchPopup
          text={selectedText}
          explanation={isLoading ? 'Loading...' : aiExplanation}
          onClose={() => {
            setShowPopup(false);
            setAiExplanation('');
          }}
        />
      )}
    </ScrollFadeIn>
  );
}

export default MedicalTerm;