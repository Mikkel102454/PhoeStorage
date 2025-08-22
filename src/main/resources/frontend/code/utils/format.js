function formatSize(bytes) {
    if (typeof bytes === "bigint") {
        // Convert to Number for math display — will clamp large values
        if (bytes > BigInt(Number.MAX_SAFE_INTEGER)) {
            console.warn("formatSize: value too large for exact conversion, showing approximate value");
        }
        bytes = Number(bytes);
    }

    if (typeof bytes !== "number" || isNaN(bytes) || bytes < 0) {
        return "0 B";
    }

    const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
    let i = 0;

    while (bytes >= 1024 && i < units.length - 1) {
        bytes /= 1024;
        i++;
    }

    const value = bytes % 1 === 0 ? bytes.toFixed(0) : bytes.toFixed(1);
    return `${value} ${units[i]}`;
}

function formatSizeReverse(sizeStr) {
    if (typeof sizeStr !== "string") return -1;

    // Remove *all* spaces and normalize case
    sizeStr = sizeStr.replace(/\s+/g, "").toUpperCase();

    const units = {
        B: 0,
        KB: 1,
        MB: 2,
        GB: 3,
        TB: 4,
        PB: 5
    };

    const regex = /^([\d.]+)([KMGTPE]?B)$/i;
    const match = sizeStr.match(regex);
    if (!match) return -1;

    const value = parseFloat(match[1]);
    const unit = match[2].toUpperCase();

    if (isNaN(value) || value < 0 || !(unit in units)) return -1;

    const exponent = units[unit];
    const bytes = value * Math.pow(1024, exponent);

    return BigInt(Math.round(bytes));
}

function fileIcon(extension) {

    const units = [
        "<i class=\"fa-solid fa-file-word icon m-r-08\" style=\"color: #4285f8;\"></i>",
        "<i class=\"fa-solid fa-file-excel icon m-r-08\" style=\"color: #07a85f;\"></i>",
        "<i class=\"fa-solid fa-file-powerpoint icon m-r-08\" style=\"color: #f06741;\"></i>",
        "<i class=\"fa-solid fa-file-image icon m-r-08\" style=\"color: #269b7f;\"></i>",
        "<i class=\"fa-solid fa-file-music icon m-r-08\" style=\"color: #e6a10c;\"></i>",
        "<i class=\"fa-solid fa-file-video icon m-r-08\" style=\"color: #2e3eac;\"></i>",
        "<i class=\"fa-solid fa-file-zipper icon m-r-08\" style=\"color: #ffc640;\"></i>",
        "<i class=\"fa-solid fa-file icon m-r-08\" style=\"color: #a5a5a5;\"></i>",
    ];
    if(!extension){return units[7]}
    extension = extension.toLowerCase();
    return {
        "doc": units[0],
        "docx": units[0],
        "xls": units[1],
        "xlsx": units[1],
        "ppt": units[2],
        "pptx": units[2],
        "7z": units[6],
        "rar": units[6],
        "zip": units[6],
        "mov": units[5],
        "mp4": units[5],
        "mpg": units[5],
        "gif": units[3],
        "jpg": units[3],
        "png": units[3],
        "jpeg": units[3],
        "mp3": units[4],
        "ogg": units[4],
        "wav": units[4],
        "bmp": units[3],
        "dcm": units[3],
        "dds": units[3],
        "djvu": units[3],
        "heic": units[3],
        "psd": units[3],
        "tga": units[3],
        "tif": units[3],
        "aif": units[4],
        "flac": units[4],
        "m3u": units[4],
        "m4a": units[4],
        "mid": units[4],
        "3gp": units[4],
        "wma": units[5],
        "asf": units[5],
        "avi": units[5],
        "flv": units[5],
        "m4v": units[5],
        "srt": units[5],
        "swf": units[5],
        "ts": units[5],
        "vob": units[5],
        "wmv": units[5],
        "cbr": units[6],
        "deb": units[6],
        "gz": units[6],
        "pkg": units[6],
        "rpm": units[6],
        "tar.gz": units[6],
        "xapk": units[6],
        "zipx": units[6],
    }[extension] || units[7];
}

function formatDate(raw){
    const trimmed = raw.replace(/(\.\d{3})\d+/, '$1'); // Keep only milliseconds
    const date = new Date(trimmed);

    return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
    });
}