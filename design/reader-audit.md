# Reading and interaction audit · 2026-11-01

The existing TASM campus archive identity is retained: navy, oxblood, warm paper, fine rules, editorial serif headings and small archival labels. The homepage remains a visual clue wall; reading controls belong in the archive.

## Implemented decisions

- Remove the photograph hover arrow on the standalone homepage. Keep a quiet silk crosshair and the existing silk entry transition.
- Story, inspiration, message and question records have no cover controls or cover panel, including generic trash cards and overview record selection. Preserve old data and all attached source files.
- A single image reader handles any aspect ratio without cropping. Mouse/pen grab, native touch scroll, zoom with center preservation, fit width, whole image, top, progress and original download; explicit image selection prevents accidental swipe navigation while reading screenshots.
- Full entry reading uses a restrained paper column and a fixed toolbar/footer, image directory and optional text-grab mode. Text stays selectable by default.
- Per-record quick-save locks, editor upload/submit locks, file-count limit, partial upload recovery and unsaved-change guards. Modal keyboard navigation does not switch sections. Mobile navigation traps focus and closes before settings.
- Fix narrow artwork list copy, clamp long message previews, improve coarse-pointer hit areas, preserve reduced-motion behavior.

## Public design references actually inspected

- [Jeffery · 抖音网页版的交互设计细节](https://quaily.com/jefferystudio/p/weekly-14-interaction-design-details-of-douyin-web): read the original article. Applied desktop-specific navigation, visible actions, focused dialogs and consistent keyboard behavior.
- [Bilibili · Ak007 design tutorial](https://www.bilibili.com/video/BV1r24y1k76d/): inspected the public indexed introduction about design workflow, components and navigation; direct video access returned 412. No claim of watching the video.
- [Douyin · 设计师 Cc interaction recreation](https://jingxuan.douyin.com/m/video/7578574860067081512): inspected indexed public information; direct page fetch timed out. No assets/code copied and no claim of watching.
- Xiaohongshu creator searches did not expose usable original design notes. The user's previously supplied clue-wall art direction and source credits remain intact.

## Verification completed locally

Browser QA in Codex in-app browser, normal desktop viewport, then 390 × 844 and 320 × 740 responsive viewport overrides. These are browser viewport checks, not a physical touchscreen device test. Only named local QA records were edited; production content was not used for mutation tests.

| Surface / flow | Checked |
|---|---|
| Homepage | No hover-arrow element; silk SVG cursor; all 24 local wall photos retained; clicking a photo enters `/archive`; no horizontal page overflow at 320px |
| Overview | Six room entries, recent records, navigation and counts |
| Story | Tree/dial controls present; QA time point selection; long-image PageDown and mouse drag; no cover; full reading; editor and saved attachment order |
| Inspiration | Live random deck; list/grid; attached image reader; favorite filter; empty search feedback; full reading |
| Artwork | Chosen first image respected; thumbnails and sequence; corrected list column proportions |
| Message | Existing chronology rail; image selection; wide-image source dimensions preserved; long screenshot reader; concise note preview |
| Questions | Image reader; status toggle; local test record moved to trash then restored |
| Links | URLs, tags, text/action layout and collection navigation |
| Gallery | All source image entries; long screenshot opens unified full reader; End reaches exact bottom |
| Profile | Existing character entries and optional portrait cards retained; full reader uses the same text/attachment layout |
| Editor | All four requested kinds have zero cover pickers; inline attachment reading; reorder/save; real UI multi-file upload of long/wide fixtures at 320px; saving disabled during upload/save |
| Full reader | No cover panel; text grab changes scrollTop; directory jumps to images; individual long image scrolls; expanded reader zoom/drag/next; outer and image scroll regions remain separate |
| Mobile | Sidebar focus enters navigation; selection closes menu; settings and editor fit; 390px full reading; 320px expanded reader/editor toolbars have clientWidth equal to scrollWidth |
| Backup / recovery | UI export downloaded valid v3 JSON with records/files/wall/chronology; local test record soft-delete and restore passed |

Model tests: 22 passing (media, inspiration, chronology, wall). Local API smoke: authentication, initialization, seven archive types, upload/download, MIME/URL validation, optimistic concurrency, favorite, trash/restore, attachment cleanup. TypeScript check passes. Framework production build is run by the packaging workflow.

No backend schema migration. No production record/file/wall edits. Existing content stays in its original owner-scoped storage.
