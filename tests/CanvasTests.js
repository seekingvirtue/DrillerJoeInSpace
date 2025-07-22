/**
 * Unit Tests for Canvas.js
 * Tests canvas utility functions
 */

// Mock canvas for testing
function createMockCanvas() {
    const mockCanvas = {
        width: 800,
        height: 600,
        getContext: () => ({
            fillStyle: '',
            strokeStyle: '',
            lineWidth: 0,
            font: '',
            textAlign: '',
            textBaseline: '',
            globalAlpha: 1,
            fillRect: () => {},
            strokeRect: () => {},
            fillText: () => {},
            beginPath: () => {},
            arc: () => {},
            fill: () => {},
            stroke: () => {},
            moveTo: () => {},
            lineTo: () => {},
            clearRect: () => {},
            save: () => {},
            restore: () => {}
        })
    };
    return mockCanvas;
}

// Canvas Tests
unitTest.test('Canvas - Constructor sets canvas and context', () => {
    const mockCanvas = createMockCanvas();
    const canvas = new Canvas(mockCanvas);
    
    unitTest.assertEqual(canvas.canvas, mockCanvas, 'Canvas should store canvas reference');
    unitTest.assertNotNull(canvas.ctx, 'Context should be set');
});

unitTest.test('Canvas - Clear sets correct fill style', () => {
    const mockCanvas = createMockCanvas();
    let fillStyle = '';
    mockCanvas.getContext = () => ({
        fillStyle: '',
        set fillStyle(value) { fillStyle = value; },
        get fillStyle() { return fillStyle; },
        fillRect: () => {}
    });
    
    const canvas = new Canvas(mockCanvas);
    canvas.clear('#FF0000');
    
    unitTest.assertEqual(fillStyle, '#FF0000', 'Fill style should be set to clear color');
});

unitTest.test('Canvas - DrawText sets correct properties', () => {
    const mockCanvas = createMockCanvas();
    let font = '';
    let fillStyle = '';
    let textAlign = '';
    let textBaseline = '';
    
    mockCanvas.getContext = () => ({
        set font(value) { font = value; },
        get font() { return font; },
        set fillStyle(value) { fillStyle = value; },
        get fillStyle() { return fillStyle; },
        set textAlign(value) { textAlign = value; },
        get textAlign() { return textAlign; },
        set textBaseline(value) { textBaseline = value; },
        get textBaseline() { return textBaseline; },
        fillText: () => {}
    });
    
    const canvas = new Canvas(mockCanvas);
    canvas.drawText('Test', 100, 200, '#00FF00', 24, 'Arial');
    
    unitTest.assertEqual(font, '24px Arial', 'Font should be set correctly');
    unitTest.assertEqual(fillStyle, '#00FF00', 'Fill style should be set to text color');
    unitTest.assertEqual(textAlign, 'center', 'Text align should be center');
    unitTest.assertEqual(textBaseline, 'middle', 'Text baseline should be middle');
});

unitTest.test('Canvas - DrawRect sets correct properties', () => {
    const mockCanvas = createMockCanvas();
    let fillStyle = '';
    let rectX, rectY, rectW, rectH;
    
    mockCanvas.getContext = () => ({
        set fillStyle(value) { fillStyle = value; },
        get fillStyle() { return fillStyle; },
        fillRect: (x, y, w, h) => { rectX = x; rectY = y; rectW = w; rectH = h; }
    });
    
    const canvas = new Canvas(mockCanvas);
    canvas.drawRect(50, 100, 200, 150, '#0000FF');
    
    unitTest.assertEqual(fillStyle, '#0000FF', 'Fill style should be set to rect color');
    unitTest.assertEqual(rectX, 50, 'Rectangle X should be correct');
    unitTest.assertEqual(rectY, 100, 'Rectangle Y should be correct');
    unitTest.assertEqual(rectW, 200, 'Rectangle width should be correct');
    unitTest.assertEqual(rectH, 150, 'Rectangle height should be correct');
});

