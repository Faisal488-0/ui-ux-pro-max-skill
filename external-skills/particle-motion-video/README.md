# Particle Motion Video — original skill installation intake

**Author:** James Camarota  
**Publisher website:** https://jamescamarota.com/  
**Status:** NOT INSTALLED. The original publisher ZIP has not been retrieved or verified. This directory deliberately contains no substitute particle engine and no counterfeit SKILL.md.

## Purpose

Third-party free-download skill described as producing 80,000-particle glowing-dust videos, masked shapes, spring-based morphing, light passes and seamless 60 fps loops with Python and FFmpeg. Published frame and spring statistics are claims in the supplied description, not independently reproduced results.

## Complete installation on Windows

1. Download the original ZIP directly from James Camarota and verify its provenance and license.
2. Run the safe extraction helper from this repository:

   ~~~powershell
   py external-skills/particle-motion-video/install_from_zip.py "C:\path\to\original-skill.zip"
   ~~~

   This copies it to the current user's ~/.claude/skills/particle-motion-video directory. For a project-only install:

   ~~~powershell
   py external-skills/particle-motion-video/install_from_zip.py "C:\path\to\original-skill.zip" --skills-dir "C:\path\to\project\.claude\skills"
   ~~~

3. Review extracted SKILL.md, scripts, dependencies, and the original license before executing third-party code.
4. In a Python virtual environment, install the dependencies documented by the author; FFmpeg must also be on PATH:

   ~~~powershell
   py -m venv .venv
   .\.venv\Scripts\python -m pip install numpy scipy opencv-python-headless pillow
   ffmpeg -version
   ~~~

5. Confirm the CLI before attempting the example commands quoted in the supplied description:

   ~~~bash
   python scripts/render.py examples/particle_sky.py --stills 20,160,470
   python scripts/render.py examples/particle_sky.py --out sky.mp4
   ~~~

   The meaning of the still-frame numbers was not independently verified. Start with a small render and inspect frame continuity.

## Security and scope

- The helper **copies verified ZIP members only**, with no code execution or dependency installation. It refuses symlinks, archive traversal, duplicate files, overlarge ZIPs and overwrites.
- Free download does not establish redistribution or commercial-use permissions; do not commit the author's original files until the license is checked.
- This is a **video renderer**, not a generator of animated GLB/FBX game assets.
- A large CPU render at 60 fps may be slow on low-memory machines; use a reduced-size test first.

## Acceptance criteria

- [ ] Original ZIP obtained from the publisher
- [ ] Provenance and license verified
- [ ] ZIP extracted successfully into the intended Claude Code skills directory
- [ ] Original SKILL.md and scripts/render.py inspected
- [ ] Python/FFmpeg verified
- [ ] Preview render inspected and loop seam checked
