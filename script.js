// Function to handle key press events
// @param {KeyboardEvent} event - The event triggered by a key press
function handleKeyPress(event) {
  if (event.key === 'Enter') {
    generateMathArt();
  }
}

// Add event listener to the input field
// @type {HTMLInputElement}
const expressionInput = document.getElementById('expressionInput');

expressionInput.addEventListener('keypress', handleKeyPress);

// Function to sanitize user input
// @param {string} input - The input string to sanitize
// @returns {string} - The sanitized string
function sanitizeInput(input) {
  // Allow only numbers, +, -, *, /, and whitespace
  return input.replace(/[^0-9+\-*/]/g, '');
}


// Generate math art using user input expression and options
// @constant {number} MAX_SHAPES - The maximum number of shapes to generate
const MAX_SHAPES = 1000; 

// Function to generate the math art
function generateMathArt() {
  // @type {HTMLDivElement}
  const artContainer = document.getElementById('artContainer');
  // @type {string}
  const expressionInputValue = expressionInput.value;
  // @type {string}
  const sanitizedExpression = sanitizeInput(expressionInputValue);
  // @type {string}
  const shapeOpacityInput = document.getElementById('shapeOpacityInput').value;
  // @type {string}
  const shapeSizeInput = document.getElementById('shapeSizeInput').value;
  // @type {string}
  const shapeBoxShadowInput = document.getElementById('shapeBoxShadowInput').value;
  // @type {string}
  const animationSelect = document.getElementById('animationSelect').value;
  artContainer.innerHTML = '';

  try {
    // @type {number}
    let evaluatedResult = eval(sanitizedExpression);
    if (isNaN(evaluatedResult) || evaluatedResult > 100000) {
      throw new Error('Invalid expression or result exceeds limit');
    }

    // Limit the number of shapes
    evaluatedResult = Math.min(evaluatedResult, MAX_SHAPES);

    const boxWidth = artContainer.offsetWidth;
    const boxHeight = artContainer.offsetHeight;
    const shapeSize = Number(shapeSizeInput);

    for (let i = 0; i < evaluatedResult; i++) {
      const shape = createShapeElement();

      const shapeWidth = getRandomSize(10, shapeSize);
      const shapeHeight = getRandomSize(10, shapeSize);
      const shapeLeft = getRandomPosition(boxWidth - shapeWidth);
      const shapeTop = getRandomPosition(boxHeight - shapeHeight);

      applyShapeStyle(shape, shapeWidth, shapeHeight, shapeLeft, shapeTop, shapeOpacityInput, shapeBoxShadowInput, animationSelect);

      artContainer.appendChild(shape);
    }
  } catch (error) {
    console.log(error);
    alert('Invalid input. Ensure the expression includes a number and the result is below 100,000.');
  }
}

// Create a shape element
// @returns {HTMLDivElement} - The shape element created
function createShapeElement() {
  const shape = document.createElement('div');
  shape.classList.add('shape');
  shape.style.backgroundColor = getRandomColor();
  return shape;
}

// Apply styles to the shape element
// @param {HTMLDivElement} shape - The shape element
// @param {number} width - The width of the shape
// @param {number} height - The height of the shape
// @param {number} left - The left position of the shape
// @param {number} top - The top position of the shape
// @param {string} opacity - The opacity of the shape
// @param {string} boxShadow - The box shadow of the shape
// @param {string} animation - The animation applied to the shape
function applyShapeStyle(shape, width, height, left, top, opacity, boxShadow, animation) {
  shape.style.left = left + 'px';
  shape.style.top = top + 'px';
  shape.style.width = width + 'px';
  shape.style.height = height + 'px';
  shape.style.borderRadius = getRandomBorderRadius() + '%';
  shape.style.background = getRandomGradient();
  shape.style.transform = getRandomRotation();
  shape.style.opacity = opacity;
  shape.style.boxShadow = `0 0 ${boxShadow}px ${getRandomColor()}`;

  // Apply animation based on user selection
  if (animation !== 'none') {
    shape.style.animation = `${animation} 3s infinite`;
  }
}

// Generate a random color
// @returns {string} - A random color in hex format
function getRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

// Generate a random position within the given max value
// @param {number} max - The maximum value for the position
// @returns {number} - A random position value
function getRandomPosition(max) {
  return Math.floor(Math.random() * (max + 1));
}

// Generate a random size within the given range
// @param {number} min - The minimum size value
// @param {number} max - The maximum size value
// @returns {number} - A random size value
function getRandomSize(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

// Generate a random border radius
// @returns {number} - A random border radius value
function getRandomBorderRadius() {
  return Math.floor(Math.random() * 50);
}

// Generate a random gradient
// @returns {string} - A random CSS gradient
function getRandomGradient() {
  const gradientDirections = ['to right', 'to bottom', 'to left', 'to top'];
  const gradientColors = [
    getRandomColor(),
    getRandomColor(),
    getRandomColor()
  ];
  const randomDirection = gradientDirections[Math.floor(Math.random() * gradientDirections.length)];
  return `linear-gradient(${randomDirection}, ${gradientColors.join(',')})`;
}

// Generate a random rotation
// @returns {string} - A random CSS rotation value
function getRandomRotation() {
  const rotationDegrees = ['0deg', '90deg', '180deg', '270deg'];
  return `rotate(${rotationDegrees[Math.floor(Math.random() * rotationDegrees.length)]})`;
}

// Saves the art container content as an image using html2canvas
function saveImage() {
  const artContainer = document.getElementById('artContainer'); // Get the art container
  html2canvas(artContainer).then(function (canvas) {
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = 'ChaosVision.png';
    link.click();
  });
}

// Event listeners for buttons
const generateBtn = document.getElementById('generateBtn');
generateBtn.addEventListener('click', generateMathArt);

const saveBtn = document.getElementById('saveBtn');
saveBtn.addEventListener('click', saveImage);
