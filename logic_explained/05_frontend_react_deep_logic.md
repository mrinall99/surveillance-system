# ⚛️ 05. React Frontend — Deep Logic Breakdown

---

## 1. Frontend Component Tree & Architecture

The React client located in `client/src/` provides a modern Single Page Application (SPA) dashboard.

```
                         ┌─────────────────┐
                         │   main.jsx      │
                         └────────┬────────┘
                                  │
                         ┌─────────────────┐
                         │    App.jsx      │ (Routing & Auth State)
                         └────────┬────────┘
        ┌─────────────────────────┼─────────────────────────┐
        ▼                         ▼                         ▼
┌───────────────┐         ┌───────────────┐         ┌───────────────┐
│ Login.jsx     │         │ Dashboard.jsx │         │ StreamView.jsx│
└───────────────┘         └───────┬───────┘         └───────────────┘
                                  │
                 ┌────────────────┴────────────────┐
                 ▼                                 ▼
        ┌─────────────────┐               ┌─────────────────┐
        │ Alerts.jsx      │               │ Settings.jsx    │
        └─────────────────┘               └─────────────────┘
```

---

## 2. Key UI Logic & React Hook Mechanics

### A. Authentication & Private Routes (`App.jsx` & `Login.jsx`)
- **State**: `user` object and `token` stored in `localStorage`.
- **Logic**:
  1. On application load, `App.jsx` reads `localStorage.getItem('token')`.
  2. If token exists, user is routed directly to the `/dashboard`.
  3. If token is missing, user is redirected to `/login`.
  4. On logout, `localStorage.clear()` is called and state is reset to `null`.

---

### B. Live Stream Base64 Rendering (`StreamView.jsx`)
- **The Challenge**: How do you stream live video inside React without using heavy external video player plugins?
- **The Solution**: WebSockets + HTML Base64 JPEG strings.
- **Hook Mechanics**:
  ```jsx
  const [frameSrc, setFrameSrc] = useState(null);
  const [detections, setDetections] = useState([]);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8000');
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'frame') {
        // Update state with new base64 image string
        setFrameSrc(`data:image/jpeg;base64,${data.image}`);
        setDetections(data.detections);
      }
    };

    return () => ws.close(); // Clean up WebSocket connection when unmounting
  }, []);
  ```
- **Why `useRef` vs `useState` for Canvas overlay?**:
  `useState` triggers full component re-render on every frame. For low-latency bounding box overlays, `useRef` directly references the `<canvas>` DOM element, bypassing React's virtual DOM reconciliation for maximum FPS!

---

### C. Polygon Zone Drawing Logic (`ZoneEditor.jsx` / HTML5 Canvas)
- **Problem**: Security operators need to draw custom restricted zones directly on top of the camera feed using mouse clicks.
- **Logic**:
  1. User clicks on the canvas area.
  2. `onClick` handler captures mouse coordinates relative to canvas boundaries:
     $$\text{x} = \text{e.nativeEvent.offsetX}, \quad \text{y} = \text{e.nativeEvent.offsetY}$$
  3. Points are pushed into coordinate array: `points = [[x1, y1], [x2, y2], ...]`.
  4. Canvas 2D context draws line paths:
     ```javascript
     ctx.beginPath();
     ctx.moveTo(points[0][0], points[0][1]);
     points.forEach(([x, y]) => ctx.lineTo(x, y));
     ctx.closePath();
     ctx.fillStyle = 'rgba(255, 0, 0, 0.3)'; // Translucent Red Fill
     ctx.fill();
     ctx.stroke();
     ```
  5. The normalized polygon coordinate list is saved to the Node.js database via `POST /api/zones`.

---

### D. Real-Time Alert Chime & Visual Flashing
- **Logic**:
  - When `data.threat_level === 'CRITICAL'`, React executes:
    ```javascript
    const alertAudio = new Audio('/alert.mp3');
    alertAudio.play().catch(e => console.log('Audio autoplay blocked'));
    ```
  - State flag `isAlarmActive` sets a CSS class `.threat-flash` which animates a glowing red border around the dashboard frame.
