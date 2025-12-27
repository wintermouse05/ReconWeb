// client/src/components/AnimatedBackground.jsx
import { useEffect, useState } from 'react';

const AnimatedBackground = ({ variant = 'primary' }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const getGradient = () => {
    switch (variant) {
      case 'success':
        return 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)';
      case 'danger':
        return 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)';
      case 'secondary':
        return 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)';
      default:
        return 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)';
    }
  };

  return (
    <>
      {/* Gradient Background */}
      <div 
        className="gradient-background"
        style={{
          background: getGradient(),
          backgroundSize: '400% 400%',
          opacity: mounted ? 1 : 0,
          transition: 'opacity 0.5s ease'
        }}
      />

      {/* Floating Particles */}
      <div className="particles-container">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="particle" />
        ))}
      </div>
    </>
  );
};

export default AnimatedBackground;