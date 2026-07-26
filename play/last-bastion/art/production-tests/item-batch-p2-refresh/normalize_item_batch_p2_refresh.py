from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
ROOT=Path(__file__).resolve().parent; RUNTIME=ROOT.parents[2]/"game-assets"
NAMES=["service-rifle-v2","scattergun-v2","arc-carbine-v2"]
def clean(n):
 im=Image.open(ROOT/f"{n}-alpha-extracted.png").convert("RGBA")
 for p in ((0,0),(im.width-1,0),(0,im.height-1),(im.width-1,im.height-1)): im.putpixel(p,(0,0,0,0))
 return im
def atlas(src,size):
 out=Image.new("RGBA",(size*2,size*2),(0,0,0,0))
 for r in range(2):
  for c in range(2):
   cell=src.crop((round(c*src.width/2),round(r*src.height/2),round((c+1)*src.width/2),round((r+1)*src.height/2)))
   if cell.getchannel("A").getbbox(): cell=cell.crop(cell.getchannel("A").getbbox())
   s=min((size-12)/cell.width,(size-12)/cell.height); cell=cell.resize((max(1,round(cell.width*s)),max(1,round(cell.height*s))),Image.Resampling.LANCZOS); out.alpha_composite(cell,(c*size+(size-cell.width)//2,r*size+(size-cell.height)//2))
 return out
def main():
 results=[]
 for n in NAMES:
  src=clean(n); master=atlas(src,128); runtime=atlas(src,64); assert master.getchannel("A").getextrema()==(0,255); master.save(ROOT/f"{n}-128.png"); runtime.save(ROOT/f"{n}-64.png"); RUNTIME.mkdir(parents=True,exist_ok=True); runtime.save(RUNTIME/f"{n}-64.png"); results.append((n,master))
 sheet=Image.new("RGB",(1500,2700),(18,22,28)); draw=ImageDraw.Draw(sheet)
 try: font=ImageFont.truetype("segoeui.ttf",34); small=ImageFont.truetype("segoeui.ttf",22)
 except OSError: font=small=ImageFont.load_default()
 draw.text((48,36),"ITEM BATCH P2 REFRESH / LEGACY WEAPON VFX / 4K PREFLIGHT",fill=(240,244,248),font=font); y=120
 for n,im in results:
  draw.text((48,y),n.upper(),fill=(160,206,220),font=font); thumb=im.resize((700,700),Image.Resampling.NEAREST); sheet.paste(thumb,(600,y),thumb); y+=820
 draw.text((48,2580),"VFX accents only; hit geometry, damage areas, chain paths, timing, and status buildup remain code-owned.",fill=(178,186,196),font=small); sheet.save(ROOT/"item-batch-p2-refresh-contact-sheet.jpg",quality=95,optimize=True)
if __name__=="__main__": main()
