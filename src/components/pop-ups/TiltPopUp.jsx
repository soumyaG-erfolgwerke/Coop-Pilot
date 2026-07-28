"use client";
import React, { useState, useEffect } from "react";

const TiltPopUp = ({
  isOpen,
  onClose,
  children,
  className = "",
  animationDuration = 300,
  overlayClassName = "fixed inset-0 z-50 flex items-center justify-center bg-black/10",
  closeOnOverlayClick = true,
  rotateDirection = "X", // 'X' or 'Y'
}) => {
  const [animationState, setAnimationState] = useState(
    isOpen ? "opening" : "closed",
  );

  const prevIsOpen = React.useRef(isOpen);

  // Effect 1: Handle parent isOpen trigger
  useEffect(() => {
    if (isOpen && !prevIsOpen.current) {
      prevIsOpen.current = true;
      setAnimationState("opening");
    } else if (!isOpen && prevIsOpen.current) {
      prevIsOpen.current = false;
      setAnimationState("closing");
      const timer = setTimeout(() => {
        setAnimationState("closed");
      }, animationDuration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, animationDuration]);

  // Effect 2: Handle transition from opening to open
  useEffect(() => {
    if (animationState === "opening") {
      const timer = setTimeout(() => {
        setAnimationState("open");
      }, 20);
      return () => clearTimeout(timer);
    }
  }, [animationState]);

  if (animationState === "closed") return null;

  const rotateValue = rotateDirection === "X" ? "rotateX" : "rotateY";

  const getTransform = () => {
    if (animationState === "opening") {
      return `${rotateValue}(-15deg) scale(0.95)`;
    }
    if (animationState === "open") {
      return `${rotateValue}(0deg) scale(1)`;
    }
    // closing
    return `${rotateValue}(-15deg) scale(0.95)`;
  };

  const getOpacity = () => {
    if (animationState === "open") return 1;
    return 0;
  };

  return (
    <div
      className={overlayClassName}
      onClick={closeOnOverlayClick ? onClose : undefined}
      style={{
        perspective: "1000px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          transitionDuration: `${animationDuration}ms`,
          transform: getTransform(),
          opacity: getOpacity(),
          transitionProperty: "transform, opacity",
          transformStyle: "preserve-3d",
          backfaceVisibility: "hidden",
        }}
        className={`transition-all ease-[cubic-bezier(0.34,1.56,0.64,1)] ${className}`}
      >
        {children}
      </div>
    </div>
  );
};

export default TiltPopUp;
