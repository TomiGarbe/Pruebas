import React, { useState, useEffect, useContext, useRef } from 'react';
import { Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LocationContext } from '../context/LocationContext';
import { getSucursalesLocations, getCorrectivos, getPreventivos, deleteSucursal, deleteSelection } from '../services/maps';
import { renderToString } from 'react-dom/server';
import { FaMapMarkerAlt } from 'react-icons/fa';
import { bearing } from '@turf/turf';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-rotate/dist/leaflet-rotate.js';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import 'leaflet-routing-machine';
import 'leaflet-geometryutil';
import '../styles/mapa.css';

const mapContainerStyle = { width: '100%', height: '100vh' };
const defaultCenter = { lat: -31.4167, lng: -64.1833 };
const ARRIVAL_RADIUS = 50;
const ANIMATION_DURATION = 1000;

const Ruta = () => {
  const { currentEntity } = useContext(AuthContext);
  const { userLocation } = useContext(LocationContext);
  const navigate = useNavigate();
  const [sucursales, setSucursales] = useState([]);
  const [routingControl, setRoutingControl] = useState(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [error, setError] = useState(null);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const userMarkerRef = useRef(null);
  const routeMarkerRef = useRef(null);
  const prevLatLngRef = useRef(null);
  const animationFrameRef = useRef(null);
  const sucursalMarkersRef = useRef([]);

  const fetchData = async () => {
    if (!currentEntity?.data?.id || !userLocation) return;
    try {
      const [sucursalesResponse, correctivosResponse, preventivosResponse] = await Promise.all([
        getSucursalesLocations(),
        getCorrectivos(parseInt(currentEntity.data.id)),
        getPreventivos(parseInt(currentEntity.data.id))
      ]);
      const allSucursales = sucursalesResponse.data;
      const correctivoIds = correctivosResponse.data || [];
      const preventivoIds = preventivosResponse.data || [];
      const selectedSucursalIds = new Set([
        ...correctivoIds.map(item => Number(item.id_sucursal)),
        ...preventivoIds.map(item => Number(item.id_sucursal))
      ]);
      let filteredSucursales = allSucursales.filter(s => selectedSucursalIds.has(Number(s.id)))
      if (userLocation) {
        filteredSucursales = [...filteredSucursales].sort((a, b) => {
          const distA = Math.sqrt(
            Math.pow(userLocation.lat - a.lat, 2) +
            Math.pow(userLocation.lng - a.lng, 2)
          );
          const distB = Math.sqrt(
            Math.pow(userLocation.lat - b.lat, 2) +
            Math.pow(userLocation.lng - b.lng, 2)
          );
          return distA - distB;
        });
      }
      setSucursales(filteredSucursales);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Error al cargar datos');
    }
  };

  const centerOnUser = () => {
    if (mapInstanceRef.current && (prevLatLngRef.current || userLocation)) {
      mapInstanceRef.current.flyTo(prevLatLngRef.current || userLocation, 18, { duration: 1 });
    } else {
      console.log('Cannot center: map or user location not available');
    }
  };

  const toggleNavegacion = () => {
    if (isNavigating) {
      setIsNavigating(false);
    } else if (routingControl) {
      iniciarNavegacion(routingControl);
    } else {
      console.log('Cannot start navigation: no routing control');
    }
  };

  const iniciarNavegacion = (route) => {
    const waypoints = route.getPlan().getWaypoints();
    if (!waypoints || waypoints.length < 2) {
      console.log('Not enough waypoints to navigate');
      return;
    }

    waypoints.slice(1).map((wp, i) => ({
      start_location: [wp.latLng.lat, wp.latLng.lng],
      instructions: route.getPlan().instructions?.find(inst => inst.waypointIndex === i + 1)?.text || `Waypoint ${i + 1}`,
    }));

    centerOnUser();
    setIsNavigating(true);
  };

  const smoothPanTo = (targetLatLng, zoom, targetBearing) => {
    if (!mapInstanceRef.current || !targetLatLng) return;

    const map = mapInstanceRef.current;
    const startLatLng = map.getCenter();
    const startBearing = map.getBearing() || 0;
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / ANIMATION_DURATION, 1);

      const lat = startLatLng.lat + (targetLatLng.lat - startLatLng.lat) * progress;
      const lng = startLatLng.lng + (targetLatLng.lng - startLatLng.lng) * progress;
      let bearingDiff = targetBearing - startBearing;
      if (bearingDiff > 180) bearingDiff -= 360;
      if (bearingDiff < -180) bearingDiff += 360;
      const bearing = startBearing + bearingDiff * progress;

      const userLatLng = L.latLng(lat, lng);
      map.setView(userLatLng, zoom);
      map.setBearing(bearing);

      userMarkerRef.current?.remove();
      userMarkerRef.current = L.marker(userLatLng, {
        icon: L.divIcon({
          html: `<div style="width: 15px; height: 20px; background:rgb(22, 109, 196); clip-path: polygon(50% 0%, 0% 100%, 100% 100%);"></div>`,
          className: '',
          iconSize: [20, 20],
          iconAnchor: [10, 20],
        }),
      }).addTo(mapInstanceRef.current);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };

    cancelAnimationFrame(animationFrameRef.current);
    animationFrameRef.current = requestAnimationFrame(animate);
  };

  const generarRuta = () => {
    if (!sucursales.length || !mapInstanceRef.current || (!prevLatLngRef.current && !userLocation)) {
      console.log('Route generation skipped: missing data', {
        sucursalesLength: sucursales.length,
        mapInstanceExists: !!mapInstanceRef.current,
        userLocationExists: !!userLocation,
        prevLatLngExists: !!prevLatLngRef.current,
      });
      sucursalMarkersRef.current.forEach(marker => marker.remove());
      if (routeMarkerRef.current?.control) {
        mapInstanceRef.current.removeControl(routeMarkerRef.current.control);
      }
      if (routeMarkerRef.current?.polyline) {
        routeMarkerRef.current.polyline.remove();
      }
      return;
    }

    const waypoints = sucursales.map((s) => L.latLng(s.lat, s.lng)).filter(Boolean);

    if (routeMarkerRef.current?.control) {
      mapInstanceRef.current.removeControl(routeMarkerRef.current.control);
    }

    sucursalMarkersRef.current.forEach(marker => marker?.remove());
    sucursales.map(sucursal => {
      const marker = L.marker([sucursal.lat, sucursal.lng], {
        icon: L.divIcon({
          html: renderToString(<FaMapMarkerAlt style={{ color: 'rgb(22, 109, 196)', fontSize: '24px' }} />),
          className: 'sucursal-marker',
          iconSize: [20, 20],
          iconAnchor: [10, 20],
        }),
        title: sucursal.name
      }).addTo(mapInstanceRef.current);
      sucursalMarkersRef.current.push(marker);
    });

    const control = L.Routing.control({
      waypoints: [prevLatLngRef.current || userLocation, ...waypoints],
      router: L.Routing.osrmv1({ serviceUrl: import.meta.env.VITE_OSRM_URL }),
      lineOptions: { styles: [{ color: '#3399FF', weight: 5 }] },
      createMarker: () => null,
      addWaypoints: false,
      routeWhileDragging: false,
      show: false
    }).addTo(mapInstanceRef.current);

    control.on('routesfound', (e) => {
      const route = e.routes[0];
      const polyline = L.polyline(route.coordinates, { color: '#3399FF', weight: 5 });
      polyline.addTo(mapInstanceRef.current);
      if (routeMarkerRef.current?.polyline) {
        routeMarkerRef.current.polyline.remove();
      }
      routeMarkerRef.current = {
        control,
        polyline
      };
      if (!isNavigating) mapInstanceRef.current.fitBounds(polyline.getBounds());
      setRoutingControl(control);
    });

    control.on('routingerror', (err) => {
      console.error('Routing error:', err);
      setError('Error al calcular la ruta');
    });
  };

  const borrarRuta = () => {
    setSucursales([]);
    sucursalMarkersRef.current.forEach(marker => marker?.remove());
    if (routeMarkerRef.current?.control) {
      mapInstanceRef.current.removeControl(routeMarkerRef.current.control);
    }
    if (routeMarkerRef.current?.polyline) {
      routeMarkerRef.current.polyline.remove();
    }
    deleteSelection();
  };

  useEffect(() => {
    if (!mapRef.current) return;
    const map = L.map(mapRef.current, {
      center: userLocation || defaultCenter,
      zoom: 12,
      rotate: true,
      rotateControl: false,
    });
    mapInstanceRef.current = map;
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: 'OpenStreetMap'
    }).addTo(map);

    if (userLocation) {
      const currentLatLng = L.latLng(userLocation.lat, userLocation.lng);
      userMarkerRef.current?.remove();
      userMarkerRef.current = L.marker(currentLatLng, {
        icon: L.divIcon({
          html: `<div style="width: 15px; height: 20px; background:rgb(22, 109, 196); clip-path: polygon(50% 0%, 0% 100%, 100% 100%);"></div>`,
          className: '',
          iconSize: [20, 20],
          iconAnchor: [10, 20],
        }),
      }).addTo(map);
    }

    return () => {
      map.remove();
    };
  }, []);

  useEffect(() => {
    if (!currentEntity) {
      navigate('/login');
      return;
    }
    if (currentEntity.type !== 'cuadrilla') {
      navigate('/');
      return;
    }
  }, [currentEntity, navigate]);

  useEffect(() => {
    if (!navigator.geolocation) {
      console.log('Geolocation not available');
      return setError('Geolocalización no disponible');
    }

    if (!isNavigating) {
      generarRuta();
    }

    const watchId = navigator.geolocation.watchPosition(
      ({ coords }) => {
        const { latitude, longitude } = coords;
        const currentLatLng = L.latLng(latitude, longitude);

        if (isNavigating) {
          const reachedSucursalIds = sucursales
            .filter(sucursal => currentLatLng.distanceTo(L.latLng(sucursal.lat, sucursal.lng)) <= ARRIVAL_RADIUS)
            .map(sucursal => Number(sucursal.id));
          
          if (reachedSucursalIds.length) {
            const nuevasSucursales = sucursales.filter(s => !reachedSucursalIds.includes(Number(s.id)));
            setSucursales(nuevasSucursales);
            reachedSucursalIds.forEach(id => deleteSucursal(id));
          } else {
            generarRuta();
          }
        }

        if (isNavigating && mapInstanceRef.current?.setBearing) {
          let heading = 0;
          if (prevLatLngRef.current) {
            heading = bearing(
              [prevLatLngRef.current.lng, prevLatLngRef.current.lat],
              [longitude, latitude]
            );
          }
          smoothPanTo(currentLatLng, 20, -heading);
        }

        prevLatLngRef.current = currentLatLng;
      },
      (err) => {
        console.error('Geolocation error:', err);
        setError('No se pudo obtener la ubicación');
      },
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
      if (routeMarkerRef.current?.control) {
        mapInstanceRef.current.removeControl(routeMarkerRef.current.control);
      }
      if (routeMarkerRef.current?.polyline) {
        routeMarkerRef.current.polyline.remove();
      }
    };
  }, [sucursales]);

  useEffect(() => {
    fetchData();
  }, [currentEntity]);

  return (
    <div className="map-container">
      {error && <div className="alert alert-danger">{error}</div>}
      <Button variant="primary" onClick={centerOnUser} className="mb-2">
        Centrar en mi ubicación
      </Button>
      <Button variant={isNavigating ? 'danger' : 'success'} onClick={toggleNavegacion} className="mb-3 ms-2">
        {isNavigating ? 'Detener navegación' : 'Iniciar navegación'}
      </Button>
      <Button variant="primary" onClick={borrarRuta} className="mb-2">
        Borrar ruta
      </Button>
      <div ref={mapRef} style={mapContainerStyle}></div>
    </div>
  );
};

export default Ruta;