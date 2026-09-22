# ⚛️ Frontend — React Client Explanation
# Folder: `client/src/`

---

## Entry Point: `main.jsx`

```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'   // ← loads all global CSS styles

// Find the <div id="root"> in index.html and inject the React app into it
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>   // ← StrictMode runs checks in development only
    <App />
  </React.StrictMode>,
)
```

**What it does:** This is the very first file that runs in the browser.
It mounts (attaches) the entire React application into the HTML page.

---

## `App.jsx` — Router & Auth Guard

```jsx
import { AuthProvider } from './context/AuthContext';
// AuthProvider wraps the whole app so EVERY page can access login state

import ProtectedRoute from './components/auth/ProtectedRoute';
// ProtectedRoute checks: "is the user logged in?"
// If NOT → redirects to /login
// If YES → shows the actual page

const App = () => {
  return (
    <AuthProvider>              // ← Makes auth state available everywhere
      <BrowserRouter>           // ← Enables page routing (like a multi-page app)
        <Routes>
          <Route path="/login" element={<Login />} />   // Login page (public)
          <Route path="/*" element={
            <ProtectedRoute>    // ← All other pages require login
              <AuthenticatedApp />
            </ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};
```

**Key idea:** `AuthProvider` is like a "global memory" — it remembers
whether the user is logged in. Any component anywhere can read this.

---

## `hooks/useSocket.js` — Real-Time Connection

```js
import { io } from 'socket.io-client';

export const useSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [frameData, setFrameData] = useState(null); // ← latest camera frame

  useEffect(() => {
    // Connect to Node.js server on port 5000
    const socket = io('http://localhost:5000', {
      withCredentials: true,   // ← send the auth cookie automatically
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => setIsConnected(true));   // ← connection success
    socket.on('disconnect', () => setIsConnected(false)); // ← lost connection

    // When Node.js sends a new camera frame:
    socket.on('frame_stream', (data) => {
      setFrameData(data);   // ← save it to state, triggers re-render
    });

    return () => socket.disconnect(); // cleanup when component unmounts
  }, []);

  return { socket, isConnected, frameData };
};
```

**What it does:**
- Opens a persistent WebSocket connection to the Node.js server
- Every time a new frame arrives from the Python engine, `frameData` updates
- React automatically re-renders any component that uses `frameData`

---

## `pages/Login.jsx` — Secret Key Login Form

**What the user sees:** A styled form asking for the "Owner Secret Key"

**Step by step:**
```
1. User types secret key into the password input
2. User clicks "AUTHORIZE & UNLOCK TERMINAL"
3. handleSubmit() fires:
   - calls: await login(secretKey)  ← from AuthContext
   - AuthContext sends POST to http://localhost:5000/api/auth/login
   - Node.js checks the key, returns a JWT token
   - The JWT is saved as an HTTP-only cookie (secure, not visible to JS)
4. On success → navigate('/') → goes to Dashboard
5. On failure → shows error message, shakes the card
```

**Lockout logic:**
```
- After 5 wrong attempts → server locks for 15 minutes
- lockout.remainingAttempts is shown in the UI ("3 attempts remaining")
- When locked: the form is hidden, replaced by a lock icon + countdown
```

---

## `pages/Dashboard.jsx` — Main Page

The most important page. Shows live camera feed + detection stats.

```jsx
const Dashboard = () => {
  const { isConnected, frameData } = useSocket(); // ← live data from socket

  // Unpack the payload from the Python engine:
  const payload    = frameData?.payload;
  const detections = payload?.detections || [];     // ← list of detected objects
  const threats    = payload?.threats    || [];     // ← threat events (from Node.js)
  const highestThreat = payload?.highest_threat;   // ← e.g. "CRITICAL"
  const latency    = payload?.inference_time_ms;   // ← how fast YOLO ran
```

**4 stat cards across the top:**
| Card | Shows | Color |
|------|-------|-------|
| Pipeline Latency | How long YOLO took (ms) | Cyan |
| Active Detections | Number of objects in frame | Green |
| Highest Threat Level | LOW / MEDIUM / HIGH / CRITICAL | Red/Violet |
| DEFCON Gauge | Security level visualizer | Dynamic |

**Main layout (2 columns):**
- Left (2/3 width): `<LiveFeed>` — the actual camera video
- Right (1/3 width): `<ThreatPanel>` — list of active threats

---

## `components/dashboard/LiveFeed.jsx` — Camera Stream Display

```jsx
// If not connected OR no frame received yet → show an offline placeholder
if (!isConnected || !frameData) return <OfflinePlaceholder />;

const { frame, payload } = frameData;
// "frame" is a Base64 string — a JPEG image encoded as text

return (
  <div className="relative w-full aspect-video">
    {/* Display the frame as an image */}
    <img
      src={`data:image/jpeg;base64,${frame}`}
      // ↑ Browser converts the Base64 text back into an actual image
      alt="Surveillance Feed"
    />

    {/* Zones overlay drawn on top of the image */}
    {showZones && <ZoneOverlay zones={activeZones} />}

    {/* Top bar: CAM-01 tag, Zones toggle button, Audio mute button */}
    {/* Bottom bar: object count, timestamp, inference time */}
  </div>
);
```

**Key concept — Base64 image:**
The Python engine converts each camera frame to a JPEG, then to a text
string (Base64). The browser can display this text directly as an image
using `data:image/jpeg;base64,...` as the `src`.

**Audio alert:**
If a CRITICAL breach is detected, `audioAlert.playRestrictedBreachBeep()` plays a beep sound in the browser using the Web Audio API.

---

## `pages/Events.jsx` — Threat History Log

- Fetches past HIGH/CRITICAL threat events from `GET /api/zones/events`
- Displays them in a filterable table (by threat level, date)
- Each row shows: time, camera, threat level, object detected, which zone

---

## `pages/Settings.jsx` — System Configuration

- Fetches current settings from `GET /api/config`
- Shows sliders/inputs for: confidence threshold, FPS, tracking on/off
- On save → sends `POST /api/config` to Node.js
- Node.js saves to `config.yaml` AND sends `UPDATE_CONFIG` to Python engine
- Python engine updates its detection threshold live (no restart needed)

---

## `context/AuthContext.jsx` — Global Login State

```jsx
// This wraps the whole app. Provides:
// - isAuthenticated: true/false
// - user: { username: 'OWNER', role: 'owner' }
// - login(secretKey): sends POST to server, saves auth state
// - logout(): clears cookie, resets state

// On app load it calls GET /api/auth/verify to check if still logged in
// (the cookie is sent automatically by the browser)
```

---

## `components/auth/ProtectedRoute.jsx`

```jsx
// Simple guard component:
if (!isAuthenticated) return <Navigate to="/login" />;
// If not logged in → redirect to login page
// If logged in → show the actual page (children)
return children;
```

---

## How Pages Get Live Data (Summary)

```
Python Engine sends frame every 33ms
     ↓
Node.js receives, processes, emits "frame_stream"
     ↓
useSocket.js receives → updates frameData state
     ↓
React re-renders Dashboard automatically
     ↓
LiveFeed shows new image, StatCards show new numbers
```
