import React, { useState, useEffect, useRef } from 'react';
import './TextToPng.css';

const TextToPng = () => {
  const [text, setText] = useState('');
  const [hRes, setHRes] = useState(1000);
  const [vRes, setVRes] = useState(1000);
  const [borderSize, setBorderSize] = useState(2);
  const [align, setAlign] = useState('left');
  const [font, setFont] = useState('Inter');
  const [color, setColor] = useState('#ffffff');
  const [bgColor, setBgColor] = useState('#000000');
  const canvasRef = useRef(null);
  const [fontsLoaded, setFontsLoaded] = useState(false);

  // Add input validation for all number inputs
  const handleNumberChange = (setter, min, max) => (e) => {
    // Allow empty string or 0 for resolutions to make editing easier
    if (e.target.value === '' || e.target.value === '0') {
      setter(0);
      return;
    }
    const value = Math.max(min, Math.min(max, parseInt(e.target.value) || min));
    setter(value);
  };

  // Add error state
  const [error, setError] = useState('');

  // Add a function to adjust resolution values
  const adjustResolution = (setter, currentValue, adjustment) => {
    // Ensure the result is within bounds (0-5000)
    const newValue = Math.max(0, Math.min(5000, currentValue + adjustment));
    setter(newValue);
  };

  // Handle font change with proper loading
  const handleFontChange = (e) => {
    const newFont = e.target.value;
    setFont(newFont);
    
    // Force a redraw by creating a temporary canvas context
    setTimeout(() => {
      if (canvasRef.current) {
        const tempCtx = canvasRef.current.getContext('2d');
        tempCtx.font = `16px ${newFont}`;
        // Measure something to ensure the font is loaded
        tempCtx.measureText('test');
        
        // Force a redraw by triggering a small state change
        setText(prevText => prevText + ' ');
        setTimeout(() => {
          setText(prevText => prevText.trim());
        }, 10);
      }
    }, 0);
  };

  // Ensure fonts are loaded before initial render
  useEffect(() => {
    // Use the document.fonts API if available
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        setFontsLoaded(true);
      });
    } else {
      // Fallback for browsers that don't support document.fonts
      setFontsLoaded(true);
    }
  }, []);

  useEffect(() => {
    try {
      if (text.trim() === '') {
        setError('Please enter some text');
        return;
      }
      
      // Skip rendering if fonts aren't loaded yet
      if (!fontsLoaded && text.trim() !== '') {
        return;
      }
      
      // Use default values if resolutions are 0
      const effectiveHRes = hRes || 100;
      const effectiveVRes = vRes || 100;
      
      setError('');
      
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      // Ensure the font is loaded before drawing
      ctx.font = `16px ${font}`;
      ctx.measureText('test'); // Force font to load
      
      // Calculate available space considering border percentage
      const borderPixels = (borderSize / 100) * Math.min(effectiveHRes, effectiveVRes);
      const maxWidth = effectiveHRes - borderPixels * 2;
      const maxHeight = effectiveVRes - borderPixels * 2;

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
      ctx.clearRect(0, 0, effectiveHRes, effectiveVRes);
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, effectiveHRes, effectiveVRes);
      
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
      const startY = (effectiveVRes - totalHeight) / 2 + lineHeight / 2;

      lines.forEach((line, i) => {
        if (align === 'justify' && i < lines.length - 1 && line.trim() !== '') {
          // Justify all lines except the last one and empty lines
          const words = line.split(' ');
          const spaceWidth = (maxWidth - ctx.measureText(line.replace(/ /g, '')).width) / (words.length - 1);
          let currentX = borderPixels;
          
          words.forEach((word, wordIndex) => {
            // Ensure we don't exceed maxWidth
            if (currentX + ctx.measureText(word).width <= effectiveHRes - borderPixels) {
              ctx.fillText(word, currentX, startY + (i * lineHeight));
              if (wordIndex < words.length - 1) {
                currentX += ctx.measureText(word).width + spaceWidth;
              }
            }
          });
        } else {
          // For non-justified text or last line
          const x = align === 'left' ? borderPixels : 
                   align === 'right' ? effectiveHRes - borderPixels : 
                   effectiveHRes / 2;
          ctx.textAlign = align === 'justify' ? 'left' : align;
          // Add a small padding to ensure text doesn't touch border
          const padding = fontSize * 0.1;
          ctx.fillText(line, x, startY + (i * lineHeight), maxWidth - padding);
        }
      });

    } catch (err) {
      setError('Error generating preview: ' + err.message);
    }
  }, [text, hRes, vRes, borderSize, align, font, color, bgColor, fontsLoaded]);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.download = 'text-image.png';
    link.href = canvasRef.current.toDataURL();
    link.click();
  };

  const handleCopyToClipboard = async () => {
    try {
      const dataUrl = canvasRef.current.toDataURL();
      // Convert data URL to blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      
      // Copy to clipboard using Clipboard API
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob
        })
      ]);
    } catch (err) {
      setError('Failed to copy to clipboard: ' + err.message);
    }
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
        <div className="resolution-control">
          <input 
            type="number" 
            value={hRes} 
            min="0"
            max="5000"
            onChange={handleNumberChange(setHRes, 0, 5000)}
          />
          <div className="resolution-buttons">
            <button onClick={() => adjustResolution(setHRes, hRes, -100)}>-100</button>
            <button onClick={() => adjustResolution(setHRes, hRes, -10)}>-10</button>
            <button onClick={() => adjustResolution(setHRes, hRes, 10)}>+10</button>
            <button onClick={() => adjustResolution(setHRes, hRes, 100)}>+100</button>
          </div>
        </div>
        
        <label>Vertical Resolution:</label>
        <div className="resolution-control">
          <input 
            type="number" 
            value={vRes} 
            min="0"
            max="5000"
            onChange={handleNumberChange(setVRes, 0, 5000)}
          />
          <div className="resolution-buttons">
            <button onClick={() => adjustResolution(setVRes, vRes, -100)}>-100</button>
            <button onClick={() => adjustResolution(setVRes, vRes, -10)}>-10</button>
            <button onClick={() => adjustResolution(setVRes, vRes, 10)}>+10</button>
            <button onClick={() => adjustResolution(setVRes, vRes, 100)}>+100</button>
          </div>
        </div>
        
        <div className="controls-row">
          <div className="control-group">
            <label>Border Size:</label>
            <div className="border-control">
              <input
                type="range"
                min="1"
                max="10" // Changed from 20 to 10
                value={borderSize}
                onChange={handleNumberChange(setBorderSize, 1, 10)}
              />
              <span>{borderSize}%</span>
            </div>
          </div>
          
          <div className="control-group">
            <label>Alignment:</label>
            <select value={align} onChange={(e) => setAlign(e.target.value)}>
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
              <option value="justify">Justify</option>
            </select>
          </div>
          
          <div className="control-group">
            <label>Font:</label>
            <select value={font} onChange={handleFontChange}>
              <option value="Inter">Inter</option>
              <option value="Roboto">Roboto</option>
              <option value="Open Sans">Open Sans</option>
              <option value="Lato">Lato</option>
              <option value="Source Sans Pro">Source Sans Pro</option>
              <option value="Work Sans">Work Sans</option>
              <option value="Noto Sans">Noto Sans</option>
              <option value="Arial">Arial</option>
            </select>
          </div>
        </div>
        
        <div className="controls-row">
          <div className="control-group">
            <label>Text Color:</label>
            <input 
              type="color" 
              value={color} 
              onChange={(e) => setColor(e.target.value)}
            />
          </div>
          
          <div className="control-group">
            <label>Background Color:</label>
            <input 
              type="color" 
              value={bgColor} 
              onChange={(e) => setBgColor(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="preview">
        <div className="button-container">
          <button 
            onClick={handleDownload} 
            disabled={!!error || text.trim() === ''}
          >
            Download PNG
          </button>
          <button 
            onClick={handleCopyToClipboard} 
            disabled={!!error || text.trim() === ''}
          >
            Copy PNG to Clipboard
          </button>
        </div>
        <div className="canvas-container">
          <canvas 
            ref={canvasRef}
            width={hRes || 100}
            height={vRes || 100}
          />
        </div>
        {error && <div className="error">{error}</div>}
      </div>
    </div>
  );
};

export default TextToPng; 