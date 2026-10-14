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
for n in ['RoomSpawn','ActorStart','ActorBedside','ActorSit','ActorSleep','IntroCamera','WakeCamera','EyeTarget','DreamSpawn','DreamExit']+[f'Checkpoint{i}' for i in range(1,9)]:
    marker=child(markers,n)
    assert marker.find("Properties/bool[@name='CanCollide']").text=='false'
    assert marker.find("Properties/float[@name='Transparency']").text=='1'
for n in ['LampBulb','EyeLeft','EyeRight','Floor','BedFrame','Pillow','ClosetVoid']: child(room,n)
for i in range(1,4): child(dream,'Memory'+str(i))
for i in range(1,9):
    floor=child(dream,'Platform'+str(i)); assert floor.find("Properties/bool[@name='CanCollide']").text=='true'
for p in root.iter('Vector3'):
    values=[float(p.find(axis).text) for axis in 'XYZ']; assert all(math.isfinite(v) for v in values)
    if p.attrib['name']=='size': assert all(v>0 for v in values)
for p in root.iter('CoordinateFrame'):
    for field in ['X','Y','Z']+[f'R{i}{j}' for i in range(3) for j in range(3)]: assert math.isfinite(float(p.find(field).text))
    rows=[[float(p.find(f'R{i}{j}').text) for j in range(3)] for i in range(3)]
    for i in range(3):
        for j in range(3): assert abs(sum(rows[i][k]*rows[j][k] for k in range(3))-(1 if i==j else 0))<1e-6
script_files={'Config':'Config.lua','State':'State.lua','OpeningServer':'OpeningServer.server.lua','OpeningClient':'OpeningClient.client.lua'}
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
code+='''
local s=State.new(0)
assert(not State.enterDream(s,1,Config))
assert(State.begin(s,0)); assert(not State.begin(s,1))
assert(not State.enterDream(s,8,Config)); assert(State.enterDream(s,9,Config))
assert(State.collect(s,1)); assert(not State.collect(s,1)); assert(not State.collect(s,4))
State.tick(s,10,.82,Config); assert(s.corruption>=.82)
local old=s.corruption; State.tick(s,12,.1,Config); assert(s.corruption>=old)
assert(not State.exit(s,13,30)); assert(State.exit(s,13,5))
assert(State.tick(s,15.3,0,Config)=='awake')
assert(State.lamp(s,16)); assert(not State.lamp(s,16.3))
assert(State.tick(s,27,0,Config)=='complete'); assert(s.completed)
assert(State.begin(s,28)); assert(s.corruption==0 and not s.completed and next(s.lights)==nil)
local idle=State.new(0); State.begin(idle,0); State.enterDream(idle,9,Config)
assert(State.tick(idle,116,0,Config)=='blackout')
local other=State.new(0); assert(other.phase=='ready' and not other.lights[1])
'''
run(code,True)
print(f'PASS: {len(items)} instances; references, required paths, transforms, source embedding, four script syntax checks and opening state tests.')
print('Roblox Studio is not available here; engine runtime and visual playtest still require Studio.')
