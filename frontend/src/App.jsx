import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import AddRecord from './components/AddRecord';
import MedicalAnalysis from './components/MedicalAnalysis';
import './App.css';

function Home() {
  return (
    <div className="container mx-auto p-8 bg-white rounded-lg shadow-md max-w-6xl">
      <header className="mb-8 pb-4 border-b">
        <h1 className="text-3xl font-bold text-gray-800">Medical Records Dashboard</h1>
        <p className="text-gray-600 mt-2">Manage and track patient medical records</p>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
          <h2 className="text-xl font-semibold text-blue-800 mb-2">Patient Records</h2>
          <p className="text-gray-600 mb-4">View and manage all patient medical records</p>
          <div className="text-3xl font-bold text-blue-600">24</div>
          <div className="text-sm text-blue-500">Total records</div>
        </div>
        
        <div className="bg-green-50 p-6 rounded-lg border border-green-100">
          <h2 className="text-xl font-semibold text-green-800 mb-2">Recent Activity</h2>
          <p className="text-gray-600 mb-4">Track recent updates to medical records</p>
          <div className="text-3xl font-bold text-green-600">7</div>
          <div className="text-sm text-green-500">Updates this week</div>
        </div>
        
        <div className="bg-purple-50 p-6 rounded-lg border border-purple-100">
          <h2 className="text-xl font-semibold text-purple-800 mb-2">Patients</h2>
          <p className="text-gray-600 mb-4">Manage patient profiles and information</p>
          <div className="text-3xl font-bold text-purple-600">12</div>
          <div className="text-sm text-purple-500">Active patients</div>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-2/3 bg-gray-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Recent Records</h2>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="p-4 bg-white rounded-lg shadow-sm flex justify-between items-center">
                <div>
                  <h3 className="font-medium">Blood Test Results</h3>
                  <p className="text-sm text-gray-500">Patient: Ziddi • Added: 2 days ago</p>
                </div>
                <button className="text-blue-500 hover:text-blue-700">View</button>
              </div>
            ))}
          </div>
          <div className="mt-4 text-right">
            <button className="text-blue-500 hover:text-blue-700">View all records →</button>
          </div>
        </div>
        
        <div className="md:w-1/3 bg-gray-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link 
              to="/add-record" 
              className="block w-full bg-blue-500 text-white px-4 py-3 rounded-lg hover:bg-blue-600 transition duration-200 text-center"
            >
              Add New Record
            </Link>
            <button className="block w-full bg-white border border-gray-300 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-50 transition duration-200">
              Add New Patient
            </button>
            <button className="block w-full bg-white border border-gray-300 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-50 transition duration-200">
              Generate Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100 py-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/add-record" element={<AddRecord />} />
          <Route path="/medical-analysis" element={<MedicalAnalysis />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
