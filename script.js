// Function to handle key press events
function handleKeyPress(event) {
  if (event.key === 'Enter') {
    generateMathArt();
  }
}

// Add event listener to the input field
const expressionInput = document.getElementById('expressionInput');
expressionInput.addEventListener('keypress', handleKeyPress);

// Generate math art using user input expression and options
function generateMathArt() {
  const artContainer = document.getElementById('artContainer');
  const expressionInputValue = expressionInput.value;
  const shapeOpacityInput = document.getElementById('shapeOpacityInput').value;
  const shapeSizeInput = document.getElementById('shapeSizeInput').value;
  const shapeBoxShadowInput = document.getElementById('shapeBoxShadowInput').value;
  const animationSelect = document.getElementById('animationSelect').value;
  artContainer.innerHTML = '';

  try {
    const evaluatedResult = eval(expressionInputValue);
    if (isNaN(evaluatedResult) || evaluatedResult > 10000) {
      throw new Error('Invalid expression or result exceeds limit');
    }

    // Draw math art based on evaluated result and options
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
    alert('Invalid expression or result exceeds limit. Please enter a valid mathematical expression or number within 10000.');
  }
}

// Create a shape element
function createShapeElement() {
  const shape = document.createElement('div');
  shape.classList.add('shape');
  shape.style.backgroundColor = getRandomColor();
  return shape;
}

// Apply styles to the shape element
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
function getRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

// Generate a random position within the given max value
function getRandomPosition(max) {
  return Math.floor(Math.random() * (max + 1));
}

// Generate a random size within the given range
function getRandomSize(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

// Generate a random border radius
function getRandomBorderRadius() {
  return Math.floor(Math.random() * 50);
}

// Generate a random gradient
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
function getRandomRotation() {
  const rotationDegrees = ['0deg', '90deg', '180deg', '270deg'];
  return `rotate(${rotationDegrees[Math.floor(Math.random() * rotationDegrees.length)]})`;
}

// Save math art as an image
function saveImage() {
  const artContainer = document.getElementById('artContainer'); // Get the art container
  html2canvas(artContainer).then(function (canvas) {
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = 'math_art.png';
    link.click();
  });
}

const generateBtn = document.getElementById('generateBtn');
generateBtn.addEventListener('click', generateMathArt);

const saveBtn = document.getElementById('saveBtn');
saveBtn.addEventListener('click', saveImage);
