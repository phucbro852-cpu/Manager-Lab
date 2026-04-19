import React, { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';

const Scanner = () => {
  const [scanResult, setScanResult] = useState(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    const scanner = new Html5QrcodeScanner('reader', {
      qrbox: { width: 250, height: 250 },
      fps: 5,
    });

    scanner.render(
      async (result) => {
        // Prevent multiple scans
        if (scanResult) return;
        setScanResult(result);
        scanner.clear();
        
        try {
          const url = new URL(result);
          if (url.pathname.startsWith('/product/')) {
            navigate(url.pathname);
          }
        } catch (e) {
          console.warn("Not a valid URL, handling raw text: ", result);
        }
      },
      (err) => {}
    );

    return () => {
      scanner.clear().catch(error => console.error("Failed to clear scanner", error));
    };
  }, [navigate, scanResult]);

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Scan Device QR</h2>
      <div className="card" style={{ maxWidth: '500px', margin: '0 auto' }}>
        <div id="reader" style={{ display: scanResult ? 'none' : 'block' }}></div>
      </div>
    </div>
  );
};

export default Scanner;
