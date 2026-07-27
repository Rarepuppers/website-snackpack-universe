# Legacy weapon refresh

The Service Rifle, Scattergun, and Arc Carbine gameplay props were regenerated as 4K-ready source images and normalized to transparent 256x128 derivatives. The manifest keeps their stable asset IDs and 64x32 logical gameplay contract, so world scale and pivots do not change while Full HD/4K rendering receives a 4x source instead of the original 64px raster.

The `*-source.png` files are retained chroma-key generation masters. The `*-gameplay-v2-256x128.png` files are the runtime-bound transparent derivatives. VFX atlases in `item-batch-p2-refresh` remain separate effect candidates and are not used as weapon geometry.
