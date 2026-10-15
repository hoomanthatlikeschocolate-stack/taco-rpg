"""Build an editable, self-contained Roblox XML place from owned geometry and Lua."""
from pathlib import Path
import json, math, xml.etree.ElementTree as E

ROOT = Path(__file__).resolve().parent
root = E.Element('roblox', {
    'xmlns:xmime': 'http://www.w3.org/2005/05/xmlmime',
    'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
    'xsi:noNamespaceSchemaLocation': 'http://www.roblox.com/roblox.xsd',
    'version': '4',
})
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
for name,size,pos in [('BackWall',(36,12,1),(0,6,-15)),('LeftWall',(1,12,30),(-18,6,0)),('RightWall',(1,12,30),(18,6,0)),('FrontLeft',(14.5,12,1),(-10.75,6,15)),('FrontRight',(14.5,12,1),(10.75,6,15)),('DoorHeader',(7,3.5,1),(0,10.25,15)),('Ceiling',(36,1,30),(0,12.5,0))]:
    part(room,name,size,pos,(49,49,66),'concrete')
for x in range(-15,17,3): part(room,'WallpaperStrip'+str(x),(.08,10.5,.06),(x,6,-14.46),(59,55,72),collide=False)
for z in [-14.45,14.45]: part(room,'Skirting'+str(z),(35,.45,.12),(0,.35,z),(91,80,94),'wood',False)
part(room,'Rug',(15,.07,8),(-4,.07,5),(83,77,98),'fabric',False)
part(room,'RugBorder',(14.5,.02,.14),(-4,.115,8.65),(143,128,142),'fabric',False)
part(room,'BedFrame',(7,1,11),(-7,.95,-5.5),(89,74,93),'wood')
part(room,'Mattress',(6.8,1,10.7),(-7,1.65,-5.5),(168,164,180),'fabric')
part(room,'Headboard',(7.6,5,.55),(-7,2.5,-11.2),(106,86,105),'wood')
for x in [-9.65,-4.35]:
    for z in [-10,.1]: part(room,'BedLeg',(.55,1.1,.55),(x,.6,z),(77,64,84),'wood')
part(room,'Pillow',(3,.55,2.2),(-7,2.31,-8.5),(215,202,191),'fabric',False)
part(room,'Blanket',(6.7,.16,2.8),(-7,2.35,-1.45),(91,108,138),'fabric',False)
# A small cloth grid bends at the lifted corner; the far and foot edges stay down.
for i in range(6):
    for j in range(8):
        x=-10.35+(i+.5)*6.7/6; z=-2.85-(j+.5)*4/8
        part(room,f'BlanketPatch{i+1}_{j+1}',(6.7/6+.025,.09,4/8+.025),(x,2.35,z),(91,108,138),'fabric',False)
        part(room,f'BlanketStitch{i+1}_{j+1}',(.045,.018,4/8+.025),(x,2.405,z),(137,144,164),'fabric',False)
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
# A continuous dream sea: the entire playable route is solid and level.
walkable=item('Folder','Walkable',dream)
ground=part(walkable,'PlatformGround',(180,2,330),(0,7,-340),(151,160,187),'plastic')
prop(ground,'float','Reflectance',.12)
part(walkable,'SafetyFloor',(200,2,360),(0,-10,-340),(70,78,100),'plastic',True,1)
for x in [-82,82]: part(walkable,'BoundarySide',(2,38,326),(x,24,-340),(0,0,0),collide=True,transparency=1)
for z in [-187,-493]: part(walkable,'BoundaryEnd',(164,38,2),(0,24,z),(0,0,0),collide=True,transparency=1)
centers=[(0,8,-232),(-8,8,-254),(-15,8,-278),(0,8,-302),(12,8,-330),(2,8,-360),(-12,8,-387),(0,8,-444)]
for i,(x,y,z) in enumerate(centers,1): part(markers,'Checkpoint'+str(i),(.5,.5,.5),(x,y+4,z),(255,255,255),collide=False,transparency=1)
# A pale path and lit edges remain visible through every dream effect.
route=[centers[0],centers[2],centers[4],centers[6],centers[7]]
for segment,(a,b) in enumerate(zip(route,route[1:])):
    distance=math.dist(a,b); steps=math.ceil(distance/4)
    for j in range(steps+1):
        t=j/steps; x=a[0]+(b[0]-a[0])*t; z=a[2]+(b[2]-a[2])*t
        part(dream,'RouteTile'+str(segment)+'_'+str(j),(10,.04,4.4),(x,8.025,z),(197,192,211),'plastic',False)
        for side in [-1,1]: part(dream,'RouteGlow'+str(segment)+'_'+str(j)+'_'+str(side),(.18,.08,1.5),(x+side*5.6,8.11,z),(187,220,230),'neon',False)
        if j%5==0:
            pebble=part(dream,'PathLight'+str(segment)+'_'+str(j),(.42,.25,.6),(x,8.19,z),(223,232,246),'neon',False)
            light(pebble,'GuideLight',(178,205,255),.48,17)
