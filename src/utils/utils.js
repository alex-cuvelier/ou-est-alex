export function pointInPolygon(polygon, x, y) {
    let result = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; i++) {
        if (
            polygon[i][1] > y !== polygon[j][1] > y &&
            x < ((polygon[j][0] - polygon[i][0]) * (y - polygon[i][1])) / (polygon[j][1] - polygon[i][1]) + polygon[i][0]
        ) {
            result = !result;
        }
        j = i;
    }

    return result;
}

export function getPolygonCenter(polygon) {
    let x = 0;
    let y = 0;
    for (let i = 0; i < polygon.length; i++) {
        x += polygon[i][0];
        y += polygon[i][1];
    }

    return { x: x / polygon.length, y: y / polygon.length };
}

export function toPolygon(coordsStr, xRatio, yRatio) {
    return coordsStr
        .split(',')
        .map((coord, index, coords) => {
            if (index % 2 === 0) {
                return [parseInt(coord), parseInt(coords[index + 1])];
            }
        })
        .filter((coord) => coord !== undefined)
        .map((coord) => [coord[0] / xRatio, coord[1] / yRatio]);
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

export function getRandomPointInCircle(centerX, centerY, radius) {
    const theta = Math.random() * (2 * Math.PI);
    const r = Math.sqrt(Math.random()) * radius;

    const x = centerX + r * Math.cos(theta);
    const y = centerY + r * Math.sin(theta);

    return { x, y };
}

export function formatMillisecondsToTime(milliseconds) {
    // Ensure the input is a number
    if (typeof milliseconds !== 'number' || isNaN(milliseconds)) {
      return 'Invalid input';
    }
  
    // Calculate hours, minutes, and seconds
    const hrs = Math.floor(milliseconds / 3600000);
    const mins = Math.floor((milliseconds % 3600000) / 60000);
    const secs = Math.floor((milliseconds % 60000) / 1000);
  
    // Pad with leading zeros if necessary
    const formattedHrs = String(hrs).padStart(2, '0');
    const formattedMins = String(mins).padStart(2, '0');
    const formattedSecs = String(secs).padStart(2, '0');
  
    return `${formattedHrs}:${formattedMins}:${formattedSecs}`;
  }
