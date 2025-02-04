import React, { useState, useEffect, useRef } from 'react';
import './TextToPng.css';

const TextToPng = () => {
  const [text, setText] = useState('');
  const [hRes, setHRes] = useState(1000);
  const [vRes, setVRes] = useState(1000);
  const [borderSize, setBorderSize] = useState(2);
  const [align, setAlign] = useState('left');
  const [font, setFont] = useState('Arial');
  const [color, setColor] = useState('#ffffff');
  const [bgColor, setBgColor] = useState('#000000');
  const canvasRef = useRef(null);

  // Add input validation for all number inputs
  const handleNumberChange = (setter, min, max) => (e) => {
    const value = Math.max(min, Math.min(max, parseInt(e.target.value) || min));
    setter(value);
  };

  // Add error state
  const [error, setError] = useState('');

  useEffect(() => {
    try {
      if (text.trim() === '') {
        setError('Please enter some text');
        return;
      }
      setError('');
      
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      // Calculate available space considering border percentage
      const borderPixels = (borderSize / 100) * Math.min(hRes, vRes);
      const maxWidth = hRes - borderPixels * 2;
      const maxHeight = vRes - borderPixels * 2;

      // First split by newlines, then by words
      const paragraphs = text.split('\n');
      const allWords = paragraphs.map(para => para.split(' '));

      // Find optimal font size using binary search
      let fontSize = 1;
      let low = 1;
      let high = Math.min(maxHeight, 1000);
      
      while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        ctx.font = `${mid}px ${font}`;
        
        // Calculate lines with this font size
        let lines = [];
        let maxLineWidth = 0;
        
        allWords.forEach((words, paraIndex) => {
          // Add empty line for paragraph breaks, except for first paragraph
          if (paraIndex > 0) lines.push('');
          
          let currentLine = '';
          for (const word of words) {
            const testLine = currentLine ? currentLine + ' ' + word : word;
            const metrics = ctx.measureText(testLine);
            
            if (metrics.width > maxWidth && currentLine !== '') {
              lines.push(currentLine);
              maxLineWidth = Math.max(maxLineWidth, ctx.measureText(currentLine).width);
              currentLine = word;
            } else {
              currentLine = testLine;
            }
          }
          if (currentLine) {
            lines.push(currentLine);
            maxLineWidth = Math.max(maxLineWidth, ctx.measureText(currentLine).width);
          }
        });

        // Check if text fits within height
        const lineHeight = mid * 1.2;
        const totalHeight = lineHeight * lines.length;
        
        if (totalHeight > maxHeight || maxLineWidth > maxWidth) {
          high = mid - 1;
        } else {
          low = mid + 1;
          fontSize = mid;
        }
      }

      // Draw canvas
      ctx.clearRect(0, 0, hRes, vRes);
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, hRes, vRes);
      
      // Draw text
      ctx.fillStyle = color;
      ctx.font = `${fontSize}px ${font}`;
      ctx.textAlign = align;
      ctx.textBaseline = 'middle';

      // Calculate final lines
      let lines = [];
      allWords.forEach((words, paraIndex) => {
        // Add empty line for paragraph breaks, except for first paragraph
        if (paraIndex > 0) lines.push('');
        
        let currentLine = '';
        for (const word of words) {
          const testLine = currentLine ? currentLine + ' ' + word : word;
          const metrics = ctx.measureText(testLine);
          
          if (metrics.width > maxWidth && currentLine !== '') {
            lines.push(currentLine);
            currentLine = word;
          } else {
            currentLine = testLine;
          }
        }
        if (currentLine) {
          lines.push(currentLine);
        }
      });

      // Draw each line
      const lineHeight = fontSize * 1.2;
      const totalHeight = lineHeight * lines.length;
      const startY = (vRes - totalHeight) / 2 + lineHeight / 2;

      lines.forEach((line, i) => {
        if (align === 'justify' && i < lines.length - 1 && line.trim() !== '') {
          // Justify all lines except the last one and empty lines
          const words = line.split(' ');
          const spaceWidth = (maxWidth - ctx.measureText(line.replace(/ /g, '')).width) / (words.length - 1);
          let currentX = borderPixels;
          
          words.forEach((word, wordIndex) => {
            // Ensure we don't exceed maxWidth
            if (currentX + ctx.measureText(word).width <= hRes - borderPixels) {
              ctx.fillText(word, currentX, startY + (i * lineHeight));
              if (wordIndex < words.length - 1) {
                currentX += ctx.measureText(word).width + spaceWidth;
              }
            }
          });
        } else {
          // For non-justified text or last line
          const x = align === 'left' ? borderPixels : 
                   align === 'right' ? hRes - borderPixels : 
                   hRes / 2;
          ctx.textAlign = align === 'justify' ? 'left' : align;
          // Add a small padding to ensure text doesn't touch border
          const padding = fontSize * 0.1;
          ctx.fillText(line, x, startY + (i * lineHeight), maxWidth - padding);
        }
      });

    } catch (err) {
      setError('Error generating preview: ' + err.message);
    }
  }, [text, hRes, vRes, borderSize, align, font, color, bgColor]);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.download = 'text-image.png';
    link.href = canvasRef.current.toDataURL();
    link.click();
  };

  return (
    <div className="container">
      <div className="controls">
        <textarea 
          value={text} 
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter text..."
        />
        
        <label>Horizontal Resolution:</label>
        <input 
          type="number" 
          value={hRes} 
          min="100"
          max="5000"
          onChange={handleNumberChange(setHRes, 100, 5000)}
        />
        
        <label>Vertical Resolution:</label>
        <input 
          type="number" 
          value={vRes} 
          min="100"
          max="5000"
          onChange={handleNumberChange(setVRes, 100, 5000)}
        />
        
        <label>Border Size:</label>
        <div className="border-control">
          <input
            type="range"
            min="1"
            max="20" // Reduced from 100 to more reasonable border size
            value={borderSize}
            onChange={handleNumberChange(setBorderSize, 1, 20)}
          />
          <span>{borderSize}%</span>
        </div>
        
        <label>Alignment:</label>
        <select value={align} onChange={(e) => setAlign(e.target.value)}>
          <option value="left">Left</option>
          <option value="center">Center</option>
          <option value="right">Right</option>
          <option value="justify">Justify</option>
        </select>
        
        <label>Font:</label>
        <select value={font} onChange={(e) => setFont(e.target.value)}>
          <option value="Inter">Inter</option>
          <option value="Roboto">Roboto</option>
          <option value="Open Sans">Open Sans</option>
          <option value="Lato">Lato</option>
          <option value="Source Sans Pro">Source Sans Pro</option>
          <option value="Work Sans">Work Sans</option>
          <option value="Noto Sans">Noto Sans</option>
          <option value="Arial">Arial</option>
          <option value="Helvetica">Helvetica</option>
        </select>
        
        <label>Text Color:</label>
        <input 
          type="color" 
          value={color} 
          onChange={(e) => setColor(e.target.value)}
        />
        
        <label>Background Color:</label>
        <input 
          type="color" 
          value={bgColor} 
          onChange={(e) => setBgColor(e.target.value)}
        />
      </div>

      <div className="preview">
        <canvas 
          ref={canvasRef}
          width={hRes}
          height={vRes}
        />
        {error && <div className="error">{error}</div>}
        <button 
          onClick={handleDownload} 
          disabled={!!error || text.trim() === ''}
        >
          Download PNG
        </button>
      </div>
    </div>
  );
};

export default TextToPng; 