unitTest.test('Canvas - DrawStroke sets correct properties', () => {
    const mockCanvas = createMockCanvas();
    let strokeStyle = '';
    let lineWidth = 0;
    let rectX, rectY, rectW, rectH;
    
    mockCanvas.getContext = () => ({
        set strokeStyle(value) { strokeStyle = value; },
        get strokeStyle() { return strokeStyle; },
        set lineWidth(value) { lineWidth = value; },
        get lineWidth() { return lineWidth; },
        strokeRect: (x, y, w, h) => { rectX = x; rectY = y; rectW = w; rectH = h; }
    });
    
    const canvas = new Canvas(mockCanvas);
    canvas.drawStroke(25, 75, 300, 400, '#FFFF00', 3);
    
    unitTest.assertEqual(strokeStyle, '#FFFF00', 'Stroke style should be set correctly');
    unitTest.assertEqual(lineWidth, 3, 'Line width should be set correctly');
    unitTest.assertEqual(rectX, 25, 'Stroke X should be correct');
    unitTest.assertEqual(rectY, 75, 'Stroke Y should be correct');
    unitTest.assertEqual(rectW, 300, 'Stroke width should be correct');
    unitTest.assertEqual(rectH, 400, 'Stroke height should be correct');
});

unitTest.test('Canvas - DrawCircle sets correct properties', () => {
    const mockCanvas = createMockCanvas();
    let fillStyle = '';
    let arcCalled = false;
    let arcX, arcY, arcRadius;
    
    mockCanvas.getContext = () => ({
        set fillStyle(value) { fillStyle = value; },
        get fillStyle() { return fillStyle; },
        beginPath: () => {},
        arc: (x, y, radius, start, end) => { 
            arcCalled = true;
            arcX = x;
            arcY = y;
            arcRadius = radius;
        },
        fill: () => {}
    });
    
    const canvas = new Canvas(mockCanvas);
    canvas.drawCircle(150, 250, 30, '#FF00FF');
    
    unitTest.assertEqual(fillStyle, '#FF00FF', 'Fill style should be set to circle color');
    unitTest.assertTrue(arcCalled, 'Arc should be called');
    unitTest.assertEqual(arcX, 150, 'Circle X should be correct');
    unitTest.assertEqual(arcY, 250, 'Circle Y should be correct');
    unitTest.assertEqual(arcRadius, 30, 'Circle radius should be correct');
});

unitTest.test('Canvas - DrawLine sets correct properties', () => {
    const mockCanvas = createMockCanvas();
    let strokeStyle = '';
    let lineWidth = 0;
    let pathStarted = false;
    let moveToX, moveToY, lineToX, lineToY;
    
    mockCanvas.getContext = () => ({
        set strokeStyle(value) { strokeStyle = value; },
        get strokeStyle() { return strokeStyle; },
        set lineWidth(value) { lineWidth = value; },
        get lineWidth() { return lineWidth; },
        beginPath: () => { pathStarted = true; },
        moveTo: (x, y) => { moveToX = x; moveToY = y; },
        lineTo: (x, y) => { lineToX = x; lineToY = y; },
        stroke: () => {}
    });
    
    const canvas = new Canvas(mockCanvas);
    canvas.drawLine(10, 20, 30, 40, '#00FFFF', 2);
    
    unitTest.assertEqual(strokeStyle, '#00FFFF', 'Stroke style should be set correctly');
    unitTest.assertEqual(lineWidth, 2, 'Line width should be set correctly');
    unitTest.assertTrue(pathStarted, 'Path should be started');
    unitTest.assertEqual(moveToX, 10, 'MoveTo X should be correct');
    unitTest.assertEqual(moveToY, 20, 'MoveTo Y should be correct');
    unitTest.assertEqual(lineToX, 30, 'LineTo X should be correct');
    unitTest.assertEqual(lineToY, 40, 'LineTo Y should be correct');
});

unitTest.test('Canvas - GetWidth returns canvas width', () => {
    const mockCanvas = createMockCanvas();
    mockCanvas.width = 1024;
    
    const canvas = new Canvas(mockCanvas);
    
    unitTest.assertEqual(canvas.getWidth(), 1024, 'Should return canvas width');
});

unitTest.test('Canvas - GetHeight returns canvas height', () => {
    const mockCanvas = createMockCanvas();
    mockCanvas.height = 768;
    
    const canvas = new Canvas(mockCanvas);
    
    unitTest.assertEqual(canvas.getHeight(), 768, 'Should return canvas height');
});
