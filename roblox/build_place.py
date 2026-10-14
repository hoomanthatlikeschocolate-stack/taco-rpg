"""Build an editable, self-contained Roblox XML place from owned geometry and Lua."""
from pathlib import Path
import json, math, xml.etree.ElementTree as E

ROOT = Path(__file__).resolve().parent
root = E.Element('roblox', {'version': '4'})
E.SubElement(root, 'External').text = 'null'
E.SubElement(root, 'External').text = 'nil'
serial = 0
manifest = []
MATERIALS = {'plastic': 272, 'wood': 512, 'woodplanks': 528, 'grass': 1280, 'neon': 288, 'concrete': 816, 'fabric': 1312, 'metal': 1088}
def item(class_name, name, parent=root):
    global serial
    serial += 1
    obj = E.SubElement(parent, 'Item', {'class': class_name, 'referent': 'RBX' + str(serial)})
    props = E.SubElement(obj, 'Properties')
    E.SubElement(props, 'string', {'name': 'Name'}).text = name
    return obj
def prop(obj, kind, name, value):
    node = E.SubElement(obj.find('Properties'), kind, {'name': name})
    if isinstance(value, bool): value = 'true' if value else 'false'
    node.text = str(value)
    return node
def vec(obj, name, value):
    node = E.SubElement(obj.find('Properties'), 'Vector3', {'name': name})
    for k, v in zip('XYZ', value): E.SubElement(node, k).text = str(v)
def color(obj, name, value):
    node = E.SubElement(obj.find('Properties'), 'Color3', {'name': name})
    for k, v in zip('RGB', value): E.SubElement(node, k).text = str(v / 255)
def matrix(rx=0, ry=0, rz=0):
    x, y, z = map(math.radians, (rx, ry, rz)); cx, sx, cy, sy, cz, sz = math.cos(x), math.sin(x), math.cos(y), math.sin(y), math.cos(z), math.sin(z)
    return ((cy*cz, -cy*sz, sy), (cx*sz+sx*sy*cz, cx*cz-sx*sy*sz, -sx*cy), (sx*sz-cx*sy*cz, sx*cz+cx*sy*sz, cx*cy))
def cframe(obj, name, position, rotation=None):
    node = E.SubElement(obj.find('Properties'), 'CoordinateFrame', {'name': name})
    for k, v in zip('XYZ', position): E.SubElement(node, k).text = str(v)
    r = rotation or matrix()
    for i in range(3):
        for j in range(3): E.SubElement(node, f'R{i}{j}').text = str(round(r[i][j], 9))
def look_at(pos, target):
    def norm(v):
        length = math.sqrt(sum(x*x for x in v)); return tuple(x/length for x in v)
    def cross(a,b): return (a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0])
    back = norm(tuple(a-b for a,b in zip(pos,target))); right = norm(cross((0,1,0),back)); up = cross(back,right)
    return tuple(tuple(axis[i] for axis in (right,up,back)) for i in range(3))
def part(parent, name, size, pos, rgb=(80,80,100), material='plastic', collide=True, transparency=0, rotation=None, shape=1, class_name='Part'):
    p = item(class_name, name, parent)
    vec(p, 'size', size); cframe(p, 'CFrame', pos, rotation)
    prop(p, 'Color3uint8', 'Color3uint8', 0xff000000 | (rgb[0]<<16) | (rgb[1]<<8) | rgb[2])
    prop(p, 'bool', 'Anchored', True); prop(p, 'bool', 'CanCollide', collide)
    prop(p, 'bool', 'CanTouch', collide); prop(p, 'bool', 'CanQuery', collide)
    prop(p, 'float', 'Transparency', transparency); prop(p, 'token', 'Material', MATERIALS[material])
    if class_name == 'Part': prop(p, 'token', 'shape', shape)
    prop(p, 'token', 'TopSurface', 0); prop(p, 'token', 'BottomSurface', 0)
    manifest.append({'name': name, 'class': class_name, 'size': size, 'position': pos, 'collide': collide, 'transparency': transparency})
    return p
