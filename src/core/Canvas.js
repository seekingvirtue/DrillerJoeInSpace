/**
 * Canvas Utilities
 * Helper functions for canvas operations and rendering utilities
 */
class Canvas {
    static drawRect(ctx, x, y, width, height, color) {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, width, height);
    }
    
    static drawCircle(ctx, x, y, radius, color) {
        // Safety check to prevent negative radius errors
        if (radius <= 0) {
            console.warn('Canvas.drawCircle: Invalid radius', radius, 'at position', x, y);
            return;
        }
        
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }
    
    static drawText(ctx, text, x, y, color, fontSize = 16, font = 'Courier New') {
        ctx.fillStyle = color;
        ctx.font = `${fontSize}px ${font}`;
        ctx.fillText(text, x, y);
    }
    
    static drawStroke(ctx, x, y, width, height, color, lineWidth = 1) {
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.strokeRect(x, y, width, height);
    }
    
    static drawLine(ctx, x1, y1, x2, y2, color, lineWidth = 1) {
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    }
    
    static clear(ctx, width, height, color = '#000000') {
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, width, height);
    }
}
