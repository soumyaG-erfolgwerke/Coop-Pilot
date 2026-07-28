"use client";
import React, { useState, useEffect } from "react";

const FadePopUp = ({
  isOpen,
  onClose,
  children,
  className = "",
  animationDuration = 200,
  overlayClassName = "fixed inset-0 z-50 flex items-center justify-center bg-black/10",
  closeOnOverlayClick = true,
}) => {
  const [animationState, setAnimationState] = useState(isOpen ? "opening" : "closed");
  const prevIsOpen = React.useRef(isOpen);

  useEffect(() => {
    if (isOpen) {
      prevIsOpen.current = true;
      setAnimationState("opening");
      const timer = setTimeout(() => setAnimationState("open"), 20);
      return () => clearTimeout(timer);
    } else if (prevIsOpen.current) {
      prevIsOpen.current = false;
      setAnimationState("closing");
      const timer = setTimeout(
        () => setAnimationState("closed"),
        animationDuration,
      );
      return () => clearTimeout(timer);
    }
  }, [isOpen, animationDuration]);

  if (animationState === "closed") return null;

  return (
    <div className={overlayClassName} onClick={closeOnOverlayClick ? onClose : undefined}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ transitionDuration: `${animationDuration}ms` }}
        className={`
          transition-all ease-out
          ${
            animationState === "opening"
              ? "opacity-0 translate-y-2 [clip-path:polygon(0%_0%,100%_0%,95%_90%,5%_90%)]"
              : animationState === "open"
                ? "opacity-100 translate-y-0 [clip-path:polygon(0%_0%,100%_0%,100%_100%,0%_100%)]"
                : "opacity-0 translate-y-2 [clip-path:polygon(0%_0%,100%_0%,95%_90%,5%_90%)]"
          }
          ${className}
        `}
      >
        {children}
      </div>
    </div>
  );
};

export default FadePopUp;
