/**
 * Geometry library for the canvas
 *
 * Helps with math and placement, and is an easier abstraction to deal
 * with than calling flat canvas functions.
 */

/**
 * Point (2D)
 */
function Point(x, y) {
    this.x = x != null ? x : 0.0;
    this.y = y != null ? y : 0.0;

    /**
     * @param pt the other point to find the distance to.
     * @returns Euclidean distance between points.
     */
    this.distanceTo = function(pt) {
        return Math.sqrt(
            Math.pow((pt.x - this.x), 2.0) +
            Math.pow((pt.y - this.y), 2.0));
    };

    this.render = function(context, width, height, radius) {
        if (radius == null)
            radius = 3.0;

        context.arc(this.x * width, this.y * height, 
            radius, 0, Math.PI * 2, true);
    };

    this.toString = function() {
        return '(' + this.x + ',' + this.y + ')';
    };
}

/**
 * Line
 *
 * @param a the 1st Point.
 * @param b the 2nd Point.
 */
function Line(a, b) {
    this.a = a != null ? a : new Point();
    this.b = b != null ? b : new Point();

    /**
     * Finds the midpoint between both points in this line.
     * @returns the mid-Point.
     */
    this.midPoint = function() {
        return new Point(
                ((this.a.x + this.b.x) / 2.0),
                ((this.a.y + this.b.y) / 2.0));
    };

    /**
     * Finds the intersection between this line and another.
     * Uses algorithm from http://paulbourke.net/geometry/lineline2d/
     *
     * @param line the other line to test intersection with.
     * @returns a Point representing intersection, or null if no intersection.
     */
    this.lineIntersection = function(line) {
        // Denominator for ua and ub are the same, so store this calculation.
        var d = (line.b.y - line.a.y) * (this.b.x - this.a.x) -
                (line.b.x - line.a.x) * (this.b.y - this.a.y);
        if (d == 0) {
            // Lines are parallel; no intersection.
            return null;
        }

        // n_a and n_b are calculated as separate values for readability.
        var n_a = (line.b.x - line.a.x) * (this.a.y - line.a.y) -
                    (line.b.y - line.a.y) * (this.a.x - line.a.x);
        var n_b = (this.b.x - this.a.x) * (this.a.y - line.a.y) -
                    (this.b.y - this.a.y) * (this.a.x - line.a.x);
        // If n_a == n_b, lines are on top of each other (coincidental).

        // Calculate the intermediate fractional point that the lines potentially intersect.
        var ua = n_a / d;
        var ub = n_b / d;

        // The fractional point will be within [0,1] if the lines intersect.
        // If > 1 or < 0, then the lines would need to be longer to intersect.
        if (ua >= 0 && ua <= 1 && ub > 0 && ub <= 1) {
            // Intersection found.
            return new Point(
                    this.a.x + (ua * (this.b.x - this.a.x)),
                    this.a.y + (ua * (this.b.y - this.a.y)));
        }

        // No intersection.
        return null;
    };

    /**
     * @returns length of this line.
     */
    this.length = function() {
        return this.a.distanceTo(this.b);
    };

    this.render = function(context, width, height) {
        context.moveTo(this.a.x * width, this.a.y * height);
        context.lineTo(this.b.x * width, this.b.y * height);
    };

    this.toString = function() {
        return '(' + this.a + ',' + this.b + ')';
    };
}

/**
 * Rectangle
 *
 * @param position the top-left Point.
 * @param width the width of the rectangle.
 * @param height the height of the rectangle.
 */
function Rectangle(position, width, height) {
    this.position = position != null ? position : new Point();
    this.width = width;
    this.height = height;

    this.render = function(context, width, height) {
        context.moveTo(this.position.x * width, this.position.y * height); // TL
        context.lineTo(this.position.x * width + this.width, this.position.y * height); // TR
        context.lineTo(this.position.x * width + this.width, this.position.y * height + this.height); // BR
        context.lineTo(this.position.x * width, this.position.y * height + this.height); // BL
        context.lineTo(this.position.x * width, this.position.y * height); // TL
    };

    this.pointIntersection = function(point) {
        throw 'Not implemented!';
    };

    this.toString = function() {
        return '(' + this.a + ',' + this.b + ')';
    };
}

/**
 * Quadratic (2nd order) Bezier curve
 *
 * @param cp0 the 1st control Point.
 * @param cp1 the 2nd control Point.
 * @param cp2 the 3rd control Point.
 */
