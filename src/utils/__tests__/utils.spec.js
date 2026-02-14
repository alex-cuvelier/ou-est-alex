import {
    pointInPolygon,
    getPolygonCenter,
    toPolygon,
    getContainedSize,
    getRandomPointInCircle,
    formatMillisecondsToTime,
    formmatSecondsToTime,
} from '../utils.js';

describe('pointInPolygon', () => {
    it('should return true when point is inside polygon', () => {
        const square = [
            [0, 0],
            [100, 0],
            [100, 100],
            [0, 100],
        ];

        expect(pointInPolygon(square, 50, 50)).toBe(true);
        expect(pointInPolygon(square, 10, 10)).toBe(true);
        expect(pointInPolygon(square, 90, 90)).toBe(true);
    });

    it('should return false when point is outside polygon', () => {
        const square = [
            [0, 0],
            [100, 0],
            [100, 100],
            [0, 100],
        ];

        expect(pointInPolygon(square, -10, 50)).toBe(false);
        expect(pointInPolygon(square, 150, 50)).toBe(false);
        expect(pointInPolygon(square, 50, -10)).toBe(false);
        expect(pointInPolygon(square, 50, 150)).toBe(false);
    });

    it('should handle triangle polygon', () => {
        const triangle = [
            [0, 0],
            [100, 0],
            [50, 100],
        ];

        expect(pointInPolygon(triangle, 50, 30)).toBe(true);
        expect(pointInPolygon(triangle, 10, 150)).toBe(false);
    });

    it('should handle complex polygon', () => {
        const complex = [
            [10, 10],
            [50, 10],
            [50, 30],
            [30, 30],
            [30, 50],
            [10, 50],
        ];

        expect(pointInPolygon(complex, 20, 20)).toBe(true);
        expect(pointInPolygon(complex, 40, 20)).toBe(true);
        expect(pointInPolygon(complex, 40, 40)).toBe(false);
    });
});

describe('getPolygonCenter', () => {
    it('should calculate center of square', () => {
        const square = [
            [0, 0],
            [100, 0],
            [100, 100],
            [0, 100],
        ];

        const center = getPolygonCenter(square);
        expect(center.x).toBe(50);
        expect(center.y).toBe(50);
    });

    it('should calculate center of triangle', () => {
        const triangle = [
            [0, 0],
            [60, 0],
            [30, 60],
        ];

        const center = getPolygonCenter(triangle);
        expect(center.x).toBe(30);
        expect(center.y).toBe(20);
    });

    it('should handle single point', () => {
        const point = [[10, 20]];

        const center = getPolygonCenter(point);
        expect(center.x).toBe(10);
        expect(center.y).toBe(20);
    });
});

describe('toPolygon', () => {
    it('should parse coordinate string correctly', () => {
        const coordsStr = '10,20,30,40,50,60';
        const polygon = toPolygon(coordsStr, 1, 1);

        expect(polygon).toEqual([
            [10, 20],
            [30, 40],
            [50, 60],
        ]);
    });

    it('should apply ratio scaling', () => {
        const coordsStr = '100,200,300,400';
        const polygon = toPolygon(coordsStr, 2, 4);

        expect(polygon).toEqual([
            [50, 50],
            [150, 100],
        ]);
    });

    it('should handle empty string', () => {
        const polygon = toPolygon('', 1, 1);
        expect(polygon).toEqual([]);
    });

    it('should handle null/undefined', () => {
        const polygon1 = toPolygon(null, 1, 1);
        const polygon2 = toPolygon(undefined, 1, 1);

        expect(polygon1).toEqual([]);
        expect(polygon2).toEqual([]);
    });

    it('should handle odd number of coordinates (creates NaN for last)', () => {
        const coordsStr = '10,20,30';
        const polygon = toPolygon(coordsStr, 1, 1);

        // Note: This is current behavior - odd coords create a point with NaN
        expect(polygon).toHaveLength(2);
        expect(polygon[0]).toEqual([10, 20]);
        expect(polygon[1][0]).toBe(30);
        expect(isNaN(polygon[1][1])).toBe(true);
    });
});

