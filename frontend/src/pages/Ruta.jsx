import React, { useState, useEffect, useContext, useRef } from 'react';
import { GoogleMap, Marker, DirectionsService, DirectionsRenderer } from '@react-google-maps/api';
import { Form, Button, ListGroup } from 'react-bootstrap';
import Select from 'react-select';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LocationContext } from '../context/LocationContext';
import { getSucursalesLocations } from '../services/maps';
import '../styles/mapa.css';

const mapContainerStyle = { width: '100%', height: '100vh' };
const defaultCenter = { lat: -31.4167, lng: -64.1833 }; // Córdoba center
const PROXIMITY_THRESHOLD = 0.05; // 50 meters in km

// Haversine formula to calculate distance between two points (in kilometers)
const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const toRad = (x) => (x * Math.PI) / 180;
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const Ruta = () => {
  const { userLocation } = useContext(LocationContext);
  const [sucursales, setSucursales] = useState([]);
  const [selectedSucursales, setSelectedSucursales] = useState([]);
  const [directions, setDirections] = useState(null);
  const [optimizedOrder, setOptimizedOrder] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mapHeading, setMapHeading] = useState(0);
  const { currentEntity } = useContext(AuthContext);
  const navigate = useNavigate();
  const mapRef = useRef(null);

  const fetchSucursales = async () => {
    setIsLoading(true);
    try {
      const response = await getSucursalesLocations();
      setSucursales(response.data);
    } catch (err) {
      setError('Error al cargar sucursales');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!currentEntity) {
      navigate('/login');
    } else {
      fetchSucursales();
    }
  }, [currentEntity, navigate]);

  useEffect(() => {
    if (!userLocation || !selectedSucursales.length) return;

    // Check proximity to each sucursal
    const visited = selectedSucursales.find((id) => {
      const sucursal = sucursales.find((s) => s.id === id);
      if (!sucursal) return false;
      const distance = haversineDistance(
        userLocation.lat,
        userLocation.lng,
        sucursal.lat,
        sucursal.lng
      );
      return distance < PROXIMITY_THRESHOLD;
    });

    if (visited) {
      setSelectedSucursales((prev) => prev.filter((id) => id !== visited));
      setDirections(null);
      setOptimizedOrder([]);
    }
  }, [userLocation, selectedSucursales, sucursales]);

  useEffect(() => {
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { heading } = position.coords;
        if (heading !== null && !isNaN(heading)) {
          setMapHeading(heading);
        }
      },
      (error) => console.error('Geolocation watch error:', error),
      { enableHighAccuracy: true }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const handleSelectChange = (selectedOptions) => {
    const selectedIds = selectedOptions ? selectedOptions.map((option) => option.value) : [];
    setSelectedSucursales(selectedIds);
    setDirections(null);
    setOptimizedOrder([]);
  };

  const calculateRoute = () => {
    if (selectedSucursales.length < 1) {
      setError('Seleccione al menos una sucursal');
      return;
    }
    if (selectedSucursales.length > 25) {
      setError('Máximo 25 sucursales permitidas');
      return;
    }
    setError(null);
    setDirections(null);
    setOptimizedOrder([]);

    const origin = userLocation || defaultCenter;

    // Find the farthest sucursal from origin
    let farthestSucursal = null;
    let maxDistance = -1;
    selectedSucursales.forEach((id) => {
      const sucursal = sucursales.find((s) => s.id === id);
      if (sucursal) {
        const distance = haversineDistance(
          origin.lat,
          origin.lng,
          sucursal.lat,
          sucursal.lng
        );
        if (distance > maxDistance) {
          maxDistance = distance;
          farthestSucursal = sucursal;
        }
      }
    });

    if (!farthestSucursal) {
      setError('No se pudo determinar la sucursal más lejana');
      return;
    }

    // Create waypoints excluding the farthest sucursal
    const waypoints = selectedSucursales
      .filter((id) => id !== farthestSucursal.id)
      .map((id) => {
        const sucursal = sucursales.find((s) => s.id === id);
        return {
          location: { lat: sucursal.lat, lng: sucursal.lng },
          stopover: true,
        };
      });

    const destination = { lat: farthestSucursal.lat, lng: farthestSucursal.lng };

    const directionsService = new window.google.maps.DirectionsService();
    directionsService.route(
      {
        origin,
        destination,
        waypoints,
        optimizeWaypoints: true,
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === window.google.maps.DirectionsStatus.OK) {
          setDirections(result);
          const optimizedIndices = result.routes[0].waypoint_order;
          console.log('Optimized waypoint indices:', optimizedIndices);
          const orderedSucursales = optimizedIndices.map((index) =>
            selectedSucursales.filter((id) => id !== farthestSucursal.id)[index]
          );
          // Include farthest sucursal as the last stop
          setOptimizedOrder([...orderedSucursales, farthestSucursal.id]);
        } else {
          setError('Error al calcular la ruta');
          console.error('Directions error:', status);
        }
      }
    );
  };

  const onMapLoad = (map) => {
    mapRef.current = map;
  };

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="map-container">
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}
      <Form className="mb-3">
        <Form.Group controlId="sucursales">
          <Form.Label>Seleccionar Sucursales</Form.Label>
          <Select
            isMulti
            options={sucursales.map((s) => ({ label: s.name, value: s.id }))}
            value={selectedSucursales.map((id) => {
              const sucursal = sucursales.find((s) => s.id === id);
              return sucursal ? { label: sucursal.name, value: id } : null;
            }).filter(Boolean)}
            onChange={handleSelectChange}
            placeholder="Seleccione sucursales"
            classNamePrefix="select"
          />
        </Form.Group>
        <Button className="mt-2" variant="primary" onClick={calculateRoute}>
          Calcular Ruta
        </Button>
      </Form>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={userLocation || defaultCenter}
        zoom={16} // Tighter zoom for navigation
        heading={mapHeading}
        onLoad={onMapLoad}
      >
        {userLocation && (
          <Marker
            position={userLocation}
            label={{ text: 'Cuadrilla', color: 'white' }}
            icon={{
              url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
            }}
          />
        )}
        {selectedSucursales.map((id) => {
          const sucursal = sucursales.find((s) => s.id === id);
          if (!sucursal) return null;
          return (
            <Marker
              key={sucursal.id}
              position={{ lat: sucursal.lat, lng: sucursal.lng }}
              label={{ text: sucursal.name, color: 'white' }}
            />
          );
        })}
        {directions && (
          <DirectionsRenderer
            directions={directions}
            options={{
              polylineOptions: { strokeColor: '#FF0000', strokeWeight: 5 },
            }}
          />
        )}
      </GoogleMap>
      {optimizedOrder.length > 0 && (
        <div className="mt-3">
          <h5>Ruta Optimizada</h5>
          <ListGroup>
            {optimizedOrder.map((id, index) => {
              const sucursal = sucursales.find((s) => s.id === id);
              return (
                <ListGroup.Item key={id}>
                  {index + 1}. {sucursal?.name || 'Unknown'}
                </ListGroup.Item>
              );
            })}
          </ListGroup>
        </div>
      )}
    </div>
  );
};

export default Ruta;