def light(parent, name, rgb, brightness=1, range_=14):
    p = item('PointLight', name, parent); color(p, 'Color', rgb); prop(p, 'float', 'Brightness', brightness); prop(p, 'float', 'Range', range_); prop(p, 'bool', 'Shadows', True)
    return p
def script(parent, class_name, name, filename):
    obj = item(class_name, name, parent); prop(obj, 'ProtectedString', 'Source', (ROOT/'src'/filename).read_text())
    if class_name != 'ModuleScript': prop(obj, 'bool', 'Disabled', False)
    return obj

workspace = item('Workspace', 'Workspace'); prop(workspace, 'bool', 'StreamingEnabled', False); prop(workspace, 'float', 'Gravity', 196.2)
cam = item('Camera', 'Camera', workspace); cframe(cam, 'CFrame', (12,7.8,12), look_at((12,7.8,12), (-5,3.4,-5.5))); cframe(cam, 'Focus', (-5,3.4,-5.5)); prop(cam, 'float', 'FieldOfView', 65); prop(cam, 'token', 'CameraType', 0)
prop(workspace, 'Ref', 'CurrentCamera', cam.attrib['referent'])
world = item('Folder', 'OpeningWorld', workspace)
room = item('Model', 'Bedroom', world); dream = item('Model', 'Dream', world); markers = item('Folder', 'Markers', world)
# Bedroom: a complete, enclosed 36 x 30 room with furniture and a dark closet.
part(room,'Floor',(36,1,30),(0,-.5,0),(57,51,61),'woodplanks')
for i in range(16): part(room, 'FloorSeam'+str(i), (.025,.01,30), (-17+i*2.25,.015,0), (27,28,38), collide=False)
for name,size,pos in [('BackWall',(36,12,1),(0,6,-15)),('LeftWall',(1,12,30),(-18,6,0)),('RightWall',(1,12,30),(18,6,0)),('FrontWall',(36,12,1),(0,6,15)),('Ceiling',(36,1,30),(0,12.5,0))]:
    part(room,name,size,pos,(49,49,66),'concrete')
for x in range(-15,17,3): part(room,'WallpaperStrip'+str(x),(.08,10.5,.06),(x,6,-14.46),(59,55,72),collide=False)
for z in [-14.45,14.45]: part(room,'Skirting'+str(z),(35,.45,.12),(0,.35,z),(91,80,94),'wood',False)
part(room,'Rug',(15,.07,8),(-4,.07,5),(83,77,98),'fabric',False)
part(room,'RugBorder',(14.5,.02,.14),(-4,.115,8.65),(143,128,142),'fabric',False)
part(room,'BedFrame',(7,1,11),(-7,1.35,-5.5),(89,74,93),'wood')
part(room,'Mattress',(6.8,1,10.7),(-7,2.32,-5.5),(168,164,180),'fabric')
part(room,'Headboard',(7.6,5,.55),(-7,2.5,-11.2),(106,86,105),'wood')
for x in [-9.65,-4.35]:
    for z in [-10,.1]: part(room,'BedLeg',(.55,1.1,.55),(x,.6,z),(77,64,84),'wood')
