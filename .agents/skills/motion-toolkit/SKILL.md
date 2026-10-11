---
name: motion-toolkit
description: Review and implement fast, accessible UI animation and mascot motion in React, Next.js and Vite projects; choose CSS/SVG, Motion, Three.js, or Cinetic responsibly.
---

# Motion Toolkit (Arabic/English)

## Scope
This repository-level skill covers interactive UI motion, visual feedback, mascots, 3D presentation, and cinematic promo videos. It does **not** silently install third-party dependencies or copy example-site assets.

## Before editing another project
1. Inspect that project's latest default branch, open PRs, package manager, lockfile, CI and deployed state.
2. Identify whether the request is **live UI interaction** or a **rendered promo video**. Never replace responsive interactions with a video.
3. Check whether packages are already installed. Never reinstall `three`, `@react-three/fiber`, `@react-three/drei`, or `framer-motion` without a reason.
4. Make isolated PRs; do not auto-merge or deploy. Free-tier-only, with no paid APIs or cloud render requirements.

## Choosing the implementation
- **UI micro-interactions:** CSS transitions/keyframes and SVG first. Animate transform and opacity; minimize reflows and paints. Keep controls keyboard and touch accessible.
- **React application animation:** use an existing animation library if compatible. Only propose a new dependency after bundle-size and version checks.
- **True realtime 3D:** use an existing `three` / react-three stack. Provide low-detail models, mobile GPU fallback, lazy loading, visibility pause, and a non-WebGL fallback.
- **Product teasers and launch films:** use the independently installed **Cinetic** agent skill (https://github.com/Leonxlnx/cinetic), version-pinned and after security/license review. It generates offline rendered videos, not interactive website components.
- **Inspiration:** https://prompt-motion.com/ shows examples/prompts. Do not assume source code, example footage, visual assets or names may be redistributed.

## Quality gates
- Observe `prefers-reduced-motion`, pause nonessential loops off-screen, support low-power devices.
- For pointer-following mascots, throttle via animation frames, clamp gaze/angle, preserve touch usability, and avoid interfering with clicks/scroll.
- Verify Arabic RTL, readable text, color contrast, focus visibility and responsive layouts.
- Compare before/after FPS, CPU usage, memory, transferred bytes and Lighthouse/performance budget.
- A render tool must stay out of production dependencies unless a scoped use case is approved.
- Preserve existing voices, navigation safety, permissions, authentication, and data access controls.
- Run lint, typecheck, tests, build and security checks when tooling is available; report unrun checks honestly.

## Project mapping (recommendations, not installations)
- Kuwait AI Teacher: subtle free-roaming assistant icon, accessible reduced-motion fallback; never replace Fawz's voice/teacher persona.
- Mishwar game: re-use existing Three.js/React Three Fiber/Drei/Framer Motion; use genuine game engine logic for world building.
- SANAD: state-driven listen/think/speak orb, real state transitions only.
- Careers / Al-Fahad: lightweight, nonblocking interactions; avoid scroll-jank and CLS.
- Darbak: safety first, no distracting driver-facing motion.

## Installing Cinetic intentionally
See `docs/MOTION_TOOLS_SETUP.md`. First review its source and license, then from the specific project use:
```bash
npx skills add Leonxlnx/cinetic#v1.0.0
```
This is a command for a local development environment, **not something automatically run by GitHub**.
