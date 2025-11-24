
export class AudioRecorder {
  private context: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private stream: MediaStream | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private isRecording: boolean = false;

  async start(onData: (base64: string) => void) {
    if (this.isRecording) return;
    
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.context = new AudioContextClass();
      
      const sourceSampleRate = this.context.sampleRate;
      const targetSampleRate = 16000;
      
      this.source = this.context.createMediaStreamSource(this.stream);
      this.processor = this.context.createScriptProcessor(4096, 1, 1);
      
      this.processor.onaudioprocess = (e) => {
        if (!this.isRecording) return;
        
        const inputData = e.inputBuffer.getChannelData(0);
        // Downsample to 16kHz
        const downsampledData = this.downsampleBuffer(inputData, sourceSampleRate, targetSampleRate);
        // Convert to Int16 PCM
        const pcmData = this.floatTo16BitPCM(downsampledData);
        // Convert to Base64
        const base64 = this.arrayBufferToBase64(pcmData.buffer);
        
        onData(base64);
      };
      
      this.source.connect(this.processor);
      this.processor.connect(this.context.destination);
      this.isRecording = true;
      
    } catch (error) {
      console.error("AudioRecorder Error:", error);
      this.stop(); 
      throw error;
    }
  }

  stop() {
    this.isRecording = false;
    if (this.stream) {
        this.stream.getTracks().forEach(t => t.stop());
    }
    if (this.processor) {
        this.processor.disconnect();
    }
    if (this.source) {
        this.source.disconnect();
    }
    if (this.context && this.context.state !== 'closed') {
        this.context.close();
    }
    
    this.stream = null;
    this.processor = null;
    this.source = null;
    this.context = null;
  }

  private downsampleBuffer(buffer: Float32Array, sampleRate: number, outSampleRate: number) {
    if (outSampleRate === sampleRate) {
      return buffer;
    }
    if (outSampleRate > sampleRate) {
      return buffer;
    }
    const sampleRateRatio = sampleRate / outSampleRate;
    const newLength = Math.round(buffer.length / sampleRateRatio);
    const result = new Float32Array(newLength);
    let offsetResult = 0;
    let offsetBuffer = 0;
    while (offsetResult < result.length) {
      const nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
      let accum = 0, count = 0;
      for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
        accum += buffer[i];
        count++;
      }
      result[offsetResult] = accum / count;
      offsetResult++;
      offsetBuffer = nextOffsetBuffer;
    }
    return result;
  }

  private floatTo16BitPCM(output: Float32Array) {
    const buffer = new ArrayBuffer(output.length * 2);
    const view = new DataView(buffer);
    for (let i = 0; i < output.length; i++) {
      const s = Math.max(-1, Math.min(1, output[i]));
      view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
    return new Uint8Array(buffer);
  }

  private arrayBufferToBase64(buffer: ArrayBuffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
}