# Low-poly reeds and floating paper fish in an impossible, shallow sea.
for i in range(24):
    x=(-1 if i%2 else 1)*(23+i%4*9); z=-221-i*10
    part(dream,'Distort_Reed'+str(i),(.2,2+i%3,.2),(x,9+i%3*.5,z),(107,135,159),'grass',False)
    fish=part(dream,'Distort_PaperFish'+str(i),(1.7,.08,.65),(x+4,13+i%4,z-3),(210,190+i%3*8,203),'plastic',False,rotation=matrix(0,i*37,12))
    part(dream,'Distort_FishTail'+str(i),(.65,.08,.8),(x+3.15,13+i%4,z-3),(206,189,206),'plastic',False,rotation=matrix(0,i*37,42))
# Memory one: the same bed, floating where a bedroom should not be.
for name,size,pos,rgb in [
    ('Bed',(7,.8,11),(-15,11.4,-281),(101,89,121)),
    ('Mattress',(6.8,.75,10.8),(-15,12.1,-281),(209,203,219)),
    ('Pillow',(3,.5,2.2),(-15,12.7,-285),(232,224,220)),
    ('Blanket',(6.7,.2,6.3),(-15,12.6,-278.8),(113,130,162)),
]:
    part(dream,'Distort_Floating'+name,size,pos,rgb,'fabric',False)
# A clock that ticks backwards above a ring of chairs.
clock_pivot=(12,19,-334)
part(markers,'ClockPivot',(.2,.2,.2),clock_pivot,collide=False,transparency=1)
part(dream,'ClockFace',(.7,9,9),clock_pivot,(215,208,218),'plastic',False,rotation=matrix(0,90,0),shape=2)
part(dream,'ClockHour',(.22,2.9,.16),(12,20.45,-333.55),(90,73,107),'metal',False)
part(dream,'ClockMinute',(.13,4,.17),(12,21,-333.45),(90,73,107),'metal',False)
for i in range(12):
    q=i*math.pi/6
    part(dream,'ClockMark'+str(i),(.19,.6,.12),(12+math.sin(q)*3.6,19+math.cos(q)*3.6,-333.48),(113,90,119),collide=False,rotation=matrix(0,0,-i*30))
for i in range(7):
    q=i*math.pi*2/7; x=12+math.sin(q)*13; z=-330+math.cos(q)*10
    part(dream,'Distort_ChairSeat'+str(i),(2.2,.25,2.2),(x,10+i*.2,z),(137,121,149),'wood',False)
    part(dream,'Distort_ChairBack'+str(i),(2.2,2.8,.25),(x,11.5+i*.2,z+1),(137,121,149),'wood',False)
# A small door leads to a hallway that cannot fit behind it.
def door(x,z,height=9,width=5,prefix='Door',parent=dream,y=8,rgb=(189,174,197)):
    for side in [-1,1]: part(parent,prefix+'Jamb'+str(side),(.45,height,.6),(x+side*width*.5,y+height*.5,z),rgb,'wood',False)
    part(parent,prefix+'Lintel',(width+.5,.5,.6),(x,y+height,z),rgb,'wood',False)
    part(parent,prefix+'Void',(width-.4,height-.3,.15),(x,y+height*.5,z-.2),(9,10,22),collide=False)
    part(parent,'Distort_'+prefix+'Leaf',(width*.72,height-.5,.45),(x+width*.38,y+height*.5,z+1),rgb,'wood',False,rotation=matrix(0,-48,0))
