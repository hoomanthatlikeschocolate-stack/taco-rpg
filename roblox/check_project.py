"""Validate geometry/XML and compile our Lua-compatible Luau syntax without claiming Studio execution."""
from pathlib import Path
import ctypes, ctypes.util, math, xml.etree.ElementTree as E
ROOT = Path(__file__).resolve().parent
tree = E.parse(ROOT/'Opening.rbxlx'); root = tree.getroot()
assert root.tag == 'roblox' and root.attrib['version'] == '4'
items = list(root.iter('Item')); refs = {obj.attrib['referent']:obj for obj in items}
assert len(refs) == len(items), 'Duplicate referents'
for prop in root.iter('Ref'): assert prop.text in refs or prop.text in ('null','nil'), f'Unresolved reference {prop.text}'
def name(obj): return obj.find("Properties/string[@name='Name']").text
def child(obj, child_name):
    return next(item for item in obj.findall('Item') if name(item) == child_name)
workspace = next(item for item in root.findall('Item') if item.attrib['class']=='Workspace')
world=child(workspace,'OpeningWorld'); markers=child(world,'Markers'); room=child(world,'Bedroom'); dream=child(world,'Dream')
for n in ['RoomSpawn','ActorStart','ActorBedside','ActorSit','ActorSleep','IntroCamera','WakeCamera','EyeTarget','DreamSpawn','DreamExit','HallwaySpawn','PortalReturn','ClockPivot']+[f'Checkpoint{i}' for i in range(1,9)]:
    marker=child(markers,n)
    assert marker.find("Properties/bool[@name='CanCollide']").text=='false'
    assert marker.find("Properties/float[@name='Transparency']").text=='1'
for n in ['LampBulb','EyeLeft','EyeRight','Floor','BedFrame','Pillow','ClosetVoid']: child(room,n)
for i in range(1,4): child(dream,'Memory'+str(i))
walkable=child(dream,'Walkable'); floor=child(walkable,'PlatformGround')
assert floor.find("Properties/bool[@name='CanCollide']").text=='true'
floor_cf=floor.find("Properties/CoordinateFrame[@name='CFrame']"); size=floor.find("Properties/Vector3[@name='size']")
floor_pos=[float(floor_cf.find(k).text) for k in 'XYZ']; floor_size=[float(size.find(k).text) for k in 'XYZ']
assert abs(floor_pos[1]+floor_size[1]/2-8)<.001
for obj in markers.findall('Item'):
    if name(obj).startswith('Checkpoint') or name(obj) in ['DreamSpawn','DreamExit','HallwaySpawn','PortalReturn']:
        cf=obj.find("Properties/CoordinateFrame[@name='CFrame']"); pos=[float(cf.find(k).text) for k in 'XYZ']
        assert abs(pos[0]-floor_pos[0])<floor_size[0]/2-4 and abs(pos[2]-floor_pos[2])<floor_size[2]/2-4, 'Recovery marker outside solid floor'
# Sample the entire route, not just endpoints: every step must have the same solid ground.
route=[child(markers,'Checkpoint'+str(i)) for i in range(1,9)]
for a,b in zip(route,route[1:]):
    def xyz(obj): return [float(obj.find("Properties/CoordinateFrame[@name='CFrame']/"+k).text) for k in 'XYZ']
    aa,bb=xyz(a),xyz(b)
    for n in range(101):
        p=[aa[k]+(bb[k]-aa[k])*n/100 for k in range(3)]
        assert abs(p[0]-floor_pos[0])<floor_size[0]/2 and abs(p[2]-floor_pos[2])<floor_size[2]/2
for n in ['Interaction1','Interaction2','Interaction3','HallwayReturn','ExitPrompt']:
    prompt=child(child(dream,n),'Remember'); assert prompt.attrib['class']=='ProximityPrompt'
    assert prompt.find("Properties/bool[@name='RequiresLineOfSight']").text=='false'
for p in root.iter('Vector3'):
    values=[float(p.find(axis).text) for axis in 'XYZ']; assert all(math.isfinite(v) for v in values)
    if p.attrib['name']=='size': assert all(v>0 for v in values)
for p in root.iter('CoordinateFrame'):
    for field in ['X','Y','Z']+[f'R{i}{j}' for i in range(3) for j in range(3)]: assert math.isfinite(float(p.find(field).text))
    rows=[[float(p.find(f'R{i}{j}').text) for j in range(3)] for i in range(3)]
    for i in range(3):
        for j in range(3): assert abs(sum(rows[i][k]*rows[j][k] for k in range(3))-(1 if i==j else 0))<1e-6
script_files={'Config':'Config.lua','State':'State.lua','Navigation':'Navigation.lua','ActorAnimator':'ActorAnimator.lua','Music':'Music.lua','OpeningServer':'OpeningServer.server.lua','OpeningClient':'OpeningClient.client.lua'}
for obj in items:
    if obj.attrib['class'] in ['Script','LocalScript','ModuleScript']:
        source=obj.find("Properties/ProtectedString[@name='Source']").text
        assert source==(ROOT/'src'/script_files[name(obj)]).read_text()
        assert 'loadstring(' not in source and 'HttpGet' not in source
