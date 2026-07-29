import Phaser from "phaser";

export interface AssetLoadFeedbackHandle {
  readonly failedKeys: string[];
  readonly lastFile: { key: string; url: string } | null;
  readonly progress: number;
  markComplete(): void;
  destroy(): void;
}

/**
 * Small, code-native loading surface shared by scenes that queue authored art
 * outside their initial preload. It records failures instead of allowing a
 * blank texture to fail later at the point of use.
 */
export function attachAssetLoadFeedback(
  scene: Phaser.Scene,
  label: string,
): AssetLoadFeedbackHandle {
  let currentProgress = 0;
  let currentFile: { key: string; url: string } | null = null;
  const failedKeys: string[] = [];
  const root = scene.add.container(0, 0).setDepth(10000).setScrollFactor(0);
  const width = scene.scale.width || 960;
  const height = scene.scale.height || 540;
  root.add(scene.add.rectangle(width / 2, height / 2, width, height, 0x0b121c, 0.96));
  root.add(scene.add.rectangle(width / 2, height / 2, 430, 150, 0x1d2938)
    .setStrokeStyle(2, 0x68e4e8));
  root.add(scene.add.text(width / 2, height / 2 - 48, label, {
    color: "#68e4e8",
    fontFamily: "monospace",
    fontSize: "18px",
  }).setOrigin(0.5));
  const status = scene.add.text(width / 2, height / 2 - 17, "STARTING...", {
    color: "#8fa1b3",
    fontFamily: "monospace",
    fontSize: "11px",
  }).setOrigin(0.5);
  root.add(status);
  root.add(scene.add.rectangle(width / 2, height / 2 + 19, 330, 10, 0x0b121c)
    .setStrokeStyle(1, 0x33475e));
  const fill = scene.add.rectangle(width / 2 - 164, height / 2 + 19, 2, 6, 0x68e4e8)
    .setOrigin(0, 0.5);
  root.add(fill);

  const onProgress = (value: number): void => {
    currentProgress = Math.max(0, Math.min(1, value));
    fill.setDisplaySize(Math.max(2, 326 * currentProgress), 6);
    status.setText(`${Math.round(currentProgress * 100)}%  ${currentFile?.key ?? "QUEUING ART"}`);
  };
  const onFileProgress = (file: Phaser.Loader.File): void => {
    currentFile = { key: String(file.key), url: String(file.url) };
    status.setText(`${Math.round(currentProgress * 100)}%  ${currentFile.key}`);
  };
  const onLoadError = (file: Phaser.Loader.File): void => {
    const key = String(file.key);
    if (!failedKeys.includes(key)) failedKeys.push(key);
    currentFile = { key, url: String(file.url) };
    status.setText(`FAILED  ${key}`);
  };
  scene.load.on(Phaser.Loader.Events.PROGRESS, onProgress);
  scene.load.on(Phaser.Loader.Events.FILE_PROGRESS, onFileProgress);
  scene.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, onLoadError);

  return {
    failedKeys,
    get lastFile() { return currentFile; },
    get progress() { return currentProgress; },
    markComplete(): void {
      if (failedKeys.length === 0) onProgress(1);
      scene.load.off(Phaser.Loader.Events.PROGRESS, onProgress);
      scene.load.off(Phaser.Loader.Events.FILE_PROGRESS, onFileProgress);
      scene.load.off(Phaser.Loader.Events.FILE_LOAD_ERROR, onLoadError);
    },
    destroy(): void {
      scene.load.off(Phaser.Loader.Events.PROGRESS, onProgress);
      scene.load.off(Phaser.Loader.Events.FILE_PROGRESS, onFileProgress);
      scene.load.off(Phaser.Loader.Events.FILE_LOAD_ERROR, onLoadError);
      root.destroy(true);
    },
  };
}
