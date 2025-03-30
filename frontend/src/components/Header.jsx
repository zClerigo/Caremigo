import React from 'react';
import { Link } from 'react-router-dom';

const Header = () => {
  return (
    <header className="bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-40">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <img src="/Caremigo-logo.png" alt="Caremigo Logo" className="h-32" />
            </Link>
            <span className="text-blue-600 italic text-xl ml-4">Happy Sunday, Ziddani!</span>
          </div>
          
          <nav className="flex space-x-8">
            <Link to="/" className="text-blue-600 hover:text-blue-800 px-3 py-2 text-lg font-medium">
              Home
            </Link>
            <button className="text-blue-600 hover:text-blue-800 px-3 py-2 text-lg font-medium">
              Account
            </button>
            <button className="text-blue-600 hover:text-blue-800 px-3 py-2 text-lg font-medium">
              Settings
            </button>
            <button className="text-blue-600 hover:text-blue-800 px-3 py-2 text-lg font-medium">
              Sign Out
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header; 