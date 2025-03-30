import React from 'react';
import { Link } from 'react-router-dom';

function HighlightedLink({ word }) {
  return (
    <Link to="/medical-term" state={{ term: word }} className="bg-yellow-200 text-blue-500 underline hover:text-blue-700">
      {word}
    </Link>
  );
}

export default HighlightedLink;