door(-12,-387,8,4,'SmallDoor')
hall=item('Model','ImpossibleHallway',dream)
part(hall,'HallFloor',(16,.05,28),(-38,8.04,-391),(208,193,207),'fabric',False)
for x in [-46,-30]: part(hall,'HallWall',(1,15,29),(x,15.5,-391),(178,167,189),'concrete',False)
part(hall,'HallCeiling',(17,.5,29),(-38,23,-391),(174,166,187),'concrete',False)
for z in [-381,-388,-395,-402]:
    lamp=part(hall,'HallLight',(2,.1,.8),(-38,22.5,z),(239,213,189),'neon',False)
    light(lamp,'HallGlow',(221,200,232),.5,20)
door(-38,-405,9,5,'HallReturn',hall)
# Enormous everyday objects, hanging furniture and a staircase to nowhere.
for i in range(8):
    part(dream,'Distort_EmptyStair'+str(i),(12,.7,3),(43,10+i*2.5,-280-i*3.5),(204-i*3,184,203),'plastic',False)
for i in range(9):
    x=(-1 if i%2 else 1)*(37+i%3*11); z=-232-i*25
    part(dream,'Distort_Cloud'+str(i),(24+i%3*7,3,14),(x,41+i%4*5,z),(211,195,213),'plastic',False,shape=0)
    part(dream,'Distort_LampStem'+str(i),(.16,5,.16),(x,12,z),(167,149,181),'metal',False)
    shade=part(dream,'Distort_LampShade'+str(i),(3,1.8,3),(x,15,z),(233,209,203),'fabric',False)
    light(shade,'StrangeLight',(236,205,231),.45,19)
part(dream,'Distort_Moon',(28,28,28),(54,66,-378),(239,228,211),'neon',False,shape=0)
door(39,-423,32,18,'GiantDoor',y=8,rgb=(174,157,190))
# An inverted miniature bedroom suspended over the water.
part(dream,'Distort_InvertedFloor',(16,.7,15),(-34,39,-305),(153,139,162),'wood',False)
part(dream,'Distort_InvertedBed',(5,1,8),(-35,36.7,-305),(139,152,179),'fabric',False)
part(dream,'Distort_InvertedPillow',(2,.5,1.5),(-35,35.9,-302.3),(230,218,213),'fabric',False)
part(dream,'Distort_InvertedRug',(9,.06,5),(-32,38.57,-310),(188,156,186),'fabric',False)
for i,(x,z) in enumerate([(-35,-310),(30,-365),(-28,-435)]):
    part(dream,'Distort_ShadowBody'+str(i),(2.3,6,1.2),(x,12,z),(27,22,42),collide=False)
    part(dream,'Distort_ShadowHead'+str(i),(1.7,1.8,1.5),(x,16,z),(129,112,140),collide=False,shape=0)
door(0,-452,10,6,'FrontDoor',y=8,rgb=(207,198,215))
def prompt_part(name,pos,action_text,object_text):
    p=part(dream,name,(.5,.5,.5),pos,collide=False,transparency=1)
    prompt=item('ProximityPrompt','Remember',p)
    prop(prompt,'string','ActionText',action_text); prop(prompt,'string','ObjectText',object_text)
    prop(prompt,'float','HoldDuration',.25); prop(prompt,'float','MaxActivationDistance',11)
    prop(prompt,'bool','RequiresLineOfSight',False); prop(prompt,'token','KeyboardKeyCode',101); prop(prompt,'token','GamepadKeyCode',1002)
    return p
for i,(pos,act,title) in enumerate([
    ((-15,11,-276),'Touch blanket','Your bed, without a bedroom'),
    ((12,11,-328),'Touch the clock','A clock running backwards'),
    ((-12,11,-386),'Open','An ordinary little door'),
],1):
    prompt_part('Interaction'+str(i),pos,act,title)
    memory=part(dream,'Memory'+str(i),(.55,.55,.55),(pos[0],12.8,pos[2]),(221,224,252),'neon',False,shape=0); light(memory,'MemoryGlow',(197,208,255),.55,14)
