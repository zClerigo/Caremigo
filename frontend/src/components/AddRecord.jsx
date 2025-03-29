import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function AddRecord() {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageData, setImageData] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const navigate = useNavigate();
  
  // For demo purposes, hardcoded patient name
  const patientName = 'Ziddi';
  
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        // Store base64 data for analysis
        const base64Data = reader.result.split(',')[1];
        setImageData(base64Data);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Here you would typically send the data to your Django backend
    // For example using fetch or axios
    
    console.log({
      title,
      date,
      description,
      image,
      patientName
    });
    
    // Reset form after submission
    setTitle('');
    setDate('');
    setDescription('');
    setImage(null);
    setImagePreview(null);
    setImageData(null);
  };

  const handleAnalyze = () => {
    if (!imagePreview) {
      alert('Please select an image first');
      return;
    }
    
    navigate('/medical-analysis', { 
      state: { 
        image: imagePreview,
        imageData: imageData
      } 
    });
  };
  
  return (
    <div className="container mx-auto p-8 bg-white rounded-lg shadow-md max-w-6xl">
      <div className="flex items-center mb-6 border-b pb-4">
        <Link to="/" className="text-blue-500 hover:text-blue-700 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </Link>
        <h1 className="text-2xl font-semibold text-center flex-1">Medical Records Management</h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-2xl font-bold mb-2">Add Medical Record</h2>
          <p className="text-gray-600 mb-6">Adding record for patient: <span className="font-semibold">{patientName}</span></p>
          
          <div className="mb-6">
            <div 
              className="w-full h-80 bg-gray-200 rounded-lg flex items-center justify-center mb-4"
              style={{ backgroundImage: imagePreview ? `url(${imagePreview})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }}
            >
              {!imagePreview && (
                <div className="text-center p-6">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-gray-500">No image selected</p>
                  <p className="text-gray-400 text-sm">Upload an image of the medical record</p>
                </div>
              )}
            </div>
            
            <div className="flex space-x-4">
              <label className="bg-white border border-blue-500 text-blue-500 px-4 py-2 rounded-lg cursor-pointer hover:bg-blue-50 inline-block">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0l-4 4m4-4v12" />
                </svg>
                Select Image
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleImageChange}
                />
              </label>
              
              {imagePreview && (
                <button
                  type="button"
                  onClick={handleAnalyze}
                  className="bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 transition duration-200 flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Analyze Record
                </button>
              )}
            </div>
          </div>
        </div>
        
        <div>
          <form onSubmit={handleSubmit} className="bg-gray-50 p-6 rounded-lg">
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">Record Title</label>
              <input 
                type="text" 
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Blood Test Results, X-Ray Report, Prescription"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">Record Date</label>
              <input 
                type="date" 
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-2">Description</label>
              <textarea 
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Add details about this record, such as doctor's notes, test results, or follow-up instructions"
                rows="6"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              ></textarea>
            </div>
            
            <div className="flex items-center justify-between">
              <Link 
                to="/" 
                className="text-gray-600 hover:text-gray-800"
              >
                Cancel
              </Link>
              <button 
                type="submit" 
                className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition duration-200 flex items-center"
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0l-4 4m4-4v12" />
                    </svg>
                    Upload Record
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
      
      {imagePreview && (
        <div className="mt-8 p-6 bg-indigo-50 rounded-lg border border-indigo-100">
          <div className="flex items-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-medium text-indigo-800">AI Analysis Available</h3>
          </div>
          <p className="text-indigo-700 mb-4">
            Get an AI-powered analysis of your medical record. Our system can help interpret medical terminology and provide suggestions.
          </p>
          <button
            onClick={handleAnalyze}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition duration-200 flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Analyze with AI
          </button>
        </div>
      )}
    </div>
  );
}

export default AddRecord; 