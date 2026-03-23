/**
 * Hotel Room Reservation System
 *
 * Hotel layout:
 *  - 10 floors, 97 rooms total
 *  - Floors 1–9: 10 rooms each → Room numbers 101–110, 201–210 ... 901–910
 *  - Floor 10:    7 rooms       → Room numbers 1001–1007
 *  - Lift/stairs on the LEFT side of building
 *
 * Travel time rules:
 *  - Horizontal (same floor): 1 min per adjacent room
 *  - Vertical (diff floors):  2 min per floor + walk to/from lift
 *
 * Booking rules:
 *  - Max 5 rooms per booking
 *  - Prefer same floor first
 *  - Otherwise minimise total travel time across floors
 */

import { useState, useCallback } from "react";

// ─────────────────────────────────────────────────────────────
// 1. HOTEL DATA MODEL
// ─────────────────────────────────────────────────────────────

/**
 * buildHotel()
 * Creates a Map where each key is a room number and the value
 * contains: floor number, position (1 = closest to lift), occupied status
 */
function buildHotel() {
  const rooms = new Map();

  // Floors 1–9: 10 rooms each
  for (let floor = 1; floor <= 9; floor++) {
    for (let pos = 1; pos <= 10; pos++) {
      const roomNo = floor * 100 + pos; // e.g., floor 1 pos 3 → room 103
      rooms.set(roomNo, { floor, position: pos, occupied: false });
    }
  }

  // Floor 10: only 7 rooms
  for (let pos = 1; pos <= 7; pos++) {
    rooms.set(1000 + pos, { floor: 10, position: pos, occupied: false });
  }

  return rooms;
}

// ─────────────────────────────────────────────────────────────
// 2. TRAVEL TIME CALCULATION
// ─────────────────────────────────────────────────────────────

/**
 * travelTime(roomA, roomB, hotel)
 *
 * Same floor:
 *   time = |posA - posB|
 *
 * Different floors:
 *   time = |floorA - floorB| × 2        (vertical via lift)
 *        + (posA - 1) + (posB - 1)      (walk to lift + walk from lift)
 *
 * Example: Room 105 (floor 1, pos 5) → Room 203 (floor 2, pos 3)
 *   vertical  = |1-2| × 2 = 2 min
 *   horizontal = (5-1) + (3-1) = 4+2 = 6 min
 *   total = 8 min
 */
function travelTime(roomA, roomB, hotel) {
  const a = hotel.get(roomA);
  const b = hotel.get(roomB);

  if (a.floor === b.floor) {
    // Same floor: just horizontal distance
    return Math.abs(a.position - b.position);
  }

  const vertical   = Math.abs(a.floor - b.floor) * 2;
  const horizontal = (a.position - 1) + (b.position - 1);
  return vertical + horizontal;
}

/**
 * groupTravelTime(rooms, hotel)
 *
 * Sort rooms by floor then position,
 * then return travel time from first room to last room.
 * This is the "total travel time" mentioned in the problem.
 */
function groupTravelTime(rooms, hotel) {
  if (rooms.length <= 1) return 0;

  const sorted = [...rooms].sort((a, b) => {
    const ra = hotel.get(a), rb = hotel.get(b);
    if (ra.floor !== rb.floor) return ra.floor - rb.floor;
    return ra.position - rb.position;
  });

  return travelTime(sorted[0], sorted[sorted.length - 1], hotel);
}

// ─────────────────────────────────────────────────────────────
// 3. BOOKING ALGORITHM
// ─────────────────────────────────────────────────────────────

/**
 * findBestRooms(n, hotel)
 *
 * Returns the optimal set of n rooms to book, or null if impossible.
 *
 * PASS 1 — Same floor:
 *   For each floor with ≥ n available rooms,
 *   slide a window of size n and find the minimum travel time group.
 *
 * PASS 2 — Multi-floor (if pass 1 fails):
 *   Use DFS/backtracking over all floors.
 *   For each floor, take the LEFTMOST k rooms (closest to lift).
 *   Find the combination of rooms across floors with minimum travel time.
 */