part(room,'Pillow',(3,.55,2.2),(-7,2.97,-8.5),(215,202,191),'fabric',False)
part(room,'Blanket',(6.7,.28,6.5),(-7,2.98,-3.3),(91,108,138),'fabric',False)
for x in [-9.4,-7.8,-6.2,-4.6]: part(room,'BlanketStripe',(.12,.035,6.3),(x,3.145,-3.3),(137,144,164),'fabric',False)
part(room,'Nightstand',(3,2.4,3),(-1.5,1.2,-6),(96,78,98),'wood')
part(room,'Drawer',(2.65,.8,.08),(-1.5,1.65,-4.45),(116,94,116),'wood',False)
part(room,'DrawerHandle',(.5,.12,.1),(-1.5,1.65,-4.36),(193,165,153),'metal',False)
part(room,'LampBase',(1.5,.16,1.5),(-1.5,2.51,-6),(151,132,131),'metal',False)
part(room,'LampStem',(.12,1.3,.12),(-1.5,3.22,-6),(158,141,139),'metal',False)
part(room,'LampShade',(1.8,1.2,1.8),(-1.5,4,-6),(226,199,170),'fabric',False)
bulb=part(room,'LampBulb',(.35,.35,.35),(-1.5,3.8,-6),(255,209,164),'neon',False,shape=0); light(bulb,'WarmLight',(255,193,136),1.7,22)
part(room,'AlarmClock',(1.5,.65,.65),(-1.2,2.78,-4.9),(26,29,45),collide=False)
clockGui=item('SurfaceGui','ClockFace',room.findall('Item')[-1]); prop(clockGui,'token','Face',5); prop(clockGui,'float','PixelsPerStud',90)
clockText=item('TextLabel','Time',clockGui); prop(clockText,'string','Text','00:14'); prop(clockText,'float','BackgroundTransparency',1); color(clockText,'TextColor3',(187,103,121)); prop(clockText,'bool','TextScaled',True)
udim=E.SubElement(clockText.find('Properties'),'UDim2',{'name':'Size'})
for k,v in [('XS',1),('XO',0),('YS',1),('YO',0)]: E.SubElement(udim,k).text=str(v)
part(room,'Desk',(8,.45,3.2),(8,3.25,4),(115,98,118),'wood')
for x in [4.7,11.3]: part(room,'DeskLeg',(.35,3,.35),(x,1.5,4),(74,63,86),'wood')
for i in range(4): part(room,'Book'+str(i),(1.2,.22,1.5),(6.5,3.55+i*.22,4),(91+i*17,95+i*7,131-i*7),collide=False)
part(room,'Paper',(2.4,.03,1.8),(10,3.5,3.8),(207,199,186),collide=False)
part(room,'ChairSeat',(2.5,.3,2.5),(8,1.8,7),(90,85,105),'wood')
part(room,'ChairBack',(2.5,2.6,.3),(8,3.2,8.1),(90,85,105),'wood')
for x in [7,9]:
    for z in [6,8]: part(room,'ChairLeg',(.25,1.7,.25),(x,.85,z),(75,70,92),'wood')
part(room,'WindowFrame',(8,6,.3),(-7,7,-14.35),(110,113,136),'wood',False)
part(room,'NightWindow',(7.4,5.4,.06),(-7,7,-14.12),(20,32,56),'neon',False)
part(room,'WindowBar',(.18,5.4,.1),(-7,7,-14.02),(135,143,165),'metal',False)
part(room,'WindowCrossbar',(7.4,.18,.1),(-7,7,-14.02),(135,143,165),'metal',False)
moon=part(room,'MoonOutside',(.85,.85,.12),(-5.5,8.1,-14.03),(205,211,232),'neon',False,shape=0); light(moon,'Moonlight',(111,149,231),.35,21)
for x in [-11.6,-2.4]: part(room,'Curtain',(1.2,6.7,.75),(x,7,-14),(70,75,105),'fabric',False)
part(room,'ClosetBody',(7,9,4),(11,4.5,-12),(70,61,81),'wood')
part(room,'ClosetVoid',(5.8,7.7,.1),(11,4.6,-9.94),(3,5,12),collide=False)
part(room,'ClosetLeftDoor',(2.1,7.8,.45),(8.9,4.6,-9.6),(105,84,108),'wood',False,rotation=matrix(0,-14,0))
part(room,'ClosetRightDoor',(1.9,7.8,.45),(13.2,4.6,-9.5),(100,81,106),'wood',False,rotation=matrix(0,20,0))
for x in [10.3,11.7]:
    e=part(room,'EyeLeft' if x<11 else 'EyeRight',(.48,.19,.26),(x,5.65,-9.85),(246,43,64),'neon',False,1,shape=0); light(e,'RedGlow',(227,22,46),0,7)
