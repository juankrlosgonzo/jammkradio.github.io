const audioPlayer = document.getElementById('audioPlayer');
const playPauseBtn = document.getElementById('playPauseBtn');
const stopBtn = document.getElementById('stopBtn'); // Get stop button
const volumeSlider = document.getElementById('volumeSlider'); // Get volume slider
const playIcon = document.getElementById('playIcon');
const pauseIcon = document.getElementById('pauseIcon');
const statusDiv = document.querySelector('.status');

// --- Funciones de actualización de UI ---
function showPlayIcon() {
    playIcon.style.display = 'block';
    pauseIcon.style.display = 'none';
    playPauseBtn.setAttribute('aria-label', 'Reproducir');
}

function showPauseIcon() {
    playIcon.style.display = 'none';
    pauseIcon.style.display = 'block';
     playPauseBtn.setAttribute('aria-label', 'Pausar');
}

function updateStatus(text) {
    statusDiv.textContent = text;
}

// --- Lógica del reproductor ---
let isPlaying = false; // Start assuming not playing until confirmed

// Set initial volume slider position based on audio element's default volume
volumeSlider.value = audioPlayer.volume;

// Attempt to play on load
audioPlayer.play().then(() => {
    isPlaying = true;
    showPauseIcon();
    updateStatus('Reproduciendo');
}).catch(error => {
    console.warn("Autoplay bloqueado, esperando interacción del usuario.", error);
    isPlaying = false;
    showPlayIcon();
    // Check if audio is paused for reasons other than user action (like network error on load)
    if (audioPlayer.paused && audioPlayer.networkState === audioPlayer.NETWORK_NO_SOURCE) {
         updateStatus('Error de red');
    } else if (audioPlayer.paused && audioPlayer.error) {
        updateStatus('Error al cargar');
    }
     else if (audioPlayer.paused) {
       updateStatus('Listo para reproducir');
    }
});


playPauseBtn.addEventListener('click', () => {
    if (isPlaying) {
        audioPlayer.pause();
        // UI update handled by 'pause' event listener
    } else {
        // If stopped, ensure we try to load fresh if needed (might not be necessary for all streams)
        if (audioPlayer.readyState === 0 || audioPlayer.ended) {
            audioPlayer.load(); // Attempt to reload if in an error state or ended
        }
        audioPlayer.play().then(() => {
             // UI update handled by 'play' event listener
        }).catch(error => {
            console.error("Error al intentar reproducir:", error);
            updateStatus('Error al reproducir');
            showPlayIcon(); // Ensure play icon is shown on error
            isPlaying = false;
        });
    }
    // Note: isPlaying state is now primarily managed by audio events
});

// Stop Button Logic
stopBtn.addEventListener('click', () => {
    audioPlayer.pause();
    // For live streams, resetting currentTime often has no effect or is undesirable.
    // If it were a file, you might use: audioPlayer.currentTime = 0;
    showPlayIcon(); // Always show play after stop
    updateStatus('Detenido');
    isPlaying = false; // Explicitly set state
});

// Volume Slider Logic
volumeSlider.addEventListener('input', (e) => {
    audioPlayer.volume = e.target.value;
});


// --- Event listeners del audio para actualizar estado ---
audioPlayer.addEventListener('play', () => {
    isPlaying = true;
    showPauseIcon();
    updateStatus('Reproduciendo');
});

audioPlayer.addEventListener('playing', () => { // Fired after buffering/resume
    isPlaying = true;
    showPauseIcon();
    updateStatus('Reproduciendo');
});


audioPlayer.addEventListener('pause', () => {
    // Only update if it wasn't explicitly stopped (stop button sets its own status)
    if (statusDiv.textContent !== 'Detenido') {
        isPlaying = false;
        showPlayIcon();
        updateStatus('Pausado');
    }
});

audioPlayer.addEventListener('waiting', () => {
    updateStatus('Cargando buffer...');
    // Don't change isPlaying state here, it might resume
});

audioPlayer.addEventListener('error', (e) => {
    console.error("Error en el elemento de audio:", e);
     // Attempt to decode the error
    let errorMsg = 'Error de reproducción';
    if (audioPlayer.error) {
        switch (audioPlayer.error.code) {
            case MediaError.MEDIA_ERR_ABORTED:
                errorMsg = 'Carga abortada';
                break;
            case MediaError.MEDIA_ERR_NETWORK:
                errorMsg = 'Error de red';
                break;
            case MediaError.MEDIA_ERR_DECODE:
                errorMsg = 'Error de decodificación';
                break;
            case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
                errorMsg = 'Fuente no soportada';
                break;
            default:
                errorMsg = 'Error desconocido';
        }
    }
    updateStatus(errorMsg);
    showPlayIcon();
    isPlaying = false;
});

audioPlayer.addEventListener('ended', () => {
    updateStatus('Stream finalizado');
    showPlayIcon();
    isPlaying = false;
});

audioPlayer.addEventListener('emptied', () => {
    // This might happen if the source changes or becomes invalid
    if (!isPlaying) { // Only update status if not actively playing
       updateStatus('Stream vacío o interrumpido');
       showPlayIcon();
    }
});

audioPlayer.addEventListener('stalled', () => {
    updateStatus('Problema de red...');
    // Consider showing play icon if stalled for too long? Maybe not.
});

// Initial check in case autoplay worked but events fired before listeners attached
if (!audioPlayer.paused) {
    isPlaying = true;
    showPauseIcon();
    updateStatus('Reproduciendo');
} else {
     // Status might already be set by error handling in the initial play attempt
     if (!statusDiv.textContent || statusDiv.textContent === 'Cargando...') {
         updateStatus('Listo para reproducir');
     }
     showPlayIcon();
}