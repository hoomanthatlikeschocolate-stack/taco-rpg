local Players=game:GetService("Players")
Players.CharacterAutoLoads=false
local ReplicatedStorage=game:GetService("ReplicatedStorage")
local RunService=game:GetService("RunService")
local shared=ReplicatedStorage:WaitForChild("OpeningShared")
local Config=require(shared:WaitForChild("Config"))
local State=require(shared:WaitForChild("State"))
local Navigation=require(shared:WaitForChild("Navigation"))
local Driving=require(shared:WaitForChild("Driving"))
local remotes=ReplicatedStorage:WaitForChild("OpeningRemotes")
local action,update=remotes:WaitForChild("Action"),remotes:WaitForChild("Update")
local map=workspace:WaitForChild("OpeningWorld")
local dream,markers,day=map:WaitForChild("Dream"),map:WaitForChild("Markers"),map:WaitForChild("Day")
local interactions=day:WaitForChild("Interactions")
local states,lastRequest,lastDrive,appearances={},{},{},{}
local free={dream=true,morning=true,breakfast=true,leave=true,work=true,cleanup=true,["return"]=true,home=true}
local messages={
    "The blanket feels like sunlight. You remember a room you have never seen.",
    "The clock has forgotten what comes after twelve.",
    "A hallway is growing inside this little door.",
    "A voice says: 'Don't hurry. You have time here.' Then the phone begins to purr.",
    "The stars stir like sugar. Something enormous swims beneath them.",
    "The lantern rises. For a moment, you remember how to fly.",
}
local rayParams=RaycastParams.new()
rayParams.FilterType=Enum.RaycastFilterType.Include
rayParams.FilterDescendantsInstances={dream.Walkable,map.Bedroom.Floor,day.Kitchen.Floor,
    day.Street.Ground,day.Street.Road,day.Street.Sidewalk,day.Street.FrontPath,day.Restaurant.Floor}
local function parts(player)
    local char=player.Character
    if not char then return nil,nil end
    return char:FindFirstChild("HumanoidRootPart"),char:FindFirstChildOfClass("Humanoid")
end
local function visible(player,show)
    local char=player.Character; if not char then return end
    local saved=appearances[player] or {}; appearances[player]=saved
    for _,p in ipairs(char:GetDescendants()) do
        if p:IsA("BasePart") then
            if saved[p]==nil then saved[p]=p.Transparency end
            p.Transparency=show and saved[p] or 1
        end
    end
end
local function packet(player)
    local s=states[player]; if not s then return end
    update:FireClient(player,"Phase",{phase=s.phase,corruption=s.corruption,memories=s.lights,
        completed=s.completed,recovering=math.max(0,s.recoveringUntil-os.clock()-.3),
        breakfast=s.breakfast,order=s.order,job=s.job,tray=s.tray,cleaned=s.cleaned,
        objective=State.objective(s,Config),dreamElapsed=s.phase=="dream" and os.clock()-s.dreamAt or 0,
        sceneElapsed=os.clock()-s.startedAt,driving=s.driving})
end
local function freeze(player,marker)
    local root,hum=parts(player)
    visible(player,false)
    if root then
        root.Anchored=true; root.AssemblyLinearVelocity=Vector3.zero; root.AssemblyAngularVelocity=Vector3.zero
        root.CFrame=(marker or markers.RoomSpawn).CFrame
    end
    if hum then hum.Sit=false; hum.WalkSpeed=0; hum.UseJumpPower=true; hum.JumpPower=0; hum.AutoRotate=false; hum:Move(Vector3.zero) end
end
local function safeCFrame(player,marker)
    local root,hum=parts(player); if not root or not hum then return nil end
    local hit=workspace:Raycast(marker.Position+Vector3.new(0,14,0),Vector3.new(0,-48,0),rayParams)
    local ground=hit and hit.Position or Vector3.new(marker.Position.X,marker.Position.Y-4,marker.Position.Z)
    local leg=player.Character:FindFirstChild("Left Leg")
    local clear=Navigation.clearance(hum.HipHeight,root.Size.Y,leg and leg.Size.Y or 0)
    return CFrame.new(ground+Vector3.new(0,clear,0))*marker.CFrame.Rotation
