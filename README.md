# Text to PNG Converter

A simple web application that converts text to PNG images with customizable settings. This tool allows you to create images from text with various fonts, colors, alignments, and resolutions. This README is AI-generated.

![Text to PNG Converter](screenshot.png)

## Features

- **Text to Image Conversion**: Convert any text into a high-quality PNG image
- **Customizable Text Styling**:
  - Choose from multiple fonts (Inter, Roboto, Open Sans, Lato, and more)
  - Set text color with a color picker
  - Adjust text alignment (left, center, right, justify)
- **Image Customization**:
  - Set custom horizontal and vertical resolutions (up to 5000px)
  - Adjust border size (1-10% of the image)
  - Choose background color with a color picker
- **Convenient Controls**:
  - Quick resolution adjustment buttons (-100, -10, +10, +100)
  - Responsive preview that scales to fit your screen
- **Export Options**:
  - Download as PNG file
  - Copy directly to clipboard for easy pasting into other applications

## Installation

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/text-to-png.git
   cd text-to-png
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Start the development server:
   ```bash
   npm start
   # or
   yarn start
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser to use the application.

## Usage

1. **Enter Text**: Type or paste your text in the text area
2. **Adjust Settings**:
   - Set the desired image resolution
   - Choose font, alignment, and colors
   - Adjust border size as needed
3. **Preview**: See a live preview of your image
4. **Export**: Download as PNG or copy to clipboard

## How It Works

The application uses HTML5 Canvas to render text with your chosen settings. It automatically calculates the optimal font size to fit your text within the specified dimensions while maintaining readability. The binary search algorithm ensures the text is as large as possible without overflowing the canvas.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.