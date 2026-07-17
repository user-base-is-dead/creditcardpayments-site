import React, { useEffect, useRef, useState } from 'react';

/**
 * Reusable ScrollReveal wrapper component.
 * Uses IntersectionObserver to trigger animations when the component enters the viewport.
 */
export default function ScrollReveal({ 
  children, 
  animation = 'reveal-hidden', // CSS class to transition from
  activeClass = 'reveal-visible', // CSS class to transition to
  threshold = 0.1, // percentage of target visibility to trigger
  delay = 0, // delay in ms before reveal
  rootMargin = '0px 0px -50px 0px' // adjust viewport boundary
}) {
  const [isIntersected, setIsIntersected] = useState(false);
  const elementRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          setIsIntersected(true);
        }, delay);
        
        // Once intersected and revealed, we can unobserve if we only want it to animate once
        if (elementRef.current) {
          observer.unobserve(elementRef.current);
        }
      }
    }, {
      threshold,
      rootMargin
    });

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => {
      if (elementRef.current) {
        observer.unobserve(elementRef.current);
      }
    };
  }, [threshold, delay, rootMargin]);

  // Clone direct child and merge className or wrap in div if children is not a single element
  if (React.isValidElement(children)) {
    const combinedClassName = `${children.props.className || ''} ${animation} ${isIntersected ? activeClass : ''}`.trim();
    return React.cloneElement(children, {
      ref: elementRef,
      className: combinedClassName
    });
  }

  return (
    <div 
      ref={elementRef} 
      className={`${animation} ${isIntersected ? activeClass : ''}`}
    >
      {children}
    </div>
  );
}
