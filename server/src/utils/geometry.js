/**
 * Geometry Utility Module.
 * Implements the Ray-Casting Algorithm for Point-in-Polygon geometric containment testing.
 */

/**
 * Checks if a 2D point (x, y) lies inside a polygon defined by an array of [x, y] vertices.
 * Uses the Ray-Casting Algorithm: Casts a ray to the right (+X direction) and counts edge intersections.
 * Odd intersections = INSIDE, Even intersections = OUTSIDE.
 * 
 * @param {[number, number]} point - [x, y] coordinates of object centroid.
 * @param {Array<[number, number]>} polygon - Array of polygon vertices [[x1, y1], [x2, y2], ...]
 * @returns {boolean} True if point is inside polygon.
 */
function isPointInPolygon(point, polygon) {
    if (!polygon || polygon.length < 3) return false;

    const [px, py] = point;
    let inside = false;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const [xi, yi] = polygon[i];
        const [xj, yj] = polygon[j];

        // Check if horizontal ray from (px, py) intersects segment (xi, yi) -> (xj, yj)
        const intersect = ((yi > py) !== (yj > py)) &&
            (px < (xj - xi) * (py - yi) / (yj - yi) + xi);

        if (intersect) {
            inside = !inside;
        }
    }

    return inside;
}

/**
 * Calculates the center point (centroid) of a bounding box [x1, y1, x2, y2]
 * normalized as percentage of frame width/height (0.0 to 100.0).
 * 
 * @param {[number, number, number, number]} bbox - [x1, y1, x2, y2] in pixels.
 * @param {number} frameWidth - Video frame width in pixels (default 640).
 * @param {number} frameHeight - Video frame height in pixels (default 480).
 * @returns {[number, number]} [centroidX_percent, centroidY_percent]
 */
function getNormalizedCentroid(bbox, frameWidth = 640, frameHeight = 480) {
    const [x1, y1, x2, y2] = bbox;
    const centerX = (x1 + x2) / 2;
    const centerY = (y1 + y2) / 2;

    const percentX = (centerX / frameWidth) * 100;
    const percentY = (centerY / frameHeight) * 100;

    return [percentX, percentY];
}

module.exports = {
    isPointInPolygon,
    getNormalizedCentroid
};
