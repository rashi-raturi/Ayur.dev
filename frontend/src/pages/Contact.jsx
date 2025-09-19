// // import React from "react";

// // export default function Contact() {
// //   const iframeSrc = "/omni-widget.html";

// //   return (
// //     <div
// //       className="min-h-screen flex flex-col items-center justify-start p-8"
// //       style={{ backgroundColor: "#486C4C" }}
// //     >
// //       <h1 className="text-4xl font-extrabold mb-4 text-white">Vaani AI</h1>
// //       <p className="text-gray-100 mb-6 text-center max-w-2xl">
// //         Your Ayurveda-inspired voice-based AI assistant — blending ancient
// //         wisdom with modern conversations.
// //       </p>

// //       <div
// //         style={{
// //           width: "100%",
// //           maxWidth: 1024,
// //           height: 640,
// //           borderRadius: 12,
// //           overflow: "hidden",
// //           boxShadow: "0 6px 22px rgba(0,0,0,0.2)",
// //           border: "1px solid rgba(255,255,255,0.15)",
// //           background: "#fff",
// //         }}
// //       >
// //         <iframe
// //           title="Vaani AI Assistant"
// //           src={iframeSrc}
// //           style={{ width: "100%", height: "100%", border: "none" }}
// //           allow="microphone; camera; autoplay; clipboard-read; clipboard-write"
// //         />
// //       </div>

// //       <p className="text-sm text-gray-200 mt-4 text-center max-w-lg">
// //         Powered by OmniDimension • Crafted with the wisdom of Ayurveda 🌿
// //       </p>
// //     </div>
// //   );
// // }

// import React from "react";

// // ContactWithOmniEnv.jsx
// // Drop this component into your Vite + React app (replace your current Contact.jsx)
// // Instructions: create a `.env` at project root with VITE_OMNI_SECRET_KEY=your_key and restart dev server.

// export default function ContactWithOmniEnv() {
//   // Vite exposes env vars prefixed with VITE_ via import.meta.env
//   const secret = import.meta.env.VITE_OMNI_SECRET_KEY || "";

//   // Build an HTML string for the iframe. We inject the secret here at build/dev time.
//   const iframeHtml = `<!DOCTYPE html>
// <html lang="en">
//   <head>
//     <meta charset="utf-8" />
//     <meta name="viewport" content="width=device-width, initial-scale=1" />
//     <title>Vaani AI – Ayur.dev (iframe)</title>
//     <style>
//       body { margin: 0; font-family: "Georgia", serif; background: #f4f9f4; color: #2e3b2c; display:flex; flex-direction:column; align-items:center; min-height:100vh; }
//       main { max-width:800px; padding:2rem; text-align:center; }
//       .features { display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:1.5rem; margin-top:2rem; }
//       .feature { background:#fff; border-radius:10px; padding:1.2rem; box-shadow:0 4px 12px rgba(0,0,0,0.06); border:1px solid #e0e0e0; }
//       footer { margin-top:auto; padding:1rem; background:#e8f5e9; text-align:center; font-size:0.9rem; color:#4e4e4e; }
//     </style>
//   </head>
//   <body>
//     <main>
//       <h2>Meet Vaani AI</h2>
//       <p>Vaani AI is your intelligent assistant designed to bring the essence of Ayurveda into modern life. Whether you want to learn natural wellness tips, explore holistic practices, or simply experience smooth voice interactions, Vaani AI is here to guide you.</p>

//       <div class="features">
//         <div class="feature"><h3>🌿 Ayurveda Knowledge</h3><p>Get insights into natural remedies, yoga, diet, and lifestyle balance.</p></div>
//         <div class="feature"><h3>🎙 Voice Interaction</h3><p>Talk naturally with Vaani AI using voice — hands-free and effortless.</p></div>
//         <div class="feature"><h3>⚡ Modern + Ancient</h3><p>Seamlessly blends ancient Ayurvedic wisdom with modern AI capabilities.</p></div>
//       </div>
//     </main>

//     <footer>
//       <h3>Place your first call. Check out Vaani AI 👉 </h3>
//     </footer>

//     <!-- Omnidim widget script (secret injected from Vite env) -->
//     <script async id="omnidimension-web-widget" src="https://backend.omnidim.io/web_widget.js?secret_key=${secret}"></script>
//   </body>
// </html>`;

//   return (
//     <div
//       className="min-h-screen flex flex-col items-center justify-start p-8"
//       style={{ backgroundColor: "#486C4C" }}
//     >
//       <h1 className="text-4xl font-extrabold mb-4 text-white">Vaani AI</h1>
//       <p className="text-gray-100 mb-6 text-center max-w-2xl">
//         Your Ayurveda-inspired voice-based AI assistant — blending ancient wisdom with modern conversations.
//       </p>

//       <div
//         style={{
//           width: "100%",
//           maxWidth: 1024,
//           height: 640,
//           borderRadius: 12,
//           overflow: "hidden",
//           boxShadow: "0 6px 22px rgba(0,0,0,0.2)",
//           border: "1px solid rgba(255,255,255,0.15)",
//           background: "#fff",
//         }}
//       >
//         {/* Use srcDoc so we can inject the env secret at build/dev time */}
//         <iframe
//           title="Vaani AI Assistant"
//           srcDoc={iframeHtml}
//           style={{ width: "100%", height: "100%", border: "none" }}
//           allow="microphone; camera; autoplay; clipboard-read; clipboard-write"
//         />
//       </div>

