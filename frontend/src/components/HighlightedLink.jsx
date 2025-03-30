import React from 'react';
import { Link } from 'react-router-dom';

function HighlightedLink({ word, isSpecialist }) {
  return (
    <Link 
      to="/medical-term"
      state={{ term: word, isSpecialist }}
      className="bg-yellow-200 text-blue-600 hover:text-blue-800 hover:underline"
    >
      {word}
    </Link>
  );
}

export default HighlightedLink;