describe('getContainedSize', () => {
    it('should maintain aspect ratio when width is limiting', () => {
        const img = {
            naturalWidth: 1000,
            naturalHeight: 500,
            width: 400,
            height: 300,
        };

        const [width, height] = getContainedSize(img);

        expect(width).toBe(400);
        expect(height).toBe(200);
    });

    it('should maintain aspect ratio when height is limiting', () => {
        const img = {
            naturalWidth: 500,
            naturalHeight: 1000,
            width: 400,
            height: 300,
        };

        const [width, height] = getContainedSize(img);

        expect(width).toBe(150);
        expect(height).toBe(300);
    });

    it('should handle square image', () => {
        const img = {
            naturalWidth: 1000,
            naturalHeight: 1000,
            width: 500,
            height: 500,
        };

        const [width, height] = getContainedSize(img);

        expect(width).toBe(500);
        expect(height).toBe(500);
    });
});

describe('getRandomPointInCircle', () => {
    it('should return point within circle radius', () => {
        const centerX = 100;
        const centerY = 100;
        const radius = 50;

        for (let i = 0; i < 100; i++) {
            const point = getRandomPointInCircle(centerX, centerY, radius);

            const distance = Math.sqrt(Math.pow(point.x - centerX, 2) + Math.pow(point.y - centerY, 2));

            expect(distance).toBeLessThanOrEqual(radius);
        }
    });

    it('should return object with x and y properties', () => {
        const point = getRandomPointInCircle(0, 0, 10);

        expect(point).toHaveProperty('x');
        expect(point).toHaveProperty('y');
        expect(typeof point.x).toBe('number');
        expect(typeof point.y).toBe('number');
    });

    it('should handle zero radius', () => {
        const point = getRandomPointInCircle(50, 50, 0);

        expect(point.x).toBeCloseTo(50, 10);
        expect(point.y).toBeCloseTo(50, 10);
    });
});

describe('formatMillisecondsToTime', () => {
    it('should format milliseconds to HH:MM:SS', () => {
        expect(formatMillisecondsToTime(0)).toBe('00:00:00');
        expect(formatMillisecondsToTime(1000)).toBe('00:00:01');
        expect(formatMillisecondsToTime(60000)).toBe('00:01:00');
        expect(formatMillisecondsToTime(3600000)).toBe('01:00:00');
    });

    it('should handle complex times', () => {
        expect(formatMillisecondsToTime(3661000)).toBe('01:01:01');
        expect(formatMillisecondsToTime(7265000)).toBe('02:01:05');
    });

    it('should pad with zeros', () => {
        expect(formatMillisecondsToTime(5000)).toBe('00:00:05');
        expect(formatMillisecondsToTime(125000)).toBe('00:02:05');
    });

    it('should handle invalid input', () => {
        expect(formatMillisecondsToTime('abc')).toBe('Invalid input');
        expect(formatMillisecondsToTime(NaN)).toBe('Invalid input');
        expect(formatMillisecondsToTime(null)).toBe('Invalid input');
    });
});

describe('formmatSecondsToTime', () => {
    it('should format seconds to HH:MM:SS', () => {
        expect(formmatSecondsToTime(0)).toBe('00:00:00');
        expect(formmatSecondsToTime(1)).toBe('00:00:01');
        expect(formmatSecondsToTime(60)).toBe('00:01:00');
        expect(formmatSecondsToTime(3600)).toBe('01:00:00');
    });

    it('should handle complex times', () => {
        expect(formmatSecondsToTime(3661)).toBe('01:01:01');
        expect(formmatSecondsToTime(7265)).toBe('02:01:05');
    });

    it('should pad with zeros', () => {
        expect(formmatSecondsToTime(5)).toBe('00:00:05');
        expect(formmatSecondsToTime(125)).toBe('00:02:05');
    });

    it('should handle invalid input', () => {
        expect(formmatSecondsToTime('abc')).toBe('Invalid input');
        expect(formmatSecondsToTime(NaN)).toBe('Invalid input');
        expect(formmatSecondsToTime(null)).toBe('Invalid input');
    });
});
