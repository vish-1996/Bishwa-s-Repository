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

// Initialize the model with error handling
async function createModel() {
    try {
        console.log('Loading model...');
        const checkpointURL = modelURL + 'model.json';
        const metadataURL = modelURL + 'metadata.json';

        // Verify files exist
        const modelResponse = await fetch(checkpointURL);
        if (!modelResponse.ok) throw new Error('Model file not found');
        const metadataResponse = await fetch(metadataURL);
        if (!metadataResponse.ok) throw new Error('Metadata file not found');

        recognizer = speechCommands.create(
            'BROWSER_FFT',
            undefined,
            checkpointURL,
            metadataURL
        );

        await recognizer.ensureModelLoaded();
        console.log('Model loaded successfully');
        return recognizer;
    } catch (error) {
        console.error('Error loading model:', error);
        currentCommandDisplay.textContent = 'Error loading model';
        throw error;
    }
}

// Start listening with enhanced error handling
async function startListening() {
    try {
        if (!recognizer) {
            recognizer = await createModel();
        }

        // Check microphone permissions
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop()); // Immediately release

        const classLabels = recognizer.wordLabels();
        console.log('Available labels:', classLabels);
        
        probabilitiesContainer.innerHTML = '';
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

        currentCommandDisplay.textContent = 'Initializing...';
        
        recognizer.listen(result => {
            const scores = result.scores;
            
            classLabels.forEach((label, index) => {
                const percent = (scores[index] * 100).toFixed(1);
                document.getElementById(`fill-${label}`).style.width = `${percent}%`;
                document.getElementById(`percent-${label}`).textContent = `${percent}%`;
            });
            
            const maxScore = Math.max(...scores);
            const predictedIndex = scores.indexOf(maxScore);
            const predictedLabel = classLabels[predictedIndex];
            
            if (maxScore > 0.75 && predictedLabel !== currentCommand) {
                currentCommand = predictedLabel;
                currentCommandDisplay.textContent = currentCommand;
                
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
        console.log('Now listening to microphone');
        
    } catch (error) {
        console.error('Error starting listening:', error);
        currentCommandDisplay.textContent = 'Error: ' + error.message;
        if (error.message.includes('permission')) {
            currentCommandDisplay.textContent += ' - Please allow microphone access';
        }
        startButton.disabled = false;
        stopButton.disabled = true;
    }
}

// Stop listening remains the same
function stopListening() {
    if (recognizer && isListening) {
        recognizer.stopListening();
        isListening = false;
        startButton.disabled = false;
        stopButton.disabled = true;
        currentCommandDisplay.textContent = currentCommand || 'None';
        console.log('Stopped listening');
    }
}

// Event listeners
startButton.addEventListener('click', startListening);
stopButton.addEventListener('click', stopListening);
