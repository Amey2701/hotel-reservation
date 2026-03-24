# 🏨 Hotel Room Reservation System

### Smart Allocation Engine for Optimal Guest Experience

A high-performance room allocation system for a 97-room, 10-floor hotel, engineered to **minimize guest travel time** using a hybrid **greedy + backtracking optimization algorithm**.

---

## 🔗 Live Demo & Repository

* 🚀 **Live Application:**
  [https://hotel-reservation-lovat-omega.vercel.app](https://hotel-reservation-lovat-omega.vercel.app)

* 💻 **Source Code:**
  [https://github.com/Amey2701/hotel-reservation](https://github.com/Amey2701/hotel-reservation)

---

## 📌 Overview

This project simulates a real-world **hotel reservation system** with intelligent room assignment. The core challenge is not just booking rooms—but **optimally allocating them** under constraints to reduce guest inconvenience.

The system incorporates:

* Spatial modeling of rooms
* Cost-based optimization (travel time)
* Multi-strategy allocation logic
* Real-time UI feedback

---

## 🧩 Problem Definition

Given:

* A hotel with **fixed room topology**
* A booking request of **1 to 5 rooms**

Goal:

> Allocate rooms such that **total travel time between them is minimized**, while respecting structural constraints.

---

## 🏢 Hotel Layout Modeling

### Structure

* **Total Floors:** 10
* **Total Rooms:** 97

| Floor | Rooms                             |
| ----- | --------------------------------- |
| 1–9   | 10 rooms each (101–110 → 901–910) |
| 10    | 7 rooms (1001–1007)               |

### Spatial Properties

* Lift & stairs located on the **LEFT**
* Rooms indexed left → right
* Room `X01` = closest to lift

---

## ⏱️ Travel Cost Model

Travel time is computed using a **weighted Manhattan-like distance function**:

### Same Floor Movement

```
time = |posA - posB|
```

### Cross-Floor Movement

```
time = |floorA - floorB| * 2 + (posA - 1) + (posB - 1)
```

### Group Travel Time

* Rooms are sorted by `(floor, position)`
* Travel time = distance between **first and last room**

---

## 🧠 Allocation Engine

The allocation algorithm is designed as a **two-phase optimization pipeline**:

---

### ✅ Phase 1 — Greedy Same-Floor Optimization

**Objective:** Maximize locality (best-case scenario)

**Approach:**

* Iterate through each floor
* Identify contiguous available rooms
* Apply **sliding window (size = N)**
* Select window with **minimum positional span**

**Why this works:**

* Same-floor allocation eliminates vertical cost entirely
* Sliding window ensures O(n) efficiency per floor

---

### 🔁 Phase 2 — Multi-Floor Backtracking (DFS)

Triggered when same-floor allocation is not feasible.

**Approach:**

* Use **Depth-First Search with backtracking**
* At each floor:

  * Select up to K available rooms (closest to lift)
* Generate all valid combinations of N rooms
* Compute travel time for each combination
* Return globally optimal solution

---

### ⚡ Optimization Heuristics

* Always pick **leftmost rooms first** (minimizes horizontal cost)
* Prune invalid paths early
* Limit branching factor via room ordering

---

## ⚙️ Tech Stack

| Layer            | Technology             |
| ---------------- | ---------------------- |
| Frontend         | React 18 + Vite        |
| State Management | React Hooks            |
| Styling          | Inline CSS (CSS-in-JS) |
| Deployment       | Vercel                 |
| Version Control  | Git + GitHub           |

---

## 🧪 Features

### Core Functionality

* 🔢 **Dynamic Booking Input (1–5 rooms)**
* ⚡ **Instant Smart Allocation**
* 🧠 **Optimized Travel-Time Calculation**

### UI/UX

* 🟩 **Visual Room Grid (10 Floors)**
* 🟧 **Recent Booking Highlight**
* 📊 **Live Occupancy Stats**
* 🖱️ **Interactive Tooltips**

### Utilities

* 🎲 **Random Occupancy Simulation (~40%)**
* 🔄 **Full Reset System**
* ⏱️ **Real-Time Travel Time Display**

---

## 🧭 System Workflow

1. User inputs number of rooms (1–5)
2. System scans availability
3. Attempts **same-floor allocation**
4. If not possible → triggers **DFS-based allocation**
5. Computes travel time
6. Updates UI + highlights rooms

---

## 🛠️ Local Development

```bash
git clone https://github.com/Amey2701/hotel-reservation
cd hotel-reservation
npm install
npm run dev
```

Access locally:
👉 [http://localhost:5173](http://localhost:5173)

---

## 📊 Complexity Analysis

### Phase 1 — Sliding Window

* Time: **O(F × R)**
  (F = floors, R = rooms per floor)

### Phase 2 — DFS Backtracking

* Worst-case: **O(C(97, 5)) ≈ manageable due to pruning**
* Practical performance optimized via:

  * Early pruning
  * Left-first selection heuristic

### Space Complexity

* O(N) for recursion stack (N ≤ 5)

---

## ⚠️ Edge Cases Handled

* ✅ Insufficient rooms available
* ✅ Fragmented availability across floors
* ✅ Last floor (7 rooms only)
* ✅ Fully occupied hotel
* ✅ Single room booking (degenerate case)

---

## 🧱 Design Decisions

### Why Greedy + DFS Hybrid?

| Approach        | Limitation                                   |
| --------------- | -------------------------------------------- |
| Pure Greedy     | Fails for fragmented availability            |
| Pure DFS        | Expensive without pruning                    |
| Hybrid (Chosen) | Optimal balance of performance + correctness |

---

### Why Leftmost Room Preference?

* Minimizes `(pos - 1)` cost component
* Reduces overall horizontal movement
* Aligns with real-world usability (closer to lift)

---

## 🚀 Possible Enhancements

* Add **priority booking tiers (VIP optimization)**
* Introduce **real-time concurrency handling**
* Extend to **multi-user reservation system (backend integration)**
* Add **caching/memoization for repeated patterns**
* Implement **A* search instead of DFS for further optimization**

---

## 📬 Submission Details

* 📧 Submitted to: [careers@unstop.com](mailto:careers@unstop.com)
* 🧑‍💻 Role: **SDE 3 Assessment**
* 🔓 Access: Public (Anyone with the link)

---

## 📞 Contact

**Amey Mali**

* 📧 Email: [ameymali2@gmail.com](mailto:ameymali2@gmail.com)
* 📱 Phone: +91 7517359266
* 💻 GitHub: [https://github.com/Amey2701](https://github.com/Amey2701)

---

## 🧑‍💻 Author Note

This project demonstrates:

* Strong problem decomposition
* Algorithmic optimization under constraints
* Clean UI-driven system design
* Practical trade-offs between performance and correctness
