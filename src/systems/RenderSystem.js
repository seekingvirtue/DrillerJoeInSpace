/**
 * Render System
 * Handles rendering operations and graphics utilities
 */
class RenderSystem {
    constructor(ctx) {
        this.ctx = ctx;
        this.canvas = ctx.canvas;
    }
    
    clear(color = '#000000') {
        Canvas.clear(this.ctx, this.canvas.width, this.canvas.height, color);
    }
    
    drawRect(x, y, width, height, color) {
        Canvas.drawRect(this.ctx, x, y, width, height, color);
    }
    
    drawCircle(x, y, radius, color) {
        // Safety check to prevent negative radius errors
        if (radius <= 0) {
            console.warn('RenderSystem.drawCircle: Invalid radius', radius, 'at position', x, y);
            return;
        }
        Canvas.drawCircle(this.ctx, x, y, radius, color);
    }
    
    drawText(text, x, y, color, fontSize = 16, font = 'Courier New') {
        Canvas.drawText(this.ctx, text, x, y, color, fontSize, font);
    }
    
    drawStroke(x, y, width, height, color, lineWidth = 1) {
        Canvas.drawStroke(this.ctx, x, y, width, height, color, lineWidth);
    }
    
    drawLine(x1, y1, x2, y2, color, lineWidth = 1) {
        Canvas.drawLine(this.ctx, x1, y1, x2, y2, color, lineWidth);
    }
    
    // Draw a starfield background
    drawStarfield(stars) {
        stars.forEach(star => {
            this.drawCircle(star.x, star.y, star.size, star.color);
        });
    }
    
    // Get canvas dimensions
    getWidth() {
        return this.canvas.width;
    }
    
    getHeight() {
        return this.canvas.height;
    }
}
