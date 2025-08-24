let maxStorage
let storageUsed

let storageLimitText
let storageLimitFill
async function reloadStorageLimit(){
    const response = await fetch(`/api/users/space`, {
        method: "GET"
    });

    if (!response.ok) {
        throwError("Failed to get user storage limit" + await response.text())
        return null;
    }

    let limit = (await response.text()).split("-");
    storageUsed = BigInt(limit[0])
    maxStorage = BigInt(limit[1])

    if(!storageLimitText) storageLimitText  = document.getElementById("storageLimitText");
    if(!storageLimitFill) storageLimitFill  = document.getElementById("storageLimitFill");

    // % used (two decimals), clamped to [0,100]
    const pct = (maxStorage > 0n)
        ? Number(storageUsed * 10000n / maxStorage) / 100
        : 0;
    const pctClamped = Math.max(0, Math.min(100, pct));

    // text
    storageLimitText.textContent =
        `${formatSize(storageUsed)} of ${formatSize(maxStorage)} used`;

    // width
    storageLimitFill.style.width = `${pctClamped}%`;

    // 3-stage color: <60% green, 60–90% amber, >=90% red
    storageLimitFill.classList.remove("ok","warn","danger");
    if (pctClamped < 60) {
        storageLimitFill.classList.add("ok");
    } else if (pctClamped < 90) {
        storageLimitFill.classList.add("warn");
    } else {
        storageLimitFill.classList.add("danger");
    }
}


document.addEventListener("DOMContentLoaded", async () => {
    await reloadStorageLimit()
});