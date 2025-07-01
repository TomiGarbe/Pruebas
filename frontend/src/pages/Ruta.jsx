import React, { useState, useEffect, useContext, useRef } from 'react';
import { ListGroup, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LocationContext } from '../context/LocationContext';
import { RouteContext } from '../context/RouteContext';
import { getSucursalesLocations } from '../services/maps';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-rotate/dist/leaflet-rotate.js';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import 'leaflet-routing-machine';
import 'leaflet-geometryutil';
import '../styles/mapa.css';

const mapContainerStyle = { width: '100%', height: '100vh' };
const defaultCenter = { lat: -31.4167, lng: -64.1833 };
const PROXIMITY_THRESHOLD = 0.05; // 50 meters in km
const DEVIATION_THRESHOLD = 50; // 50 meters for route recalculation

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
  const [routingControl, setRoutingControl] = useState(null);
  const [optimizedOrder, setOptimizedOrder] = useState([]);
  const [isNavigating, setIsNavigatingState] = useState(false);
  const [routePolyline, setRoutePolyline] = useState(null);
  const [error, setError] = useState(null);
  const [steps, setSteps] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const lastRouteRef = useRef(null);

  useEffect(() => {
    if (!currentEntity) navigate('/login');
    else getSucursalesLocations().then(res => {
      console.log('Fetched sucursales:', res.data);
      setSucursales(res.data);
    }).catch(err => {
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

  useEffect(() => {
    if (!mapRef.current) {
      console.error('mapRef is null');
      return;
    }

    mapInstanceRef.current = L.map(mapRef.current, {
      center: [userLocation?.lat || defaultCenter.lat, userLocation?.lng || defaultCenter.lng],
      zoom: 20,
      rotate: true,
      rotateControl: false
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(mapInstanceRef.current);

    mapInstanceRef.current.invalidateSize();
    console.log('Map initialized');

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        console.log('Map unmounted');
      }
    };
  }, []);

  const iniciarNavegacion = (route) => {
    if (!userLocation || !mapInstanceRef.current || !route) return;
    const waypoints = route.getPlan().getWaypoints();
    if (!waypoints || waypoints.length < 2) {
      setError('Ruta inválida: insuficientes waypoints');
      return;
    }
    const instructions = waypoints.slice(1).map((wp, i) => {
      const instruction = route.getPlan().instructions && route.getPlan().instructions.find(inst => inst.waypointIndex === i + 1);
      return {
        start_location: [wp.latLng.lat, wp.latLng.lng],
        instructions: instruction ? instruction.text : `Dirígete a waypoint ${i + 1}`
      };
    });
    const nextWaypoint = instructions[0];
    const heading = nextWaypoint ? getBearing(
      userLocation.lat,
      userLocation.lng,
      nextWaypoint.start_location[0],
      nextWaypoint.start_location[1]
    ) : 0;
    setSteps(instructions);
    mapInstanceRef.current.setView([userLocation.lat, userLocation.lng], 20);
    mapInstanceRef.current.setBearing(heading);
    setIsNavigatingState(true);
    console.log('Navigation started, zoomed to:', userLocation, 'Heading:', heading);
  };

  const centerOnUser = () => {
    if (!userLocation || !mapInstanceRef.current) return;
    mapInstanceRef.current.setView([userLocation.lat, userLocation.lng], 20);
    console.log('Centered on user location:', userLocation);
  };

  useEffect(() => {
    if (!navigator.geolocation) {
      console.log('Geolocation not available');
      setError('Geolocalización no disponible');
      return;
    }
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        if (isNavigating && steps.length > 0 && mapInstanceRef.current) {
          const nextStep = steps[currentStepIndex] || steps[0];
          const heading = getBearing(
            latitude,
            longitude,
            nextStep.start_location[0],
            nextStep.start_location[1]
          );
          mapInstanceRef.current.setBearing(heading);
          console.log('Map rotated to route heading:', heading);
        }

        if (isNavigating && routePolyline && userLocation) {
          const point = L.latLng(userLocation.lat, userLocation.lng);
          const closest = L.GeometryUtil.closest(mapInstanceRef.current, routePolyline, point);
          const isOnRoute = closest && closest.distance < DEVIATION_THRESHOLD;
          if (!isOnRoute) {
            console.log('User deviated from route, recalculating...');
            setRoutingControl(null);
            setRoutePolyline(null);
            setSteps([]);
            setCurrentStepIndex(0);
            lastRouteRef.current = null;
          }
        }

        if (steps.length > 0) {
          const index = steps.findIndex((step, i) => {
            const loc = step.start_location;
            const dist = L.latLng(latitude, longitude).distanceTo(L.latLng(loc[0], loc[1])) / 1000;
            return dist < 0.03;
          });
          if (index !== -1 && index !== currentStepIndex) {
            setCurrentStepIndex(index);
            console.log('Updated step index:', index);
          }
        }
      },
      (err) => {
        console.error('Geolocation error:', err);
        setError('No se pudo obtener la ubicación. Habilite los servicios de ubicación o verifique los permisos en su navegador.');
        if (!userLocation) {
          setIsNavigatingState(false);
          mapInstanceRef.current?.setView([defaultCenter.lat, defaultCenter.lng], 20);
        }
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 30000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [isNavigating, routePolyline, userLocation, steps, currentStepIndex]);

  useEffect(() => {
    if (!selectedSucursales.length || !userLocation || !sucursales.length || !mapInstanceRef.current) {
      if (routingControl) {
        mapInstanceRef.current.removeControl(routingControl);
        setRoutingControl(null);
      }
      setRoutePolyline(null);
      setSteps([]);
      setOptimizedOrder([]);
      setIsNavigatingState(false);
      lastRouteRef.current = null;
      return;
    }

    const currentRouteKey = JSON.stringify(selectedSucursales);
    if (routingControl && lastRouteRef.current === currentRouteKey) {
      console.log('Route already calculated, skipping');
      return;
    }

    let farthest = null;
    let maxDist = -1;
    selectedSucursales.forEach(id => {
      const s = sucursales.find(s => s.id == id);
      if (!s) return;
      const dist = L.latLng(userLocation.lat, userLocation.lng).distanceTo(L.latLng(s.lat, s.lng)) / 1000;
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
        return s ? L.latLng(s.lat, s.lng) : null;
      })
      .filter(Boolean);

    if (routingControl) {
      mapInstanceRef.current.removeControl(routingControl);
    }

    const control = L.Routing.control({
      waypoints: [L.latLng(userLocation.lat, userLocation.lng), ...waypoints, L.latLng(farthest.lat, farthest.lng)],
      router: L.Routing.osrmv1({
        serviceUrl: 'http://router.project-osrm.org/route/v1'
      }),
      lineOptions: {
        styles: [{ color: '#FF0000', weight: 5 }]
      },
      createMarker: () => null,
      addWaypoints: false,
      routeWhileDragging: false
    }).addTo(mapInstanceRef.current);

    control.on('routesfound', (e) => {
      const route = e.routes[0];
      console.log('Route data:', route);
      setRoutePolyline(L.polyline(route.coordinates, { color: '#FF0000', weight: 5 }));
      setOptimizedOrder([...waypoints.map((_, i) => selectedSucursales[i]), String(farthest.id)]);
      lastRouteRef.current = currentRouteKey;
      setRoutingControl(control);
      iniciarNavegacion(control);
      console.log('Route calculated, polyline set:', route.coordinates);
    });

    control.on('routingerror', (err) => {
      console.error('Routing error:', err);
      setError('Error al calcular la ruta');
    });
  }, [selectedSucursales, userLocation, sucursales]);

  useEffect(() => {
    if (!userLocation || !selectedSucursales.length || !mapInstanceRef.current) return;

    const userMarkers = [];
    const sucursalMarkers = [];

    if (userLocation) {
      const userMarker = L.marker([userLocation.lat, userLocation.lng], {
        icon: L.divIcon({
          html: `<div style="width: 20px; height: 20px; background: blue; clip-path: polygon(50% 0%, 0% 100%, 100% 100%); transform: translateY(-50%);"></div>`,
          className: '',
          iconSize: [20, 20],
          iconAnchor: [10, 20]
        })
      }).addTo(mapInstanceRef.current);
      userMarkers.push(userMarker);
    }

    sucursalMarkers.push(...selectedSucursales.map(id => {
      const s = sucursales.find(s => s.id == id);
      if (!s) return null;
      const marker = L.marker([s.lat, s.lng], {
        icon: L.divIcon({
          html: `<div style="color: white; font-size: 14px; font-weight: bold; transform: translate(10px, -20px);">${s.name}</div>`,
          className: '',
          iconSize: [40, 40],
          iconAnchor: [20, 20]
        })
      }).addTo(mapInstanceRef.current);
      return marker;
    }).filter(Boolean));

    return () => {
      userMarkers.forEach(marker => marker.remove());
      sucursalMarkers.forEach(marker => marker.remove());
      if (routePolyline) routePolyline.remove();
    };
  }, [userLocation, selectedSucursales, sucursales]);

  useEffect(() => {
    if (!userLocation || !selectedSucursales.length) return;
    const visited = selectedSucursales.find(id => {
      const s = sucursales.find(s => s.id == id);
      if (!s) return false;
      return L.latLng(userLocation.lat, userLocation.lng).distanceTo(L.latLng(s.lat, s.lng)) / 1000 < PROXIMITY_THRESHOLD;
    });
    if (visited) {
      setSelectedSucursales(prev => prev.filter(id => id !== String(visited)));
      selectedMantenimientos
        .filter(m => m.id_sucursal == visited)
        .forEach(m => removeMantenimiento(m.id));
      setRoutingControl(null);
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
      <div ref={mapRef} style={mapContainerStyle}></div>
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
              >
                {step.instructions}
              </ListGroup.Item>
            ))}
          </ListGroup>
        </div>
      )}
    </div>
  );
};

export default Ruta;