-- Execute the actual server script, with Roblox services substituted.
local now=0; os.clock=function() return now end
local vmeta={}
vmeta.__index=function(v,key) if key=="Magnitude" then return math.sqrt(v.X*v.X+v.Y*v.Y+v.Z*v.Z) end; return rawget(v,key) end
local function v(x,y,z) return setmetatable({X=x,Y=y,Z=z},vmeta) end
vmeta.__add=function(a,b) return v(a.X+b.X,a.Y+b.Y,a.Z+b.Z) end
vmeta.__sub=function(a,b) return v(a.X-b.X,a.Y-b.Y,a.Z-b.Z) end
Vector3={new=v,zero=v(0,0,0)}
local cfmeta={}
cfmeta.__index=function(cf,key) if key=="Rotation" then return setmetatable({Position=v(0,0,0)},cfmeta) end end
cfmeta.__mul=function(a,b) return setmetatable({Position=a.Position+b.Position},cfmeta) end
CFrame={new=function(x,y,z) return setmetatable({Position=type(x)=="table" and x or v(x,y,z)},cfmeta) end,
    Angles=function() return setmetatable({Position=v(0,0,0)},cfmeta) end}
Enum={RaycastFilterType={Include=1},HumanoidDisplayDistanceType={None=1},HumanoidStateType={GettingUp=1}}
RaycastParams={new=function() return {} end}
local function signal() return {Connect=function(self,fn) self.fn=fn end,Fire=function(self,...) if self.fn then return self.fn(...) end end} end
local queue={}
task={spawn=function(fn) fn() end,delay=function(delay,fn) table.insert(queue,{at=now+delay,fn=fn}) end}
local function advance(t)
    now=t
    for i=#queue,1,-1 do if queue[i].at<=now then local fn=queue[i].fn; table.remove(queue,i); fn() end end
end
local function folder(children)
    return setmetatable(children,{__index={
        WaitForChild=function(self,n) assert(self[n],n); return self[n] end,
        FindFirstChild=function(self,n) return self[n] end,
        GetChildren=function(self) local out={}; for _,o in pairs(self) do if type(o)=="table" then table.insert(out,o) end end; return out end,
    }})
end
local function marker(x,y,z) return {Position=v(x,y,z),CFrame=CFrame.new(x,y,z)} end
local markers=folder({RoomSpawn=marker(0,4,8),DreamSpawn=marker(0,12,-232),DreamExit=marker(0,12,-446),
    HallwaySpawn=marker(-38,12,-381),PortalReturn=marker(-12,12,-395),MorningSpawn=marker(-1.25,4,-2.3),
    CouchStand=marker(-4.2,4,7),CarHome=marker(-10,2.3,62),CarWork=marker(10,2.3,350),
    HomeArrival=marker(-4,4,61),WorkArrival=marker(24,4,350),WorkEntry=marker(55.5,4,343)})
local coords={{0,-232},{-8,-254},{-15,-278},{0,-302},{12,-330},{2,-360},{-12,-387},{0,-444}}
for i,p in ipairs(coords) do markers["Checkpoint"..i]=marker(p[1],12,p[2]) end
local dream=folder({Walkable=folder({})})
for i=1,6 do dream["Interaction"..i]=folder({Position=v(0,11,-280),Remember={Triggered=signal()}}) end
dream.HallwayReturn=folder({Position=v(-38,11,-404),Remember={Triggered=signal()}})
dream.ExitPrompt=folder({Position=v(0,11,-446),Remember={Triggered=signal()}})
local interactions=folder({})
local positions={tv={-10,3,6.4},fridge={-12,3,21},toaster={-12,3.6,33},eat={-8,3.6,33},
    carHome={-10,3,62},carWork={10,3,350},order={54.5,3.7,343},burger={66,3.5,331},
    fries={76,3.5,331},drink={78,3,344},serve={54.5,3.5,353},counter={54.5,3.5,361},
    trash={75,3,376},bed={-1.8,3,-2.2},coworker={69,3,365}}
