import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { GoogleMap, Marker } from '@react-google-maps/api';
import { getUsersLocations, getSucursalesLocations } from '../services/maps';
import '../styles/mapa.css';

const containerStyle = {
  width: '100%',
  height: '600px'
};

const defaultCenter = {
  lat: -31.416,
  lng: -64.183
};

const Mapa = () => {
  const [users, setUsers] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentEntity } = useContext(AuthContext);
  const navigate = useNavigate();

  const fetchLocations = async () => {
    try {
      const responseUsers = await getUsersLocations();
      console.log('Fetched locations:', responseUsers.data);
      const updatedUsers = responseUsers.data.map(user => ({
        id: user.id,
        name: user.name || 'Unknown',
        lat: parseFloat(user.lat),
        lng: parseFloat(user.lng)
      })).filter(user => !isNaN(user.lat) && !isNaN(user.lng) && user.lat !== 0 && user.lng !== 0);

      setUsers(updatedUsers);

      const responseSucursales = await getSucursalesLocations();

      const updatedSucursales = responseSucursales.data.map(sucursal => ({
        id: sucursal.id,
        name: sucursal.name || 'Unknown',
        lat: parseFloat(sucursal.lat),
        lng: parseFloat(sucursal.lng)
      })).filter(sucursal => !isNaN(sucursal.lat) && !isNaN(sucursal.lng) && sucursal.lat !== 0 && sucursal.lng !== 0);

      setSucursales(updatedSucursales);
    } catch (error) {
      setError('Error al cargar ubicaciones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!currentEntity) {
      navigate('/login');
    } else if (currentEntity.type !== 'usuario') {
      navigate('/');
    } else {
      fetchLocations();
      const intervalId = setInterval(fetchLocations, 30000);
      return () => clearInterval(intervalId);
    }
  }, [currentEntity, navigate]);

  if (loading) return <div className="map-container">Cargando mapa...</div>;
  if (error) return <div className="map-container">{error}</div>;

  return (
    <div className="map-container">
      <h2>Mapa de Usuarios y Sucursales</h2>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={defaultCenter}
        zoom={users.length > 0 ? 12 : 2}
        onLoad={map => console.log('Map loaded:', map)}
        onUnmount={map => console.log('Map unmounted:', map)}
      >
        {users.map(user => (
          <Marker
            key={user.id}
            position={{ lat: user.lat, lng: user.lng }}
            icon={{
              url: 'https://maps.google.com/mapfiles/kml/shapes/cabs.png',
              scaledSize: new window.google.maps.Size(40, 40),
              anchor: new window.google.maps.Point(20, 20),
              labelOrigin: new window.google.maps.Point(60, 20)
            }}
            label={{
              text: user.name,
              color: "#000",
              fontSize: "14px",
              fontWeight: "bold"
            }}
          />
        ))}
        {sucursales.map(sucursal => (
          <Marker
            key={sucursal.id}
            position={{ lat: sucursal.lat, lng: sucursal.lng }}
            title={sucursal.name}
          />
        ))}
      </GoogleMap>
    </div>
  );
};

export default Mapa;