prompt_part('HallwayReturn',(-38,11,-404),'Step through','The door behind you')
prompt_part('ExitPrompt',(0,11,-446),'Listen','A door with no other side')
# Additional gentle dream interactions; none advances the waking timer.
part(dream,'Float_PhoneTable',(4,.35,3),(7,10.2,-245),(181,149,180),'wood',False)
part(dream,'Float_Phone',(1.8,.5,1.1),(7,10.7,-245),(228,179,176),collide=False)
part(dream,'Float_Receiver',(2.3,.22,.45),(7,11.12,-245),(216,151,162),collide=False)
prompt_part('Interaction4',(7,11,-243),'Answer','A phone that remembers you')
part(dream,'Float_Teacup',(4,3.5,4),(-20,10,-302),(224,197,176),'plastic',False,shape=2)
for i in range(12):
    q=i*math.pi/6
    part(dream,'Float_TeaStar'+str(i),(.25,.25,.25),(-20+math.cos(q)*4,14+i%3,-302+math.sin(q)*4),(236,222,176),'neon',False,shape=0)
prompt_part('Interaction5',(-18,11,-299),'Stir the sky','A cup full of stars')
for i in range(18):
    x=-7+i%6*2.8; z=-350-i//6*5
    part(dream,'Float_Lantern'+str(i),(.7,1.05,.7),(x,16+i%4,z),(233,190+i%3*15,162),'neon',False)
    for j in range(2): part(dream,'Float_Rain'+str(i*2+j),(.05,.45,.05),(x+3*j,9+i%7,z-j*2),(201,228,237),'neon',False)
prompt_part('Interaction6',(1,11,-351),'Release a lantern','Make a wish')
for x,z in [(-18,-242),(18,-287),(-5,-316)]:
    part(dream,'Float_Book',(2.4,.12,1.7),(x,14,z),(240,215,187),'fabric',False,rotation=matrix(0,22,-15))
    part(dream,'Float_BookWing',(2.4,.12,1.7),(x+2.2,14,z),(240,215,187),'fabric',False,rotation=matrix(0,22,15))
from build_day import build_day
build_day(globals())
from build_details import build_details
build_details(globals())