//       <p className="text-sm text-gray-200 mt-4 text-center max-w-lg">
//         Powered by OmniDimension • Crafted with the wisdom of Ayurveda 🌿
//       </p>
//     </div>
//   );
// }


import React from "react";

// ContactWithOmniEnv.jsx
// Drop this component into your Vite + React app (replace your current Contact.jsx)
// Instructions: create a `.env` at project root with VITE_OMNI_SECRET_KEY=your_key and restart dev server.

export default function ContactWithOmniEnv() {
  // Vite exposes env vars prefixed with VITE_ via import.meta.env
  const secret = import.meta.env.VITE_OMNI_SECRET_KEY || "";

  // Build an HTML string for the iframe. We inject the secret here at build/dev time.
  const iframeHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Vaani AI – Ayur.dev (iframe)</title>
    <style>
      body { margin: 0; font-family: "Georgia", serif; background: #f4f9f4; color: #2e3b2c; display:flex; flex-direction:column; align-items:center; min-height:100vh; }
      header { background: linear-gradient(135deg, #2e7d32, #66bb6a); width: 100%; padding: 2rem; text-align:center; color: white; }
      header h1 { margin:0; font-size:2.2rem; }
      header p { margin-top:0.5rem; font-size:1.1rem; opacity:0.9; }
      main { max-width:800px; padding:2rem; text-align:center; }
      main h2 { font-size:1.8rem; margin-bottom:1rem; color:#2e7d32; }
      main p { font-size:1.1rem; line-height:1.6; margin-bottom:1.5rem; }
      .features { display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:1.5rem; margin-top:2rem; }
      .feature { background:#ffffff; border-radius:10px; padding:1.2rem; box-shadow:0 4px 12px rgba(0,0,0,0.06); border:1px solid #e0e0e0; }
      .feature h3 { margin:0 0 0.5rem; color:#388e3c; font-size:1.2rem; }
      footer { margin-top: auto; padding:1rem; background:#e8f5e9; text-align:center; font-size:0.9rem; color:#4e4e4e; }
    </style>
  </head>
  <body>

    <main>
      <h2>Meet Vaani AI</h2>
      <p>
        Vaani AI is your intelligent assistant designed to bring the essence of Ayurveda into modern life. Whether you want to learn natural wellness tips, explore holistic practices, or simply experience smooth voice interactions, Vaani AI is here to guide you.
      </p>

      <div class="features">
        <div class="feature">
          <h3>🌿 Ayurveda Knowledge</h3>
          <p>Get insights into natural remedies, yoga, diet, and lifestyle balance.</p>
        </div>
        <div class="feature">
          <h3>🎙 Voice Interaction</h3>
          <p>Talk naturally with Vaani AI using voice — hands-free and effortless.</p>
        </div>
        <div class="feature">
          <h3>⚡ Modern + Ancient</h3>
          <p>Seamlessly blends ancient Ayurvedic wisdom with modern AI capabilities.</p>
        </div>
      </div>
    </main>

    <footer>
      <h3>Place your first call. Check out Vaani AI 👉 </h3>
    </footer>

    <!-- Omnidim widget script (secret injected from Vite env) -->
    <script async id="omnidimension-web-widget" src="https://backend.omnidim.io/web_widget.js?secret_key=${secret}"></script>
  </body>
</html>`;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-start p-8"
      style={{ backgroundColor: "#486C4C" }}
    >
      <h1 className="text-4xl font-extrabold mb-4 text-white">Vaani AI</h1>
      <p className="text-gray-100 mb-6 text-center max-w-2xl">
        Your Ayurveda-inspired voice-based AI assistant — blending ancient wisdom with modern conversations.
      </p>

      <div
        style={{
          width: "100%",
          maxWidth: 1024,
          height: 640,
          borderRadius: 12,
          overflow: "hidden",
          boxShadow: "0 6px 22px rgba(0,0,0,0.2)",
          border: "1px solid rgba(255,255,255,0.15)",
          background: "#fff",
        }}
      >
        {/* Use srcDoc so we can inject the env secret at build/dev time */}
        <iframe
          title="Vaani AI Assistant"
          srcDoc={iframeHtml}
          style={{ width: "100%", height: "100%", border: "none" }}
          allow="microphone; camera; autoplay; clipboard-read; clipboard-write"
        />
      </div>

      <p className="text-sm text-gray-200 mt-4 text-center max-w-lg">
        Powered by OmniDimension • Crafted with the wisdom of Ayurveda 🌿
      </p>

      {/*
        Below are auxiliary files/templates for generating a standalone omni-widget.html
        ------------------------------------------------------------
        File: omni-widget.template.html
        (this is your original HTML with styles preserved; the script src uses ${OMNI_SECRET_KEY} placeholder)

        File: scripts/generate-omni.js
        (small Node script that reads .env and writes public/omni-widget.html by replacing ${OMNI_SECRET_KEY})

        Add the following to package.json to auto-generate before dev/build:
          "predev": "node scripts/generate-omni.js",
          "prebuild": "node scripts/generate-omni.js"

        Create .env at project root with:
          VITE_OMNI_SECRET_KEY=your_secret_here

        The generator will write the final public/omni-widget.html with the real secret injected. Use iframe src="/omni-widget.html" in your Contact component instead of srcDoc if you prefer that flow.
      */}
    </div>
  );
}