function findBestRooms(n, hotel) {
  // Group available rooms by floor, sorted by position (left to right)
  const byFloor = new Map();
  for (const [roomNo, info] of hotel) {
    if (!info.occupied) {
      if (!byFloor.has(info.floor)) byFloor.set(info.floor, []);
      byFloor.get(info.floor).push(roomNo);
    }
  }
  for (const [, rooms] of byFloor) {
    rooms.sort((a, b) => hotel.get(a).position - hotel.get(b).position);
  }

  const floors = [...byFloor.keys()].sort((a, b) => a - b);

  // Check if enough rooms exist at all
  const totalAvailable = floors.reduce((sum, f) => sum + byFloor.get(f).length, 0);
  if (totalAvailable < n) return null;

  let bestRooms = null;
  let bestTime  = Infinity;

  // ── PASS 1: Try same-floor booking ──────────────────────────
  for (const floor of floors) {
    const avail = byFloor.get(floor);
    if (avail.length >= n) {
      // Slide window of size n across available rooms on this floor
      for (let i = 0; i <= avail.length - n; i++) {
        const candidate = avail.slice(i, i + n);
        const t = groupTravelTime(candidate, hotel);
        if (t < bestTime) {
          bestTime  = t;
          bestRooms = candidate;
        }
      }
    }
  }

  // If a single-floor solution was found, return it
  if (bestRooms) return { rooms: bestRooms, travelTime: bestTime };

  // ── PASS 2: Multi-floor DFS ──────────────────────────────────
  // Enumerate every way to split n rooms across floors
  function dfs(floorIndex, remaining, chosen) {
    if (remaining === 0) {
      // We have a complete candidate — check its travel time
      const t = groupTravelTime(chosen, hotel);
      if (t < bestTime) {
        bestTime  = t;
        bestRooms = [...chosen];
      }
      return;
    }
    if (floorIndex >= floors.length) return;

    const avail  = byFloor.get(floors[floorIndex]);
    const maxTake = Math.min(remaining, avail.length);

    // Option 1: Skip this floor entirely
    dfs(floorIndex + 1, remaining, chosen);

    // Option 2: Take 1..maxTake rooms from this floor
    // Always take the LEFTMOST k (they're closest to the lift)
    for (let k = 1; k <= maxTake; k++) {
      dfs(floorIndex + 1, remaining - k, [...chosen, ...avail.slice(0, k)]);
    }
  }

  dfs(0, n, []);

  return bestRooms ? { rooms: bestRooms, travelTime: bestTime } : null;
}

// ─────────────────────────────────────────────────────────────
// 4. REACT COMPONENT
// ─────────────────────────────────────────────────────────────