for n,p in pairs(positions) do interactions[n]=folder({Name=n,Position=v(p[1],p[2],p[3]),Use={Triggered=signal()}}) end
local day=folder({Interactions=interactions,Kitchen=folder({Floor={}}),Street=folder({Ground={},Road={},Sidewalk={},FrontPath={}}),Restaurant=folder({Floor={}})})
local rootData={Position=v(0,4,8),Size=v(2,2,1),Parent=true,Anchored=false,Transparency=0,
    AssemblyLinearVelocity=v(0,0,0),AssemblyAngularVelocity=v(0,0,0)}
local root=setmetatable({},{
    __index=function(_,key)
        if key=="SetNetworkOwner" or key=="SetNetworkOwnershipAuto" then return function() end
        elseif key=="IsA" then return function(self,class) return class=="BasePart" end end
        return rootData[key]
    end,
    __newindex=function(_,key,value) rootData[key]=value; if key=="CFrame" then rootData.Position=value.Position end end,
})
local hum={Health=100,HipHeight=2,Died=signal(),Move=function(self,d) self.lastMove=d end,ChangeState=function(self,s) self.state=s end}
local pivots=0
local char=folder({HumanoidRootPart=root,Humanoid=hum,["Left Leg"]={Size=v(1,2,1)},DescendantAdded=signal()})
function char:FindFirstChildOfClass(class) return class=="Humanoid" and hum or nil end
function char:GetDescendants() return {root} end
function char:PivotTo(cf) pivots=pivots+1; root.CFrame=cf end
local player={Character=char,CharacterAdded=signal()}
local loads=0
function player:LoadCharacterAsync() loads=loads+1; self.Character=char; self.CharacterAdded:Fire(char) end
local players={PlayerAdded=signal(),PlayerRemoving=signal(),GetPlayers=function() return {player} end}
local heartbeat=signal(); local packets={}
local update={FireClient=function(self,who,kind,data) table.insert(packets,{kind=kind,data=data}) end}
local action={OnServerEvent=signal()}
local modules=folder({Config={Name="Config"},State={Name="State"},Navigation={Name="Navigation"},Driving={Name="Driving"}})
local replicated=folder({OpeningShared=modules,OpeningRemotes=folder({Action=action,Update=update})})
workspace=folder({OpeningWorld=folder({Dream=dream,Markers=markers,Day=day,Bedroom=folder({Floor={}})})})
function workspace:Raycast(origin) return {Position=v(origin.X,origin.Z<-184 and 8 or 0,origin.Z)} end
game={GetService=function(self,n)
    if n=="Players" then return players elseif n=="ReplicatedStorage" then return replicated elseif n=="RunService" then return {Heartbeat=heartbeat} end
    error("Unexpected service "..n)
end}
local currentState
local newState=State.new
State.new=function(t) local s=newState(t); if not currentState then currentState=s end; return s end
require=function(module) return ({Config=Config,State=State,Navigation=Navigation,Driving=Driving})[module.Name] end
__SERVER_CODE__
assert(players.CharacterAutoLoads==false and root.Transparency==1 and root.Anchored)
action.OnServerEvent:Fire(player,"Ready"); assert(loads==0)
action.OnServerEvent:Fire(player,"Begin")
advance(10); action.OnServerEvent:Fire(player,"EnterDream")
assert(currentState.phase=="dream" and not root.Anchored and root.Transparency==0)
assert(root.Position.Y>=11.8 and root.Position.Z==-232)
root.Position=v(12,11.8,-330); advance(12); heartbeat:Fire(.2)
assert(currentState.checkpoint==5 and currentState.corruption==0)
local count,location=pivots,root.Position
action.OnServerEvent:Fire(player,"Ready"); assert(pivots==count and root.Position==location)
currentState.lights[1]=true
root.Position=v(12,-7,-330); root.AssemblyLinearVelocity=v(0,-230,0); root.AssemblyAngularVelocity=v(2,3,4)
advance(13); heartbeat:Fire(.2)
assert(root.Anchored and root.Position.Y>=11.8 and root.Position.Z==-330)
assert(root.AssemblyLinearVelocity.Magnitude==0 and root.AssemblyAngularVelocity.Magnitude==0)
assert(currentState.lights[1] and currentState.checkpoint==5)
advance(13.4); assert(not root.Anchored)
root.Position=v(75,11.8,-480); advance(15); action.OnServerEvent:Fire(player,"Return")
assert(root.Position.X==12 and root.Position.Z==-330 and root.Anchored)
advance(15.4); assert(not root.Anchored)
-- Door interaction returns to the beginning but cannot wake the player early.
root.Position=dream.ExitPrompt.Position; advance(17); dream.ExitPrompt.Remember.Triggered:Fire(player)
assert(currentState.phase=="dream" and root.Position.Z==-232)
advance(17.4)
advance(54.99); heartbeat:Fire(.2); assert(currentState.corruption==0)
advance(56); heartbeat:Fire(.2); assert(currentState.corruption>0)
advance(100); heartbeat:Fire(.2); assert(currentState.phase=="blackout")
advance(102.3); heartbeat:Fire(.2); assert(currentState.phase=="awake")
action.OnServerEvent:Fire(player,"Lamp"); assert(currentState.phase=="awake")
advance(113.3); heartbeat:Fire(.2); assert(currentState.phase=="lightsOut")
advance(114.4); action.OnServerEvent:Fire(player,"Lamp"); assert(currentState.phase=="getup")
advance(118.1); action.OnServerEvent:Fire(player,"Stand")
assert(currentState.phase=="morning" and not root.Anchored and root.Transparency==0)
local function interact(kind)
    advance(now+.2); root.Position=interactions[kind].Position; interactions[kind].Use.Triggered:Fire(player)
