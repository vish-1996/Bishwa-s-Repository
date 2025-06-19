// DOM elements
const startButton = document.getElementById('startButton');
const stopButton = document.getElementById('stopButton');
const currentCommandDisplay = document.getElementById('currentCommand');
const labelContainer = document.getElementById('label-container');

// Model variables
const URL = "https://teachablemachine.withgoogle.com/models/zrw3Yrg6Z/";
let recognizer;
let currentCommand = null;
let isListening = false;

// Create the model
async function createModel() {
    const checkpointURL = URL + "model.json";
    const metadataURL = URL + "metadata.json";

    recognizer = speechCommands.create(
        "BROWSER_FFT",
        undefined,
        checkpointURL,
        metadataURL);

    await recognizer.ensureModelLoaded();
    return recognizer;
}

// Start listening
async function startListening() {
    if (!recognizer) {
        recognizer = await createModel();
    }

    const classLabels = recognizer.wordLabels();
    
    // Clear previous labels
    labelContainer.innerHTML = '';
    for (let i = 0; i < classLabels.length; i++) {
        labelContainer.appendChild(document.createElement('div'));
    }

    // Start recognition
    recognizer.listen(result => {
        const scores = result.scores;
        
        // Update probabilities display
        for (let i = 0; i < classLabels.length; i++) {
            const classPrediction = `${classLabels[i]}: ${result.scores[i].toFixed(2)}`;
            labelContainer.childNodes[i].innerHTML = classPrediction;
        }

        // Get the highest probability command
        const maxScoreIndex = scores.indexOf(Math.max(...scores));
        const newCommand = classLabels[maxScoreIndex];
        
        // Only update if the command changed and probability is high enough
        if (newCommand !== currentCommand && scores[maxScoreIndex] > 0.75) {
            currentCommand = newCommand;
            currentCommandDisplay.textContent = currentCommand;
            currentCommandDisplay.className = 'command-display ' + currentCommand.toLowerCase();
        }
    }, {
        includeSpectrogram: false,
        probabilityThreshold: 0.7,
        invokeCallbackOnNoiseAndUnknown: false,
        overlapFactor: 0.5
    });

    isListening = true;
    startButton.disabled = true;
    stopButton.disabled = false;
    currentCommandDisplay.textContent = "Listening...";
}

// Stop listening
function stopListening() {
    if (recognizer && isListening) {
        recognizer.stopListening();
        isListening = false;
        startButton.disabled = false;
        stopButton.disabled = true;
        
        if (!currentCommand) {
            currentCommandDisplay.textContent = "None";
        }
    }
}

// Event listeners
startButton.addEventListener('click', startListening);
stopButton.addEventListener('click', stopListening);
