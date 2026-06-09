import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';

const RoutingMachine = ({ userCoords, parkingCoords }) => {
  const map = useMap();

  useEffect(() => {
    if (!userCoords || !parkingCoords) return;

    // Khởi tạo routing control
    const routingControl = L.Routing.control({
      waypoints: [
        L.latLng(userCoords[0], userCoords[1]),
        L.latLng(parkingCoords[0], parkingCoords[1])
      ],
      // Tùy chỉnh đường vẽ chỉ đường (Polyline)
      lineOptions: {
        styles: [
          { color: '#2A85FF', weight: 6, opacity: 0.8 } // Màu xanh dương đậm, hiện đại
        ],
        extendToWaypoints: true,
        missingRouteTolerance: 0
      },
      // Không cho phép người dùng kéo thả hay thêm điểm trung gian
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: true, // Tự động zoom bản đồ để vừa vặn với toàn bộ tuyến đường
      showAlternatives: false,
      
      // Ẩn bảng hướng dẫn chỉ đường bằng chữ (turn-by-turn text instructions)
      show: false,

      // Tạo marker trống cho các điểm (vì mình đã vẽ Marker riêng trong MapContainer rồi)
      createMarker: () => null 
    });

    // Thêm control vào bản đồ
    routingControl.addTo(map);

    // Hàm dọn dẹp (Cleanup Function): 
    // Rất quan trọng để tránh memory leak và lỗi in đè nhiều tuyến đường lên nhau 
    // mỗi khi component re-render hoặc người dùng chọn bãi đỗ xe khác.
    return () => {
      try {
        if (map && routingControl) {
          map.removeControl(routingControl);
        }
      } catch (error) {
        console.error("Lỗi khi xóa routing control:", error);
      }
    };
  }, [map, userCoords, parkingCoords]);

  return null; // Component này không render UI HTML, chỉ thao tác với Leaflet DOM
};

export default RoutingMachine;