end
local function placeOnGround(player,marker,stabilize)
    local root,hum=parts(player); local s=states[player]
    if not root or not hum or not s or hum.Health<=0 then return false end
    local cf=safeCFrame(player,marker); if not cf then return false end
    pcall(function() root:SetNetworkOwner(nil) end)
    root.Anchored=true; root.AssemblyLinearVelocity=Vector3.zero; root.AssemblyAngularVelocity=Vector3.zero
    hum.Sit=false; hum.PlatformStand=false; hum:Move(Vector3.zero)
    player.Character:PivotTo(cf); visible(player,true)
    hum.WalkSpeed=Config.WalkSpeed; hum.UseJumpPower=true; hum.JumpPower=Config.JumpPower; hum.AutoRotate=true
    local serial,phase=s.recoverySerial,s.phase
    local function release()
        if not root.Parent or states[player]~=s or not free[s.phase] or s.phase~=phase or serial~=s.recoverySerial then return end
        root.AssemblyLinearVelocity=Vector3.zero; root.AssemblyAngularVelocity=Vector3.zero; root.Anchored=false
        hum:ChangeState(Enum.HumanoidStateType.GettingUp)
        pcall(function() root:SetNetworkOwnershipAuto() end)
    end
    if stabilize then task.delay(Config.RecoveryFreeze,release) else release() end
    return true
end
local function recover(player,marker,message)
    local s=states[player]; if not s or not State.recover(s,os.clock(),Config) then return end
    if placeOnGround(player,marker,true) then
        update:FireClient(player,"Recovery",{duration=Config.RecoveryControlDelay})
        update:FireClient(player,"Text",{text=message or "Your feet find the ground again. There is no hurry."})
    end
end
local function change(player,oldPhase)
    local s=states[player]; local phase=s.phase
    if phase=="dream" then placeOnGround(player,markers.DreamSpawn,false)
    elseif phase=="morning" then placeOnGround(player,markers.MorningSpawn,false)
    elseif phase=="breakfast" and oldPhase=="news" then placeOnGround(player,markers.CouchStand,false)
    elseif phase=="work" and oldPhase=="driveWork" then placeOnGround(player,markers.WorkArrival,false)
    elseif phase=="home" and oldPhase=="driveHome" then placeOnGround(player,markers.HomeArrival,false)
    elseif phase=="driveWork" or phase=="driveHome" then
        local marker=phase=="driveWork" and markers.CarHome or markers.CarWork
        if not s.driving then s.driving=Driving.new(marker.Position.X,marker.Position.Z,phase=="driveWork" and math.pi or 0,os.clock()) end
        freeze(player,marker)
    elseif not free[phase] then freeze(player)
    end
    packet(player)
end
local loadPlayer
local function setupCharacter(player,char)
    local root=char:WaitForChild("HumanoidRootPart",20); local hum=char:WaitForChild("Humanoid",20)
    if not root or not hum or not states[player] then return end
    appearances[player]={}; visible(player,false)
    root.Anchored=true; hum.WalkSpeed=0; hum.JumpPower=0; hum.DisplayDistanceType=Enum.HumanoidDisplayDistanceType.None
    char.DescendantAdded:Connect(function(p)
        local s=states[player]
        if p:IsA("BasePart") and s then
            appearances[player][p]=p.Transparency
            if not free[s.phase] then p.Transparency=1 end
        end
    end)
    hum.Died:Connect(function() task.delay(2,function() if states[player] then loadPlayer(player) end end) end)
