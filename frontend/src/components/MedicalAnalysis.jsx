import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import HighlightedLink from './HighlightedLink';
import axios from 'axios';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

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
  const [savedAnalysis, setSavedAnalysis] = useState(false);
  const [textRegions, setTextRegions] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [showZoomView, setShowZoomView] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalSelectedRegion, setModalSelectedRegion] = useState(null);
  const [renderedImageSize, setRenderedImageSize] = useState({ width: 0, height: 0 });
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const [popups, setPopups] = useState([]);
  const [isDragging, setIsDragging] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const navigate = useNavigate();
  const imageRef = useRef(null);

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
    // Always analyze if image data exists
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
    setTextRegions([]);

    try {
      // Generate medical summary using Gemini
      const summary = await generateMedicalSummary(base64Image);
      if (summary) {
        setMedicalSummary(summary);
      }
      
      // Extract text regions using Vision API
      console.log("Calling extractTextRegions with base64 image data");
      // Make sure we're passing the correct format - remove data:image prefix if present
      let cleanBase64 = base64Image;
      if (base64Image.includes(',')) {
        cleanBase64 = base64Image.split(',')[1];
      }
      
      const regions = await extractTextRegions(cleanBase64);
      console.log("Received regions:", regions);
      if (regions && regions.length > 0) {
        setTextRegions(regions);
      } else {
        console.warn("No text regions found in the image");
      }
    } catch (error) {
      console.error("Analysis error:", error);
      alert("Error analyzing image: " + (error instanceof Error ? error.message : String(error)));
    } finally {
      setAnalyzing(false);
    }
  }

  // New function to extract text regions using Vision API
  async function extractTextRegions(base64Image) {
    try {
      console.log("Starting text region extraction");
      const apiKey = "AIzaSyAfUJbHB5Kr7oL0kvY00FuLo9aEuaE0uYM";
      const apiUrl = "https://vision.googleapis.com/v1/images:annotate";
      
      // Log the first few characters of the base64 string to verify it's valid
      console.log("Base64 image data (first 50 chars):", base64Image.substring(0, 50));
      
      const requestData = {
        requests: [
          {
            image: {
              content: base64Image
            },
            features: [
              {
                type: "TEXT_DETECTION",
                maxResults: 50
              }
            ]
          }
        ]
      };
      
      console.log("Sending request to Vision API");
      const response = await fetch(`${apiUrl}?key=${apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestData)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Vision API error response:", errorText);
        throw new Error(`Vision API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log("Vision API response:", data);
      
      if (data.responses && data.responses[0]?.textAnnotations) {
        // Skip the first annotation which is the entire text
        const annotations = data.responses[0].textAnnotations.slice(1);
        console.log("Found annotations:", annotations.length);
        
        // Get image dimensions for percentage calculations
        const img = new Image();
        img.src = `data:image/jpeg;base64,${base64Image}`;
        
        // Wait for image to load to get dimensions
        await new Promise((resolve) => {
          img.onload = resolve;
          // If image fails to load, resolve anyway after a timeout
          setTimeout(resolve, 1000);
        });
        
        const imgWidth = img.width || 1000; // Default if not available
        const imgHeight = img.height || 1000; // Default if not available
        console.log("Image dimensions for calculations:", { width: imgWidth, height: imgHeight });
        
        // Filter for measurements and values
        const valueRegex = /^[-+]?\d*\.?\d+(?:[eE][-+]?\d+)?(?:\s*[%<>])?$/; // Match numbers with optional units
        const rangeRegex = /^\d+\s*[-–]\s*\d+$/; // Match ranges like "10-20"
        const unitRegex = /^\d+\s*(?:mg|g|kg|ml|L|mmol\/L|μmol\/L|U\/L|mmHg|cm|mm|μm|ng\/mL|pg\/mL|IU\/L|mIU\/L)$/i; // Match numbers with medical units
        
        // Convert to our format, filtering for values only
        const regions = annotations
          .filter(annotation => {
            const text = annotation.description.trim();
            return (
              valueRegex.test(text) || 
              rangeRegex.test(text) || 
              unitRegex.test(text) ||
              /^\d+$/.test(text) || // Just numbers
              /^[<>]\s*\d+$/.test(text) // Less than or greater than values
            );
          })
          .map((annotation, index) => {
            const vertices = annotation.boundingPoly.vertices;
            
            // Calculate bounding box
            const minX = Math.min(...vertices.map(v => v.x || 0));
            const minY = Math.min(...vertices.map(v => v.y || 0));
            const maxX = Math.max(...vertices.map(v => v.x || 0));
            const maxY = Math.max(...vertices.map(v => v.y || 0));
            
            return {
              id: `text-${index}`,
              x: (minX / imgWidth) * 100,
              y: (minY / imgHeight) * 100,
              width: ((maxX - minX) / imgWidth) * 100,
              height: ((maxY - minY) / imgHeight) * 100,
              text: annotation.description
            };
          });
        
        console.log("Extracted value regions:", regions);
        return regions;
      } else {
        console.warn("No text annotations found in Vision API response");
        return [];
      }
      
    } catch (error) {
      console.error("Error extracting text regions:", error);
      return [];
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
                text: "Analyze this medical record image and provide information in the following three categories:\n\n1. Summary: Brief explanation of the results in simple, layman's terms.\n\n2. What can I do?: Suggest lifestyle changes, diet modifications, or exercises the patient can personally implement.\n\n3. Where to go?: Recommend specific specialist doctors (e.g., cardiologist, endocrinologist) the patient should consult based on any abnormal values.\n\nKeep each section concise, about 1-2 sentences each.\n\nFor each term in each section, if the term is complex, surround the term with ||. For example, ||medical-term||.\n\nAt the end of summary, list all specialists included in the Where to go section FORMAT AS FOLLOWS: _included-specialists: specialist1, specialist2,..."
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
    
    console.log('Original summary:', summary);
    
    // Extract specialists list from the end indicated by _included-specialists
    const specialistMatch = summary.match(/_included-specialists:\s*(.*?)(?:\n|$)/);
    const specialistsList = specialistMatch ? 
      specialistMatch[1].trim().toLowerCase().split(/,\s*/) : 
      [];
    
    // Remove the specialist line from the main summary
    const mainSummary = summary.replace(/_included-specialists:.*?(?:\n|$)/, '');
    
    // Split by numbered sections (1., 2., 3.)
    const sections = mainSummary.split(/(\d+\.\s+)/);
    const formattedSections = [];
    
    for (let i = 1; i < sections.length; i += 2) {
      const title = sections[i].replace(/^\d+\.\s+/, '');
      let content = sections[i + 1];

      const parts = [];
      let lastIndex = 0;

      content.replace(/\|\|(.*?)\|\|/g, (match, word, index) => {
        parts.push(content.substring(lastIndex, index));
        // Check if the word is in the specialists list
        const isSpecialist = specialistsList.some(specialist => 
          specialist.includes(word.toLowerCase())
        );
        parts.push(<HighlightedLink key={index} word={word} isSpecialist={isSpecialist} />);
        lastIndex = index + match.length;
        return match; // return match so replace works
      });

      parts.push(content.substring(lastIndex));
      formattedSections.push({ title, content: parts });
    }
    
    return formattedSections;
  };

  const saveAnalysis = async (summary) => {
    if (!summary) return;

    try {
      const sections = formatSummary(summary);
      if (!sections) return;

      const analysisData = {
        analysis_summary: sections[0]?.content || '',
        analysis_actions: sections[1]?.content || '',
        analysis_recommendations: sections[2]?.content || ''
      };

      console.log('Saving analysis for profile:', profileId);
      console.log('Record data:', record);

      // If this is a new record, we need to create it first
      if (recordId === 'new' && location.state?.record) {
        const formData = new FormData();
        formData.append('title', record.title);
        formData.append('date', record.date);
        formData.append('description', record.description);
        formData.append('image_data', record.image_data);
        formData.append('analysis_summary', analysisData.analysis_summary);
        formData.append('analysis_actions', analysisData.analysis_actions);
        formData.append('analysis_recommendations', analysisData.analysis_recommendations);

        // Convert base64 to blob and append as file
        const base64Response = await fetch(record.image);
        const blob = await base64Response.blob();
        formData.append('image', blob, 'medical_record.jpg');

        console.log('Sending request to:', `http://localhost:8000/api/profiles/${profileId}/records/`);
        const response = await axios.post(
          `http://localhost:8000/api/profiles/${profileId}/records/`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );

        if (response.status === 201) {
          navigate(`/profile/${profileId}`);
        }
      } else if (recordId && recordId !== 'new') {
        // Update existing record with analysis
        const formData = new FormData();
        formData.append('analysis_summary', analysisData.analysis_summary);
        formData.append('analysis_actions', analysisData.analysis_actions);
        formData.append('analysis_recommendations', analysisData.analysis_recommendations);

        const response = await axios.patch(
          `http://localhost:8000/api/profiles/${profileId}/records/${recordId}/`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );

        if (response.status === 200) {
          navigate(`/profile/${profileId}`);
        }
      }
    } catch (error) {
      console.error('Error saving analysis:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
        console.error('Profile ID:', profileId);
        console.error('Record:', record);
        alert('Failed to save analysis results: ' + JSON.stringify(error.response.data));
      } else {
        alert('Failed to save analysis results. Please try again.');
      }
    }
  };

  const handleSaveAnalysis = async () => {
    if (medicalSummary) {
      await saveAnalysis(medicalSummary);
    }
  };

  const handleBack = () => {
    if (recordId === 'new') {
      navigate(`/add-record/${profileId}`);
    } else {
      navigate(`/profile/${profileId}`);
    }
  };

  const toggleZoomView = () => {
    setShowZoomView(!showZoomView);
    setSelectedRegion(null);
    
    // If we're entering zoom view and we have image data but no text regions,
    // automatically trigger text extraction
    if (!showZoomView && imageData && textRegions.length === 0) {
      console.log("Auto-triggering text extraction on zoom view entry");
      setTimeout(() => {
        extractTextRegions(imageData).then(regions => {
          if (regions && regions.length > 0) {
            console.log("Setting text regions:", regions);
            setTextRegions(regions);
          } else {
            console.warn("No regions returned from auto extraction");
          }
        }).catch(error => {
          console.error("Auto extraction error:", error);
        });
      }, 500); // Small delay to ensure the view has rendered
    }
  };

  const handleRegionClick = (region, event) => {
    // Check if this region already has a popup
    const existingPopupIndex = popups.findIndex(popup => popup.region.id === region.id);
    
    if (existingPopupIndex >= 0) {
      // If popup exists, bring it to front by moving it to the end of the array
      const updatedPopups = [...popups];
      const popup = updatedPopups.splice(existingPopupIndex, 1)[0];
      setPopups([...updatedPopups, popup]);
      return;
    }
    
    // Calculate popup position based on click event
    let position = { x: 100, y: 100 }; // Default position
    if (event) {
      // Position the popup near the click but ensure it stays in viewport
      const x = Math.min(event.clientX, window.innerWidth - 300); // 300px is approximate popup width
      const y = Math.min(event.clientY, window.innerHeight - 200); // 200px is approximate popup height
      position = { x, y };
    }
    
    // Add new popup
    setPopups([...popups, {
      id: `popup-${Date.now()}`, // Unique ID
      region: region,
      position: position
    }]);
    
    // Highlight the region
    setSelectedRegion(region);
  };
  
  const closePopup = (popupId) => {
    setPopups(popups.filter(popup => popup.id !== popupId));
    // If this was the selected region, deselect it
    const popup = popups.find(p => p.id === popupId);
    if (popup && selectedRegion?.id === popup.region.id) {
      setSelectedRegion(null);
    }
  };
  
  const startDragging = (e, popupId) => {
    const popup = popups.find(p => p.id === popupId);
    if (!popup) return;
    
    setIsDragging(popupId);
    setDragOffset({
      x: e.clientX - popup.position.x,
      y: e.clientY - popup.position.y
    });
    
    // Prevent text selection during drag
    e.preventDefault();
  };
  
  const handleDrag = (e) => {
    if (!isDragging) return;
    
    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;
    
    // Keep popup within viewport bounds
    const x = Math.max(0, Math.min(newX, window.innerWidth - 300));
    const y = Math.max(0, Math.min(newY, window.innerHeight - 200));
    
    // Update the position of the dragged popup
    setPopups(popups.map(popup => 
      popup.id === isDragging 
        ? { ...popup, position: { x, y } } 
        : popup
    ));
  };
  
  const stopDragging = () => {
    setIsDragging(null);
  };
  
  // Add event listeners for drag
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDrag);
      window.addEventListener('mouseup', stopDragging);
      
      return () => {
        window.removeEventListener('mousemove', handleDrag);
        window.removeEventListener('mouseup', stopDragging);
      };
    }
  }, [isDragging, dragOffset, popups]);

  const handleImageLoad = () => {
    if (imageRef.current) {
      const { offsetWidth, offsetHeight } = imageRef.current;
      console.log("Image loaded with dimensions:", { width: offsetWidth, height: offsetHeight });
      setRenderedImageSize({ width: offsetWidth, height: offsetHeight });
      
      // Recalculate text region positions based on actual image dimensions
      if (textRegions.length > 0) {
        const img = new Image();
        img.onload = () => {
          const imgWidth = img.width;
          const imgHeight = img.height;
          console.log("Original image dimensions:", { width: imgWidth, height: imgHeight });
          
          // No need to update regions here as they're already in percentage
        };
        img.src = image;
      }
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

  // Render the zoom view
  if (showZoomView) {
    return (
      <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col">
        {/* Header */}
        <div className="bg-gray-800 text-white p-4 flex justify-between items-center">
          <button
            onClick={toggleZoomView}
            className="text-white hover:text-gray-300 flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <h2 className="text-xl font-semibold">Document Viewer</h2>
          <div className="w-10"></div> {/* Empty div for spacing */}
        </div>
        
        {/* Zoomable Image */}
        <div className="flex-1 overflow-hidden flex justify-center items-center bg-gray-900">
          <TransformWrapper
            initialScale={1}
            minScale={0.5}
            maxScale={5}
            doubleClick={{
              disabled: false,
              mode: "reset"
            }}
          >
            {({ zoomIn, zoomOut, resetTransform }) => (
              <>
                <div className="absolute top-20 right-4 flex flex-col space-y-2 z-10">
                  <button 
                    onClick={() => zoomIn()} 
                    className="bg-blue-500 text-white p-2 rounded-full shadow-lg"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </button>
                  <button 
                    onClick={() => zoomOut()} 
                    className="bg-blue-500 text-white p-2 rounded-full shadow-lg"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" />
                    </svg>
                  </button>
                  <button 
                    onClick={() => resetTransform()} 
                    className="bg-blue-500 text-white p-2 rounded-full shadow-lg"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                </div>
                <TransformComponent
                  wrapperStyle={{
                    width: "100%",
                    height: "100%"
                  }}
                  contentStyle={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    width: "100%",
                    height: "100%"
                  }}
                >
                  <div className="relative">
                    <img
                      ref={imageRef}
                      src={image}
                      alt="Medical Record"
                      className="max-w-none"
                      onLoad={handleImageLoad}
                    />
                    
                    {textRegions.length > 0 && textRegions.map((region) => (
                      <div
                        key={region.id}
                        className={`absolute cursor-pointer border ${
                          selectedRegion?.id === region.id 
                            ? 'border-red-500' 
                            : 'border-blue-500'
                        }`}
                        style={{
                          left: `${region.x}%`,
                          top: `${region.y}%`,
                          width: `${region.width}%`,
                          height: `${region.height}%`,
                          pointerEvents: 'auto',
                          zIndex: 50,
                          backgroundColor: selectedRegion?.id === region.id 
                            ? 'rgba(254, 202, 202, 0.1)' // Very transparent red
                            : 'rgba(191, 219, 254, 0.1)' // Very transparent blue
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRegionClick(region, e);
                        }}
                      />
                    ))}
                  </div>
                </TransformComponent>
              </>
            )}
          </TransformWrapper>
        </div>
        
        {/* Loading indicator for text extraction */}
        {analyzing && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 z-40">
            <div className="bg-white p-4 rounded-lg shadow-lg flex items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mr-3"></div>
              <p className="text-gray-700">Analyzing document...</p>
            </div>
          </div>
        )}
        
        {/* Debug info */}
        <div className="absolute bottom-4 left-4 bg-black bg-opacity-70 text-white p-2 rounded text-xs">
          <p>Text regions: {textRegions.length}</p>
          <p>Image size: {renderedImageSize.width}x{renderedImageSize.height}</p>
          <p>Image data available: {imageData ? 'Yes' : 'No'}</p>
        </div>
        
        {/* Multiple text region popups */}
        {popups.map((popup) => (
          <div 
            key={popup.id}
            className="fixed bg-white rounded-lg shadow-lg p-4 z-50 max-w-xs"
            style={{
              left: `${popup.position.x}px`,
              top: `${popup.position.y}px`,
              maxWidth: '300px',
              cursor: isDragging === popup.id ? 'grabbing' : 'grab',
              zIndex: isDragging === popup.id ? 60 : 50 // Bring active popup to front
            }}
          >
            <div 
              className="flex justify-between items-center mb-2 cursor-grab"
              onMouseDown={(e) => startDragging(e, popup.id)}
            >
              <h3 className="text-lg font-semibold text-gray-900 select-none">Detected Text</h3>
              <button 
                onClick={() => closePopup(popup.id)}
                className="text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="max-h-40 overflow-y-auto">
              <p className="text-gray-700 text-sm mb-2">{popup.region.text || ''}</p>
              <div className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-200">
                <p>Position: {popup.region.x.toFixed(1)}%, {popup.region.y.toFixed(1)}%</p>
                <p>Size: {popup.region.width.toFixed(1)}% × {popup.region.height.toFixed(1)}%</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Regular view
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
                  <button
                    onClick={toggleZoomView}
                    className="absolute bottom-4 right-4 bg-blue-500 text-white p-2 rounded-full shadow-lg"
                    title="Open document viewer"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                    </svg>
                  </button>
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
                      <p className="text-gray-600">
                        {section.content.map((part, partIndex) => (
                          <React.Fragment key={partIndex}>{part}</React.Fragment>
                        ))}
                      </p>
                    </div>
                  ))}
                  {recordId === 'new' && (
                    <button
                      onClick={handleSaveAnalysis}
                      className="w-full bg-green-500 text-white py-3 px-4 rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                    >
                      Save Document
                    </button>
                  )}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  No analysis available. Please try analyzing the image again.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MedicalAnalysis;