import type { Item, Vector2 } from "@owlbear-rodeo/sdk";

type HexSide = 0 | 1 | 2 | 3 | 4 | 5;

// Sides are ordered like so: 0 is right most, then 1 is below and it loops around to 5 which is above 0
// The vertex for a side is the bottom vertex for it. So side 0 is the bottom vertex which is side 1's stop vertex
//  4 /\ 5
// 3 |  | 0
//  2 \/ 1
function getSideVertex(hex: Item, cellSize: Vector2, side: HexSide): Vector2 {
    const deg = 60 * side + 30;
    const rad = deg * (Math.PI / 180);
    const halfSize = cellSize.y / 2;
    return {
        x: hex.position.x + halfSize * Math.cos(rad),
        y: hex.position.y + halfSize * Math.sin(rad),
    };
}

const floorEq = (value1: number, value2: number): boolean => Math.floor(value1) === Math.floor(value2);

function findNeighbor(hex: Item, hexagons: Item[], cellSize: Vector2, side: HexSide): Item | undefined {
    const diffX = cellSize.x / Math.sqrt(3);
    const diffY = cellSize.y * (3 / 4);

    let horiz: (h: Item) => boolean;
    let vert: (h: Item) => boolean;
    if (side === 0) {
        horiz = (h: Item): boolean => floorEq(h.position.x - diffX, hex.position.x);
        vert = (h: Item): boolean => floorEq(h.position.y, hex.position.y);
    }

    if (side === 1) {
        horiz = (h: Item): boolean => floorEq(h.position.x - diffX / 2, hex.position.x);
        vert = (h: Item): boolean => floorEq(h.position.y - diffY, hex.position.y);
    }

    if (side === 2) {
        horiz = (h: Item): boolean => floorEq(h.position.x + diffX / 2, hex.position.x);
        vert = (h: Item): boolean => floorEq(h.position.y - diffY, hex.position.y);
    }

    if (side === 3) {
        horiz = (h: Item): boolean => floorEq(h.position.x + diffX, hex.position.x);
        vert = (h: Item): boolean => floorEq(h.position.y, hex.position.y);
    }

    if (side === 4) {
        horiz = (h: Item): boolean => floorEq(h.position.x + diffX / 2, hex.position.x);
        vert = (h: Item): boolean => floorEq(h.position.y + diffY, hex.position.y);
    }

    if (side === 5) {
        horiz = (h: Item): boolean => floorEq(h.position.x - diffX / 2, hex.position.x);
        vert = (h: Item): boolean => floorEq(h.position.y + diffY, hex.position.y);
    }

    return hexagons.find((h) => horiz(h) && vert(h));
}

//  4 /\ 5
// 3 |  | 0
//  2 \/ 1
// 1 + 3 mod 6 = opposed side = 4
// 4 is a shared edge with the previous hex
// 4 + 1 mod 6 = 5
// 5 is the next open edge since we were on 1
const getJumpSide = (side: HexSide): HexSide => ((((side + 3) % 6) + 1) % 6) as HexSide;

const getNextSide = (side: HexSide): HexSide => ((side + 1) % 6) as HexSide;

export function extractCurveVertices(hexagons: Item[], cellSize: Vector2): Vector2[] {
    // Assume pointy for now
    const vertices: Vector2[] = [];

    // Edge case where there is no hex
    if (hexagons.length === 0) return vertices;

    // Edge case where there is a single hex
    if (hexagons.length === 1) {
        for (let i = 0; i < 6; i++) {
            vertices.push(getSideVertex(hexagons[0], cellSize, i as HexSide));
        }

        return vertices;
    }

    // Find the right most hexagon
    // We will know we are done when we are back to this hexagon
    const rightMost = hexagons.sort((a, b) => b.position.x - a.position.x)[0];

    // Now we start looping
    // For each side, check if there is a cell. If there is a cell, we know it is a boundary cell
    // so we immediately jump to it and start from the opposite side from which we jumped.
    // Cells can be visited multiple times, depending on if we are on a straight line or not.
    let currentHex = rightMost;
    let currentSide: HexSide = 0;

    const maxIterations = 1000; // Basically max number of vertices.
    let iterationCounter = 0;
    do {
        const neighbor = findNeighbor(currentHex, hexagons, cellSize, currentSide);

        // If there is a neighbor, immeditaly switch to it
        // Then set the side accordingly
        let verticeToPush: Vector2;
        if (neighbor) {
            currentHex = neighbor;
            currentSide = getJumpSide(currentSide);
            verticeToPush = getSideVertex(currentHex, cellSize, currentSide);
        } else {
            verticeToPush = getSideVertex(currentHex, cellSize, currentSide);
        }

        if (vertices[0] && floorEq(verticeToPush.x, vertices[0].x) && floorEq(verticeToPush.y, vertices[0].y)) {
            break;
        }

        vertices.push(verticeToPush);
        currentSide = getNextSide(currentSide);
        iterationCounter++;
    } while (iterationCounter < maxIterations);

    return vertices;
}
