import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthContext } from './AuthContext';
import { updateUserLocation } from '../services/maps';

export const LocationContext = createContext();

const LocationProvider = ({ children }) => {
  const { currentEntity } = useContext(AuthContext);
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    if (!currentEntity) {
      setUserLocation(null);
      return;
    }

    const updateLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            const location = { lat: latitude, lng: longitude };
            setUserLocation(location);
            const name = currentEntity.data.nombre || 'Unknown';
            updateUserLocation({ lat: latitude, lng: longitude, name })
              .catch(error => console.error('Error updating location:', error));
          },
          (error) => {
            console.error('Geolocation error:', error);
            setUserLocation(null); // Fallback to null if geolocation fails
          },
          { enableHighAccuracy: true }
        );
      } else {
        console.error('Geolocation not supported');
        setUserLocation(null);
      }
    };

    // Update location immediately and every 30 seconds
    updateLocation();
    const intervalId = setInterval(updateLocation, 30000);

    return () => clearInterval(intervalId);
  }, [currentEntity]);

  return (
    <LocationContext.Provider value={{ userLocation }}>
      {children}
    </LocationContext.Provider>
  );
};

export default LocationProvider;