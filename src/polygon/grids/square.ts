import type { Item, Vector2 } from "@owlbear-rodeo/sdk";

type Side = 0 | 1 | 2 | 3;

//   3
// 2 □ 0
//   1

function getSideVertex(square: Item, cellSize: Vector2, side: Side): Vector2 {
    if (side === 0) {
        return { x: square.position.x + cellSize.x, y: square.position.y + cellSize.y };
    }

    if (side === 1) {
        return { x: square.position.x, y: square.position.y + cellSize.y };
    }

    if (side === 2) {
        return square.position;
    }

    // Side 3
    return { x: square.position.x + cellSize.x, y: square.position.y };
}

const floorEq = (value1: number, value2: number): boolean => Math.floor(value1) === Math.floor(value2);

function findNeighbor(square: Item, squares: Item[], cellSize: Vector2, side: Side): Item | undefined {
    const diff = cellSize.x;

    let horiz: (h: Item) => boolean;
    let vert: (h: Item) => boolean;
    if (side === 0) {
        horiz = (h: Item): boolean => floorEq(h.position.x - diff, square.position.x);
        vert = (h: Item): boolean => floorEq(h.position.y, square.position.y);
    }

    if (side === 1) {
        horiz = (h: Item): boolean => floorEq(h.position.x, square.position.x);
        vert = (h: Item): boolean => floorEq(h.position.y - diff, square.position.y);
    }

    if (side === 2) {
        horiz = (h: Item): boolean => floorEq(h.position.x + diff, square.position.x);
        vert = (h: Item): boolean => floorEq(h.position.y, square.position.y);
    }

    if (side === 3) {
        horiz = (h: Item): boolean => floorEq(h.position.x, square.position.x);
        vert = (h: Item): boolean => floorEq(h.position.y + diff, square.position.y);
    }

    return squares.find((h) => horiz(h) && vert(h));
}

//   3
// 2 □ 0
//   1
// 1 + 2 mod 4 = opposed side = 3
// 3 is a shared edge with the previous square
// 3 + 1 mod 4 = 0
// 0 is the next open edge since we were on 1
const getJumpSide = (side: Side): Side => ((((side + 2) % 4) + 1) % 4) as Side;

const getNextSide = (side: Side): Side => ((side + 1) % 4) as Side;

function extractCurveVertices(squares: Item[], cellSize: Vector2): Vector2[] {
    // Assume pointy for now
    const vertices: Vector2[] = [];

    // Edge case where there is no square
    if (squares.length === 0) return vertices;

    // Edge case where there is a single square
    if (squares.length === 1) {
        for (let i = 0; i < 4; i++) {
            vertices.push(getSideVertex(squares[0], cellSize, i as Side));
        }

        return vertices;
    }

    // Find the top right most square
    // We will know we are done when we are back to this square
    const rightMost = squares.sort((a, b) => b.position.x - a.position.x || b.position.y - a.position.y)[0];

    // Now we start looping
    // For each side, check if there is a cell. If there is a cell, we know it is a boundary cell
    // so we immediately jump to it and start from the opposite side from which we jumped.
    // Cells can be visited multiple times, depending on if we are on a straight line or not.
    let currentsquare = rightMost;
    let currentSide: Side = 0;

    const maxIterations = 5000; // Avoid crashing on unhandled case
    let iterationCounter = 0;
    do {
        const neighbor = findNeighbor(currentsquare, squares, cellSize, currentSide);

        // If there is a neighbor, immeditaly switch to it
        // Then set the side accordingly
        let vertex: Vector2;
        if (neighbor) {
            currentsquare = neighbor;
            currentSide = getJumpSide(currentSide);
            continue;
        } else {
            vertex = getSideVertex(currentsquare, cellSize, currentSide);
        }

        if (vertices[0] && floorEq(vertex.x, vertices[0].x) && floorEq(vertex.y, vertices[0].y)) {
            break;
        }

        vertices.push(vertex);
        currentSide = getNextSide(currentSide);
        iterationCounter++;
    } while (iterationCounter < maxIterations);

    return vertices;
}

export const square = { extractCurveVertices };
