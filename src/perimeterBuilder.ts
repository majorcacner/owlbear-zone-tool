type Vector2 = { x: number; y: number };

/**
 * Order an unordered set of polygon perimeter vertices so a line tool can draw the polygon.
 * Guarantees: every input vertex appears exactly once in the returned array.
 *
 * Strategy:
 * 1. Start at a deterministic vertex (leftmost, then lowest).
 * 2. Greedily append the nearest unused vertex that does not create a segment intersection.
 * 3. If no non-intersecting nearest neighbor exists, pick the nearest unused vertex anyway.
 * 4. After a full tour is built, run a 2-opt uncrossing pass to remove intersections.
 */
export function buildPerimeter(vertices: Vector2[], eps = 1e-8): Vector2[] {
    const n: number = vertices.length;
    if (n <= 1) return vertices.slice();

    // helpers
    const sq = (a: Vector2, b: Vector2): number => {
        const dx: number = a.x - b.x;
        const dy: number = a.y - b.y;
        return dx * dx + dy * dy;
    };

    const dist = (a: Vector2, b: Vector2): number => Math.sqrt(sq(a, b));

    const cross = (a: Vector2, b: Vector2, c: Vector2): number => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);

    const onSegment = (a: Vector2, b: Vector2, p: Vector2): boolean => {
        return (
            Math.min(a.x, b.x) - eps <= p.x &&
            p.x <= Math.max(a.x, b.x) + eps &&
            Math.min(a.y, b.y) - eps <= p.y &&
            p.y <= Math.max(a.y, b.y) + eps &&
            Math.abs(cross(a, b, p)) <= eps
        );
    };

    const segmentsIntersect = (a: Vector2, b: Vector2, c: Vector2, d: Vector2): boolean => {
        // exclude shared endpoints as "intersect" (we allow touching at endpoints)
        if (
            (a.x === c.x && a.y === c.y) ||
            (a.x === d.x && a.y === d.y) ||
            (b.x === c.x && b.y === c.y) ||
            (b.x === d.x && b.y === d.y)
        ) {
            return false;
        }
        // bounding box quick reject
        if (Math.max(a.x, b.x) + eps < Math.min(c.x, d.x)) return false;
        if (Math.max(c.x, d.x) + eps < Math.min(a.x, b.x)) return false;
        if (Math.max(a.y, b.y) + eps < Math.min(c.y, d.y)) return false;
        if (Math.max(c.y, d.y) + eps < Math.min(a.y, b.y)) return false;

        const c1: number = cross(a, b, c);
        const c2: number = cross(a, b, d);
        const c3: number = cross(c, d, a);
        const c4: number = cross(c, d, b);

        if (Math.abs(c1) < eps && onSegment(a, b, c)) return true;
        if (Math.abs(c2) < eps && onSegment(a, b, d)) return true;
        if (Math.abs(c3) < eps && onSegment(c, d, a)) return true;
        if (Math.abs(c4) < eps && onSegment(c, d, b)) return true;

        return c1 > 0 !== c2 > 0 && c3 > 0 !== c4 > 0;
    };

    // deterministic start: leftmost then lowest y
    let start: number = 0;
    for (let i = 1; i < n; i++) {
        if (
            vertices[i].x < vertices[start].x - eps ||
            (Math.abs(vertices[i].x - vertices[start].x) <= eps && vertices[i].y < vertices[start].y - eps)
        ) {
            start = i;
        }
    }

    // Precompute sorted neighbor lists (by distance) for each vertex to speed greedy selection
    const neighborOrder: number[][] = new Array(n);
    for (let i = 0; i < n; i++) {
        const arr: number[] = new Array(n - 1);
        let idx: number = 0;
        for (let j = 0; j < n; j++) {
            if (i === j) continue;
            arr[idx++] = j;
        }
        arr.sort((a: number, b: number) => sq(vertices[i], vertices[a]) - sq(vertices[i], vertices[b]));
        neighborOrder[i] = arr;
    }

    // Build tour greedily
    const used: boolean[] = new Array<boolean>(n).fill(false);
    const tourIdx: number[] = [];
    tourIdx.push(start);
    used[start] = true;

    while (tourIdx.length < n) {
        const cur: number = tourIdx[tourIdx.length - 1];
        const neighbors: number[] = neighborOrder[cur];

        // try to pick nearest unused neighbor that does not create intersection with existing segments
        let chosen: number | null = null;
        for (const cand of neighbors) {
            if (used[cand]) continue;
            // check if adding segment (cur -> cand) intersects any existing segment except adjacent last segment
            let bad: boolean = false;
            const a: Vector2 = vertices[cur];
            const b: Vector2 = vertices[cand];
            for (let s = 0; s + 1 < tourIdx.length; s++) {
                const pIdx: number = tourIdx[s];
                const qIdx: number = tourIdx[s + 1];
                // skip checking the last segment that shares endpoint cur
                if (pIdx === cur || qIdx === cur) continue;
                if (segmentsIntersect(a, b, vertices[pIdx], vertices[qIdx])) {
                    bad = true;
                    break;
                }
            }
            if (!bad) {
                chosen = cand;
                break;
            }
        }

        // if none found, pick nearest unused (we will fix crossings later)
        if (chosen === null) {
            for (const cand of neighbors) {
                if (!used[cand]) {
                    chosen = cand;
                    break;
                }
            }
        }

        if (chosen === null) {
            // should not happen, but break to avoid infinite loop
            break;
        }
        tourIdx.push(chosen);
        used[chosen] = true;
    }

    // 2-opt uncrossing on circular tour
    const uncross = (order: number[]): number[] => {
        const m: number = order.length;
        let improved: boolean = true;
        let iter: number = 0;
        while (improved && iter < 100000) {
            improved = false;
            iter++;
            for (let i = 0; i < m; i++) {
                const aIdx: number = order[i];
                const bIdx: number = order[(i + 1) % m];
                for (let j = i + 2; j < m; j++) {
                    // avoid adjacent edges and the same edge
                    if (i === 0 && j === m - 1) continue;
                    const cIdx: number = order[j % m];
                    const dIdx: number = order[(j + 1) % m];
                    if (aIdx === cIdx || aIdx === dIdx || bIdx === cIdx || bIdx === dIdx) continue;
                    if (segmentsIntersect(vertices[aIdx], vertices[bIdx], vertices[cIdx], vertices[dIdx])) {
                        // reverse segment between i+1 and j inclusive
                        let s: number = i + 1;
                        let e: number = j;
                        while (s < e) {
                            const si: number = s % m;
                            const ei: number = e % m;
                            const tmp: number = order[si];
                            order[si] = order[ei];
                            order[ei] = tmp;
                            s++;
                            e--;
                        }
                        improved = true;
                        break;
                    }
                }
                if (improved) break;
            }
        }
        return order;
    };

    const finalIdx: number[] = uncross(tourIdx.slice());

    // Final safety: if uncross didn't include all vertices (shouldn't happen), append missing ones by nearest insertion
    const present: Set<number> = new Set(finalIdx);
    if (present.size !== n) {
        for (let i = 0; i < n; i++) {
            if (!present.has(i)) {
                // find best insertion place that minimally increases perimeter
                let bestPos: number = 0;
                let bestCost: number = Infinity;
                for (let pos = 0; pos < finalIdx.length; pos++) {
                    const a: Vector2 = vertices[finalIdx[pos]];
                    const b: Vector2 = vertices[finalIdx[(pos + 1) % finalIdx.length]];
                    const cost: number = dist(a, vertices[i]) + dist(vertices[i], b) - dist(a, b);
                    if (cost < bestCost) {
                        bestCost = cost;
                        bestPos = pos + 1;
                    }
                }
                finalIdx.splice(bestPos, 0, i);
            }
        }
        // run uncross again after insertions
        uncross(finalIdx);
    }

    // Return ordered vertices (closed loop implied by drawing tool connecting last->first)
    return finalIdx.map((idx: number) => vertices[idx]);
}