part(room,'PictureFrame',(3.4,4,.2),(4,7,-14.35),(137,110,129),'wood',False)
part(room,'Picture',(2.9,3.5,.1),(4,7,-14.2),(117,133,153),collide=False)
# Floating meadow. The collision route remains stable while decorations distort.
centers=[(0,8,-240),(0,8,-270),(-7,10,-299),(7,11,-327),(18,10,-356),(14,12,-386),(0,12,-414),(0,13,-444)]
for i,(x,y,z) in enumerate(centers,1):
    part(dream,'Platform'+str(i),(24,4,26),(x,y-2,z),(92,116,112),'grass')
    part(dream,'PlatformSoil'+str(i),(22,5,24),(x,y-6.5,z),(65,75,92),'concrete')
    for side in [-1,1]: part(dream,'EdgeLight'+str(i)+str(side),(.12,.08,25),(x+side*11.3,y+.05,z),(171,200,179),'neon',False)
    for j in range(5):
        xx=x-9+j*4.3; zz=z+(-7 if j%2 else 7)
        part(dream,'Distort_Grass'+str(i)+'_'+str(j),(.18,.7,.18),(xx,y+.35,zz),(148,172,151),'grass',False)
        part(dream,'Distort_Flower'+str(i)+'_'+str(j),(.5,.18,.5),(xx,y+.78,zz),(226,177+j*7,162),'neon',False)
    part(markers,'Checkpoint'+str(i),(.5,.5,.5),(x,y+4,z),(255,255,255),collide=False,transparency=1)
for i,(x,y,z) in enumerate(centers):
    tx=x+(-9 if i%2 else 8); tz=z-7
    part(dream,'Distort_TreeTrunk'+str(i),(1,8,1),(tx,y+4,tz),(104,91,107),'wood',False)
    for level in range(3):
        part(dream,'Distort_TreeCrown'+str(i)+'_'+str(level),(7-level*1.6,5,7-level*1.6),(tx,y+7+level*2.1,tz),(76+level*5,111+level*3,118),'grass',False,shape=0)
for i,(x,y,z) in enumerate([centers[1],centers[4],centers[6]],1):
    memory=part(dream,'Memory'+str(i),(1.1,1.1,1.1),(x,y+3.8,z),(255,225,169),'neon',False,shape=0); light(memory,'MemoryGlow',(255,222,169),1.2,16)
for i,(x,y,z) in enumerate([centers[0],centers[3],centers[5]]):
    part(dream,'Distort_LampStem'+str(i),(.16,5,.16),(x+7,y+2.5,z+5),(142,148,166),'metal',False)
    shade=part(dream,'Distort_LampShade'+str(i),(2.8,1.4,2.8),(x+7,y+5.3,z+5),(219,194,180),'fabric',False); light(shade,'StrangeLight',(255,215,176),.55,18)
for i in range(13):
    x=(-1 if i%2 else 1)*(35+i*2.5); z=-235-i*18
    part(dream,'Distort_Cloud'+str(i),(18+i%3*4,3,10),(x,35+i%4*4,z),(195,181,190),'plastic',False,shape=0)
part(dream,'Distort_Sun',(22,22,22),(62,65,-365),(255,234,183),'neon',False,shape=0)
part(dream,'DoorFrame',(6.3,9,.7),(0,17.5,-452),(164,151,163),'wood',False)
part(dream,'DoorVoid',(4.7,7.7,.8),(0,17.3,-451.5),(5,4,12),collide=False)
part(dream,'Distort_Door',(3.5,7.7,.5),(2.1,17.3,-450.1),(123,104,130),'wood',False,rotation=matrix(0,-34,0))
part(dream,'DoorHandle',(.2,.2,.35),(1,17.3,-449.6),(226,192,163),'metal',False,shape=0)
for i,(x,z) in enumerate([(-19,-298),(27,-358),(-17,-415)]):
    part(dream,'Distort_ShadowBody'+str(i),(2.3,6,1.2),(x,15,z),(18,13,28),collide=False)
    part(dream,'Distort_ShadowHead'+str(i),(1.7,1.8,1.5),(x,19,z),(89,68,94),collide=False,shape=0)
