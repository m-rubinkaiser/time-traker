import { useRef, useEffect } from 'react';

export default function TiltContainer({ children, className, style, maxRotation = 12, scale = 1.03 }) {
  const elRef = useRef(null);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;

    const handleMouseMove = (e) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const xc = rect.width / 2;
      const yc = rect.height / 2;
      
      const dx = x - xc;
      const dy = y - yc;
      
      const rotX = (dy / yc) * -maxRotation;
      const rotY = (dx / xc) * maxRotation;
      
      el.style.transform = `perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale3d(${scale}, ${scale}, ${scale})`;
      el.style.transition = 'transform 0.15s cubic-bezier(0.25, 1, 0.5, 1)';
    };

    const handleMouseLeave = () => {
      el.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
      el.style.transition = 'transform 0.6s cubic-bezier(0.25, 1, 0.5, 1)';
    };

    el.addEventListener('mousemove', handleMouseMove);
    el.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      el.removeEventListener('mousemove', handleMouseMove);
      el.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [maxRotation, scale]);

  return (
    <div ref={elRef} className={className} style={{ ...style, transformStyle: 'preserve-3d' }}>
      {children}
    </div>
  );
}
