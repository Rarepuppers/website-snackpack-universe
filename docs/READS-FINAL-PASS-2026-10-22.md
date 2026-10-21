# Reads final pass — 22 October 2026

The final quality pass restores all eleven existing Counting sequence models to the website and printable story/question pages, retaining their owning-app values and gaps. Missing sequence/value mutations fail publication checks; actual PDF text is checked too. Market Basket page 3 now supplies `2, 3, ?, 5` before its question. Counting import round-trip: 234 output files unchanged.

Three observation tasks use positional choices and neutral descriptions authored first in Counting (source commit `11a515ad8`), then imported verbatim. The same descriptions appear in app, web and print. Existing illustrations remain; no new raster artwork was generated.

The one-page toolbar uses a scrollable single-column control area only when its measured height exceeds available viewport space. Labels retain the reader's text size; focusing or scrolling reveals every control. Correct and tried maths choices use guarded `aria-disabled` semantics, so keyboard focus is retained and repeat activation cannot resubmit a choice.

Local verification: all 74 Reads browser cases and all 274 website browser cases pass. Source/art/quiz/print checks, 498 contrast combinations and six-decodable round-trip pass. All seven changed PDFs (49 pages) were rendered and reviewed. Counting app verify, separate Expo helper and fresh/returning/settled first-paint smoke pass; all three changed observation pages were inspected in its web export. These checks do not establish native runtime, actual speech/screen-reader behaviour or physical printer output.

Counts remain 54 books / 307 story pages / 54 individual PDFs / 379 printed pages, plus three collection PDFs / 99 pages. No access tier, service-worker cache version, new book, native build or store submission changed. Actual Android/iPhone, Safari retention and physical-print gates remain recorded in the monorepo handoff. The 15 November expansion decision gate is unchanged.
