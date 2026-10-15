import React, { useRef, useEffect } from 'react';

interface LiveECGMonitorProps {
  heartRate?: number;
  spo2?: number;
  className?: string;
}

export const LiveECGMonitor: React.FC<LiveECGMonitorProps> = ({
  heartRate = 78,
  spo2 = 98,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let x = 0;
    const height = canvas.height;
    const width = canvas.width;
    const midY = height / 2;

    // Buffer of previous points to draw smooth trace
    let prevX = 0;
    let prevY = midY;

    // Timing for heartbeat simulation based on heartRate
    let step = 0;
    const beatInterval = Math.max(30, Math.round((60 / heartRate) * 60)); // frames per beat

    const draw = () => {
      // Clear a small slice ahead of the sweeping needle to create authentic phosphor fade
      const clearWidth = 14;
      ctx.fillStyle = 'rgba(6, 13, 27, 0.25)';
      ctx.fillRect(0, 0, width, height);

      // Erase ahead of current cursor
      ctx.fillStyle = '#060d1b';
      ctx.fillRect((x + 1) % width, 0, clearWidth, height);

      // Compute current ECG voltage (P-Q-R-S-T wave complex)
      const beatProgress = step % beatInterval;
      let y = midY;

      if (beatProgress >= 0 && beatProgress < 4) {
        // Flat baseline
        y = midY + (Math.random() - 0.5) * 1.5;
      } else if (beatProgress >= 4 && beatProgress < 8) {
        // P Wave (atrial depolarization)
        y = midY - 6 * Math.sin(((beatProgress - 4) / 4) * Math.PI);
      } else if (beatProgress >= 8 && beatProgress < 11) {
        // PR segment
        y = midY;
      } else if (beatProgress === 11) {
        // Q wave (small downward deflection)
        y = midY + 5;
      } else if (beatProgress === 12) {
        // R wave peak (sharp upward ventricular spike)
        y = midY - 34;
      } else if (beatProgress === 13) {
        // S wave (sharp downward deflection)
        y = midY + 12;
      } else if (beatProgress >= 14 && beatProgress < 17) {
        // ST segment
        y = midY;
      } else if (beatProgress >= 17 && beatProgress < 23) {
        // T wave (ventricular repolarization)
        y = midY - 10 * Math.sin(((beatProgress - 17) / 6) * Math.PI);
      } else {
        // Isoelectric baseline with minor physiological baseline noise
        y = midY + (Math.sin(step * 0.05) * 1.5) + (Math.random() - 0.5) * 1.2;
      }

      // Draw the ECG line segment
      ctx.beginPath();
      ctx.moveTo(prevX, prevY);
      ctx.lineTo(x, y);
      ctx.strokeStyle = '#10b981'; // Medical phosphor green
      ctx.lineWidth = 2.2;
      ctx.shadowColor = '#34d399';
      ctx.shadowBlur = 6;
      ctx.stroke();

      // Draw glowing lead needle cursor
      ctx.beginPath();
      ctx.arc(x, y, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = '#6ee7b7';
      ctx.shadowColor = '#6ee7b7';
      ctx.shadowBlur = 10;
      ctx.fill();

      // Reset shadow blur for performance
      ctx.shadowBlur = 0;

      prevX = x;
      prevY = y;

      x += 2;
      if (x >= width) {
        x = 0;
        prevX = 0;
      }

      step++;
      animationFrameId = requestAnimationFrame(draw);
    };

    // Pre-fill background grid
    ctx.fillStyle = '#060d1b';
    ctx.fillRect(0, 0, width, height);

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [heartRate]);

  return (
    <div className={`relative rounded-xl overflow-hidden bg-[#060d1b] border border-emerald-950/60 ${className}`}>
      {/* Background medical oscilloscope grid */}
      <div 
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(16, 185, 129, 0.4) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(16, 185, 129, 0.4) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px',
        }}
      />

      {/* Top telemetry overlay bar */}
      <div className="absolute top-2 left-3 right-3 flex items-center justify-between text-[11px] font-mono z-10">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span className="text-emerald-400 font-bold tracking-wider">LEAD II &middot; 25 mm/s &middot; GAIN: 1.0</span>
        </div>
        <div className="flex items-center gap-3 text-slate-300">
          <span className="text-rose-400 font-bold">HR: {heartRate} BPM</span>
          <span className="text-cyan-400 font-bold">SpO2: {spo2}%</span>
          <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px]">REAL-TIME</span>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        width={600}
        height={90}
        className="w-full h-24 block"
      />

      {/* Bottom diagnostic reading */}
      <div className="absolute bottom-1.5 left-3 right-3 flex items-center justify-between text-[10px] font-mono text-slate-400 pointer-events-none">
        <span>PR: 148 ms &middot; QRS: 88 ms &middot; QT/QTc: 382/414 ms</span>
        <span className="text-emerald-400">NORMAL SINUS RHYTHM</span>
      </div>
    </div>
  );
};
