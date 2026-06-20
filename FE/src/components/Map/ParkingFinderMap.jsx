import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import axios from 'axios';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import RoutingMachine from './RoutingMachine';
import { useNavigate } from 'react-router-dom';
import parkingLotService from '../../services/api/parkingLotService';

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

// Tạo Custom Icon hiển thị chữ "P" màu xanh dương cho bãi đỗ của hệ thống
const systemParkingIcon = new L.DivIcon({
  html: `<div style="
    background-color: #2A85FF;
    color: white;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    font-weight: bold;
    font-size: 18px;
    border: 2px solid white;
    box-shadow: 0 2px 8px rgba(42,133,255,0.6);
    z-index: 1000;
  ">P</div>`,
  className: 'custom-system-parking-icon',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
});

// Tạo Custom Icon hiển thị vị trí người dùng (Chấm tròn màu xanh dương)
const userIcon = new L.DivIcon({
  html: `<div style="
    background-color: #2196F3;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    border: 3px solid white;
    box-shadow: 0 0 15px rgba(33, 150, 243, 0.8);
  "></div>`,
  className: 'custom-user-icon',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
  popupAnchor: [0, -10],
});

// Component con hỗ trợ di chuyển tâm bản đồ mượt mà (flyTo) khi tọa độ thay đổi
const MapController = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center && Array.isArray(center) && center.length === 2 && !isNaN(center[0]) && !isNaN(center[1])) {
      map.flyTo(center, 15, { duration: 1.5 });
    }
  }, [center, map]);
  return null;
};

const MapSync = ({ selectedId, markerRefs }) => {
  const map = useMap();
  useEffect(() => {
    if (selectedId && markerRefs.current && markerRefs.current[selectedId]) {
      const marker = markerRefs.current[selectedId];
      // Mở popup
      marker.openPopup();
      // Di chuyển bản đồ đến marker đó
      const latLng = marker.getLatLng();
      if (latLng && !isNaN(latLng.lat) && !isNaN(latLng.lng)) {
        map.flyTo(latLng, 17, { duration: 1.5 });
      }
    }
  }, [selectedId, map, markerRefs]);
  return null;
};

