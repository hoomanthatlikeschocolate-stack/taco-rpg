"""Geometry, embedded-source, real state/driver and substituted-service server checks."""
from pathlib import Path
import ctypes, ctypes.util, math, re, xml.etree.ElementTree as E
ROOT=Path(__file__).resolve().parent
serialized=(ROOT/'Opening.rbxlx').read_bytes()
assert serialized.startswith(b'<roblox '), 'Roblox XML must start with its root element'
assert not re.search(rb'<[^<>]+/>',serialized), 'Use explicit closing tags for the Roblox XML reader'
root=E.parse(ROOT/'Opening.rbxlx').getroot()
assert root.tag=='roblox' and root.attrib['version']=='4'
items=list(root.iter('Item')); refs={o.attrib['referent']:o for o in items}
assert len(refs)==len(items)
for p in root.iter('Ref'): assert p.text in refs or p.text in ('null','nil')
def name(o): return o.find("Properties/string[@name='Name']").text
def child(o,n): return next(p for p in o.findall('Item') if name(p)==n)
def xyz(o): return [float(o.find("Properties/CoordinateFrame[@name='CFrame']/"+k).text) for k in 'XYZ']
def size(o): return [float(o.find("Properties/Vector3[@name='size']/"+k).text) for k in 'XYZ']
def val(o,kind,n): return o.find("Properties/"+kind+"[@name='"+n+"']").text
workspace=next(o for o in root.findall('Item') if o.attrib['class']=='Workspace')
world=child(workspace,'OpeningWorld')
markers,room,dream,day=[child(world,n) for n in ['Markers','Bedroom','Dream','Day']]
required=['RoomSpawn','ActorStart','ActorWalk1','ActorWalk2','ActorBedside','ActorSit','ActorSleep','IntroCamera','WakeCamera',
    'EyeTarget','DreamSpawn','DreamExit','HallwaySpawn','PortalReturn','ClockPivot','MorningSpawn','ActorCouch','ActorCouchApproach',
    'CouchStand','TVView','CarHome','CarWork','HomeArrival','WorkArrival','WorkEntry']+[f'Checkpoint{i}' for i in range(1,9)]
for n in required:
    marker=child(markers,n); assert val(marker,'bool','CanCollide')=='false' and val(marker,'float','Transparency')=='1'
for n in ['LampBulb','EyeLeft','EyeRight','Floor','BedFrame','Pillow','ClosetVoid','TVScreen','CouchBase','CeilingLight']: child(room,n)
for i in range(1,11): assert child(child(dream,'Interaction'+str(i)),'Remember').attrib['class']=='ProximityPrompt'
for i in range(1,7):
    for j in range(1,9): child(room,f'BlanketPatch{i}_{j}');child(room,f'BlanketStitch{i}_{j}')
assert xyz(child(markers,'TVView'))[2]<xyz(child(markers,'ActorCouch'))[2]-.65,'TV camera must be in front of the head'
floor=child(child(dream,'Walkable'),'PlatformGround')
assert val(floor,'bool','CanCollide')=='true'
fp,fs=xyz(floor),size(floor); assert abs(fp[1]+fs[1]/2-8)<.001
for marker in markers.findall('Item'):
    if name(marker).startswith('Checkpoint') or name(marker) in ['DreamSpawn','DreamExit','HallwaySpawn','PortalReturn']:
        p=xyz(marker); assert abs(p[0]-fp[0])<fs[0]/2-4 and abs(p[2]-fp[2])<fs[2]/2-4
route=[xyz(child(markers,'Checkpoint'+str(i))) for i in range(1,9)]
for a,b in zip(route,route[1:]):
    for i in range(101):
        p=[a[k]+(b[k]-a[k])*i/100 for k in range(3)]
        assert abs(p[0]-fp[0])<fs[0]/2 and abs(p[2]-fp[2])<fs[2]/2
# Swept footprint of the walking actor must clear bedroom furniture.
path=[xyz(child(markers,n)) for n in ['ActorStart','ActorWalk1','ActorWalk2','ActorBedside']]
for a,b in zip(path,path[1:]):
    for j in range(101):
        x,z=a[0]+(b[0]-a[0])*j/100,a[2]+(b[2]-a[2])*j/100
        for obj in room.findall('Item'):
            if obj.attrib['class']!='Part' or val(obj,'bool','CanCollide')!='true' or name(obj)=='Floor': continue
            p,s=xyz(obj),size(obj)
            if p[1]-s[1]/2>6.4: continue
            dx=max(abs(x-p[0])-s[0]/2,0); dz=max(abs(z-p[2])-s[2]/2,0)
            assert dx*dx+dz*dz>1.85**2, 'Actor walking route intersects '+name(obj)
kitchen=child(day,'Kitchen'); street=child(day,'Street'); work=child(day,'Restaurant')
for n in ['Floor','Fridge','FridgeDoor','Toaster','BreakfastPlate']: child(kitchen,n)
for n in ['Floor','Counter','Grill','Fryer','DrinkMachine','TrashCan','Customer','Coworker']: child(work,n)
for n in ['HomeCar','WorkCar']: assert val(child(day,n),'Ref','PrimaryPart') in refs
interactions=child(day,'Interactions')
for n in ['tv','fridge','toaster','eat','carHome','carWork','order','burger','fries','drink','serve','counter','trash','bed','coworker']:
    assert child(child(interactions,n),'Use').attrib['class']=='ProximityPrompt'
