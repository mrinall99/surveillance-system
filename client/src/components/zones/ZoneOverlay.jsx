import React from 'react';

const ZoneOverlay = ({ zones, activeBreachZoneNames = [] }) => {
  if (!zones || zones.length === 0) return null;

  const getZoneStyles = (type, isBreached) => {
    if (isBreached) {
      return {
        stroke: '#ff0033',
        fill: 'rgba(255, 0, 51, 0.45)',
        labelBg: 'rgba(220, 38, 38, 1)',
        labelBorder: '#ffffff',
        text: '#ffffff',
        dot: '#ff0033',
        isBreached: true
      };
    }

    switch (type) {
      case 'restricted':
        return { 
          stroke: '#ef4444', 
          fill: 'rgba(239, 68, 68, 0.28)', 
          labelBg: 'rgba(185, 28, 28, 0.95)', 
          labelBorder: '#ef4444',
          text: '#ffffff',
          dot: '#ef4444',
          isBreached: false
        };
      case 'monitored':
        return { 
          stroke: '#f59e0b', 
          fill: 'rgba(245, 158, 11, 0.25)', 
          labelBg: 'rgba(180, 83, 9, 0.95)', 
          labelBorder: '#f59e0b',
          text: '#ffffff',
          dot: '#f59e0b' 
        };
      case 'safe':
        return { 
          stroke: '#10b981', 
          fill: 'rgba(16, 185, 129, 0.25)', 
          labelBg: 'rgba(4, 120, 87, 0.95)', 
          labelBorder: '#10b981',
          text: '#ffffff',
          dot: '#10b981' 
        };
      default:
        return { 
          stroke: '#06b6d4', 
          fill: 'rgba(6, 182, 212, 0.25)', 
          labelBg: 'rgba(14, 116, 144, 0.95)', 
          labelBorder: '#06b6d4',
          text: '#ffffff',
          dot: '#06b6d4' 
        };
    }
  };

  return (
    <svg 
      className="absolute inset-0 w-full h-full pointer-events-none z-10" 
      viewBox="0 0 100 100" 
      preserveAspectRatio="none"
    >
      {zones.map((zone, zIdx) => {
        if (!zone.polygon || !Array.isArray(zone.polygon) || zone.polygon.length < 3) return null;

        const isBreached = activeBreachZoneNames.includes(zone.name);
        const pointsString = zone.polygon.map(([x, y]) => `${x},${y}`).join(' ');
        const styles = getZoneStyles(zone.type, isBreached);
        const [firstX, firstY] = zone.polygon[0];

        // Ensure label doesn't clip off the top or left edges
        const badgeY = Math.max(1.5, firstY > 6 ? firstY - 5 : firstY + 2);
        const badgeX = Math.min(Math.max(1.5, firstX), 68);

        return (
          <g key={zone.id || zone.name || zIdx} className={isBreached ? "animate-pulse" : ""}>
            {/* Filled Polygonal Area with bold neon stroke */}
            <polygon
              points={pointsString}
              fill={styles.fill}
              stroke={styles.stroke}
              strokeWidth={isBreached ? "2.0" : "1.2"}
              strokeDasharray={isBreached ? "none" : "2.5 1.5"}
              strokeLinejoin="round"
            />

            {/* Corner Vertex Anchor Circles */}
            {zone.polygon.map(([vx, vy], vIdx) => (
              <circle
                key={vIdx}
                cx={vx}
                cy={vy}
                r={isBreached ? "1.8" : "1.2"}
                fill={styles.dot}
                stroke="#ffffff"
                strokeWidth="0.4"
              />
            ))}

            {/* Zone Tag Badge */}
            <g transform={`translate(${badgeX}, ${badgeY})`}>
              <rect
                x="0"
                y="0"
                width={isBreached ? "34" : "28"}
                height="4.8"
                fill={styles.labelBg}
                stroke={styles.labelBorder}
                strokeWidth="0.4"
                rx="1"
              />
              <text
                x="1.5"
                y="3.4"
                fill={styles.text}
                fontSize="2.4"
                fontFamily="JetBrains Mono, monospace"
                fontWeight="800"
                letterSpacing="0.05em"
              >
                {isBreached ? `⚠️ ${zone.name.toUpperCase()} [BREACH]` : zone.name.toUpperCase()}
              </text>
            </g>
          </g>
        );
      })}
    </svg>
  );
};

export default ZoneOverlay;
