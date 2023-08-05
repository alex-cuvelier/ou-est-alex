export function pointInPolygon(polygon, point) {
    let result = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; i++) {
        if (
            polygon[i][1] > point[1] !== polygon[j][1] > point[1] &&
            point[0] < ((polygon[j][0] - polygon[i][0]) * (point[1] - polygon[i][1])) / (polygon[j][1] - polygon[i][1]) + polygon[i][0]
        ) {
            result = !result;
        }
        j = i;
    }

    return result;
}

export function toPolygon(coordsStr) {
    return coordsStr
        .split(',')
        .map((coord, index, coords) => {
            if (index % 2 === 0) {
                return [parseInt(coord), parseInt(coords[index + 1])];
            }
        })
        .filter((coord) => coord !== undefined);
}

export function getContainedSize(img) {
    var ratio = img.naturalWidth / img.naturalHeight;
    var width = img.height * ratio;
    var height = img.height;
    if (width > img.width) {
        width = img.width;
        height = img.width / ratio;
    }
    return [width, height];
}
