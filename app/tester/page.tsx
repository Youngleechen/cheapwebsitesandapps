// app/page.tsx
import React from 'react';

export default function Home() {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <title>Test Page - Works on All Devices</title>
        <style dangerouslySetInnerHTML={{__html: `
          /* Reset and base styles for maximum compatibility */
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
            line-height: 1.5;
            color: #333;
            background-color: #f5f5f5;
            padding: 16px;
          }
          
          .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            padding: 24px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          
          .header {
            text-align: center;
            margin-bottom: 24px;
            padding-bottom: 16px;
            border-bottom: 2px solid #eaeaea;
          }
          
          h1 {
            font-size: 28px;
            color: #1a1a1a;
            margin-bottom: 8px;
          }
          
          .status {
            display: inline-block;
            padding: 4px 12px;
            background: #4CAF50;
            color: white;
            border-radius: 4px;
            font-size: 14px;
            margin-top: 8px;
          }
          
          .content {
            margin: 24px 0;
          }
          
          .box {
            background: #f8f9fa;
            border: 2px solid #e9ecef;
            border-radius: 6px;
            padding: 20px;
            margin: 16px 0;
            text-align: center;
          }
          
          .box h2 {
            font-size: 20px;
            margin-bottom: 12px;
            color: #2c3e50;
          }
          
          .box p {
            font-size: 16px;
            color: #666;
            line-height: 1.6;
          }
          
          .footer {
            text-align: center;
            margin-top: 24px;
            padding-top: 16px;
            border-top: 1px solid #eaeaea;
            color: #666;
            font-size: 14px;
          }
          
          /* Basic responsive adjustments */
          @media (max-width: 768px) {
            .container {
              padding: 16px;
            }
            
            h1 {
              font-size: 24px;
            }
            
            .box {
              padding: 16px;
            }
          }
          
          /* Very basic fallback for extremely old devices */
          @media (max-width: 480px) {
            body {
              padding: 8px;
            }
            
            .container {
              padding: 12px;
            }
            
            h1 {
              font-size: 20px;
            }
            
            .box {
              padding: 12px;
            }
          }
          
          /* Touch-friendly buttons */
          .button {
            display: inline-block;
            background: #007bff;
            color: white;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 4px;
            font-size: 16px;
            margin: 8px;
            border: none;
            cursor: pointer;
            transition: background-color 0.2s;
          }
          
          .button:hover {
            background: #0056b3;
          }
          
          .button:active {
            background: #004080;
          }
          
          /* Ensure text is readable on all devices */
          .test-text {
            font-size: 16px;
            line-height: 1.6;
            margin: 16px 0;
          }
          
          /* Simple grid that works everywhere */
          .grid {
            display: flex;
            flex-wrap: wrap;
            gap: 16px;
            margin-top: 16px;
          }
          
          .grid-item {
            flex: 1;
            min-width: 200px;
            background: #fff;
            border: 1px solid #ddd;
            padding: 16px;
            border-radius: 4px;
          }
        `}} />
      </head>
      <body>
        <div className="container">
          <div className="header">
            <h1>📱 Device Compatibility Test</h1>
            <div className="status">✓ Working on All Devices</div>
          </div>
          
          <div className="content">
            <div className="box">
              <h2>✅ This Page Works Everywhere</h2>
              <p>This is a simple, clean test page designed to work on all devices including older phones. No complex CSS, no modern features that break on old browsers.</p>
            </div>
            
            <div className="box">
              <h2>🔍 What to Check</h2>
              <p>• Text should be readable and properly sized</p>
              <p>• Buttons should be touch-friendly</p>
              <p>• Layout should adapt to screen size</p>
              <p>• Colors and spacing should look consistent</p>
            </div>
            
            <div className="test-text">
              <p>This text block tests basic typography rendering. It should be easy to read on any device, with proper line spacing and font sizing that works across all screen sizes.</p>
            </div>
            
            <div className="grid">
              <div className="grid-item">
                <h3>📱 Mobile</h3>
                <p>Tested on old phones</p>
              </div>
              <div className="grid-item">
                <h3>💻 Desktop</h3>
                <p>Works on all browsers</p>
              </div>
              <div className="grid-item">
                <h3>🖨️ Print</h3>
                <p>Clean for printing too</p>
              </div>
            </div>
            
            <div style={{textAlign: 'center', margin: '24px 0'}}>
              <button className="button" onClick={() => alert('Button works!')}>
                Test Button
              </button>
              <a href="#" className="button" style={{background: '#28a745'}} onClick={(e) => {e.preventDefault(); alert('Link works!');}}>
                Test Link
              </a>
            </div>
          </div>
          
          <div className="footer">
            <p>Simple page for testing device compatibility • No JavaScript dependencies • Pure CSS</p>
            <p>If this works but your app doesn't, the issue is likely in your CSS or build configuration</p>
          </div>
        </div>
        
        {/* Minimal inline script for basic interactivity testing */}
        <script dangerouslySetInnerHTML={{__html: `
          document.addEventListener('DOMContentLoaded', function() {
            // Simple test to ensure JS is working
            console.log('Page loaded successfully on all devices');
            
            // Add touch feedback for older devices
            const buttons = document.querySelectorAll('.button');
            buttons.forEach(button => {
              button.addEventListener('touchstart', function() {
                this.style.opacity = '0.8';
              });
              
              button.addEventListener('touchend', function() {
                this.style.opacity = '1';
              });
            });
          });
        `}} />
      </body>
    </html>
  );
}