const ParkingFinderMap = ({ onDataLoad, selectedParkingId, onSelectParking }) => {
  const navigate = useNavigate();
  // Tâm bản đồ mặc định: Khu vực trung tâm (ví dụ: TP.HCM)
  const [center, setCenter] = useState([10.7769, 106.7009]);
  const [userLocation, setUserLocation] = useState(null);
  const [parkings, setParkings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [routingTarget, setRoutingTarget] = useState(null); // Lưu tọa độ bãi xe muốn chỉ đường đến

  // Lưu trữ các tham chiếu đến Marker để có thể điều khiển mở popup từ bên ngoài
  const markerRefs = React.useRef({});

  // Lấy danh sách bãi đỗ từ hệ thống (Backend)
  const fetchSystemParkings = async () => {
    try {
      const response = await parkingLotService.getParkingLots({ limit: 1000, status: 'active' });
      // ApiResponse.paginated returns { success, data, meta } OR response directly is data array
      let data = response.data || response;
      if (Array.isArray(data)) {
        return data.map(lot => ({
          id: lot._id,
          lat: lot.address?.coordinates?.lat,
          lon: lot.address?.coordinates?.lng,
          isSystem: true,
          tags: {
            name: lot.name,
            access: 'System Parking',
            fee: lot.settings?.pricePerHour ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(lot.settings.pricePerHour) + '/h' : 'Contact',
            capacity: lot.totalSlots,
          },
          lotData: lot
        })).filter(p => p.lat && p.lon);
      }
      return [];
    } catch (error) {
      console.error('Lỗi khi lấy bãi đỗ xe hệ thống:', error);
      return [];
    }
  };

  // Hàm gọi Overpass API để lấy bãi xe xung quanh 1.5km
  const fetchParkings = async (lat, lng) => {
    setLoading(true);

    // Câu lệnh OverpassQL: 
    // - Tìm các node, way, relation có tag "amenity"="parking"
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

    // Danh sách các Overpass API endpoint dự phòng để thử nếu endpoint chính bị lỗi (như lỗi 504)
    const endpoints = [
      'https://overpass-api.de/api/interpreter',
      'https://lz4.overpass-api.de/api/interpreter',
      'https://z.overpass-api.de/api/interpreter',
      'https://overpass.kumi.systems/api/interpreter',
      'https://overpass.osm.ch/api/interpreter'
    ];

    let success = false;

    for (const endpoint of endpoints) {
      try {
        // Overpass API ưu tiên nhận POST request định dạng x-www-form-urlencoded hoặc text thô
        const response = await axios.post(endpoint, query, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          timeout: 15000 // Đặt timeout 15s để thử server khác nếu phản hồi quá lâu
        });

        const elements = response.data.elements || [];
        const sysParkings = await fetchSystemParkings();
        const allParkings = [...sysParkings, ...elements];
        
        setParkings(allParkings);
        if (onDataLoad) onDataLoad(allParkings);

        success = true;
        break; // Nếu gọi thành công thì thoát vòng lặp
      } catch (error) {
        console.warn(`Lỗi khi gọi endpoint ${endpoint}:`, error.message);
        // Tiếp tục vòng lặp để thử endpoint tiếp theo
      }
    }

    if (!success) {
      console.error("Tất cả các Overpass API endpoints đều không khả dụng tại thời điểm này.");
      // Fallback: Just load system parkings if OSM fails
      const sysParkings = await fetchSystemParkings();
      setParkings(sysParkings);
      if (onDataLoad) onDataLoad(sysParkings);
    }

    setLoading(false);
  };

  // Gọi API lần đầu khi component vừa render
  useEffect(() => {
    // Tự động lấy vị trí hiện tại ngay khi vừa vào trang
    if ("geolocation" in navigator) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          if (latitude !== undefined && longitude !== undefined && !isNaN(latitude) && !isNaN(longitude)) {
            // Cập nhật tâm bản đồ và vị trí người dùng
            setCenter([latitude, longitude]);
            setUserLocation([latitude, longitude]);
            // Quét dữ liệu bãi xe tại tọa độ mới
            fetchParkings(latitude, longitude);
          } else {
            console.warn("Vị trí GPS không hợp lệ (NaN/undefined):", latitude, longitude);
            fetchParkings(center[0], center[1]);
          }
        },
        (error) => {
          console.warn("Không lấy được vị trí ban đầu (có thể do người dùng từ chối):", error);
          // Nếu lỗi hoặc từ chối, dùng vị trí mặc định (TP.HCM)
          fetchParkings(center[0], center[1]);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      // Nếu trình duyệt không hỗ trợ geolocation
      fetchParkings(center[0], center[1]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Hàm xử lý khi người dùng bấm nút "Tìm bãi xe xung quanh vị trí của tôi"
  const handleFindMyLocation = () => {
    if ("geolocation" in navigator) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          if (latitude !== undefined && longitude !== undefined && !isNaN(latitude) && !isNaN(longitude)) {
            // Cập nhật tâm bản đồ mới và vị trí người dùng
            setCenter([latitude, longitude]);
            setUserLocation([latitude, longitude]);
            // Quét lại dữ liệu bãi xe tại tọa độ mới
            fetchParkings(latitude, longitude);
          } else {
            console.error("Vị trí GPS không hợp lệ (NaN/undefined):", latitude, longitude);
            alert("Vị trí định vị từ GPS không hợp lệ.");
            setLoading(false);
          }
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
        {loading ? 'Finding...' : 'Find parking'}
      </button>

      {/* Nút hủy chỉ đường (hiển thị khi đang bật chế độ chỉ đường) */}
      {routingTarget && (
        <button
          onClick={() => setRoutingTarget(null)}
          style={{
            position: 'absolute',
            top: '70px',
            right: '20px',
            zIndex: 1000,
            padding: '10px 20px',
            backgroundColor: '#FF3B30',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.3s ease'
          }}
        >
          Cancel directions
        </button>
      )}

      <MapContainer
        center={center}
        zoom={15}
        style={{ width: '100%', height: '100%', zIndex: 1 }}
      >
        {/* Component rỗng xử lý logic flyTo */}
        <MapController center={center} />

        {/* Component đồng bộ chọn bãi xe từ Sidebar */}
        <MapSync selectedId={selectedParkingId} markerRefs={markerRefs} />

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Component Vẽ Đường đi (RoutingMachine) */}
        {userLocation && routingTarget && (
          <RoutingMachine userCoords={userLocation} parkingCoords={routingTarget} />
        )}

        {/* Marker hiển thị vị trí của người dùng */}
        {userLocation && (
          <Marker position={userLocation} icon={userIcon}>
            <Popup>
              <div style={{ textAlign: 'center', fontSize: '14px', margin: 0 }}>
                <strong>You are here</strong>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Lặp qua kết quả từ Overpass API để vẽ Marker */}
        {parkings.map((p) => {
          // Với node thì có lat/lon, với way/relation thì có center.lat/center.lon
          const lat = p.lat || (p.center && p.center.lat);
          const lon = p.lon || (p.center && p.center.lon);

          if (!lat || !lon) return null;

          const tags = p.tags || {};
          const name = tags.name || 'Building / Sidewalk Parking';

          // Xử lý xác định loại hình truy cập Public/Private
          let accessInfo = "Public";
          if (tags.access === 'private' || tags.parking === 'private' || tags.access === 'customers') {
            accessInfo = "Private / Customers";
          } else if (tags.access) {
            accessInfo = tags.access; // Hiển thị nguyên gốc nếu có tag access khác
          }

          return (
            <Marker
              key={p.id}
              position={[lat, lon]}
              icon={p.isSystem ? systemParkingIcon : parkingIcon}
              ref={(m) => {
                if (m) {
                  markerRefs.current[p.id] = m;
                }
              }}
              eventHandlers={{
                click: () => {
                  if (onSelectParking) onSelectParking(p.id);
                }
              }}
            >
              <Popup>
                <div style={{ minWidth: '180px', fontFamily: 'Arial, sans-serif' }}>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#1a1a1a' }}>
                    {name}
                  </h3>

                  <div style={{ fontSize: '14px', color: '#555', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <p style={{ margin: 0 }}>
                      <strong>Access:</strong> <span style={{ color: accessInfo.includes('Private') ? '#e74c3c' : '#27ae60', fontWeight: 'bold' }}>{accessInfo}</span>
                    </p>

                    {tags.fee && (
                      <p style={{ margin: 0 }}>
                        <strong>Fee:</strong> {tags.fee === 'yes' ? 'Yes' : tags.fee === 'no' ? 'Free' : tags.fee}
                      </p>
                    )}

                    {tags.capacity && (
                      <p style={{ margin: 0 }}>
                        <strong>Capacity:</strong> {tags.capacity} spaces
                      </p>
                    )}
                  </div>

                  {/* Nút Kích hoạt chỉ đường */}
                  <button
                    onClick={() => {
                      if (userLocation) {
                        setRoutingTarget([lat, lon]);
                      } else {
                        alert("Please enable 'Find parking' to get your location first!");
                      }
                    }}
                    style={{
                      marginTop: '12px',
                      padding: '8px 12px',
                      backgroundColor: '#2A85FF',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      width: '100%',
                      fontWeight: 'bold',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseOver={(e) => e.target.style.backgroundColor = '#1C6DD0'}
                    onMouseOut={(e) => e.target.style.backgroundColor = '#2A85FF'}
                  >
                    Get directions
                  </button>

                  {/* Nút Đặt chỗ (Chỉ hiển thị cho bãi xe hệ thống) */}
                  {p.isSystem && (
                    <button
                      onClick={() => navigate('/booking', {
                        state: {
                          spot: {
                            _id: p.lotData._id,
                            title: p.lotData.name,
                            price: p.lotData.settings?.pricePerHour || p.lotData.pricePerHour || 20000,
                            address: p.lotData.address ? [p.lotData.address.street, p.lotData.address.ward, p.lotData.address.district, p.lotData.address.city].filter(Boolean).join(', ') : '',
                            availableSlots: p.lotData.availableSlots,
                            totalSlots: p.lotData.totalSlots,
                            code: p.lotData.code,
                          }
                        }
                      })}
                      style={{
                        marginTop: '8px',
                        padding: '8px 12px',
                        backgroundColor: '#4CAF50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        width: '100%',
                        fontWeight: 'bold',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseOver={(e) => e.target.style.backgroundColor = '#45a049'}
                      onMouseOut={(e) => e.target.style.backgroundColor = '#4CAF50'}
                    >
                      Book a slot
                    </button>
                  )}
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
