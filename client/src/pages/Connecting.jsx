export default function Connecting() {
    return (
      <div className="w-screen h-screen bg-black flex flex-col items-center justify-center text-white">
        
        {/* Main Text */}
        <h1 className="text-6xl md:text-8xl font-extrabold tracking-widest">
          CONNECTING
        </h1>
  
        {/* Sub Text */}
        <p className="mt-6 text-xl md:text-2xl tracking-wide opacity-80">
          to Game
        </p>
  
        {/* Loading Indicator */}
        <div className="mt-10 flex space-x-3">
          <span className="w-3 h-3 bg-white rounded-full animate-bounce"></span>
          <span className="w-3 h-3 bg-white rounded-full animate-bounce [animation-delay:0.15s]"></span>
          <span className="w-3 h-3 bg-white rounded-full animate-bounce [animation-delay:0.3s]"></span>
        </div>
  
      </div>
    );
  }
  