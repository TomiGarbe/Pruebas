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
const defaultCenter = { lat: -31.4167, lng: -64.1833 };
const PROXIMITY_THRESHOLD = 0.05; // 50 meters in km
const DEVIATION_THRESHOLD = 50; // 50 meters for route recalculation

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
  const { userLocation, setIsNavigating } = useContext(LocationContext);
  const { currentEntity } = useContext(AuthContext);
  const { selectedMantenimientos, removeMantenimiento } = useContext(RouteContext);
  const navigate = useNavigate();
  const [sucursales, setSucursales] = useState([]);
  const [selectedSucursales, setSelectedSucursales] = useState([]);
  const [directions, setDirections] = useState(null);
  const [optimizedOrder, setOptimizedOrder] = useState([]);
  const [mapHeading, setMapHeading] = useState(0);
  const [isNavigating, setIsNavigatingState] = useState(false);
  const [routePolyline, setRoutePolyline] = useState(null);
  const [error, setError] = useState(null);
  const [steps, setSteps] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const mapRef = useRef(null);
  const lastRouteRef = useRef(null);

  useEffect(() => {
    if (!currentEntity) navigate('/login');
    else getSucursalesLocations().then(res => setSucursales(res.data)).catch(err => {
      console.error(err);
      setError('Error al cargar sucursales');
    });
  }, [currentEntity, navigate]);

  useEffect(() => {
    const sucursalIds = [...new Set(selectedMantenimientos.map(m => m.id_sucursal))].filter(Boolean);
    setSelectedSucursales(sucursalIds.map(id => String(id)));
  }, [selectedMantenimientos]);

  useEffect(() => {
    setIsNavigating(isNavigating);
  }, [isNavigating, setIsNavigating]);

  const onMapLoad = (map) => {
    mapRef.current = map;
    map.setTilt(45);
    map.setMapTypeId('hybrid');
    console.log('Map loaded with tilt=45, mapTypeId=hybrid');
  };

  const iniciarNavegacion = (directionsResult) => {
    if (!userLocation || !mapRef.current || !directionsResult) return;
    const firstLeg = directionsResult.routes[0].legs[0];
    const heading = getBearing(
      firstLeg.start_location.lat(),
      firstLeg.start_location.lng(),
      firstLeg.steps[0].end_location.lat(),
      firstLeg.steps[0].end_location.lng()
    );
    setSteps(firstLeg.steps);
    mapRef.current.panTo(userLocation);
    mapRef.current.setZoom(20);
    mapRef.current.setOptions({ heading });
    setMapHeading(heading);
    setIsNavigatingState(true);
    console.log('Navigation started, zoomed to:', userLocation, 'Heading:', heading);
  };

  const centerOnUser = () => {
    if (!userLocation || !mapRef.current) return;
    mapRef.current.panTo(userLocation);
    mapRef.current.setZoom(20);
    console.log('Centered on user location:', userLocation);
  };

  useEffect(() => {
    if (!navigator.geolocation) {
      console.log('Geolocation not available');
      return;
    }
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { heading, latitude, longitude } = pos.coords;
        if (heading !== null && !isNaN(heading) && isNavigating && mapRef.current) {
          setMapHeading(heading);
          mapRef.current.setOptions({ heading });
          console.log('Map rotated to heading:', heading);
        }

        if (isNavigating && routePolyline && userLocation && window.google.maps.geometry?.polyline) {
          const isOnRoute = window.google.maps.geometry.polyline.isLocationOnEdge(
            new window.google.maps.LatLng(userLocation.lat, userLocation.lng),
            routePolyline,
            DEVIATION_THRESHOLD / 1000
          );
          if (!isOnRoute) {
            console.log('User deviated from route, recalculating...');
            setDirections(null);
            setRoutePolyline(null);
            setSteps([]);
            setCurrentStepIndex(0);
            lastRouteRef.current = null;
          }
        }

        if (steps.length > 0) {
          const index = steps.findIndex((step, i) => {
            const loc = step.start_location;
            const dist = haversineDistance(latitude, longitude, loc.lat(), loc.lng());
            return dist < 0.03;
          });
          if (index !== -1 && index !== currentStepIndex) {
            setCurrentStepIndex(index);
            console.log('Updated step index:', index);
          }
        }
      },
      console.error,
      { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [isNavigating, routePolyline, userLocation, steps, currentStepIndex]);

  useEffect(() => {
    if (!selectedSucursales.length || !userLocation || !sucursales.length) {
      setDirections(null);
      setRoutePolyline(null);
      setSteps([]);
      setOptimizedOrder([]);
      setIsNavigatingState(false);
      lastRouteRef.current = null;
      return;
    }

    if (directions && lastRouteRef.current === JSON.stringify(selectedSucursales)) {
      console.log('Route already calculated, skipping');
      return;
    }

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

    if (!farthest) {
      setError('No se pudo determinar la sucursal más lejana');
      return;
    }

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
        lastRouteRef.current = JSON.stringify(selectedSucursales);
        iniciarNavegacion(res);
        console.log('Route calculated, polyline set:', res.routes[0].overview_path);
      } else {
        console.error('Directions error:', status);
        setError('Error al calcular la ruta');
      }
    });
  }, [selectedSucursales, userLocation, sucursales]);

  useEffect(() => {
    if (!userLocation || !selectedSucursales.length) return;
    const visited = selectedSucursales.find(id => {
      const s = sucursales.find(s => s.id == id);
      if (!s) return false;
      return haversineDistance(userLocation.lat, userLocation.lng, s.lat, s.lng) < PROXIMITY_THRESHOLD;
    });
    if (visited) {
      setSelectedSucursales(prev => prev.filter(id => id !== String(visited)));
      selectedMantenimientos
        .filter(m => m.id_sucursal == visited)
        .forEach(m => removeMantenimiento(m.id));
      setDirections(null);
      setRoutePolyline(null);
      setSteps([]);
      setOptimizedOrder([]);
      setIsNavigatingState(false);
      lastRouteRef.current = null;
    }
  }, [userLocation, selectedSucursales, sucursales, selectedMantenimientos, removeMantenimiento]);

  return (
    <div className="map-container">
      {error && <div className="alert alert-danger">{error}</div>}
      <Button
        variant="primary"
        onClick={centerOnUser}
        disabled={!userLocation}
        className="mb-3"
      >
        Centrar en mi ubicación
      </Button>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={userLocation || defaultCenter}
        zoom={20}
        heading={mapHeading}
        onLoad={onMapLoad}
        options={{
          gestureHandling: 'cooperative',
          zoomControl: true,
          mapTypeId: 'hybrid',
          tilt: 45
        }}
      >
        {userLocation && (
          <Marker
            position={userLocation}
            icon={{
              path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
              scale: 5,
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
        {directions && (
          <DirectionsRenderer
            directions={directions}
            options={{ polylineOptions: { strokeColor: '#FF0000', strokeWeight: 5 }, preserveViewport: isNavigating }}
          />
        )}
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
      {steps.length > 0 && (
        <div className="mt-3">
          <h5>Instrucciones paso a paso</h5>
          <ListGroup>
            {steps.map((step, i) => (
              <ListGroup.Item
                key={i}
                active={i === currentStepIndex}
                dangerouslySetInnerHTML={{ __html: step.instructions }}
              />
            ))}
          </ListGroup>
        </div>
      )}
    </div>
  );
};

export default Ruta;