function QuadraticCurve(cp0, cp1, cp2) {
    this.cp0 = cp0 != null ? cp0 : new Point();
    this.cp1 = cp1 != null ? cp1 : new Point();
    this.cp2 = cp2 != null ? cp2 : new Point();

    /**
     * Finds the point where this curve intersects a line.
     *
     * TODO: Curve flattening can be replaced by a simpler equation for quadratics.
     * Solution: http://www.wolframalpha.com/input/?i=(1-t)^2*A+%2B+2*(1-t)*t*B+%2B+t^2*C+%3D+0
     *
     * @param line the Line to test intersection with.
     * @param resolution the resolution (interval) of t. Higher resolution is more accurate, but slower.
     * @returns the Point where the line and curve intersect, or null if no intersection.
     */
    this.lineIntersection = function(line, resolution) {
        if (resolution == null) resolution = 0.01;
        var lastPoint = this.cp0;
        var intersection = null;
        for (var t = 1.0; t > -1; t -= resolution) {
            var tPoint = this.pointInTime(t);
            var secant = new Line(lastPoint, tPoint);
            intersection = line.lineIntersection(secant);
            if (intersection != null)
                return intersection;
            lastPoint = tPoint;
        }
        return null;
    };

    /**
     * Point on the quadratic curve at time t.
     *
     * @param t the time in [0,1].
     * @returns the Point at time t.
     */
    this.pointInTime = function(t) {
        // 1\cdot t^2+2\cdot (t\cdot (1-t))+1\cdot (1-t)^2
        return new Point(
            cp0.x * Math.pow(t, 2.0) + cp1.x * 2 * (t * (1.0 - t)) + cp2.x * Math.pow(1.0 - t, 2.0),
            cp0.y * Math.pow(t, 2.0) + cp1.y * 2 * (t * (1.0 - t)) + cp2.y * Math.pow(1.0 - t, 2.0));
    };

    this.render = function(context, width, height) {
        // Draw smooth curve.
        context.moveTo(cp0.x * width, cp0.y * height);
        context.quadraticCurveTo(
            cp1.x * width, cp1.y * height,
            cp2.x * width, cp2.y * height);
    };

    this.toString = function() {
        return '(' + cp0 + ',' + cp1 + ',' + cp2 + ')';
    };
}

/**
 * Cubic (3rd order) Bezier curve
 *
 * @param cp0 the 1st control Point.
 * @param cp1 the 2nd control Point.
 * @param cp2 the 3rd control Point.
 * @param cp3 the 4th control Point.
 */
function CubicCurve(cp0, cp1, cp2, cp3) {
    this.cp0 = cp0 != null ? cp0 : new Point();
    this.cp1 = cp1 != null ? cp1 : new Point();
    this.cp2 = cp2 != null ? cp2 : new Point();
    this.cp3 = cp3 != null ? cp3 : new Point();

    /**
     * Finds the point where this curve intersects a line.
     *
     * Uses curve flattening, which is more efficient than this evil solution for t:
     * http://www.wolframalpha.com/input/?i=(1-t)^3*A+%2B+3*(1-t)^2*t*B+%2B+3*(1-t)*t^2*C+%2B+t^3*D+%3D+0
     *
     * @param line the Line to test intersection with.
     * @param resolution the resolution (interval) of t. Higher resolution is more accurate, but slower.
     * @returns the Point where the line and curve intersect, or null if no intersection.
     */
    this.lineIntersection = function(line, resolution) {
        if (resolution == null) resolution = 0.01;
        var lastPoint = this.cp0;
        var intersection = null;
        for (var t = 1.0; t > -1; t -= resolution) {
            var tPoint = this.pointInTime(t);
            var secant = new Line(lastPoint, tPoint);
            intersection = line.lineIntersection(secant);
            if (intersection != null)
                return intersection;
            lastPoint = tPoint;
        }
        return null;
    };

    /**
     * Point on the cubic curve at time t.
     *
     * @param t the time in [0,1].
     * @returns the Point at time t.
     */
    this.pointInTime = function(t) {
        // 1\cdot t^3+3\cdot (t^2\cdot (1-t))+3\cdot (t\cdot (1-t)^2)+1\cdot (1-t)^3
        return new Point(
            cp0.x * Math.pow(t, 3.0) +
                cp3.x * 3 * (Math.pow(t, 2.0) * (1.0 - t)) +
                cp2.x * 3 * (t * Math.pow(1.0 - t, 2.0)) +
                cp1.x * Math.pow(1.0 - t, 3.0),
            cp0.y * Math.pow(t, 3.0) +
                cp3.y * 3 * (Math.pow(t, 2.0) * (1.0 - t)) +
                cp2.y * 3 * (t * Math.pow(1.0 - t, 2.0)) +
                cp1.y * Math.pow(1.0 - t, 3.0));
    };

    this.render = function(context, width, height) {
        // Draw smooth curve.
        context.moveTo(cp0.x * width, cp0.y * height);
        context.bezierCurveTo(
            cp3.x * width, cp3.y * height,
            cp2.x * width, cp2.y * height,
            cp1.x * width, cp1.y * height);
        // Draw individual points on curve.
        /*var interval = 0.01;
        for (var t = 0; t < 1.0; t += interval) {
            this.pointInTime(t).render(context, width, height);
        }*/
    };

    this.toString = function() {
        return '(' + cp0 + ',' + cp1 + ',' + cp2 + ',' + cp3 + ')';
    };
}

module.exports = {
    Point: Point,
    Line: Line,
    Rectangle: Rectangle,
    QuadraticCurve: QuadraticCurve,
    CubicCurve: CubicCurve
};
