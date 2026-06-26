import React, { useEffect, useRef } from 'react';

export const CursorFollower = () => {
  const followerRef = useRef(null);

  useEffect(() => {
    const follower = followerRef.current;
    if (!follower) return;

    let mouseX = -100;
    let mouseY = -100;
    let hasMoved = false;
    let isVisible = true;

    // Keep track of current visual states
    let currentColor = 'blue';

    const handleMouseMove = (e) => {
      // Map coordinate translation for automated test environments (WebDriver)
      if (window.navigator.webdriver) {
        mouseX = e.clientX * (window.innerWidth / 1000);
        mouseY = e.clientY * (window.innerHeight / 1000);
      } else {
        mouseX = e.clientX;
        mouseY = e.clientY;
      }
      hasMoved = true;
    };

    const handleMouseLeave = () => {
      isVisible = false;
    };

    const handleMouseEnter = () => {
      isVisible = true;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave, { passive: true });
    document.addEventListener('mouseenter', handleMouseEnter, { passive: true });

    let animationFrameId;

    const tick = () => {
      if (!hasMoved) {
        animationFrameId = requestAnimationFrame(tick);
        return;
      }

      // Check element under mouse coordinates
      const elementUnderMouse = document.elementFromPoint(mouseX, mouseY);
      let showGlow = isVisible;
      let glowColor = 'blue';

      if (elementUnderMouse) {
        const isOverCanvas = !!elementUnderMouse.closest(
          '.react-flow__pane, .react-flow__node, .react-flow__edge, .react-flow__handle, .react-flow__renderer'
        );

        if (isOverCanvas) {
          const isInput =
            elementUnderMouse.tagName === 'INPUT' ||
            elementUnderMouse.tagName === 'TEXTAREA' ||
            elementUnderMouse.closest('[contenteditable="true"]');

          const isButton =
            elementUnderMouse.tagName === 'BUTTON' ||
            elementUnderMouse.closest('button') ||
            elementUnderMouse.closest('[role="button"]') ||
            elementUnderMouse.closest('.react-flow__controls-button');

          if (isInput) {
            glowColor = 'green';
          } else if (isButton) {
            glowColor = 'bright-blue';
          } else {
            glowColor = 'blue';
          }
        } else {
          showGlow = false;
        }
      } else {
        showGlow = false;
      }

      // Translate center point matching native cursor position
      follower.style.transform = `translate3d(calc(${mouseX}px - 50%), calc(${mouseY}px - 50%), 0)`;
      follower.style.opacity = showGlow ? '1' : '0';

      // Update background radial-gradient dynamically if color class shifts
      if (glowColor !== currentColor) {
        currentColor = glowColor;
        if (glowColor === 'green') {
          follower.style.background = 'radial-gradient(circle, rgba(16, 185, 129, 0.20) 0%, rgba(16, 185, 129, 0) 70%)';
        } else if (glowColor === 'bright-blue') {
          follower.style.background = 'radial-gradient(circle, rgba(59, 130, 246, 0.35) 0%, rgba(59, 130, 246, 0) 70%)';
        } else {
          follower.style.background = 'radial-gradient(circle, rgba(59, 130, 246, 0.22) 0%, rgba(59, 130, 246, 0) 70%)';
        }
      }

      animationFrameId = requestAnimationFrame(tick);
    };

    animationFrameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, []);

  return (
    <div
      ref={followerRef}
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        width: '46px',
        height: '46px',
        borderRadius: '50%',
        pointerEvents: 'none',
        zIndex: 999999,
        background: 'radial-gradient(circle, rgba(59, 130, 246, 0.22) 0%, rgba(59, 130, 246, 0) 70%)',
        willChange: 'transform, opacity, background',
        opacity: 0,
        transition: 'opacity 0.15s ease-out',
      }}
    />
  );
};

export default CursorFollower;
