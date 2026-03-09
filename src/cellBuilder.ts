import OBR, {
    buildShape,
    type GridType,
    type ShapeType,
    type ToolContext,
    type ToolEvent,
    type Vector2,
} from "@owlbear-rodeo/sdk";

function getShapeType(gridType: GridType): ShapeType {
    switch (gridType) {
        case "HEX_HORIZONTAL":
        case "HEX_VERTICAL":
            return "HEXAGON";
        default:
            return "RECTANGLE";
    }
}

function getRotation(gridType: GridType): number {
    switch (gridType) {
        case "HEX_HORIZONTAL":
            return 30;
        default:
            return 0;
    }
}

const getId = (currentId: string, position: Vector2): string => `zone-${currentId}-${position.x}-${position.y}`;
export async function getCellSize(gridType: GridType): Promise<Vector2> {
    const gridSize = await OBR.scene.grid.getDpi();

    if (gridType === "HEX_VERTICAL") {
        const x = Math.sqrt(3) * gridSize;
        const y = (gridSize / Math.sqrt(3)) * 2;

        return { x, y };
    }

    if (gridType === "HEX_HORIZONTAL") {
        const x = (gridSize / Math.sqrt(3)) * 2;
        const y = Math.sqrt(3) * gridSize;

        return { x, y };
    }

    return { x: gridSize, y: gridSize };
}

export async function makeCell(currentId: string, ctx: ToolContext, ev: ToolEvent): Promise<void> {
    const position = await OBR.scene.grid.snapPosition(ev.pointerPosition, 1, false);
    const id = getId(currentId, position);
    const items = await OBR.scene.local.getItems((x) => x.id === id);

    if (items.length) return;

    const gridType = await OBR.scene.grid.getType();
    const size = await getCellSize(gridType);

    const shape = buildShape()
        .id(id)
        .position(position)
        .shapeType(getShapeType(gridType))
        .rotation(getRotation(gridType))
        .width(size.x)
        .height(size.y)
        .fillColor((ctx.metadata.fillColor as string) || "red")
        .fillOpacity((ctx.metadata.fillOpacity as number) || 0)
        .strokeWidth(0);

    const built = shape.build();

    await OBR.scene.local.addItems([built]);
}
