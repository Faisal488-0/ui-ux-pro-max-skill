# Motion tools: repository setup and status

This file is a setup guide, **not evidence of a completed machine-level installation**.

## Available tools

| Tool | Role | Location / license | Status |
| --- | --- | --- | --- |
| Prompt Motion | Animation ideas/prompts | https://prompt-motion.com/ ; check rights per example | Reference only; not a package installed by npm |
| Cinetic | Claude Code / Codex cinematic film skill | https://github.com/Leonxlnx/cinetic ; MIT skill | Opt-in local install required |
| Three.js / React Three Fiber / Drei | Realtime in-app 3D graphics | Independent package licenses | Already declared in `Faisal488-0/mishwar-the-lost-bell`; do not duplicate |
| Framer Motion | Interactive React UI motion | Independent package license | Already declared in Mishwar; check each other repo separately |

## Install Cinetic locally after auditing its contents

The upstream install method (pin a released version to reduce supply-chain drift):

```bash
npx skills add Leonxlnx/cinetic#v1.0.0
```

Choose the intended agent (Codex, Claude Code, etc.) and **project-local** scope when prompted. Do not install across all machines unless explicitly desired. The official skill also offers global installation and a Claude Code plugin path; check upstream documentation before using either.

**Prerequisites:** Node 22+, Python 3.11+, ffmpeg 6+ with ffprobe/libx264, and Chromium. Linux/macOS support is documented. On Windows, upstream suggests WSL2 and describes it as not yet tested. Rendering requires additional Python packages and can be CPU-intensive.

**License guard:** Cinetic itself is MIT, but its default Remotion engine has independent licensing and may require a paid company license (upstream says free for individuals and companies up to three people). If eligibility is uncertain, **do not use Remotion commercially** until verified. Cinetic also supports HyperFrames (Apache-2.0), subject to its dependencies' licenses. Free-tier-only policy always applies.

## Implementation workflow

1. Confirm target repository, source assets and license/attribution.
2. Distinguish **live motion** (CSS/SVG/Three.js) from **offline video** (Cinetic).
3. Check current dependencies and security alerts. Never update dependencies simply to add eye-catching animation.
4. Commit and review via project-specific PR, with CI and performance checks.
5. Never ship unlicensed example imagery or executable scripts copied from reference sites.

## Current scope

This PR registers a lightweight **motion-toolkit agent skill** in this design-skill repository for agents running *in this repository*. It does **not** install Cinetic on a PC, enable it automatically in every GitHub repository, introduce runtime website dependencies, or deploy anything. To use the motion toolkit in a separate project, install/copy the skill there after approval and compatibility review.
