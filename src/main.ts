import OBR, { buildCurve } from "@owlbear-rodeo/sdk";
import { getCellSize, makeCell } from "./cellBuilder";
import { buildPerimeter } from "./perimeterBuilder";
import { buildVertexSet } from "./vertexBuilder";

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
            const items = await OBR.scene.items.getItems((item) => item.id.includes(currentId));
            const size = await getCellSize(gridType);

            const verts = buildVertexSet(items, size, gridType);
            const orderedVerts = buildPerimeter(verts);

            const outerEdge = buildCurve()
                .points(orderedVerts)
                .tension(0)
                .closed(true)
                .fillColor((ctx.metadata.fillColor as string) || "red")
                .fillOpacity((ctx.metadata.fillOpacity as number) || 0)
                .strokeColor((ctx.metadata.strokeColor as string) || "red")
                .strokeWidth((ctx.metadata.strokeWidth as number) || 0)
                .build();

            await OBR.scene.items.addItems([outerEdge]);

            // Cleanup old objects
            OBR.scene.items.deleteItems(items.map((x) => x.id));

            currentId = crypto.randomUUID();
        },
    });
}

OBR.onReady(createZoneMode);
