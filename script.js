// DOM elements
const startButton = document.getElementById('startButton');
const stopButton = document.getElementById('stopButton');
const currentCommandDisplay = document.getElementById('currentCommand');
const probabilitiesContainer = document.getElementById('probabilities');

// Model variables
let recognizer;
let currentCommand = null;
let isListening = false;

// Model URL (update this to your model's path)
const modelURL = './assets/model/';

// Initialize the model
async function createModel() {
    const checkpointURL = modelURL + 'model.json';
    const metadataURL = modelURL + 'metadata.json';

    recognizer = speechCommands.create(
        'BROWSER_FFT',
        undefined,
        checkpointURL,
        metadataURL
    );

    await recognizer.ensureModelLoaded();
    return recognizer;
}

// Start listening
async function startListening() {
    if (!recognizer) {
        recognizer = await createModel();
    }

    const classLabels = recognizer.wordLabels();
    
    // Clear previous probabilities
    probabilitiesContainer.innerHTML = '';
    
    // Create probability bars for each class
    classLabels.forEach(label => {
        const barContainer = document.createElement('div');
        barContainer.className = 'probability-bar';
        
        const labelSpan = document.createElement('span');
        labelSpan.className = 'probability-label';
        labelSpan.textContent = label;
        
        const valueContainer = document.createElement('div');
        valueContainer.className = 'probability-value';
        
        const valueFill = document.createElement('div');
        valueFill.className = 'probability-fill';
        valueFill.id = `fill-${label}`;
        
        const percentSpan = document.createElement('span');
        percentSpan.className = 'probability-percent';
        percentSpan.id = `percent-${label}`;
        percentSpan.textContent = '0%';
        
        valueContainer.appendChild(valueFill);
        barContainer.appendChild(labelSpan);
        barContainer.appendChild(valueContainer);
        barContainer.appendChild(percentSpan);
        
        probabilitiesContainer.appendChild(barContainer);
    });

    // Start recognition
    recognizer.listen(result => {
        const scores = result.scores;
        
        // Update probability bars
        classLabels.forEach((label, index) => {
            const percent = (scores[index] * 100).toFixed(1);
            document.getElementById(`fill-${label}`).style.width = `${percent}%`;
            document.getElementById(`percent-${label}`).textContent = `${percent}%`;
        });
        
        // Get the highest probability
        const maxScore = Math.max(...scores);
        const predictedIndex = scores.indexOf(maxScore);
        const predictedLabel = classLabels[predictedIndex];
        
        // Only update if the prediction is confident enough and different from current
        if (maxScore > 0.75 && predictedLabel !== currentCommand) {
            currentCommand = predictedLabel;
            currentCommandDisplay.textContent = currentCommand;
            
            // Add visual feedback
            currentCommandDisplay.style.backgroundColor = '#e74c3c';
            currentCommandDisplay.style.color = 'white';
            setTimeout(() => {
                currentCommandDisplay.style.backgroundColor = '#f1f1f1';
                currentCommandDisplay.style.color = '#333';
            }, 300);
        }
    }, {
        includeSpectrogram: false,
        probabilityThreshold: 0.7,
        invokeCallbackOnNoiseAndUnknown: true,
        overlapFactor: 0.5
    });

    isListening = true;
    startButton.disabled = true;
    stopButton.disabled = false;
    currentCommandDisplay.textContent = 'Listening...';
}

// Stop listening
function stopListening() {
    if (recognizer && isListening) {
        recognizer.stopListening();
        isListening = false;
        startButton.disabled = false;
        stopButton.disabled = true;
        currentCommandDisplay.textContent = currentCommand || 'None';
    }
}

// Event listeners
startButton.addEventListener('click', startListening);
stopButton.addEventListener('click', stopListening);
