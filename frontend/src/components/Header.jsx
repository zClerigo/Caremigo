import React from 'react';
import { Link } from 'react-router-dom';

const Header = () => {
  return (
    <header className="bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-24">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <img src="/Caremigo-logo-transparent.png" alt="Caremigo Logo" className="h-20" />
            </Link>
            <span className="text-blue-600 italic text-xl ml-4 gradient-text">Happy Sunday, Ziddani!</span>
          </div>
          
          <nav className="flex space-x-8">
            <Link to="/" className="text-blue-600 hover:text-blue-800 px-3 py-2 text-lg font-source-sans-pro italic">
              Home
            </Link>
            <button className="text-blue-600 hover:text-blue-800 px-3 py-2 text-lg font-source-sans-pro italic">
              Account
            </button>
            <button className="text-blue-600 hover:text-blue-800 px-3 py-2 text-lg font-source-sans-pro italic">
              About
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header; 