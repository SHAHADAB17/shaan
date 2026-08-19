# ShaanChat Modular Upgrade

Files:
- `index.html` — UI shell; preserves existing DOM IDs and Firebase paths.
- `styles.css` — extracted legacy styling plus accessibility/responsive enhancements.
- `firebase-config.js` — Firebase/App Check configuration and shared Firebase instances.
- `auth.js` — authentication UI and auth-state listener.
- `chat.js` — existing chat/group/friend/QR/security application logic, refactored to imports.
- `webrtc.js` — STUN/TURN configuration and ICE-state/restart foundation.
- `media.js` — Cloudinary upload, client-side image compression, media helpers and audio waveform preview.
- `ui-ux.js` — DOM sanitization, safe URL validation, swipe-to-reply, message highlighting and modal focus trapping.

Important:
- Existing Firestore document paths and DOM IDs are retained.
- Cloudinary remains unsigned-upload based; no API secret is stored client-side.
- The Web Crypto functions are an E2EE foundation only. Messages are NOT automatically E2EE until a real authenticated key exchange and encrypted message schema are enabled.
- For production WebRTC, add a TURN server to `webrtc.js`; STUN alone is not sufficient for every NAT/network.
