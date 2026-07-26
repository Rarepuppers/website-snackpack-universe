from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
ROOT=Path(__file__).resolve().parent; RUNTIME=ROOT.parents[2]/"game-assets"
def clean(n):
 im=Image.open(ROOT/f"{n}-alpha-extracted.png").convert("RGBA")
 for p in ((0,0),(im.width-1,0),(0,im.height-1),(im.width-1,im.height-1)): im.putpixel(p,(0,0,0,0))
 return im
def atlas(src,cols,rows,size):
 out=Image.new("RGBA",(cols*size,rows*size),(0,0,0,0))
 for r in range(rows):
  for c in range(cols):
   cell=src.crop((round(c*src.width/cols),round(r*src.height/rows),round((c+1)*src.width/cols),round((r+1)*src.height/rows)))
   if cell.getchannel("A").getbbox(): cell=cell.crop(cell.getchannel("A").getbbox())
   s=min((size-16)/cell.width,(size-16)/cell.height); cell=cell.resize((max(1,round(cell.width*s)),max(1,round(cell.height*s))),Image.Resampling.LANCZOS)
   out.alpha_composite(cell,(c*size+(size-cell.width)//2,r*size+(size-cell.height)//2))
 return out
def check(im,cols,rows,n):
 assert im.getchannel("A").getextrema()==(0,255),f"{n}: alpha"
 for r in range(rows):
  for c in range(cols): assert im.crop((c*im.width//cols,r*im.height//rows,(c+1)*im.width//cols,(r+1)*im.height//rows)).getchannel("A").getbbox(),f"{n}: empty"
def main():
 specs=[("machine-cyborg-reclaimer-v1",4,9,192),("machine-cyborg-reclaimer-effects-v1",4,2,128)]; results=[]
 for n,cols,rows,size in specs:
  im=atlas(clean(n),cols,rows,size); check(im,cols,rows,n); im.save(ROOT/f"{n}.png"); im.save(ROOT/f"{n}-{size}.png"); RUNTIME.mkdir(parents=True,exist_ok=True); im.save(RUNTIME/f"{n}-{size}.png"); results.append((n,im))
 sheet=Image.new("RGB",(1400,4100),(18,22,28)); draw=ImageDraw.Draw(sheet)
 try: font=ImageFont.truetype("segoeui.ttf",34); small=ImageFont.truetype("segoeui.ttf",22)
 except OSError: font=small=ImageFont.load_default()
 draw.text((48,36),"CYBORG RECLAIMER / BODY + EFFECTS / 4K PREFLIGHT",fill=(240,244,248),font=font); y=110
 for n,im in results:
  draw.text((48,y),n.upper(),fill=(160,206,220),font=font); thumb=im.resize((1200,round(im.height*1200/im.width)),Image.Resampling.NEAREST); sheet.paste(thumb,(100,y+58),thumb); y+=thumb.height+130
 draw.text((48,4040),"Art supports the authorized repair behavior; target eligibility, tether, patch count, healing, interruption, and cooldown remain code-owned.",fill=(178,186,196),font=small); sheet.save(ROOT/"cyborg-reclaimer-contact-sheet.jpg",quality=95,optimize=True)
if __name__=="__main__": main()