end
loadPlayer=function(player)
    local s=states[player]; if not s or s.loading then return end
    s.loading=true
    task.spawn(function()
        local ok=pcall(function() player:LoadCharacterAsync() end)
        if states[player]~=s then return end
        s.loading=false
        if not ok then update:FireClient(player,"Text",{text="The character could not load. Rejoin to retry."}); return end
        if s.phase=="dream" then
            s.recoveringUntil=0
            recover(player,markers:FindFirstChild("Checkpoint"..s.checkpoint) or markers.DreamSpawn,
                "You remember where you were. Keep exploring."); packet(player)
        elseif free[s.phase] then
            local marker=(s.phase=="work" or s.phase=="cleanup" or s.phase=="return") and markers.WorkEntry
                or s.phase=="home" and markers.HomeArrival or markers.MorningSpawn
            placeOnGround(player,marker,false); packet(player)
        else change(player) end
    end)
end
local function added(player)
    if states[player] then return end
    states[player]=State.new(os.clock())
    player.CharacterAdded:Connect(function(char) setupCharacter(player,char) end)
    if player.Character then setupCharacter(player,player.Character); change(player) end
end
Players.PlayerAdded:Connect(added)
for _,player in ipairs(Players:GetPlayers()) do added(player) end
Players.PlayerRemoving:Connect(function(player) states[player]=nil; lastRequest[player]=nil; lastDrive[player]=nil; appearances[player]=nil end)
action.OnServerEvent:Connect(function(player,command,a,b)
    if type(command)~="string" then return end
    local s=states[player]; if not s then added(player); s=states[player] end
    local now=os.clock()
    -- Ready is idempotent and must never override a recovered checkpoint.
    if command=="Ready" then if not player.Character then loadPlayer(player) elseif not s.loading then packet(player) end; return end
    if command=="DriveInput" then
        if s.driving and now-(lastDrive[player] or -100)>=.035 then lastDrive[player]=now; Driving.input(s.driving,a,b,now) end
        return
    end
    if now-(lastRequest[player] or -100)<.1 then return end; lastRequest[player]=now
    local old=s.phase
    if command=="Begin" then
        local root,hum=parts(player)
        if root and hum and State.begin(s,now) then change(player,old) end
    elseif command=="EnterDream" and State.enterDream(s,now,Config) then change(player,old)
    elseif command=="Return" and s.phase=="dream" then
        recover(player,markers:FindFirstChild("Checkpoint"..s.checkpoint) or markers.DreamSpawn)
    elseif command=="Lamp" and State.lamp(s,now) then change(player,old)
    elseif command=="Stand" and State.stand(s,now,Config) then change(player,old)
    elseif command=="SleepAgain" and State.finish(s,now,Config) then change(player,old)
    elseif command=="Park" and s.driving then
        local target=s.phase=="driveWork" and markers.CarWork or markers.CarHome
        if Driving.canPark(s.driving,target.Position.X,target.Position.Z,now) and State.arrive(s,now) then change(player,old)
        else update:FireClient(player,"Text",{text="Stop inside the marked parking area, then press E to park."}) end
    end
end)
for i=1,6 do
    local index=i; local obj=dream:WaitForChild("Interaction"..i)
    obj:WaitForChild("Remember").Triggered:Connect(function(player)
        local s=states[player]; local root=parts(player)
        if not s or not root or s.phase~="dream" or (root.Position-obj.Position).Magnitude>13 then return end
        if State.collect(s,index) then update:FireClient(player,"Memory",{index=index}); update:FireClient(player,"Text",{text=messages[index]}) end
        if index>=4 then update:FireClient(player,"DreamInteraction",{index=index}) end
        if index==3 and State.portal(s,os.clock()) then recover(player,markers.HallwaySpawn,"The small door opens into a very long thought.") end
    end)
end
local function dreamPrompt(name,fn)
    local obj=dream:WaitForChild(name)
    obj:WaitForChild("Remember").Triggered:Connect(function(player)
        local s=states[player]; local root=parts(player)
        if s and root and s.phase=="dream" and (root.Position-obj.Position).Magnitude<13 then fn(player,s) end
    end)
