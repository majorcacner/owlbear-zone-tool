import OBR, { buildCurve, type Vector2 } from "@owlbear-rodeo/sdk";
import { getCellSize, makeCell } from "./cellBuilder";
import { flatHex } from "./flatHex";
import { pointyHex } from "./pointyHex";
import { square } from "./square";

const toolId = "rodeo.owlbear.tool/drawing";
const modeId = "zone";

async function createZoneMode(): Promise<void> {
    let currentId = crypto.randomUUID();

    OBR.tool.createMode({
        id: `${toolId}/${modeId}`,
        icons: [
            {
                icon: "/zone.svg",
                label: "Zone",
                filter: {
                    activeTools: [toolId],
                },
            },
        ],
        onToolDown: async (ctx, ev) => {
            await makeCell(currentId, ctx, ev);
        },
        onToolDragMove: async (ctx, ev) => {
            await makeCell(currentId, ctx, ev);
        },
        onToolUp: async (ctx) => {
            const gridType = await OBR.scene.grid.getType();
            const items = await OBR.scene.local.getItems((item) => item.id.includes(currentId));
            const size = await getCellSize(gridType);

            let customVerts: Vector2[] = [];

            // Only supported types
            if (gridType === "HEX_VERTICAL") customVerts = pointyHex.extractCurveVertices(items, size);
            else if (gridType === "HEX_HORIZONTAL") customVerts = flatHex.extractCurveVertices(items, size);
            else if (gridType === "SQUARE") customVerts = square.extractCurveVertices(items, size);

            const outerEdge = buildCurve()
                .points(customVerts)
                .tension(0)
                .closed(true)
                .fillColor((ctx.metadata.fillColor as string) || "red")
                .fillOpacity((ctx.metadata.fillOpacity as number) || 0)
                .strokeColor((ctx.metadata.strokeColor as string) || "red")
                .strokeWidth((ctx.metadata.strokeWidth as number) || 0)
                .locked(true)
                .build();

            await OBR.scene.items.addItems([outerEdge]);

            // Cleanup old objects
            OBR.scene.local.deleteItems(items.map((x) => x.id));

            currentId = crypto.randomUUID();
        },
    });
}

OBR.onReady(createZoneMode);