# Markers are invisible non-colliding helpers, editable in Studio.
marker_defs={'RoomSpawn':((0,4,8),matrix()),'ActorStart':((5,2.9,7),matrix()),'ActorBedside':((-2.9,2.9,-4),matrix(0,90,0)),'ActorSit':((-4.1,3.75,-4),matrix(0,90,0)),'ActorSleep':((-7,3.25,-5.7),((-1,0,0),(0,0,-1),(0,-1,0))), 'IntroCamera':((12,7.8,12),matrix()),'WakeCamera':((-7,3.8,-7.65),matrix()),'EyeTarget':((11,5.65,-9.85),matrix()),'DreamSpawn':((0,12,-232),matrix()),'DreamExit':((0,16,-446),matrix())}
for name,(pos,rot) in marker_defs.items(): part(markers,name,(.5,.5,.5),pos,(255,255,255),collide=False,transparency=1,rotation=rot)
spawn=part(workspace,'SpawnLocation',(3,.2,3),(0,.15,8),(40,45,65),collide=False,transparency=1,class_name='SpawnLocation'); prop(spawn,'bool','Neutral',True); prop(spawn,'float','Duration',0)
# Replicated local cinematic actor. His face is geometry, with no uploaded asset dependencies.
replicated=item('ReplicatedStorage','ReplicatedStorage'); assets=item('Folder','OpeningAssets',replicated); sleeper=item('Model','Sleeper',assets)
body=[('Root',(2,2,1),(0,0,0),(0,0,0),1),('Torso',(2,2,1),(0,.5,0),(110,134,164),0),('Head',(1.65,1.4,1.3),(0,2.2,0),(221,184,155),0),('Hair',(1.74,.52,1.39),(0,2.78,0),(43,33,44),0),('LeftArm',(.85,2,.9),(-1.45,.45,0),(110,134,164),0),('RightArm',(.85,2,.9),(1.45,.45,0),(110,134,164),0),('LeftLeg',(.9,2.4,.9),(-.55,-1.7,0),(59,74,96),0),('RightLeg',(.9,2.4,.9),(.55,-1.7,0),(59,74,96),0),('LeftHand',(.85,.4,.9),(-1.45,-.7,0),(221,184,155),0),('RightHand',(.85,.4,.9),(1.45,-.7,0),(221,184,155),0),('FaceEyeL',(.13,.13,.055),(-.32,2.28,-.68),(46,34,41),0),('FaceEyeR',(.13,.13,.055),(.32,2.28,-.68),(46,34,41),0),('Mouth',(.35,.065,.045),(0,1.92,-.68),(143,97,94),0)]
actor_root=None
for name,size,pos,rgb,trans in body:
    obj=part(sleeper,name,size,pos,rgb,'fabric' if name in ['Torso','LeftLeg','RightLeg','LeftArm','RightArm'] else 'plastic',False,trans)
    if name=='Root': actor_root=obj
prop(sleeper,'Ref','PrimaryPart',actor_root.attrib['referent'])
remote_folder=item('Folder','OpeningRemotes',replicated); item('RemoteEvent','Action',remote_folder); item('RemoteEvent','Update',remote_folder)
shared=item('Folder','OpeningShared',replicated); script(shared,'ModuleScript','Config','Config.lua'); script(shared,'ModuleScript','State','State.lua')
server=item('ServerScriptService','ServerScriptService'); script(server,'Script','OpeningServer','OpeningServer.server.lua')
starter=item('StarterPlayer','StarterPlayer'); starter_scripts=item('StarterPlayerScripts','StarterPlayerScripts',starter); script(starter_scripts,'LocalScript','OpeningClient','OpeningClient.client.lua')
item('StarterGui','StarterGui'); item('SoundService','SoundService')
lighting=item('Lighting','Lighting'); prop(lighting,'float','ClockTime',.23); prop(lighting,'float','Brightness',1.4); prop(lighting,'float','ExposureCompensation',-.15); color(lighting,'Ambient',(38,42,64)); color(lighting,'OutdoorAmbient',(43,51,77)); color(lighting,'FogColor',(21,27,46)); prop(lighting,'float','FogStart',0); prop(lighting,'float','FogEnd',150); prop(lighting,'bool','GlobalShadows',True)
E.indent(root,space='  ')
out=ROOT/'Opening.rbxlx'; E.ElementTree(root).write(out,encoding='utf-8',xml_declaration=True)
(ROOT/'map-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(f'Built {out.name}: {serial} instances, {len(manifest)} geometry parts, {out.stat().st_size:,} bytes.')
