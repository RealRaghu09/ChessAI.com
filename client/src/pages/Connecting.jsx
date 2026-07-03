export default function Connecting() {
  return (
    <div className="w-screen h-screen bg-black flex flex-col items-center justify-center text-white">
      <h1 className="text-6xl md:text-8xl font-extrabold tracking-widest">
        CONNECTING
      </h1>
      <p className="mt-6 text-xl md:text-2xl tracking-wide text-neutral-400">
        to Game
      </p>
      <div className="mt-10 flex space-x-2">
        <span className="w-3 h-3 bg-white animate-bounce" />
        <span className="w-3 h-3 bg-white animate-bounce [animation-delay:0.15s]" />
        <span className="w-3 h-3 bg-white animate-bounce [animation-delay:0.3s]" />
      </div>
    </div>
  );
}
