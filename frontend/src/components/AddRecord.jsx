import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

function AddRecord() {
  const { profileId } = useParams();
  const [profile, setProfile] = useState(null);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageData, setImageData] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get(`http://localhost:8000/api/profiles/${profileId}/`);
        setProfile(response.data);
      } catch (error) {
        console.error('Error fetching profile:', error);
        navigate('/');
      }
    };
    fetchProfile();
  }, [profileId, navigate]);
  
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        const base64Data = reader.result.split(',')[1];
        setImageData(base64Data);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('date', date);
      formData.append('description', description);
      formData.append('image', image);
      
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
    } catch (error) {
      console.error('Error uploading record:', error);
      alert('Failed to upload medical record. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleAnalyze = () => {
    if (!imagePreview) {
      alert('Please select an image first');
      return;
    }
    
    navigate(`/medical-analysis/${profileId}/new`);
  };

  if (!profile) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-8 bg-white rounded-lg shadow-md max-w-6xl">
      <div className="flex items-center mb-6 border-b pb-4">
        <button onClick={() => navigate(`/profile/${profileId}`)} className="text-blue-500 hover:text-blue-700 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Profile
        </button>
        <h1 className="text-2xl font-semibold text-center flex-1">Upload Medical Record</h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-2xl font-bold mb-2">Upload Medical Record</h2>
          <p className="text-gray-600 mb-6">Adding record for: <span className="font-semibold">{profile.name}</span></p>
          
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
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
              id="image-upload"
            />
            <label
              htmlFor="image-upload"
              className="block w-full bg-blue-500 text-white text-center py-2 rounded-lg hover:bg-blue-600 transition duration-200 cursor-pointer"
            >
              {imagePreview ? 'Change Image' : 'Select Image'}
            </label>
          </div>
        </div>
        
        <div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-gray-700 mb-2">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-gray-700 mb-2">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-gray-700 mb-2">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-32"
                required
              />
            </div>
            
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isUploading}
                className="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition duration-200 disabled:opacity-50"
              >
                {isUploading ? 'Uploading...' : 'Upload Record'}
              </button>
              <button
                type="button"
                onClick={handleAnalyze}
                disabled={!imagePreview}
                className="flex-1 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition duration-200 disabled:opacity-50"
              >
                Analyze Record
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AddRecord; 