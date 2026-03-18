import OBR, { type ToolContext, type ToolEvent } from "@owlbear-rodeo/sdk";
import { makeCell } from "./polygon/cellBuilder";
import { computePolygon, previewId, updateTempPolygon } from "./polygon/polygonBuilder";

const liveComputeKey = "cacner.zone.liveCompute";

const isLiveComputing = (): boolean => Boolean(JSON.parse(localStorage.getItem(liveComputeKey) || "true"));

function setupConfigPanel(): void {
    const liveComputeCheckbox = document.getElementById("zone-live-compute") as HTMLInputElement;

    if (liveComputeCheckbox) {
        liveComputeCheckbox.checked = isLiveComputing();
        liveComputeCheckbox.addEventListener("change", (e) => {
            if (e.target instanceof HTMLInputElement) {
                localStorage.setItem(liveComputeKey, JSON.stringify(e.target.checked));
            }
        });
    }
}

const modeId = "zone";
const toolId = "rodeo.owlbear.tool/drawing";

async function createZoneMode(): Promise<void> {
    let currentId = crypto.randomUUID();

    const cellCallback = async (ctx: ToolContext, ev: ToolEvent): Promise<void> => {
        const liveCompute = isLiveComputing();
        await makeCell(currentId, ctx, ev, liveCompute);
        if (liveCompute) await updateTempPolygon(ctx, currentId);
    };

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
        onToolDown: cellCallback,
        onToolDragMove: cellCallback,
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

OBR.onReady(() => {
    setupConfigPanel();
    createZoneMode();
});
