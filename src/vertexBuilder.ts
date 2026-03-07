import type { GridType, Item, Vector2 } from "@owlbear-rodeo/sdk";

function getVerticalVertices(items: Item[], cellSize: Vector2): Record<string, number> {
    const vertices: Record<string, number> = {};
    items.forEach((item) => {
        const itemVerts: Vector2[] = [];
        for (let i = 0; i < 6; i++) {
            const deg = 60 * i - 30;
            const rad = deg * (Math.PI / 180);
            const halfSize = cellSize.y / 2;
            const point: Vector2 = {
                x: item.position.x + halfSize * Math.cos(rad),
                y: item.position.y + halfSize * Math.sin(rad),
            };
            itemVerts.push(point);
        }
        itemVerts.forEach((v) => {
            const key = `${v.x.toFixed(0)}/${v.y.toFixed(0)}`;
            if (vertices[key]) vertices[key]++;
            else vertices[key] = 1;
        });
    });

    return vertices;
}

function getHorizontalVertices(items: Item[], cellSize: Vector2): Record<string, number> {
    const vertices: Record<string, number> = {};
    items.forEach((item) => {
        const itemVerts: Vector2[] = [];
        for (let i = 0; i < 6; i++) {
            const deg = 60 * i;
            const rad = deg * (Math.PI / 180);
            const halfSize = cellSize.y / 2;
            const point: Vector2 = {
                x: item.position.x + halfSize * Math.cos(rad),
                y: item.position.y + halfSize * Math.sin(rad),
            };
            itemVerts.push(point);
        }
        itemVerts.forEach((v) => {
            const key = `${v.x.toFixed(0)}/${v.y.toFixed(0)}`;
            if (vertices[key]) vertices[key]++;
            else vertices[key] = 1;
        });
    });

    return vertices;
}

export function buildVertexSet(items: Item[], cellSize: Vector2, gridType: GridType): Vector2[] {
    let vertices: Record<string, number>;

    if (gridType === "HEX_VERTICAL") vertices = getVerticalVertices(items, cellSize);
    else if (gridType === "HEX_HORIZONTAL") vertices = getHorizontalVertices(items, cellSize);
    else vertices = getVerticalVertices(items, cellSize);

    const verts: Vector2[] = Object.entries(vertices)
        .filter(([_, value]) => value < 3)
        .map(([key, _]) => {
            const [sx, sy] = key.split("/");
            return { x: Number(sx), y: Number(sy) };
        });

    return verts;
}