export default function App() {
  // Hotel state: Map of all rooms
  const [hotel, setHotel] = useState(() => buildHotel());

  // Rooms highlighted after last booking
  const [lastBooked, setLastBooked] = useState([]);

  // Input: how many rooms to book
  const [numRooms, setNumRooms] = useState("");

  // Message bar (success / error)
  const [message, setMessage] = useState(null);

  // ── BOOK ────────────────────────────────────────────────────
  const handleBook = useCallback(() => {
    const n = parseInt(numRooms, 10);

    // Validate input
    if (isNaN(n) || n < 1 || n > 5) {
      setMessage({ type: "error", text: "Enter a number between 1 and 5." });
      setLastBooked([]);
      return;
    }

    const result = findBestRooms(n, hotel);

    if (!result) {
      setMessage({ type: "error", text: "Not enough rooms available!" });
      setLastBooked([]);
      return;
    }

    const { rooms, travelTime: tt } = result;

    // Mark rooms as occupied in state (immutable update)
    setHotel(prev => {
      const next = new Map(prev);
      for (const r of rooms) {
        next.set(r, { ...next.get(r), occupied: true });
      }
      return next;
    });

    setLastBooked(rooms);
    const sorted = [...rooms].sort((a, b) => a - b);
    setMessage({
      type: "success",
      text: `Booked rooms: ${sorted.join(", ")} — Travel time: ${tt} min`,
    });
  }, [numRooms, hotel]);

  // ── RANDOM OCCUPANCY ─────────────────────────────────────────
  const handleRandom = useCallback(() => {
    setHotel(prev => {
      const next = new Map(prev);
      for (const [roomNo, info] of next) {
        // ~40% chance each room is randomly occupied
        next.set(roomNo, { ...info, occupied: Math.random() < 0.4 });
      }
      return next;
    });
    setLastBooked([]);
    setMessage({ type: "success", text: "Random occupancy applied." });
  }, []);

  // ── RESET ────────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    setHotel(buildHotel());
    setLastBooked([]);
    setNumRooms("");
    setMessage(null);
  }, []);

  // ── STATS ────────────────────────────────────────────────────
  const occupied  = [...hotel.values()].filter(r => r.occupied).length;
  const available = 97 - occupied;

  // ── RENDER ───────────────────────────────────────────────────
  // Floors displayed top-to-bottom: Floor 10 at top, Floor 1 at bottom
  const floorOrder = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1];

  function getRoomsForFloor(floor) {
    const count = floor === 10 ? 7 : 10;
    return Array.from({ length: count }, (_, i) =>
      floor === 10 ? 1000 + i + 1 : floor * 100 + i + 1
    );
  }

  return (
    <div style={styles.app}>

      {/* ── Header ── */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={{ fontSize: 36 }}>🏨</span>
          <div>
            <div style={styles.title}>Hotel Reservation System</div>
            <div style={styles.subtitle}>97 Rooms · 10 Floors · Smart Booking</div>
          </div>
        </div>
        <div style={styles.stats}>
          <div style={styles.statBadge}>
            <span style={{ ...styles.dot, background: "#22c55e" }} />
            {available} Available
          </div>
          <div style={styles.statBadge}>
            <span style={{ ...styles.dot, background: "#ef4444" }} />
            {occupied} Occupied
          </div>
        </div>
      </div>

      {/* ── Controls ── */}
      <div style={styles.controls}>
        <input
          type="number"
          min="1"
          max="5"
          value={numRooms}
          onChange={e => setNumRooms(e.target.value)}
          placeholder="Rooms (1–5)"
          style={styles.input}
          onKeyDown={e => e.key === "Enter" && handleBook()}
        />
        <button style={{ ...styles.btn, background: "#3b82f6" }} onClick={handleBook}>
          Book
        </button>
        <button style={{ ...styles.btn, background: "#8b5cf6" }} onClick={handleRandom}>
          Random
        </button>
        <button style={{ ...styles.btn, background: "#475569" }} onClick={handleReset}>
          Reset
        </button>
      </div>

      {/* ── Message Bar ── */}
      {message && (
        <div style={{
          ...styles.message,
          background:   message.type === "success" ? "#052e16" : "#2d0707",
          borderColor:  message.type === "success" ? "#16a34a" : "#dc2626",
          color:        message.type === "success" ? "#86efac" : "#fca5a5",
        }}>
          {message.type === "success" ? "✅" : "❌"} {message.text}
        </div>
      )}

      {/* ── Legend ── */}
      <div style={styles.legend}>
        {[
          { color: "#1e293b", border: "1px solid #475569", label: "Available" },
          { color: "#ef4444", label: "Occupied" },
          { color: "#f59e0b", label: "Just Booked" },
        ].map(({ color, border, label }) => (
          <div key={label} style={styles.legendItem}>
            <div style={{ width: 14, height: 14, borderRadius: 3, background: color, border: border || "none" }} />
            <span style={{ fontSize: 12, color: "#94a3b8" }}>{label}</span>
          </div>
        ))}
      </div>

      {/* ── Hotel Grid ── */}
      <div style={styles.gridWrapper}>

        {/* Left column: Lift/Stairs indicator */}
        <div style={styles.liftCol}>
          <div style={styles.liftLabel}>🛗 Lift</div>
        </div>

        {/* Room grid, one row per floor */}
        <div style={styles.floorsCol}>
          {floorOrder.map(floor => (
            <div key={floor} style={styles.floorRow}>

              {/* Floor label */}
              <div style={styles.floorLabel}>
                {floor === 10 ? "10" : `F${floor}`}
              </div>

              {/* Room cells */}
              <div style={styles.roomsRow}>
                {getRoomsForFloor(floor).map(roomNo => {
                  const info        = hotel.get(roomNo);
                  const isJustBooked = lastBooked.includes(roomNo);

                  // Colour: amber = just booked, red = occupied, dark = free
                  let bg = "#1e293b";
                  if (info.occupied && !isJustBooked) bg = "#ef4444";
                  if (isJustBooked)                   bg = "#f59e0b";

                  return (
                    <div
                      key={roomNo}
                      title={`Room ${roomNo} — ${info.occupied ? "Occupied" : "Available"}`}
                      style={{
                        ...styles.room,
                        background: bg,
                        boxShadow: isJustBooked
                          ? "0 0 0 2px #fbbf24, 0 0 12px #f59e0b88"
                          : "none",
                        transform: isJustBooked ? "scale(1.12)" : "scale(1)",
                      }}
                    >
                      <span style={styles.roomNumber}>{roomNo}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 5. STYLES (inline — no external CSS file needed)
// ─────────────────────────────────────────────────────────────

const styles = {
  app: {
    fontFamily: "'Courier New', monospace",
    background: "#0f172a",
    minHeight: "100vh",
    color: "#e2e8f0",
    padding: 24,
    boxSizing: "border-box",
  },
  header: {
    display: "flex", justifyContent: "space-between",
    alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 24,
  },
  headerLeft: { display: "flex", alignItems: "center", gap: 12 },
  title: {
    fontSize: 22, fontWeight: "bold", color: "#f1f5f9", letterSpacing: 1,
  },
  subtitle: { fontSize: 12, color: "#94a3b8", marginTop: 2 },
  stats: { display: "flex", gap: 12 },
  statBadge: {
    display: "flex", alignItems: "center", gap: 6,
    background: "#1e293b", padding: "6px 14px", borderRadius: 20,
    fontSize: 13, border: "1px solid #334155",
  },
  dot: { width: 8, height: 8, borderRadius: "50%", display: "inline-block" },
  controls: {
    display: "flex", gap: 10, flexWrap: "wrap",
    alignItems: "center", marginBottom: 16,
  },
  input: {
    background: "#1e293b", border: "1px solid #475569", color: "#f1f5f9",
    padding: "10px 14px", borderRadius: 8, fontSize: 14,
    fontFamily: "inherit", width: 140, outline: "none",
  },
  btn: {
    padding: "10px 20px", border: "none", borderRadius: 8,
    fontSize: 14, fontFamily: "inherit", cursor: "pointer",
    fontWeight: "bold", color: "#fff", letterSpacing: 0.5,
  },
  message: {
    padding: "10px 16px", borderRadius: 8,
    marginBottom: 16, fontSize: 13, border: "1px solid",
  },
  legend: { display: "flex", gap: 20, marginBottom: 20, flexWrap: "wrap" },
  legendItem: { display: "flex", alignItems: "center", gap: 6 },
  gridWrapper: { display: "flex", overflowX: "auto", paddingBottom: 8 },
  liftCol: {
    display: "flex", flexDirection: "column",
    justifyContent: "center", alignItems: "center",
    background: "#1e293b", borderRadius: "10px 0 0 10px",
    padding: "10px 8px", minWidth: 44,
    border: "1px solid #334155", borderRight: "none",
  },
  liftLabel: {
    writingMode: "vertical-rl", textOrientation: "mixed",
    fontSize: 11, color: "#64748b", letterSpacing: 2,
  },
  floorsCol: {
    display: "flex", flexDirection: "column", gap: 4,
    background: "#0f172a", padding: 12,
    border: "1px solid #334155", borderRadius: "0 10px 10px 0",
  },
  floorRow: { display: "flex", alignItems: "center", gap: 8 },
  floorLabel: {
    width: 28, textAlign: "right", fontSize: 11,
    color: "#64748b", flexShrink: 0, fontWeight: "bold",
  },
  roomsRow: { display: "flex", gap: 4 },
  room: {
    width: 42, height: 34, borderRadius: 5,
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "default", transition: "transform 0.2s, box-shadow 0.2s", flexShrink: 0,
  },
  roomNumber: {
    fontSize: 9, color: "#cbd5e1", fontWeight: "bold", userSelect: "none",
  },
};