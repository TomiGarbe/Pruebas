import React, { useState, useEffect, useContext, useRef } from 'react';
import { GoogleMap, Marker, DirectionsRenderer } from '@react-google-maps/api';
import { ListGroup, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LocationContext } from '../context/LocationContext';
import { RouteContext } from '../context/RouteContext';
import { getSucursalesLocations } from '../services/maps';
import '../styles/mapa.css';

const mapContainerStyle = { width: '100%', height: '100vh' };
const defaultCenter = { lat: -31.4167, lng: -64.1833 }; // Córdoba
const PROXIMITY_THRESHOLD = 0.05;
const DEVIATION_THRESHOLD = 50;

const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const toRad = (x) => (x * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const getBearing = (lat1, lng1, lat2, lng2) => {
  const toRad = (deg) => deg * Math.PI / 180;
  const toDeg = (rad) => rad * 180 / Math.PI;
  const dLon = toRad(lng2 - lng1);
  const y = Math.sin(dLon) * Math.cos(toRad(lat2));
  const x = Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
};

const Ruta = () => {
  const { userLocation } = useContext(LocationContext);
  const { currentEntity } = useContext(AuthContext);
  const { selectedMantenimientos, removeMantenimiento } = useContext(RouteContext);
  const navigate = useNavigate();
  const [sucursales, setSucursales] = useState([]);
  const [selectedSucursales, setSelectedSucursales] = useState([]);
  const [directions, setDirections] = useState(null);
  const [optimizedOrder, setOptimizedOrder] = useState([]);
  const [mapHeading, setMapHeading] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);
  const [routePolyline, setRoutePolyline] = useState(null);
  const [error, setError] = useState(null);
  const mapRef = useRef(null);

  useEffect(() => {
    if (!currentEntity) navigate('/login');
    else getSucursalesLocations().then(res => setSucursales(res.data)).catch(console.error);
  }, [currentEntity, navigate]);

  useEffect(() => {
    const sucursalIds = [...new Set(selectedMantenimientos.map(m => m.id_sucursal))].filter(Boolean);
    setSelectedSucursales(sucursalIds.map(id => String(id)));
  }, [selectedMantenimientos]);

  const onMapLoad = (map) => {
    mapRef.current = map;
    map.setTilt(45);
  };

  const startNavigation = () => {
    if (!userLocation || !mapRef.current || !directions) return;
    setIsNavigating(true);
    const leg = directions.routes[0].legs[0];
    const heading = getBearing(
      leg.start_location.lat(),
      leg.start_location.lng(),
      leg.steps[0].end_location.lat(),
      leg.steps[0].end_location.lng()
    );
    mapRef.current.panTo(userLocation);
    mapRef.current.setZoom(17);
    mapRef.current.setHeading(heading);
  };

  useEffect(() => {
    if (!navigator.geolocation || !window.google.maps.geometry) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { heading, latitude, longitude } = pos.coords;
        if (heading !== null && isNavigating && mapRef.current) {
          setMapHeading(heading);
          mapRef.current.setHeading(heading);
          mapRef.current.panTo({ lat: latitude, lng: longitude });
        }
      },
      console.error,
      { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [isNavigating]);

  useEffect(() => {
    if (!selectedSucursales.length || !userLocation || !sucursales.length) return;
    const origin = userLocation;
    let farthest = null;
    let maxDist = -1;
    selectedSucursales.forEach(id => {
      const s = sucursales.find(s => s.id == id);
      if (!s) return;
      const dist = haversineDistance(origin.lat, origin.lng, s.lat, s.lng);
      if (dist > maxDist) {
        maxDist = dist;
        farthest = s;
      }
    });

    const waypoints = selectedSucursales
      .filter(id => id !== String(farthest.id))
      .map(id => {
        const s = sucursales.find(s => s.id == id);
        return s ? { location: { lat: s.lat, lng: s.lng }, stopover: true } : null;
      })
      .filter(Boolean);

    const service = new window.google.maps.DirectionsService();
    service.route({
      origin,
      destination: { lat: farthest.lat, lng: farthest.lng },
      waypoints,
      optimizeWaypoints: true,
      travelMode: 'DRIVING',
    }, (res, status) => {
      if (status === 'OK') {
        setDirections(res);
        setRoutePolyline(new window.google.maps.Polyline({ path: res.routes[0].overview_path }));
        const order = res.routes[0].waypoint_order.map(i => selectedSucursales.filter(id => id !== String(farthest.id))[i]);
        setOptimizedOrder([...order, String(farthest.id)]);
      } else {
        console.error('Directions error:', status);
      }
    });
  }, [selectedSucursales, userLocation, sucursales]);

  return (
    <div className="map-container">
      {error && <div className="alert alert-danger">{error}</div>}
      <Button
        variant="primary"
        onClick={startNavigation}
        disabled={!selectedSucursales.length || !userLocation || !directions || isNavigating}
        className="mb-3">
        Iniciar Navegación
      </Button>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={userLocation || defaultCenter}
        zoom={16}
        onLoad={onMapLoad}
        options={{
          gestureHandling: 'cooperative',
          zoomControl: true,
          mapTypeId: 'roadmap',
        }}>
        {userLocation && (
          <Marker
            position={userLocation}
            icon={{
              path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
              scale: 5,
              rotation: mapHeading,
              fillColor: 'blue',
              fillOpacity: 1,
              strokeWeight: 1,
            }}
          />
        )}
        {selectedSucursales.map((id) => {
          const s = sucursales.find((s) => s.id == id);
          return s ? (
            <Marker key={id} position={{ lat: s.lat, lng: s.lng }} label={{ text: s.name, color: 'white' }} />
          ) : null;
        })}
        {directions && <DirectionsRenderer directions={directions} options={{ polylineOptions: { strokeColor: '#FF0000', strokeWeight: 5 } }} />}
      </GoogleMap>
      {optimizedOrder.length > 0 && (
        <div className="mt-3">
          <h5>Ruta Optimizada</h5>
          <ListGroup>
            {optimizedOrder.map((id, index) => {
              const s = sucursales.find((s) => s.id == id);
              return <ListGroup.Item key={id}>{index + 1}. {s?.name || 'Unknown'}</ListGroup.Item>;
            })}
          </ListGroup>
        </div>
      )}
    </div>
  );
};

export default Ruta;