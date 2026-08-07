export function createBarcodeScanner({ video, statusElement, onDetected }) {
  let stream = null;
  let detector = null;
  let active = false;
  let frameId = null;
  let lastScanAt = 0;
  let runId = 0;

  const setStatus = (message) => {
    statusElement.textContent = message;
  };

  const releaseStream = (mediaStream) => {
    mediaStream?.getTracks().forEach((track) => track.stop());
  };

  const stop = () => {
    runId += 1;
    active = false;
    if (frameId) cancelAnimationFrame(frameId);
    frameId = null;
    releaseStream(stream);
    stream = null;
    detector = null;
    video.pause();
    video.srcObject = null;
  };

  const scanFrame = async (time, currentRun) => {
    if (!active || !detector || currentRun !== runId) return;

    if (video.readyState >= 2 && time - lastScanAt > 350) {
      lastScanAt = time;
      try {
        const codes = await detector.detect(video);
        if (currentRun !== runId) return;
        const value = codes[0]?.rawValue;
        if (value) {
          stop();
          onDetected(value);
          return;
        }
      } catch {
        if (currentRun === runId) {
          setStatus('No se ha podido leer la imagen. Acerca el código y evita reflejos.');
        }
      }
    }

    if (currentRun === runId) frameId = requestAnimationFrame((nextTime) => scanFrame(nextTime, currentRun));
  };

  const start = async () => {
    stop();
    const currentRun = runId;

    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setStatus('La cámara necesita HTTPS. Puedes escribir el código manualmente.');
      return false;
    }

    if (!('BarcodeDetector' in window)) {
      setStatus('Este navegador no permite escanear directamente. Escribe el código manualmente.');
      return false;
    }

    let pendingStream = null;

    try {
      setStatus('Solicitando acceso a la cámara…');
      const supported = await BarcodeDetector.getSupportedFormats();
      if (currentRun !== runId) return false;

      const preferred = ['ean_13', 'ean_8', 'upc_a', 'upc_e'].filter((format) => supported.includes(format));
      const formats = preferred.length ? preferred : supported;
      detector = formats.length ? new BarcodeDetector({ formats }) : new BarcodeDetector();
      pendingStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      if (currentRun !== runId) {
        releaseStream(pendingStream);
        return false;
      }

      stream = pendingStream;
      video.srcObject = stream;
      await video.play();

      if (currentRun !== runId) {
        releaseStream(stream);
        stream = null;
        video.srcObject = null;
        return false;
      }

      active = true;
      setStatus('Apunta al código de barras y mantenlo dentro del recuadro.');
      frameId = requestAnimationFrame((time) => scanFrame(time, currentRun));
      return true;
    } catch (error) {
      releaseStream(pendingStream);
      if (currentRun !== runId) return false;
      const denied = error?.name === 'NotAllowedError';
      setStatus(denied
        ? 'No se ha concedido acceso a la cámara. Puedes escribir el código manualmente.'
        : 'No se ha podido iniciar la cámara. Puedes escribir el código manualmente.');
      stop();
      return false;
    }
  };

  return { start, stop };
}
