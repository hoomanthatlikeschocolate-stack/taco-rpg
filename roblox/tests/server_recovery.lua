-- Runs the actual server script with minimal Roblox service substitutes.
-- It covers the reported teleport/falling regression, not a second copy of the server logic.
local now=0
os.clock=function() return now end
local vmeta={}
vmeta.__index=function(v,key)
    if key=='Magnitude' then return math.sqrt(v.X*v.X+v.Y*v.Y+v.Z*v.Z) end
    return rawget(v,key)
end
local function v(x,y,z) return setmetatable({X=x,Y=y,Z=z},vmeta) end
vmeta.__add=function(a,b) return v(a.X+b.X,a.Y+b.Y,a.Z+b.Z) end
vmeta.__sub=function(a,b) return v(a.X-b.X,a.Y-b.Y,a.Z-b.Z) end
Vector3={new=v,zero=v(0,0,0)}
local cfmeta={}
cfmeta.__index=function(cf,key) if key=='Rotation' then return setmetatable({Position=v(0,0,0)},cfmeta) end end
cfmeta.__mul=function(a,b) return setmetatable({Position=a.Position+b.Position},cfmeta) end
CFrame={new=function(x,y,z) return setmetatable({Position=type(x)=='table' and x or v(x,y,z)},cfmeta) end}
Enum={RaycastFilterType={Include=1},HumanoidDisplayDistanceType={None=1},HumanoidStateType={GettingUp=1}}
RaycastParams={new=function() return {} end}
local function signal()
    return {Connect=function(self,fn) self.fn=fn end,Fire=function(self,...) if self.fn then return self.fn(...) end end}
end
local queue={}
task={spawn=function(fn) fn() end,delay=function(delay,fn) table.insert(queue,{at=now+delay,fn=fn}) end}
local function advance(t)
    now=t
    for i=#queue,1,-1 do if queue[i].at<=now then local fn=queue[i].fn; table.remove(queue,i); fn() end end
end
local function folder(children)
    return setmetatable(children,{__index={WaitForChild=function(self,n) assert(self[n],n); return self[n] end,FindFirstChild=function(self,n) return self[n] end}})
end
local marker=function(x,y,z) return {Position=v(x,y,z),CFrame=CFrame.new(x,y,z)} end
local markers=folder({RoomSpawn=marker(0,4,8),DreamSpawn=marker(0,12,-232),DreamExit=marker(0,12,-446),HallwaySpawn=marker(-38,12,-381),PortalReturn=marker(-12,12,-395)})
local coords={{0,-232},{-8,-254},{-15,-278},{0,-302},{12,-330},{2,-360},{-12,-387},{0,-444}}
for i,p in ipairs(coords) do markers['Checkpoint'..i]=marker(p[1],12,p[2]) end
local dream=folder({Walkable=folder({})})
for i=1,3 do dream['Interaction'..i]=folder({Position=v(0,11,-280),Remember={Triggered=signal()}}) end
dream.HallwayReturn=folder({Position=v(-38,11,-404),Remember={Triggered=signal()}})
dream.ExitPrompt=folder({Position=v(0,11,-446),Remember={Triggered=signal()}})
local rootData={Position=v(0,4,8),Size=v(2,2,1),Parent=true,Anchored=false,AssemblyLinearVelocity=v(0,0,0),AssemblyAngularVelocity=v(0,0,0)}
local root=setmetatable({}, {
    __index=function(_,key)
        if key=='SetNetworkOwner' or key=='SetNetworkOwnershipAuto' then return function() end end
        return rootData[key]
    end,
    __newindex=function(_,key,value) rootData[key]=value; if key=='CFrame' then rootData.Position=value.Position end end,
})
local humanoid={Health=100,HipHeight=2,Move=function(self,direction) self.lastMove=direction end,ChangeState=function(self,state) self.state=state end}
local pivotCalls=0
local char=folder({HumanoidRootPart=root,Humanoid=humanoid,['Left Leg']={Size=v(1,2,1)}})
function char:FindFirstChildOfClass(class) return class=='Humanoid' and humanoid or nil end
function char:PivotTo(cf) pivotCalls=pivotCalls+1; root.CFrame=cf end
local player={Character=char,CharacterAdded=signal()}
local players={PlayerAdded=signal(),PlayerRemoving=signal(),GetPlayers=function() return {player} end}
local heartbeat=signal()
local packets={}
local update={FireClient=function(self,who,kind,data) table.insert(packets,{kind=kind,data=data}) end}
local action={OnServerEvent=signal()}
local modules=folder({Config={Name='Config'},State={Name='State'},Navigation={Name='Navigation'}})
local replicated=folder({OpeningShared=modules,OpeningRemotes=folder({Action=action,Update=update})})
workspace=folder({OpeningWorld=folder({Dream=dream,Markers=markers})})
function workspace:Raycast(origin,direction,params) return {Position=v(origin.X,8,origin.Z)} end
game={GetService=function(self,name)
    if name=='Players' then return players elseif name=='ReplicatedStorage' then return replicated elseif name=='RunService' then return {Heartbeat=heartbeat} end
    error('Unexpected service '..name)
end}
local currentState
local newState=State.new
State.new=function(time) currentState=newState(time); return currentState end
require=function(module) return ({Config=Config,State=State,Navigation=Navigation})[module.Name] end
-- SERVER_CODE is inserted below by the Python runner.
__SERVER_CODE__
action.OnServerEvent:Fire(player,'Begin')
advance(10); action.OnServerEvent:Fire(player,'EnterDream')
assert(currentState.phase=='dream' and not root.Anchored)
assert(root.Position.Y>=11.8 and root.Position.Z==-232)
root.Position=v(12,11.8,-330); advance(12); heartbeat:Fire(.2)
assert(currentState.checkpoint==5)
local calls=pivotCalls; local location=root.Position
action.OnServerEvent:Fire(player,'Ready')
assert(pivotCalls==calls and root.Position==location,'Ready must not teleport a recovering player to the first spawn')
currentState.lights[1]=true
root.Position=v(12,-7,-330); root.AssemblyLinearVelocity=v(0,-230,0); root.AssemblyAngularVelocity=v(2,3,4)
advance(13); heartbeat:Fire(.2)
assert(root.Anchored and root.Position.Y>=11.8 and root.Position.Z==-330)
assert(root.AssemblyLinearVelocity.Magnitude==0 and root.AssemblyAngularVelocity.Magnitude==0)
assert(currentState.lights[1] and currentState.checkpoint==5)
advance(13.4); assert(not root.Anchored,'Recovery must release the character after stabilizing')
heartbeat:Fire(.2); assert(root.Position.Y>=11.8,'Safe recovery must not immediately fall again')
root.Position=v(75,11.8,-480); advance(15); action.OnServerEvent:Fire(player,'Return')
assert(root.Position.X==12 and root.Position.Z==-330 and root.Anchored)
advance(15.4); assert(not root.Anchored)
local seen=false; for _,p in ipairs(packets) do if p.kind=='Recovery' then seen=true; assert(p.data.duration>=.6) end end
assert(seen,'Client input must be briefly suspended during recovery')
