// Elements
const textEl       = document.getElementById('text');
const voiceSelect  = document.getElementById('voice');
const rateEl       = document.getElementById('rate');
const volumeEl     = document.getElementById('volume');
const rateVal      = document.getElementById('rateVal');
const volVal       = document.getElementById('volVal');
const countEl      = document.getElementById('count');
const statusEl     = document.getElementById('status');

let currentAudio   = null;
let lastAudioBlob  = null;
let lastAudioUrl   = null;

// Update UI
rateEl.oninput   = () => rateVal.textContent = rateEl.value;
volumeEl.oninput = () => volVal.textContent  = volumeEl.value;
textEl.oninput   = () => {
    const len = textEl.value.length;
    countEl.textContent = len;

    if (len > 9000) {
        countEl.style.color = len > 10000 ? 'red' : 'orange';
    } else {
        countEl.style.color = '';
    }
};

// Mode change
document.querySelectorAll('input[name="mode"]').forEach(radio => {
  radio.addEventListener('change', () => {
    const isPuter = radio.value === 'puter';
    document.getElementById('voiceGroup').style.display = isPuter ? 'block' : 'none';
    statusEl.textContent = isPuter 
      ? "Puter.js mode - free, good quality, WAV download"
      : "Browser mode - basic voices, play only (no download)";
  });
});

// Generate & Play with auto-splitting
async function generateAndPlay() {
  const text = textEl.value.trim();
  if (!text) {
    statusEl.textContent = "Please enter some text first";
    return;
  }

  if (text.length > 10000) {
    statusEl.textContent = "Text too long (max 10000 characters)";
    return;
  }

  statusEl.textContent = "Generating audio...";

  try {
    const mode = document.querySelector('input[name="mode"]:checked').value;

    if (mode !== 'puter') {
      statusEl.textContent = "Large text supported only in Puter mode";
      return;
    }

    const voice = voiceSelect.value;

    // Split text into safe chunks
    const chunkSize = 2800;
    const chunks = [];
    for (let i = 0; i < text.length; i += chunkSize) {
      chunks.push(text.slice(i, i + chunkSize));
    }

    const audioBlobs = [];

    // Generate audio for each chunk
    for (let i = 0; i < chunks.length; i++) {
      statusEl.textContent = `Generating part ${i + 1} of ${chunks.length}...`;

      const audioSrc = await puter.ai.txt2speech(chunks[i], {
        lang: 'en-US',
        voice: voice === 'default' ? undefined : voice,
        speed: parseFloat(rateEl.value),
        volume: parseFloat(volumeEl.value),
        response_format: 'wav'
      });

      const res = await fetch(audioSrc);
      if (!res.ok) throw new Error("Audio fetch failed");
      const blob = await res.blob();
      audioBlobs.push(blob);
    }

    // Combine blobs
    const combinedBlob = new Blob(audioBlobs, { type: 'audio/wav' });
    lastAudioBlob = combinedBlob;
    lastAudioUrl = URL.createObjectURL(combinedBlob);

    // Play audio
    if (currentAudio) currentAudio.pause();
    currentAudio = new Audio(lastAudioUrl);
    currentAudio.play();

    statusEl.textContent = "Playing... (Full audio ready)";

  } catch (err) {
    console.error(err);
    statusEl.textContent = "Error: " + (err.message || "Something went wrong");
  }
}

// Download audio
function downloadAudio() {
  if (!lastAudioBlob) {
    statusEl.textContent = "Please click Generate & Play first";
    return;
  }

  const a = document.createElement('a');
  a.href = lastAudioUrl;
  a.download = `my-tts-${Date.now()}.wav`;
  a.click();

  statusEl.textContent = "Audio downloaded!";
}

// Pause
function pauseAudio() {
  if (currentAudio) currentAudio.pause();
  statusEl.textContent = "Paused";
}

// Stop
function stopAudio() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
  }
  statusEl.textContent = "Stopped";
}
