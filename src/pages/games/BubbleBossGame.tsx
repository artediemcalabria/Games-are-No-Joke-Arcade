import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { useStore } from '../../store/useStore';

const tools = ['Ask a Question', 'Check Source', 'Listen First', 'Find Evidence', 'Slow Down'];

export default function BubbleBossGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [score, setScore] = useState(0);
  const { completeGame } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isPlaying) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    let animationFrameId = 0;
    let rightPressed = false;
    let leftPressed = false;
    let x = canvas.width / 2;
    let y = canvas.height - 40;
    let dx = 3.6;
    let dy = -3.8;
    let paddleX = canvas.width / 2 - 55;
    let activeScore = 0;

    const ballRadius = 8;
    const paddleWidth = 110;
    const paddleHeight = 15;
    const bubbleRadius = 24;
    const bubbleRows = 4;
    const bubbleColumns = 5;
    const bubbles = Array.from({ length: bubbleRows * bubbleColumns }, (_, index) => ({
      x: 54 + (index % bubbleColumns) * 92,
      y: 50 + Math.floor(index / bubbleColumns) * 54,
      status: 1,
      label: ['Rumor', 'Us/Them', 'Fear', 'Bias', 'Fake'][index % 5],
    }));

    const keyDownHandler = (event: KeyboardEvent) => {
      if (event.key === 'Right' || event.key === 'ArrowRight') rightPressed = true;
      if (event.key === 'Left' || event.key === 'ArrowLeft') leftPressed = true;
    };
    const keyUpHandler = (event: KeyboardEvent) => {
      if (event.key === 'Right' || event.key === 'ArrowRight') rightPressed = false;
      if (event.key === 'Left' || event.key === 'ArrowLeft') leftPressed = false;
    };
    const movePaddle = (clientX: number) => {
      const relativeX = clientX - canvas.getBoundingClientRect().left;
      paddleX = Math.max(0, Math.min(canvas.width - paddleWidth, relativeX - paddleWidth / 2));
    };
    const touchMoveHandler = (event: TouchEvent) => {
      event.preventDefault();
      movePaddle(event.touches[0].clientX);
    };
    const mouseMoveHandler = (event: MouseEvent) => movePaddle(event.clientX);

    document.addEventListener('keydown', keyDownHandler);
    document.addEventListener('keyup', keyUpHandler);
    canvas.addEventListener('touchmove', touchMoveHandler, { passive: false });
    canvas.addEventListener('mousemove', mouseMoveHandler);

    const drawText = (text: string, tx: number, ty: number, size = 9, color = '#ffffff') => {
      ctx.font = `700 ${size}px Helvetica Neue, Arial`;
      ctx.fillStyle = color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, tx, ty);
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'rgba(0,0,0,0.95)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      bubbles.forEach((bubble, index) => {
        if (!bubble.status) return;
        const color = ['#ff00ff', '#00f2ff', '#39ff14', '#ffff00'][index % 4];
        ctx.beginPath();
        ctx.arc(bubble.x, bubble.y, bubbleRadius, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.shadowBlur = 12;
        ctx.shadowColor = color;
        ctx.fill();
        ctx.closePath();
        drawText(bubble.label, bubble.x, bubble.y, 9, '#050505');

        const distance = Math.hypot(x - bubble.x, y - bubble.y);
        if (distance < bubbleRadius + ballRadius) {
          bubble.status = 0;
          dy = -dy;
          activeScore += 1;
          setScore(activeScore);
          if (activeScore === bubbles.length) {
            setGameWon(true);
            setIsPlaying(false);
            completeGame('bubble-boss', 300);
            confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
          }
        }
      });

      ctx.beginPath();
      ctx.arc(x, y, ballRadius, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#ffffff';
      ctx.fill();
      ctx.closePath();

      ctx.shadowBlur = 14;
      ctx.shadowColor = '#00f2ff';
      ctx.fillStyle = '#00f2ff';
      ctx.fillRect(paddleX, canvas.height - paddleHeight - 12, paddleWidth, paddleHeight);
      drawText(tools[activeScore % tools.length], paddleX + paddleWidth / 2, canvas.height - 19, 10, '#050505');

      if (x + dx > canvas.width - ballRadius || x + dx < ballRadius) dx = -dx;
      if (y + dy < ballRadius) dy = -dy;
      if (y + dy > canvas.height - ballRadius - 12) {
        if (x > paddleX && x < paddleX + paddleWidth && y < canvas.height - 10) {
          dy = -dy;
          dx = (x - (paddleX + paddleWidth / 2)) * 0.12;
        } else if (y + dy > canvas.height + ballRadius) {
          setGameOver(true);
          setIsPlaying(false);
          return;
        }
      }

      if (rightPressed && paddleX < canvas.width - paddleWidth) paddleX += 6;
      if (leftPressed && paddleX > 0) paddleX -= 6;

      x += dx;
      y += dy;
      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
      document.removeEventListener('keydown', keyDownHandler);
      document.removeEventListener('keyup', keyUpHandler);
      canvas.removeEventListener('touchmove', touchMoveHandler);
      canvas.removeEventListener('mousemove', mouseMoveHandler);
    };
  }, [completeGame, isPlaying]);

  const restart = () => {
    setGameOver(false);
    setGameWon(false);
    setScore(0);
    setIsPlaying(true);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center w-full max-w-2xl mx-auto pb-10">
      <div className="w-full arcade-border-pink glass-panel-pink p-4 rounded-xl shadow-lg mb-6 flex justify-between items-center gap-4">
        <div>
          <p className="text-xs text-pink-300 font-bold uppercase tracking-widest">Echo Breaker</p>
          <h2 className="text-xl font-arcade text-pink-500 uppercase tracking-widest mt-2">Bubble Boss</h2>
          <p className="text-xs text-gray-300 font-medium mt-2">Break bubbles with critical thinking tools.</p>
        </div>
        <div className="text-2xl font-arcade text-white">{score * 15}</div>
      </div>

      <div className="relative w-full max-w-[480px] aspect-[3/2] flex justify-center mt-2">
        <canvas ref={canvasRef} width={480} height={320} className="bg-black/90 arcade-border shadow-lg rounded-xl w-full h-full touch-none" />

        {!isPlaying && !gameWon && !gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/75 rounded-xl backdrop-blur-sm text-center p-5">
            <h3 className="text-pink-500 font-arcade text-xl mb-4">READY?</h3>
            <p className="text-sm text-gray-300 max-w-sm mb-6">Move the tool bar. Break rumors, bias, fear, and us/them bubbles.</p>
            <button onClick={() => setIsPlaying(true)} className="arcade-border px-8 py-4 bg-cyan-900/40 text-cyan-400 font-bold uppercase tracking-widest hover:bg-cyan-500 hover:text-black transition-colors">
              Start Game
            </button>
          </div>
        )}

        {gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 rounded-xl gap-5 backdrop-blur-md text-center p-5">
            <h3 className="text-3xl font-arcade text-red-500">Bubble Wins</h3>
            <p className="text-gray-300 text-sm">The design lesson: feedback must be quick and readable.</p>
            <button onClick={restart} className="px-8 py-3 border-2 border-red-500 text-red-400 font-bold uppercase hover:bg-red-500 hover:text-black transition-colors">
              Retry
            </button>
          </div>
        )}

        {gameWon && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 rounded-xl gap-5 backdrop-blur-md text-center p-5">
            <h3 className="text-3xl font-arcade text-green-400">Bubbles Cleared</h3>
            <p className="text-gray-300 text-sm max-w-sm">Takeaway: a simple mechanic can teach players to ask, check, and listen.</p>
            <button onClick={() => navigate('/arcade')} className="px-6 py-3 border-2 border-green-400 text-green-400 font-bold uppercase hover:bg-green-400 hover:text-black transition-colors">
              Return to Arcade
            </button>
          </div>
        )}
      </div>

      <p className="mt-6 text-center text-xs text-gray-500 font-medium uppercase tracking-widest leading-relaxed">
        Use arrow keys, mouse, or drag left/right.
      </p>
    </motion.div>
  );
}
