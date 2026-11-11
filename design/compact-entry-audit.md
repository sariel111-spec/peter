# Compact transmissions and entry audit · 2026-11-01

Scope: make transmission records smaller, enlarge the clue wall slightly within the screen, and remove the document reload from the homepage entry flow. No production data or saved wall layout is rewritten.

The existing isolated photos, research papers, pins, clips, red threads, cork and wooden frame from the user's three supplied Xiaohongshu references remain the art direction. The three original pages were retried through web access this round and were unavailable; no claim of inspecting newly accessible post images. The already retained source materials and credits remain intact.

## Changes

- Transmission grid: two columns (three on very wide desktops), compact preview readers, modest paper borders and alternating navy/red rules. Lists use a horizontal text/image layout. Mobile remains readable in one column. Header, tag and date rail spacing is smaller.
- Full image and text readers remain independent of the preview height; no crop of source files and no cover option reintroduced.
- The wall uses more of the viewport and less outer padding, while keeping the saved aspect ratio and every object geometry. Styles apply to presentation mode only; inspection and DIY workspace retain their behavior.
- Entry uses `router.push`, code/image/data preloading and one persistent layout-level curtain. Only compositor transforms animate the curtain. The archive signals readiness after records resolve and the primary overview image has decoded (bounded wait), then two paint frames precede reveal. The body stays scroll-locked during the transition. Failed connections expose recovery actions after 12 seconds.
- Preloaded authenticated responses live only in module memory for up to 8 seconds, are consumed once, and are discarded on failure. No private record cache is added to web storage.
- Browser back clears the in-flight transition; BFCache restoration retains the wall refresh behavior. Reduced motion skips curtain movement.

## Verified locally

- Desktop (983 × 752): wall frame about 963 × 644, complete and within screen; no photo hover arrow; grid columns approximately 346px each. Grid and horizontal list both rendered. List cards with two images were approximately 364px high instead of a page-wide image panel.
- Long image PageDown changed nested scrollTop while the compact viewport stayed about 165px high; expanded mobile reader retained a 630px viewport and could read the full source.
- Homepage photo entry reached the archive and removed its loading curtain; browser back and a second entry succeeded. Mobile entry also completed. No browser error logs in the tested flow.
- 390 × 844 responsive check: wall about 378 × 673, no horizontal overflow; transmission card widths matched their scroll widths; full-image reader remained usable.
- DIY editor opened, all 24 local layer handles remained present, and exiting the editor without changes worked. Local draft offer was left untouched.
- TypeScript and production build are checked during packaging. Preload/media unit tests passed (5), as did existing chronology/wall model tests (15).

Only two named local transmission fixtures and their source uploads were created for these checks. Production verification is read-only. Responsive viewport testing is not a physical-device or throttled-network benchmark; no absolute latency guarantee is implied.
