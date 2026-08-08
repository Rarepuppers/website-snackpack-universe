# Steam Input depot files

`steam_input_manifest.vdf` is the source-controlled action contract. Its action names mirror the
game's code-owned controls; changing either side requires updating the manifest audit test.

The `configurations` block intentionally remains empty until Last Bastion has its real Steam App ID.
Official controller configuration files must be exported by Steam Input Dev Mode, dumped through
`steam://dumpcontrollerconfig?appid=<real-app-id>`, copied beside the manifest, and referenced by
controller type and relative path. Do not fabricate those generated VDFs or validate against App 480.

Live acceptance:

1. Enable Steam Input Layout Dev Mode and run the real App ID through Steam.
2. Export and dump layouts for Steam Deck, Xbox, DualSense, Switch Pro, and generic controllers.
3. Add their paths under `configurations` using Valve's current controller-type identifiers.
4. Set Steamworks > Steam Input to `Custom Configuration (Bundled with game)` and point it at this manifest.
5. Confirm the runtime reports each connected controller family and the HUD legends change before Phaser boot.
6. Confirm keyboard/mouse fallback, hot-plug, remapping, menus, combat, pause, and overlay behavior.

Reference: https://partner.steamgames.com/doc/features/steam_controller/action_manifest_file
