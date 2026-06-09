import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import axios from 'axios';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix lỗi mất icon mặc định của Leaflet khi build bằng React/Vite
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Tạo Custom Icon hiển thị chữ "P" màu xanh lá cây
const parkingIcon = new L.DivIcon({
  html: `<div style="
    background-color: #4CAF50;
    color: white;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    font-weight: bold;
    font-size: 16px;
    border: 2px solid white;
    box-shadow: 0 2px 5px rgba(0,0,0,0.3);
  ">P</div>`,
  className: 'custom-parking-icon', // Reset class mặc định để không bị đè style
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  popupAnchor: [0, -15],
});

// Component con hỗ trợ di chuyển tâm bản đồ mượt mà (flyTo) khi tọa độ thay đổi
const MapController = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, 15, { duration: 1.5 });
    }
  }, [center, map]);
  return null;
};

const ParkingFinderMap = () => {
  // Tâm bản đồ mặc định: Khu vực trung tâm (ví dụ: TP.HCM)
  const [center, setCenter] = useState([10.7769, 106.7009]);
  const [parkings, setParkings] = useState([]);
  const [loading, setLoading] = useState(false);

  // Hàm gọi Overpass API để lấy bãi xe xung quanh 1.5km
  const fetchParkings = async (lat, lng) => {
    setLoading(true);
    
    // Câu lệnh OverpassQL: 
    // - Tìm các node, way, relation có tag "amenity=parking"
    // - (around:1500, lat, lng): Bán kính 1500m (1.5km) xung quanh tọa độ hiện tại
    // - [out:json]: Định dạng trả về là JSON
    // - out center: Trả về tọa độ trung tâm cho các dạng way và relation để có thể đặt Marker
    const query = `
      [out:json];
      (
        node["amenity"="parking"](around:1500, ${lat}, ${lng});
        way["amenity"="parking"](around:1500, ${lat}, ${lng});
        relation["amenity"="parking"](around:1500, ${lat}, ${lng});
      );
      out center;
    `;

    try {
      // Overpass API ưu tiên nhận POST request định dạng x-www-form-urlencoded hoặc text thô
      const response = await axios.post('https://overpass-api.de/api/interpreter', query, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      
      const elements = response.data.elements || [];
      setParkings(elements);
    } catch (error) {
      console.error("Lỗi khi gọi Overpass API lấy dữ liệu bãi xe:", error);
    } finally {
      setLoading(false);
    }
  };

  // Gọi API lần đầu khi component vừa render
  useEffect(() => {
    fetchParkings(center[0], center[1]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Hàm xử lý khi người dùng bấm nút "Tìm bãi xe xung quanh vị trí của tôi"
  const handleFindMyLocation = () => {
    if ("geolocation" in navigator) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          // Cập nhật tâm bản đồ mới
          setCenter([latitude, longitude]);
          // Quét lại dữ liệu bãi xe tại tọa độ mới
          fetchParkings(latitude, longitude);
        },
        (error) => {
          console.error("Lỗi lấy vị trí GPS:", error);
          alert("Không thể truy cập vị trí của bạn. Vui lòng cấp quyền cho trình duyệt.");
          setLoading(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      alert("Trình duyệt của bạn không hỗ trợ định vị (Geolocation).");
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      {/* Nút bấm định vị được thiết kế absolute nổi trên bản đồ */}
      <button 
        onClick={handleFindMyLocation}
        disabled={loading}
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          zIndex: 1000,
          padding: '12px 24px',
          backgroundColor: loading ? '#ccc' : '#ffffff',
          color: '#333',
          border: 'none',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontWeight: 'bold',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          transition: 'all 0.3s ease'
        }}
      >
        {loading ? '⏳ Đang quét...' : '📍 Tìm bãi xe quanh tôi'}
      </button>

      <MapContainer 
        center={center} 
        zoom={15} 
        style={{ width: '100%', height: '100%', zIndex: 1 }}
      >
        {/* Component rỗng xử lý logic flyTo */}
        <MapController center={center} />
        
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Lặp qua kết quả từ Overpass API để vẽ Marker */}
        {parkings.map((p) => {
          // Với node thì có lat/lon, với way/relation thì có center.lat/center.lon
          const lat = p.lat || (p.center && p.center.lat);
          const lon = p.lon || (p.center && p.center.lon);
          
          if (!lat || !lon) return null;

          const tags = p.tags || {};
          const name = tags.name || 'Bãi giữ xe tòa nhà/vỉa hè';
          
          // Xử lý xác định loại hình truy cập Public/Private
          let accessInfo = "Public (Công cộng)";
          if (tags.access === 'private' || tags.parking === 'private' || tags.access === 'customers') {
            accessInfo = "Private (Nội bộ / Khách hàng)";
          } else if (tags.access) {
            accessInfo = tags.access; // Hiển thị nguyên gốc nếu có tag access khác
          }

          return (
            <Marker key={p.id} position={[lat, lon]} icon={parkingIcon}>
              <Popup>
                <div style={{ minWidth: '180px', fontFamily: 'Arial, sans-serif' }}>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#1a1a1a' }}>
                    {name}
                  </h3>
                  
                  <div style={{ fontSize: '14px', color: '#555', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <p style={{ margin: 0 }}>
                      <strong>Truy cập:</strong> <span style={{ color: accessInfo.includes('Private') ? '#e74c3c' : '#27ae60', fontWeight: 'bold' }}>{accessInfo}</span>
                    </p>
                    
                    {tags.fee && (
                      <p style={{ margin: 0 }}>
                        <strong>Phí:</strong> {tags.fee === 'yes' ? 'Có thu phí' : tags.fee === 'no' ? 'Miễn phí' : tags.fee}
                      </p>
                    )}
                    
                    {tags.capacity && (
                      <p style={{ margin: 0 }}>
                        <strong>Sức chứa:</strong> {tags.capacity} xe
                      </p>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default ParkingFinderMap;
