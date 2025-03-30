import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';

function MedicalTerm() {
  const location = useLocation();
  const { term } = location.state;
  const [definition, setDefinition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDefinition = async () => {
      setLoading(true);
      setError(null);
      try {
        // Replace with your API endpoint for definitions
        const response = await axios.get(`YOUR_DEFINITION_API_ENDPOINT?term=${term}`);
        setDefinition(response.data.definition); // Adjust based on your API response structure
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    if (term) {
      fetchDefinition();
    }
  }, [term]);

  if (loading) {
    return <div>Loading definition...</div>;
  }

  if (error) {
    return <div>Error fetching definition: {error.message}</div>;
  }

  if (!definition) {
    return <div>No definition found for {term}.</div>;
  }

  return (
    <div>
      <h1>Definition of {term}</h1>
      <p>{definition}</p>
    </div>
  );
}

export default MedicalTerm;