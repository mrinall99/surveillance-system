# 🛡️ PHASE 2 TECH STACK GUIDE — SIMPLE & EASY EXPLANATION

> **Presentation Guide for Oral Presentations — Phase 2**
> **Target Audience**: General presentation audiences, evaluators, and judges.

---

## 🏬 1. The Big Picture Analogy: Adding Spatial Boundaries & Threat Intelligence

In Phase 1, our system learned how to **see** objects ("That's a person!").

In **Phase 2**, our system learns how to **think and evaluate danger**:

```
+------------------------+      +------------------------+      +------------------------+
| 1. DRAW INVISIBLE      |      | 2. CHECK IF OBJECT IS  |      | 3. ESCALATE ALARM      |
|    LASER FENCES        | ───► |    INSIDE THE FENCE    | ───► |    SEVERITY LEVEL      |
| (Interactive Editor)   |      | (Ray-Casting Geometry) |      | (LOW ➔ CRITICAL)       |
+------------------------+      +------------------------+      +------------------------+
```

1. **Virtual Fence Lines (Polygon Security Zones)**:
   - *Analogy*: Drawing an invisible laser boundary around a vault door or perimeter.
   - *What it does*: Lets the security officer draw **Restricted** (🔴 Red), **Monitored** (🟡 Yellow), and **Safe** (🟢 Green) zones directly on the video screen.

2. **Ray-Casting Algorithm (The Geometry Checker)**:
   - *Analogy*: Throwing a laser beam from a marble to see if it crosses an odd number of boundary lines to prove it is inside the box.
   - *What it does*: Checks if the center point of an object is inside a restricted zone in 0.1 milliseconds.

3. **Threat Classification Matrix (The Alarm Escalator)**:
   - *Analogy*: A smart alarm meter that changes from `LOW` (cat walking) to `CRITICAL` (human intruder in restricted vault).

4. **Loitering & Dwell-Time Analytics (The Clock Watcher)**:
   - *Analogy*: A security guard noticing someone standing by an ATM machine for over 30 seconds without moving.
   - *What it does*: Tracks how long a person lingering stays inside a monitored area and triggers a **LOITERING ALERT**.

---

## 🗣️ Summary Presentation Script for Phase 2

> *"In Phase 2, we added spatial intelligence and threat classification to our system. Using our **interactive point-and-click Zone Editor**, administrators can draw custom **Restricted**, **Monitored**, and **Safe** polygon boundaries directly on the video stream. 
> 
> Our backend runs a **Ray-Casting Point-in-Polygon algorithm** to check object centroids, and evaluates a **4-level threat classification matrix**—triggering **CRITICAL** alarms on restricted breaches and **HIGH** alarms on suspicious loitering dwell times exceeding 30 seconds."*
