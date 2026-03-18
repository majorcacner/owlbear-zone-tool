import OBR from "@owlbear-rodeo/sdk";
import { makeCell } from "./polygon/cellBuilder";
import { computePolygon, previewId, updateTempPolygon } from "./polygon/polygonBuilder";

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
            await makeCell(currentId, ev);
            await updateTempPolygon(ctx, currentId);
        },
        onToolDragMove: async (ctx, ev) => {
            await makeCell(currentId, ev);
            await updateTempPolygon(ctx, currentId);
        },
        onToolUp: async (ctx) => {
            const finalBuilder = await computePolygon(ctx, currentId);
            const outerEdge = finalBuilder.id(currentId).build();

            // Clean temp polygon
            await OBR.scene.local.deleteItems([previewId]);
            await OBR.scene.items.addItems([outerEdge]);

            // Cleanup old objects
            const toDelete = await OBR.scene.local.getItems((item) => item.id.includes(currentId));
            OBR.scene.local.deleteItems(toDelete.map((x) => x.id));

            currentId = crypto.randomUUID();
        },
    });
}

OBR.onReady(createZoneMode);
