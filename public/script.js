let map;

// Khởi tạo bản đồ
function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: { lat: 10.7769, lng: 106.7009 },
    zoom: 15,
  });
  updateGPS();
}

// Cập nhật vị trí GPS
function updateGPS() {
  fetch('/gps')
    .then(response => response.json())
    .then(data => {
      const position = { lat: data.latitude, lng: data.longitude };
      map.setCenter(position);
      new google.maps.Marker({
        position: position,
        map: map,
        title: 'Vehicle',
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#ff0000', // Chấm đỏ
          fillOpacity: 1,
          strokeWeight: 0
        }
      });
      setTimeout(updateGPS, 5000);
    })
    .catch(error => console.error('Error fetching GPS:', error));
}

// Hiển thị video stream
function displayVideoStream() {
  const video = document.getElementById('video-stream');
  fetch('/stream')
    .then(response => response.text())
    .then(html => {
      video.innerHTML = html;
    });
  setTimeout(displayVideoStream, 1000);
}

// Cập nhật thời gian và thông báo
function updateInfo() {
  const timeElement = document.getElementById('time');
  const notificationElement = document.getElementById('notification');
  const now = new Date().toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).replace(/\//g, '-').replace(',', ' -');
  timeElement.textContent = `Thời gian - Có người: ${now}`;

  fetch('/yolo')
    .then(response => response.json())
    .then(data => {
      notificationElement.textContent = `dd-mm-yy hh:mm:ss - Có người`;
    })
    .catch(error => console.error('Error fetching YOLO:', error));
  setTimeout(updateInfo, 5000);
}

// Khởi chạy khi tải trang
window.onload = () => {
  if (document.getElementById('map')) {
    initMap();
    displayVideoStream();
    updateInfo();
  }
};