library=ctypes.util.find_library('lua5.4')
if not library: raise SystemExit('Lua-compatible syntax compiler unavailable. XML checks passed.')
lua=ctypes.CDLL(library)
lua.luaL_newstate.restype=ctypes.c_void_p; lua.lua_close.argtypes=[ctypes.c_void_p]
lua.luaL_openlibs.argtypes=[ctypes.c_void_p]
lua.luaL_loadbufferx.argtypes=[ctypes.c_void_p,ctypes.c_char_p,ctypes.c_size_t,ctypes.c_char_p,ctypes.c_char_p]; lua.luaL_loadbufferx.restype=ctypes.c_int
lua.lua_tolstring.argtypes=[ctypes.c_void_p,ctypes.c_int,ctypes.POINTER(ctypes.c_size_t)]; lua.lua_tolstring.restype=ctypes.c_char_p
lua.lua_pcallk.argtypes=[ctypes.c_void_p,ctypes.c_int,ctypes.c_int,ctypes.c_int,ctypes.c_longlong,ctypes.c_void_p]; lua.lua_pcallk.restype=ctypes.c_int
def run(code, execute=False):
    state=lua.luaL_newstate(); lua.luaL_openlibs(state); b=code.encode()
    err=lua.luaL_loadbufferx(state,b,len(b),b'check',None)
    if not err and execute: err=lua.lua_pcallk(state,0,0,0,0,None)
    message=lua.lua_tolstring(state,-1,None).decode() if err else ''
    lua.lua_close(state); assert not err, message
for path in sorted((ROOT/'src').glob('*.lua')): run(path.read_text())
code='local Config=(function()\n'+(ROOT/'src/Config.lua').read_text()+'\nend)()\nlocal State=(function()\n'+(ROOT/'src/State.lua').read_text()+'\nend)()\n'
code+='local Navigation=(function()\n'+(ROOT/'src/Navigation.lua').read_text()+'\nend)()\n'
code+='''
local s=State.new(0)
assert(not State.enterDream(s,1,Config))
assert(State.begin(s,0)); assert(not State.begin(s,1))
assert(not State.enterDream(s,8,Config)); assert(State.enterDream(s,9,Config))
assert(State.collect(s,1)); assert(not State.collect(s,1)); assert(not State.collect(s,4))
State.tick(s,10,.82,Config); assert(s.corruption>=.45 and s.corruption<=Config.NavigationCorruptionCap)
local old=s.corruption; State.tick(s,12,.1,Config); assert(s.corruption>=old)
assert(not State.exit(s,13,30)); assert(State.exit(s,13,5))
assert(State.tick(s,15.3,0,Config)=='awake')
assert(State.lamp(s,16)); assert(not State.lamp(s,16.3))
assert(State.tick(s,27,0,Config)=='complete'); assert(s.completed)
assert(State.begin(s,28)); assert(s.corruption==0 and not s.completed and next(s.lights)==nil)
local idle=State.new(0); State.begin(idle,0); State.enterDream(idle,9,Config)
assert(State.tick(idle,116,0,Config)==nil and idle.phase=='dream')
assert(idle.corruption<=Config.NavigationCorruptionCap)
assert(State.tick(idle,260,0,Config)=='blackout')
local other=State.new(0); assert(other.phase=='ready' and not other.lights[1])
local recover=State.new(0); State.begin(recover,0); State.enterDream(recover,9,Config)
recover.lights[1]=true; recover.checkpoint=5; recover.corruption=.6
assert(State.recover(recover,12,Config)); assert(not State.recover(recover,12.1,Config))
assert(State.recover(recover,13.1,Config)); assert(recover.lights[1] and recover.checkpoint==5 and recover.corruption==.6)
assert(Navigation.clearance(0,2,2)>=3.8) -- R6, including its legs
assert(Navigation.clearance(2,2,0)>=3.8) -- normal R15
assert(Navigation.clearance(5,4,0)>7) -- a scaled avatar
assert(Navigation.needsRecovery(0,2,-330,8)); assert(not Navigation.needsRecovery(0,11.8,-330,8))
assert(Navigation.checkpoint(5,2)==5)
for _,progress in ipairs({0,.5,1,0,1}) do State.tick(recover,30,progress,Config); assert(recover.corruption<=.65 and recover.phase=='dream') end
assert(Config.Sounds.Room~='' and Config.Sounds.Dream~='' and Config.Sounds.Drone~='' and Config.Sounds.Wake~='')
'''
run(code,True)
prefix='local Config=(function()\n'+(ROOT/'src/Config.lua').read_text()+'\nend)()\nlocal State=(function()\n'+(ROOT/'src/State.lua').read_text()+'\nend)()\nlocal Navigation=(function()\n'+(ROOT/'src/Navigation.lua').read_text()+'\nend)()\n'
server_test=(ROOT/'tests/server_recovery.lua').read_text().replace('__SERVER_CODE__',(ROOT/'src/OpeningServer.server.lua').read_text())
run(prefix+server_test,True)
print(f'PASS: {len(items)} instances; connected walking route, safe recovery markers, references, transforms, source embedding, seven script syntax checks and opening/recovery state tests.')
print('PASS: executed actual server recovery, velocity clearing, checkpoint retention, manual return and non-teleporting Ready queries with service substitutes.')
print('Roblox Studio is not available here; engine runtime, animation and audio playtest still require Studio.')
