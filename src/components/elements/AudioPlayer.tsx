import React, { useRef, useEffect, useState } from "react";
import { FaPause, FaPlay } from "react-icons/fa";

type AudioPlayerProps = {
  inscriptionId: string;
};

const AudioPlayer: React.FC<AudioPlayerProps> = ({ inscriptionId }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);

  useEffect(() => {
    const interval = setInterval(drawWaveform, 500);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      audio.play();
      setIsPlaying(true);
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  };

  const setupAudioContext = () => {
    const audio = audioRef.current;
    if (audio && !audioContext) {
      const newAudioContext = new AudioContext();
      setAudioContext(newAudioContext);

      const newAnalyser = newAudioContext.createAnalyser();
      newAnalyser.fftSize = 2048;
      setAnalyser(newAnalyser);

      const source = newAudioContext.createMediaElementSource(audio);
      source.connect(newAnalyser);
      newAnalyser.connect(newAudioContext.destination);
    }
  };

  const drawWaveform = () => {
    if (!analyser) return;

    const canvas: any = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      requestAnimationFrame(draw);
      analyser.getByteTimeDomainData(dataArray);

      ctx.clearRect(0, 0, width, height);
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#eab308";
      ctx.beginPath();

      const sliceWidth = width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * height) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
    };

    draw();
  };

  useEffect(() => {
    setupAudioContext();
  }, []);

  useEffect(() => {
    if (audioContext && analyser) {
      drawWaveform();
    }
  }, [audioContext, analyser]);

  return (
    <div className="w-full h-full">
      <div className="overflow-hidden flex flex-col justify-between h-full">
        <audio
          ref={audioRef}
          className="w-full hidden"
          src={`/content/${inscriptionId}`}
          controls
        />
        <div className="bg-primary  p-2 absolute top-0 left-0 right-0">
          <div className="flex  items-center">
            <button
              onClick={togglePlayPause}
              className="p-2 text-accent hover:text-accent_dark rounded-full"
            >
              {isPlaying ? <FaPause /> : <FaPlay />}
            </button>
            {isPlaying ? <p>Playing...</p> : <p>Ready To Play</p>}
          </div>
          {/* <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={handleVolumeChange}
            className="volume-slider"
          /> */}
        </div>
        <canvas ref={canvasRef} className="w-full h-full"></canvas>
      </div>
    </div>
  );
};

export default AudioPlayer;