# The bedroom, kitchen, front path, street and destination sidewalk all overlap.
assert xyz(child(room,'Floor'))[2]+size(child(room,'Floor'))[2]/2==15
assert xyz(child(kitchen,'Floor'))[2]-size(child(kitchen,'Floor'))[2]/2==15
assert xyz(child(kitchen,'Floor'))[2]+size(child(kitchen,'Floor'))[2]/2==43
assert xyz(child(street,'FrontPath'))[2]-size(child(street,'FrontPath'))[2]/2<=43
road=child(street,'Road'); rp,rs=xyz(road),size(road)
for n in ['CarHome','CarWork']:
    p=xyz(child(markers,n)); assert abs(p[0]-rp[0])<rs[0]/2-3 and abs(p[2]-rp[2])<rs[2]/2-5
# Door openings are at least seven studs wide. Furniture never blocks the shared aisle.
assert size(child(room,'DoorHeader'))[0]>=7 and size(child(kitchen,'DoorHeader'))[0]>=7
for p in root.iter('Vector3'):
    values=[float(p.find(k).text) for k in 'XYZ']; assert all(math.isfinite(v) for v in values)
    if p.attrib['name']=='size': assert all(v>0 for v in values)
for p in root.iter('CoordinateFrame'):
    values=[float(p.find(k).text) for k in ['X','Y','Z']+[f'R{i}{j}' for i in range(3) for j in range(3)]]
    assert all(math.isfinite(v) for v in values)
    rows=[[float(p.find(f'R{i}{j}').text) for j in range(3)] for i in range(3)]
    for i in range(3):
        for j in range(3): assert abs(sum(rows[i][k]*rows[j][k] for k in range(3))-(i==j))<1e-6
script_files={n:n+'.lua' for n in ['Config','State','Navigation','Driving','ActorAnimator','Music','Cloth','DreamMotion']}
script_files.update(OpeningServer='OpeningServer.server.lua',OpeningClient='OpeningClient.client.lua',Loading='Loading.client.lua')
for o in items:
    if o.attrib['class'] in ['Script','LocalScript','ModuleScript']:
        source=val(o,'ProtectedString','Source')
        assert source==(ROOT/'src'/script_files[name(o)]).read_text()
        assert 'loadstring(' not in source and 'HttpGet' not in source
players=next(o for o in root.findall('Item') if o.attrib['class']=='Players')
assert val(players,'bool','CharacterAutoLoads')=='false'
first=next(o for o in root.findall('Item') if o.attrib['class']=='ReplicatedFirst')
child(first,'Loading'); child(first,'OpeningClient')
library=ctypes.util.find_library('lua5.4')
assert library,'Lua-compatible syntax checker unavailable'
lua=ctypes.CDLL(library)
lua.luaL_newstate.restype=ctypes.c_void_p; lua.lua_close.argtypes=[ctypes.c_void_p]
lua.luaL_openlibs.argtypes=[ctypes.c_void_p]
lua.luaL_loadbufferx.argtypes=[ctypes.c_void_p,ctypes.c_char_p,ctypes.c_size_t,ctypes.c_char_p,ctypes.c_char_p]; lua.luaL_loadbufferx.restype=ctypes.c_int
lua.lua_tolstring.argtypes=[ctypes.c_void_p,ctypes.c_int,ctypes.POINTER(ctypes.c_size_t)]; lua.lua_tolstring.restype=ctypes.c_char_p
lua.lua_pcallk.argtypes=[ctypes.c_void_p,ctypes.c_int,ctypes.c_int,ctypes.c_int,ctypes.c_longlong,ctypes.c_void_p]; lua.lua_pcallk.restype=ctypes.c_int
def run(code,execute=False):
    state=lua.luaL_newstate(); lua.luaL_openlibs(state); b=code.encode()
    err=lua.luaL_loadbufferx(state,b,len(b),b'check',None)
    if not err and execute: err=lua.lua_pcallk(state,0,0,0,0,None)
    message=lua.lua_tolstring(state,-1,None).decode() if err else ''
    lua.lua_close(state); assert not err,message
for f in sorted((ROOT/'src').glob('*.lua')): run(f.read_text())
prefix=''.join('local '+n+'=(function()\n'+(ROOT/'src'/script_files[n]).read_text()+'\nend)()\n' for n in ['Config','State','Navigation','Driving','Cloth','DreamMotion'])
run(prefix+(ROOT/'tests/state_day.lua').read_text(),True)
run(prefix+(ROOT/'tests/server_recovery.lua').read_text().replace('__SERVER_CODE__',(ROOT/'src/OpeningServer.server.lua').read_text()),True)
print(f'PASS: {len(items)} instances; XML, references, embedded sources and eleven Lua syntax checks.')
print('PASS: furniture clearance, ten dream interactions, flexible cloth, clear TV view, connected ground and complete day map.')
print('PASS: strict 45-second quiet period, automatic wake, lamp timing, breakfast, all orders, cleanup, both drives and second bedtime.')
print('PASS: actual server with service substitutes: intro handshake, checkpoint recovery, velocity clearing, gated quests and complete playable day.')
print('Roblox Studio is unavailable here. Native rendering, animation, input and audio still require an engine playtest.')