end
dreamPrompt("HallwayReturn",function(player,s)
    if State.portal(s,os.clock()) then recover(player,markers.PortalReturn,"The hallway lets you out somewhere else.") end
end)
dreamPrompt("ExitPrompt",function(player,s)
    update:FireClient(player,"Text",{text=s.corruption>.25 and "Behind the door, someone is breathing in time with you." or "Beyond the door you can hear the ocean, although you are already standing in it."})
    if State.portal(s,os.clock()) then recover(player,markers.DreamSpawn,"You step through and find the beginning again.") end
end)
local foodLines={burger="The grill hisses. Burger ready.",fries="Golden fries, salted and packed.",drink="Ice, soda, lid. Ready to go.",counter="The counter is clean.",trash="The last bag goes into the bin."}
for _,obj in ipairs(interactions:GetChildren()) do
    local kind=obj.Name
    obj:WaitForChild("Use").Triggered:Connect(function(player)
        local s=states[player]; local root=parts(player)
        if not s or not root or (root.Position-obj.Position).Magnitude>12 then return end
        if kind=="coworker" then
            if s.phase=="work" or s.phase=="cleanup" or s.phase=="return" then
                update:FireClient(player,"Text",{text="Coworker: You look exhausted. Grab some water after these orders. I'll lock up tonight."})
            end
            return
        end
        local now=os.clock(); local old=s.phase
        if not State.interact(s,kind,now,Config) then return end
        update:FireClient(player,"DayInteraction",{kind=kind})
        change(player,old)
        if kind=="order" then update:FireClient(player,"Text",{text="Customer: "..table.concat(Config.Orders[s.order].items,", ")..", please."})
        elseif kind=="serve" then update:FireClient(player,"Text",{text=s.phase=="cleanup" and "Last customer: Thanks. Hope you get some sleep tonight." or "Customer: Thank you!"})
        elseif foodLines[kind] then update:FireClient(player,"Text",{text=foodLines[kind]})
        elseif kind=="fridge" then update:FireClient(player,"Text",{text="Bread. Butter. Everything where you left it."})
        elseif kind=="eat" then update:FireClient(player,"Text",{text="Just a bad dream. I should get to work."}) end
    end)
end
local elapsed=0
RunService.Heartbeat:Connect(function(dt)
    local now=os.clock()
    for player,s in pairs(states) do
        if s.driving then
            Driving.tick(s.driving,dt,now,Config)
            local root=parts(player)
            if root then root.CFrame=CFrame.new(s.driving.x,2.3,s.driving.z)*CFrame.Angles(0,s.driving.yaw,0) end
        end
    end
    elapsed=elapsed+dt; if elapsed<.15 then return end; elapsed=0
    for player,s in pairs(states) do
        local root,hum=parts(player)
        if root and hum and hum.Health>0 then
            if s.phase=="dream" then
                if Navigation.needsRecovery(root.Position.X,root.Position.Y,root.Position.Z,Config.GroundY) then
                    recover(player,markers:FindFirstChild("Checkpoint"..s.checkpoint) or markers.DreamSpawn)
                end
                for i=1,8 do local cp=markers:FindFirstChild("Checkpoint"..i)
                    if cp and (root.Position-cp.Position).Magnitude<18 then s.checkpoint=Navigation.checkpoint(s.checkpoint,i) end
                end
            elseif free[s.phase] and root.Position.Y < -5 then
                placeOnGround(player,(s.phase=="work" or s.phase=="cleanup" or s.phase=="return") and markers.WorkEntry
                    or s.phase=="home" and markers.HomeArrival or markers.MorningSpawn,true)
            end
        end
        local old=s.phase
        local progress=root and (Config.DreamStartZ-root.Position.Z)/(Config.DreamStartZ-Config.DreamEndZ) or 0
        local changed=State.tick(s,now,progress,Config)
        if changed then change(player,old) end
        if s.phase=="getup" and now-s.startedAt>10 and State.stand(s,now,Config) then change(player,old) end
        if s.phase=="dream" then update:FireClient(player,"Corruption",{value=s.corruption,elapsed=now-s.dreamAt})
        elseif s.driving then update:FireClient(player,"Drive",{x=s.driving.x,z=s.driving.z,yaw=s.driving.yaw,speed=s.driving.speed}) end
    end
end)
