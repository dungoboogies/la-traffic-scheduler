interface Point {
  id: string;
  lat: number;
  lng: number;
}

function haversine(a: Point, b: Point): number {
  const R = 3959; // miles
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      sinLng * sinLng;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function estimateMinutes(miles: number): number {
  return Math.round(miles * 2.5); // ~24 mph average LA traffic
}

function buildMatrix(points: Point[]): number[][] {
  const n = points.length;
  const matrix: number[][] = [];
  for (let i = 0; i < n; i++) {
    matrix[i] = [];
    for (let j = 0; j < n; j++) {
      matrix[i][j] = i === j ? 0 : haversine(points[i], points[j]);
    }
  }
  return matrix;
}

function nearestNeighbor(matrix: number[][], startIdx: number): number[] {
  const n = matrix.length;
  const visited = new Set<number>([startIdx]);
  const route = [startIdx];
  let current = startIdx;

  while (visited.size < n) {
    let nearest = -1;
    let nearestDist = Infinity;
    for (let i = 0; i < n; i++) {
      if (!visited.has(i) && matrix[current][i] < nearestDist) {
        nearest = i;
        nearestDist = matrix[current][i];
      }
    }
    if (nearest === -1) break;
    visited.add(nearest);
    route.push(nearest);
    current = nearest;
  }

  return route;
}

function twoOpt(route: number[], matrix: number[][]): number[] {
  const best = [...route];
  let improved = true;

  while (improved) {
    improved = false;
    for (let i = 1; i < best.length - 1; i++) {
      for (let j = i + 1; j < best.length; j++) {
        const d1 = matrix[best[i - 1]][best[i]] + matrix[best[j - 1]][best[j]];
        const d2 = matrix[best[i - 1]][best[j - 1]] + matrix[best[i]][best[j]];
        if (d2 < d1 - 0.001) {
          best.splice(i, j - i, ...best.slice(i, j).reverse());
          improved = true;
        }
      }
    }
  }

  return best;
}

function totalDistance(route: number[], matrix: number[][]): number {
  let total = 0;
  for (let i = 0; i < route.length - 1; i++) {
    total += matrix[route[i]][route[i + 1]];
  }
  return total;
}

export interface OptimizeResult {
  originalOrder: string[];
  optimizedOrder: string[];
  originalMiles: number;
  optimizedMiles: number;
  originalMinutes: number;
  optimizedMinutes: number;
  savingsMinutes: number;
  savingsMiles: number;
  swaps: string[];
}

export function optimizeRoute(
  home: { lat: number; lng: number },
  appointments: { id: string; lat: number; lng: number; title: string }[]
): OptimizeResult {
  if (appointments.length <= 1) {
    return {
      originalOrder: appointments.map((a) => a.id),
      optimizedOrder: appointments.map((a) => a.id),
      originalMiles: 0,
      optimizedMiles: 0,
      originalMinutes: 0,
      optimizedMinutes: 0,
      savingsMinutes: 0,
      savingsMiles: 0,
      swaps: [],
    };
  }

  const homePoint: Point = { id: "home", lat: home.lat, lng: home.lng };
  const points: Point[] = [
    homePoint,
    ...appointments.map((a) => ({ id: a.id, lat: a.lat, lng: a.lng })),
    homePoint, // return home
  ];

  // Original route: home -> appointments in current order -> home
  const originalIndices = Array.from({ length: points.length }, (_, i) => i);
  const matrix = buildMatrix(points);

  const originalMiles = totalDistance(originalIndices, matrix);

  // Optimize: fix home as start, find best order for middle points
  const middlePoints: Point[] = appointments.map((a) => ({
    id: a.id,
    lat: a.lat,
    lng: a.lng,
  }));
  const allPoints = [homePoint, ...middlePoints, homePoint];
  const fullMatrix = buildMatrix(allPoints);

  // Nearest neighbor starting from home (index 0), excluding last home
  const nnRoute = nearestNeighbor(
    fullMatrix.slice(0, -1).map((row) => row.slice(0, -1)),
    0
  );
  // Add return to home
  nnRoute.push(allPoints.length - 1);

  const optimizedRoute = twoOpt(nnRoute, fullMatrix);
  const optimizedMiles = totalDistance(optimizedRoute, fullMatrix);

  const originalMinutes = estimateMinutes(originalMiles);
  const optimizedMinutes = estimateMinutes(optimizedMiles);

  // Map optimized indices back to appointment ids (skip home start/end)
  const optimizedIds = optimizedRoute
    .slice(1, -1)
    .map((idx) => allPoints[idx].id);

  // Generate swap suggestions
  const swaps: string[] = [];
  const origIds = appointments.map((a) => a.id);
  for (let i = 0; i < optimizedIds.length; i++) {
    if (optimizedIds[i] !== origIds[i]) {
      const optAppt = appointments.find((a) => a.id === optimizedIds[i]);
      const origAppt = appointments.find((a) => a.id === origIds[i]);
      if (optAppt && origAppt) {
        swaps.push(`Move ${optAppt.title} to slot ${i + 1} (was ${origAppt.title})`);
      }
    }
  }

  return {
    originalOrder: origIds,
    optimizedOrder: optimizedIds,
    originalMiles: +originalMiles.toFixed(1),
    optimizedMiles: +optimizedMiles.toFixed(1),
    originalMinutes,
    optimizedMinutes,
    savingsMinutes: Math.max(0, originalMinutes - optimizedMinutes),
    savingsMiles: +Math.max(0, originalMiles - optimizedMiles).toFixed(1),
    swaps,
  };
}