end
interact("eat"); assert(currentState.phase=="morning",'Cannot skip the news')
interact("tv"); assert(currentState.phase=="news" and root.Anchored and root.Transparency==1)
advance(now+25.1); heartbeat:Fire(.2); assert(currentState.phase=="breakfast" and not root.Anchored)
interact("toaster"); assert(currentState.breakfast=="bread")
interact("fridge"); assert(currentState.breakfast=="toast")
interact("toaster"); assert(currentState.breakfast=="toasting")
interact("eat"); assert(currentState.phase=="breakfast")
advance(now+4.1); heartbeat:Fire(.2); assert(currentState.breakfast=="eat")
interact("eat"); assert(currentState.phase=="leave")
interact("carHome"); assert(currentState.phase=="driveWork" and root.Anchored and root.Transparency==1)
-- Drive to each destination using the same remote input and heartbeat as a client.
local function commute(target)
    for i=1,500 do
        local c=currentState.driving
        local dx,dz=target.Position.X-c.x,target.Position.Z-c.z
        local dist=math.sqrt(dx*dx+dz*dz)
        if dist<=10 and math.abs(c.speed)<7 then
            advance(now+.15); action.OnServerEvent:Fire(player,"Park"); return
        end
        local desired=math.atan(-dx,-dz)
        local diff=(desired-c.yaw+math.pi)%(2*math.pi)-math.pi
        local steer=math.max(-1,math.min(1,-diff*3))
        advance(now+.1); action.OnServerEvent:Fire(player,"DriveInput",dist<25 and 0 or 1,steer); heartbeat:Fire(.1)
    end
    error("Driving cannot reach parking area")
end
commute(markers.CarWork)
assert(currentState.phase=="work" and not root.Anchored and root.Position.X==24)
for i,order in ipairs(Config.Orders) do
    interact("serve"); assert(currentState.job=="take")
    interact("order")
    for _,food in ipairs(order.items) do interact(food) end
    interact("serve")
end
assert(currentState.phase=="cleanup")
interact("counter"); interact("trash"); assert(currentState.phase=="return")
interact("carWork"); assert(currentState.phase=="driveHome")
commute(markers.CarHome); assert(currentState.phase=="home" and not root.Anchored)
interact("bed"); assert(currentState.phase=="secondBedtime")
advance(now+10); action.OnServerEvent:Fire(player,"SleepAgain")
assert(currentState.phase=="complete" and currentState.completed)
-- Fresh join waits for the client's Ready handshake before any avatar is loaded.
currentState=nil
local second={Character=nil,CharacterAdded=signal()}
function second:LoadCharacterAsync() self.Character=char; self.CharacterAdded:Fire(char); loads=loads+1 end
players.PlayerAdded:Fire(second); assert(second.Character==nil)
advance(now+.2); action.OnServerEvent:Fire(second,"Ready")
assert(second.Character==char and loads==1 and currentState.phase=="ready")
