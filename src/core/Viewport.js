/**
 * Viewport helper
 * Manages logical resolution, CSS scaling (letterbox), and devicePixelRatio handling.
 * Keeps the game's logical coordinate system (e.g., 800x600) stable while scaling the
 * canvas visually to fill the container with preserved aspect ratio.
 */
class Viewport {
    static setup(canvas, ctx, logicalWidth = 800, logicalHeight = 600, container = null) {
        Viewport.canvas = canvas;
        Viewport.ctx = ctx;
        Viewport.logicalWidth = logicalWidth;
        Viewport.logicalHeight = logicalHeight;
        // container can be passed (element) or will default to parentElement
        Viewport.container = container || canvas.parentElement || document.body;

        // Initial resize and attach handler
        Viewport._applySize();
        window.addEventListener('resize', () => Viewport._applySize());
    }

    static _applySize() {
        if (!Viewport.canvas || !Viewport.ctx) return;

        const containerWidth = Viewport.container.clientWidth || window.innerWidth;
        const containerHeight = Viewport.container.clientHeight || window.innerHeight;

        // Calculate scale that fits while preserving aspect
        const scale = Math.min(
            containerWidth / Viewport.logicalWidth,
            containerHeight / Viewport.logicalHeight
        );

        // CSS display size in CSS pixels
        const displayWidth = Math.max(1, Math.floor(Viewport.logicalWidth * scale));
        const displayHeight = Math.max(1, Math.floor(Viewport.logicalHeight * scale));

        // Set CSS size (how big it appears on screen)
        Viewport.canvas.style.width = displayWidth + 'px';
        Viewport.canvas.style.height = displayHeight + 'px';

        // Backing store size in physical pixels (for crisp rendering on HiDPI)
        const dpr = window.devicePixelRatio || 1;
        Viewport.dpr = dpr;

        Viewport.canvas.width = Math.round(Viewport.logicalWidth * dpr);
        Viewport.canvas.height = Math.round(Viewport.logicalHeight * dpr);

        // Ensure drawing operations use logical coordinates by scaling the context
        Viewport.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        // Turn off smoothing for pixel-crisp retro look
        if (typeof Viewport.ctx.imageSmoothingEnabled !== 'undefined') {
            Viewport.ctx.imageSmoothingEnabled = false;
        }

        // Store the last computed display dimensions for mapping
        Viewport._displayWidth = displayWidth;
        Viewport._displayHeight = displayHeight;
        Viewport._scale = scale;
    }

    // Map client (DOM) coordinates to logical game coordinates
    static clientToLogical(clientX, clientY) {
        if (!Viewport.canvas) return { x: clientX, y: clientY };

        const rect = Viewport.canvas.getBoundingClientRect();
        // rect.width/height are CSS pixels (display size)
        const x = (clientX - rect.left) * (Viewport.logicalWidth / rect.width);
        const y = (clientY - rect.top) * (Viewport.logicalHeight / rect.height);
        return { x: x, y: y };
    }

    static getLogicalWidth() { return Viewport.logicalWidth; }
    static getLogicalHeight() { return Viewport.logicalHeight; }
    static getScale() { return Viewport._scale || 1; }
}
