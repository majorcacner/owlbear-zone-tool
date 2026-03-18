import OBR, { buildCurve, type Curve, type ToolContext, type Vector2 } from "@owlbear-rodeo/sdk";
import type { CurveBuilder } from "@owlbear-rodeo/sdk/lib/builders/CurveBuilder";
import { getCellSize } from "./cellBuilder";
import { flatHex } from "./grids/flatHex";
import { pointyHex } from "./grids/pointyHex";
import { square } from "./grids/square";

export const previewId = "temp-polygon";

export const computePolygon = async (ctx: ToolContext, currentId: string): Promise<CurveBuilder> => {
    const gridType = await OBR.scene.grid.getType();
    const items = await OBR.scene.local.getItems((item) => item.id.includes(currentId));
    const size = await getCellSize(gridType);

    let customVerts: Vector2[] = [];

    // Only supported types
    if (gridType === "HEX_VERTICAL") customVerts = pointyHex.extractCurveVertices(items, size);
    else if (gridType === "HEX_HORIZONTAL") customVerts = flatHex.extractCurveVertices(items, size);
    else if (gridType === "SQUARE") customVerts = square.extractCurveVertices(items, size);

    return buildCurve()
        .points(customVerts)
        .tension(0)
        .closed(true)
        .fillColor((ctx.metadata.fillColor as string) || "red")
        .fillOpacity((ctx.metadata.fillOpacity as number) || 0)
        .strokeColor((ctx.metadata.strokeColor as string) || "red")
        .strokeWidth((ctx.metadata.strokeWidth as number) || 0)
        .locked(true);
};

export const updateTempPolygon = async (ctx: ToolContext, currentId: string): Promise<void> => {
    const tempCurveBuilder = await computePolygon(ctx, currentId);
    const tempCurve = tempCurveBuilder.id(previewId).build();
    const curves = await OBR.scene.local.getItems((item) => item.id === previewId);

    if (curves.length) {
        const currentCurve = curves[0] as Curve;
        // Normally this _should_ work as curves are built in the same order every time
        // and vectors defined the same way each time. If this fails we'll need to implement
        // better comparison techniques.
        if (JSON.stringify(tempCurve.points) === JSON.stringify(currentCurve.points)) {
            return;
        }

        await OBR.scene.local.updateItems(
            [currentCurve],
            (draft) => {
                draft[0].points = tempCurve.points;
            },
            true,
        );
    } else {
        await OBR.scene.local.addItems([tempCurve]);
    }
};
