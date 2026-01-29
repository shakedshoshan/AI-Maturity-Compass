'use client';

const AnimatedBackground = () => {
    return (
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {/* Soft gradient blobs for light theme */}
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-cyan-200/25 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-indigo-200/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '4s' }}></div>
        
        {/* Subtle floating particles */}
        <div className="particle" style={{ top: '10%', right: '20%', animation: 'float 8s ease-in-out infinite' }}></div>
        <div className="particle" style={{ top: '30%', right: '80%', animation: 'float 12s ease-in-out infinite 1s' }}></div>
        <div className="particle" style={{ top: '60%', right: '10%', animation: 'float 10s ease-in-out infinite 2s' }}></div>
        <div className="particle" style={{ top: '80%', right: '60%', animation: 'float 7s ease-in-out infinite 3s' }}></div>
        <div className="particle" style={{ top: '20%', right: '50%', animation: 'float 9s ease-in-out infinite 4s' }}></div>
        
        <style jsx>{`
            .particle {
                position: absolute;
                width: 6px;
                height: 6px;
                background: rgba(0, 64, 128, 0.15);
                border-radius: 50%;
            }
        `}</style>
      </div>
    );
  };
  
export default AnimatedBackground;
