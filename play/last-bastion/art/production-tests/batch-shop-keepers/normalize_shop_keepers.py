from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
ROOT=Path(__file__).resolve().parent; RUNTIME=ROOT.parents[2]/"game-assets"
KEEPERS=["blacksmith","gunsmith","vndr","clinician","medic-sister","curator","fence"]
def main():
 src=Image.open(ROOT/"shop-keepers-v1-alpha-extracted.png").convert("RGBA")
 for p in ((0,0),(src.width-1,0),(0,src.height-1),(src.width-1,src.height-1)): src.putpixel(p,(0,0,0,0))
 sheets=[]
 for c,name in enumerate(KEEPERS):
  sheet=Image.new("RGBA",(512,256),(0,0,0,0))
  for r in range(4):
   cell=src.crop((round(c*src.width/7),round(r*src.height/4),round((c+1)*src.width/7),round((r+1)*src.height/4)))
   if cell.getchannel("A").getbbox(): cell=cell.crop(cell.getchannel("A").getbbox())
   s=min(112/cell.width,240/cell.height); cell=cell.resize((max(1,round(cell.width*s)),max(1,round(cell.height*s))),Image.Resampling.LANCZOS)
   sheet.alpha_composite(cell,(r*128+(128-cell.width)//2,256-cell.height-8))
  sheet.save(ROOT/f"shop-keeper-{name}-v1-4x128x256.png"); RUNTIME.mkdir(parents=True,exist_ok=True); sheet.save(RUNTIME/f"shop-keeper-{name}-v1-4x128x256.png"); sheets.append((name,sheet))
 check=Image.new("RGB",(1400,5000),(18,22,28)); draw=ImageDraw.Draw(check)
 try: font=ImageFont.truetype("segoeui.ttf",34); small=ImageFont.truetype("segoeui.ttf",22)
 except OSError: font=small=ImageFont.load_default()
 draw.text((48,36),"SHOP KEEPERS / 7 SPECIALTY SILHOUETTES / 4K PREFLIGHT",fill=(240,244,248),font=font); y=110
 for name,sheet in sheets:
  draw.text((48,y),name.upper(),fill=(160,206,220),font=font); thumb=sheet.resize((1024,512),Image.Resampling.NEAREST); check.paste(thumb,(100,y+58),thumb); y+=680
 draw.text((48,4880),"Keepers are presentation-only; prices, offers, specialties, counter layout, and transaction logic remain code-owned.",fill=(178,186,196),font=small); check.save(ROOT/"shop-keepers-contact-sheet.jpg",quality=95,optimize=True)
if __name__=="__main__": main()
