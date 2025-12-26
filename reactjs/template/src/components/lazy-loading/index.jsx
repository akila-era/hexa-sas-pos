import React, { Suspense } from "react";

export const LazyWrapper = ({
  children
}) => (
  <Suspense fallback={
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh' 
    }}>
      <div>Loading...</div>
    </div>
  }>
    {children}
  </Suspense>
);