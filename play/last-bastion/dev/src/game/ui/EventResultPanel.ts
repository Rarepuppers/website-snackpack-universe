import type Phaser from "phaser";
import { uiTextResolution } from "../rendering/DisplayScaling";

/** A bounded result panel shared by the expedition and its review scene. */
export function renderEventResultPanel(
  scene: Phaser.Scene, root: Phaser.GameObjects.Container,
  narrative: string, summary: readonly string[], requestedPage: number,
  continueAction: () => void, pageAction: (delta: number) => void,
): { page: number; pageCount: number; visibleLines: string[] } {
  const text = (x: number, y: number, value: string, size = 12, color = "#e8e2d4") => {
    const label = scene.add.text(x,y,value,{fontFamily:"ui-monospace, SFMono-Regular, Consolas, monospace",fontSize:`${size}px`,color,lineSpacing:5,wordWrap:{width:720}})
      .setResolution(uiTextResolution());
    root.add(label);
    return label;
  };
  root.add(scene.add.rectangle(480,270,960,540,0x05090e,0.86).setInteractive());
  root.add(scene.add.rectangle(70,40,820,460,0x1d2938).setOrigin(0).setStrokeStyle(2,0x68e4e8));
  text(480,58,"RESULT",18,"#68e4e8").setOrigin(0.5,0);
  const body = text(110,100,"");
  // Wrap with the actual renderer/font before paging. No dropped rows or shrinking text.
  const wrapped = body.getWrappedText([narrative || "You move on.", "", ...summary].join("\n"));
  const rowsPerPage = 17;
  const pageCount = Math.max(1,Math.ceil(wrapped.length / rowsPerPage));
  const page = Math.max(0,Math.min(pageCount-1,requestedPage));
  const visibleLines = wrapped.slice(page*rowsPerPage,(page+1)*rowsPerPage);
  body.setText(visibleLines.join("\n"));
  const button = (x: number, width: number, label: string, action: () => void, enabled = true) => {
    const box = scene.add.rectangle(x,465,width,34,0x263a4a).setStrokeStyle(1,enabled ? 0x68e4e8 : 0x3b4d63);
    if (enabled) box.setInteractive({useHandCursor:true}).on("pointerdown",action);
    root.add(box);
    text(x,465,label,11,enabled ? "#e8e2d4" : "#8fa1b3").setOrigin(0.5);
  };
  button(480,320,"ENTER / SPACE / A  CONTINUE",continueAction);
  if (pageCount > 1) {
    text(480,420,`Page ${page+1} / ${pageCount}   ← → / D-pad: read more`,11,"#68e4e8").setOrigin(0.5,0);
    button(190,160,"← PREVIOUS",()=>pageAction(-1),page>0);
    button(770,160,"NEXT →",()=>pageAction(1),page<pageCount-1);
  }
  return {page,pageCount,visibleLines};
}