# Markers are invisible non-colliding helpers, editable in Studio.
marker_defs={'RoomSpawn':((0,4,8),matrix()),'ActorStart':((0,3.18,9),matrix()),'ActorWalk1':((0,3.18,3),matrix()),'ActorWalk2':((-1.25,3.18,.8),matrix(0,38,0)),'ActorBedside':((-1.25,3.18,-2.3),matrix(0,90,0)),'ActorSit':((-3.95,3.1,-2.2),matrix(0,-90,0)),'ActorSleep':((-7,2.85,-5.3),((-1,0,0),(0,0,-1),(0,-1,0))), 'IntroCamera':((12,7.8,12),matrix()),'WakeCamera':((-6.4,3.8,-7.55),matrix()),'EyeTarget':(closet_target,matrix()),'DreamSpawn':((0,12,-232),matrix()),'DreamExit':((0,12,-446),matrix()),'HallwaySpawn':((-38,12,-381),matrix()),'PortalReturn':((-12,12,-395),matrix())}
for name,(pos,rot) in marker_defs.items(): part(markers,name,(.5,.5,.5),pos,(255,255,255),collide=False,transparency=1,rotation=rot)
spawn=part(workspace,'SpawnLocation',(3,.2,3),(0,.15,8),(40,45,65),collide=False,transparency=1,class_name='SpawnLocation'); prop(spawn,'bool','Neutral',True); prop(spawn,'float','Duration',0)
# Replicated local cinematic actor. His face is geometry, with no uploaded asset dependencies.
replicated=item('ReplicatedStorage','ReplicatedStorage'); assets=item('Folder','OpeningAssets',replicated); sleeper=item('Model','Sleeper',assets)
body=[('Root',(2,2,1),(0,0,0),(0,0,0),1),('Torso',(2,2,1),(0,.5,0),(110,134,164),0),('Head',(1.65,1.4,1.3),(0,2.2,0),(221,184,155),0),('Hair',(1.74,.52,1.39),(0,2.78,0),(43,33,44),0),('LeftArm',(.85,1.1,.9),(-1.36,.6,0),(110,134,164),0),('RightArm',(.85,1.1,.9),(1.36,.6,0),(110,134,164),0),('LeftLeg',(.9,1.15,.9),(-.55,-1.075,0),(59,74,96),0),('RightLeg',(.9,1.15,.9),(.55,-1.075,0),(59,74,96),0),('LeftHand',(.85,.4,.9),(-1.45,-.7,0),(221,184,155),0),('RightHand',(.85,.4,.9),(1.45,-.7,0),(221,184,155),0),('FaceEyeL',(.13,.13,.055),(-.32,2.28,-.68),(46,34,41),0),('FaceEyeR',(.13,.13,.055),(.32,2.28,-.68),(46,34,41),0),('Mouth',(.35,.065,.045),(0,1.92,-.68),(143,97,94),0)]
body += [
    ('LeftLowerLeg',(.82,1.25,.83),(-.55,-2.275,0),(59,74,96),0),
    ('RightLowerLeg',(.82,1.25,.83),(.55,-2.275,0),(59,74,96),0),
    ('LeftFoot',(.94,.28,1.2),(-.55,-3.04,-.12),(210,211,218),0),
    ('RightFoot',(.94,.28,1.2),(.55,-3.04,-.12),(210,211,218),0),
    ('LeftForearm',(.72,.84,.8),(-1.36,-.37,0),(110,134,164),0),
    ('RightForearm',(.72,.84,.8),(1.36,-.37,0),(110,134,164),0),
]
actor_root=None
for name,size,pos,rgb,trans in body:
    obj=part(sleeper,name,size,pos,rgb,'fabric' if name in ['Torso','LeftLeg','RightLeg','LeftArm','RightArm'] else 'plastic',False,trans)
    if name=='Root': actor_root=obj
prop(sleeper,'Ref','PrimaryPart',actor_root.attrib['referent'])
remote_folder=item('Folder','OpeningRemotes',replicated); item('RemoteEvent','Action',remote_folder); item('RemoteEvent','Update',remote_folder)
shared=item('Folder','OpeningShared',replicated)
for name in ['Config','State','Navigation','Driving','ActorAnimator','Music','Cloth','DreamMotion']: script(shared,'ModuleScript',name,name+'.lua')
server=item('ServerScriptService','ServerScriptService'); script(server,'Script','OpeningServer','OpeningServer.server.lua')
players=item('Players','Players'); prop(players,'bool','CharacterAutoLoads',False)
# Main client also lives in ReplicatedFirst so Ready can spawn the avatar after UI exists.
first=item('ReplicatedFirst','ReplicatedFirst'); script(first,'LocalScript','Loading','Loading.client.lua'); script(first,'LocalScript','OpeningClient','OpeningClient.client.lua')
starter=item('StarterPlayer','StarterPlayer'); item('StarterPlayerScripts','StarterPlayerScripts',starter)
item('StarterGui','StarterGui'); item('SoundService','SoundService')
lighting=item('Lighting','Lighting'); prop(lighting,'float','ClockTime',.23); prop(lighting,'float','Brightness',1.4); prop(lighting,'float','ExposureCompensation',-.15); color(lighting,'Ambient',(38,42,64)); color(lighting,'OutdoorAmbient',(43,51,77)); color(lighting,'FogColor',(21,27,46)); prop(lighting,'float','FogStart',0); prop(lighting,'float','FogEnd',150); prop(lighting,'bool','GlobalShadows',True)
# Compact XML keeps the Studio download small; editable source remains in src/.
# Roblox's native reader requires explicit closing tags, even for empty strings.
out=ROOT/'Opening.rbxlx'; E.ElementTree(root).write(out,encoding='utf-8',xml_declaration=False,short_empty_elements=False)
(ROOT/'map-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(f'Built {out.name}: {serial} instances, {len(manifest)} geometry parts, {out.stat().st_size:,} bytes.')
