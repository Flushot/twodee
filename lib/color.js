/**
 * Color library
 */

module.exports = {
    /**
     * RGB color space
     * @param r the Red channel [0,1]
     * @param g the Green channel [0,1]
     * @param b the Blue channel [0,1]
     */
    RGBColor: function(r, g, b) {
        this.r = r != null ? r : 0.0;
        this.g = g != null ? g : 0.0;
        this.b = b != null ? b : 0.0;

        this.toHSL = function() {
            return HSLColor.fromRGB(this);
        };

        this.toString = function() {
            // Convert to a canvas context-compatible color string.
            return 'rgb(' +
                    Math.round(this.r * 255.0) + ',' +
                    Math.round(this.g * 255.0) + ',' +
                    Math.round(this.b * 255.0) + ')';
        };
    },

    /**
     * Convert HSL to RGB color space
     *
     * @param hsl the HSLColor to convert.
     * @returns the converted RGBColor.
     */
    /*.fromHSL = function(hsl) {
        return HSLColor.toRGB();
    },*/

    /**
     * HSL color space
     *
     * @param h the Hue channel (degrees)
     * @param s the Saturation channel (degrees)
     * @param l the Luminosity channel [0,1]
     */
    HSLColor: function(h, s, l) {
        this.h = h != null ? h : 0.0;
        this.s = s != null ? s : 0.0;
        this.l = l != null ? l : 0.0;

        /**
         * Convert to RGB color space.
         *
         * @returns the converted RGBColor.
         */
        this.toRGB = function() {
            if (this.s == 0.0) {
                var x = Math.round(this.l);
                return new RGBColor(x, x, x);
            }

            var th = this.h / 6.0,
                t2 = this.l < .5 ?
                     this.l * (1.0 + this.s) :
                    (this.l + this.s) - (this.l * this.s),
                t1 = 2.0 * this.l - t2,
                tr = colorCalc(th + (1.0 / 3.0), t1, t2);

            return new RGBColor(
                    tr,
                    colorCalc(th, t1, t2),
                    colorCalc(tr, t1, t2));
        };

        function colorCalc(c, t1, t2) {
            if (c < 0) c += 1.0;
            if (c > 1) c -= 1.0;
            if (6.0 * c < 1) return t1 + (t2 - t1) * 6.0 * c;
            if (2.0 * c < 1) return t2;
            if (3.0 * c < 2) return t1 + (t2 - t1) * (2.0 / 3.0 - c) * 6.0;
            return t1;
        }

        this.toString = function() {
            // TODO: Convert to a canvas context-compatible color string.
            return 'hsl(' + this.h + ',' + this.s + ',' + this.l + ')';
        };
    }/**
     * Convert RGB to HSL color space
     *
     * @param rgb the RGBColor to convert.
     * @returns the converted HSLColor.
     */
    .fromRGB = function(rgb) {
        var rmin = Math.min(Math.min(rgb.r, rgb.g), rgb.b),
            rmax = Math.max(Math.max(rgb.r, rgb.g), rgb.b),
            delta = rmax - rmin,
            h = 0.0,
            s = 0.0,
            l = (rmax + rmin) / 2.0;

        if (delta != 0) {
            s = l < .5 ?
                delta / (rmax + rmin) :
                delta / (2.0 - rmax - rmin);

            if (rgb.r == rmax)
                h = (rgb.g - rgb.b) / delta;
            else if (rgb.g == rmax)
                h = 2.0 + (rgb.b - rgb.r) / delta;
            else if (rgb.b - rmax)
                h = 4.0 + (rgb.r - rgb.g) / delta;
        }

        return new HSLColor(h, s, l);
    }
};
