/**
 * Menu UI Component
 * Handles menu interface elements and styling
 */
class Menu {
    constructor() {
        this.options = [];
        this.selectedIndex = 0;
        this.style = {
            backgroundColor: '#001122',
            selectedColor: '#00FFFF',
            normalColor: '#FFFFFF',
            fontSize: 24,
            font: 'Courier New'
        };
    }
    
    addOption(text, callback) {
        this.options.push({
            text: text,
            callback: callback
        });
    }
    
    setSelectedIndex(index) {
        this.selectedIndex = Math.max(0, Math.min(this.options.length - 1, index));
    }
    
    selectNext() {
        this.setSelectedIndex(this.selectedIndex + 1);
    }
    
    selectPrevious() {
        this.setSelectedIndex(this.selectedIndex - 1);
    }
    
    selectCurrent() {
        if (this.options[this.selectedIndex] && this.options[this.selectedIndex].callback) {
            this.options[this.selectedIndex].callback();
        }
    }
    
    render(renderer, x, y, spacing = 50) {
        this.options.forEach((option, index) => {
            const optionY = y + (index * spacing);
            const isSelected = index === this.selectedIndex;
            
            // Draw selection background
            if (isSelected) {
                const textWidth = option.text.length * 12; // Approximate text width
                renderer.drawRect(x - textWidth/2 - 10, optionY - 20, textWidth + 20, 35, this.style.backgroundColor);
                renderer.drawStroke(x - textWidth/2 - 10, optionY - 20, textWidth + 20, 35, this.style.selectedColor, 2);
            }
            
            // Draw option text
            const color = isSelected ? this.style.selectedColor : this.style.normalColor;
            renderer.drawText(option.text, x, optionY, color, this.style.fontSize, this.style.font);
        });
    }
    
    clear() {
        this.options = [];
        this.selectedIndex = 0;
    }
}
