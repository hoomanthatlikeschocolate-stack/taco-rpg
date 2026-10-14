local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")
local shared = ReplicatedStorage:WaitForChild("OpeningShared")
local Config = require(shared:WaitForChild("Config"))
local State = require(shared:WaitForChild("State"))
local Navigation = require(shared:WaitForChild("Navigation"))
local remotes = ReplicatedStorage:WaitForChild("OpeningRemotes")
local action, update = remotes:WaitForChild("Action"), remotes:WaitForChild("Update")
local map = workspace:WaitForChild("OpeningWorld")
local dream, markers = map:WaitForChild("Dream"), map:WaitForChild("Markers")
local walkable = dream:WaitForChild("Walkable")
local states, lastRequest = {}, {}
local messages = {
    "The sheets are still warm. You never got out of bed.",
    "Every clock is counting backwards. Yours is still 00:14.",
    "The inside is larger than the outside. That should be impossible.",
}
local rayParams = RaycastParams.new()
rayParams.FilterType = Enum.RaycastFilterType.Include
rayParams.FilterDescendantsInstances = { walkable }
local function characterParts(player)
    local char = player.Character
    if not char then return nil,nil end
    return char:FindFirstChild("HumanoidRootPart"), char:FindFirstChildOfClass("Humanoid")
end
local function packet(player,name)
    local s=states[player]; if not s then return end
    update:FireClient(player,"Phase",{phase=name or s.phase,corruption=s.corruption,memories=s.lights,completed=s.completed,recovering=math.max(0,s.recoveringUntil-os.clock()-.3)})
end
local function freeze(player)
    local root,humanoid=characterParts(player)
    if root then root.Anchored=true; root.AssemblyLinearVelocity=Vector3.zero; root.AssemblyAngularVelocity=Vector3.zero; root.CFrame=markers.RoomSpawn.CFrame end
    if humanoid then humanoid.WalkSpeed=0; humanoid.UseJumpPower=true; humanoid.JumpPower=0; humanoid.AutoRotate=false; humanoid:Move(Vector3.zero) end
end
local function safeCFrame(player,marker)
    local root,humanoid=characterParts(player); if not root or not humanoid then return nil end
    local hit=workspace:Raycast(marker.Position+Vector3.new(0,14,0),Vector3.new(0,-48,0),rayParams)
    local ground=hit and hit.Position or Vector3.new(marker.Position.X,Config.GroundY,marker.Position.Z)
    local leg=player.Character:FindFirstChild("Left Leg")
    local clear=Navigation.clearance(humanoid.HipHeight,root.Size.Y,leg and leg.Size.Y or 0)
    return CFrame.new(ground+Vector3.new(0,clear,0))*marker.CFrame.Rotation
end
local function placeOnGround(player,marker,stabilize)
    local root,humanoid=characterParts(player); local s=states[player]
    if not root or not humanoid or not s or humanoid.Health<=0 then return false end
    local cf=safeCFrame(player,marker); if not cf then return false end
    pcall(function() root:SetNetworkOwner(nil) end)
    root.Anchored=true; root.AssemblyLinearVelocity=Vector3.zero; root.AssemblyAngularVelocity=Vector3.zero
    humanoid.Sit=false; humanoid.PlatformStand=false; humanoid:Move(Vector3.zero)
    player.Character:PivotTo(cf)
    humanoid.WalkSpeed=Config.WalkSpeed; humanoid.UseJumpPower=true; humanoid.JumpPower=Config.JumpPower; humanoid.AutoRotate=true
    local serial=s.recoverySerial
    local function release()
        if not root.Parent or states[player]~=s or s.phase~="dream" or serial~=s.recoverySerial then return end
        root.AssemblyLinearVelocity=Vector3.zero; root.AssemblyAngularVelocity=Vector3.zero; root.Anchored=false
        humanoid:ChangeState(Enum.HumanoidStateType.GettingUp)
        pcall(function() root:SetNetworkOwnershipAuto() end)
    end
    if stabilize then task.delay(Config.RecoveryFreeze,release) else release() end
    return true
end
local function recover(player,marker,message)
    local s=states[player]; if not s or not State.recover(s,os.clock(),Config) then return end
    if placeOnGround(player,marker,true) then
        update:FireClient(player,"Recovery",{duration=Config.RecoveryControlDelay})
        update:FireClient(player,"Text",{text=message or "The ground is solid again. Follow the pale path."})
    end
end
local function change(player,name)
    if name=="dream" then placeOnGround(player,markers.DreamSpawn,false)
    elseif name=="ready" or name=="bedtime" or name=="blackout" or name=="awake" then freeze(player) end
    packet(player,name)
end
local function added(player)
    if states[player] then return end
    states[player]=State.new(os.clock())
    player.CharacterAdded:Connect(function(char)
        local root=char:WaitForChild("HumanoidRootPart",20); local humanoid=char:WaitForChild("Humanoid",20)
        if not root or not humanoid then return end
        humanoid.DisplayDistanceType=Enum.HumanoidDisplayDistanceType.None
        local s=states[player]; if not s then return end
        if s.phase=="dream" then
            s.recoveringUntil=0; local cp=markers:FindFirstChild("Checkpoint"..s.checkpoint) or markers.DreamSpawn
            recover(player,cp,"You remember where you were. Keep following the light."); packet(player,"dream")
        else states[player]=State.new(os.clock()); change(player,"ready") end
    end)
    if player.Character then
        task.spawn(function() player.Character:WaitForChild("HumanoidRootPart",20); if states[player] then change(player,"ready") end end)
    end
end
Players.PlayerAdded:Connect(added)
for _,player in ipairs(Players:GetPlayers()) do added(player) end
Players.PlayerRemoving:Connect(function(player) states[player]=nil; lastRequest[player]=nil end)
action.OnServerEvent:Connect(function(player,command)
    if type(command)~="string" then return end
    local s=states[player]; if not s then added(player); s=states[player] end
    local now=os.clock()
    -- Queries never teleport the player: respawn recovery keeps its checkpoint.
    if command=="Ready" then packet(player); return end
    if now-(lastRequest[player] or -100)<.1 then return end; lastRequest[player]=now
    if command=="Begin" then
        local root,humanoid=characterParts(player)
        if root and humanoid and State.begin(s,now) then change(player,"bedtime") end
    elseif command=="EnterDream" then
        if State.enterDream(s,now,Config) then change(player,"dream") end
    elseif command=="Exit" then
        local root=characterParts(player)
        if root and State.exit(s,now,(root.Position-markers.DreamExit.Position).Magnitude) then change(player,"blackout") end
    elseif command=="Return" and s.phase=="dream" then
        recover(player,markers:FindFirstChild("Checkpoint"..s.checkpoint) or markers.DreamSpawn)
    elseif command=="Lamp" and State.lamp(s,now) then
        update:FireClient(player,"Lamp",{}); update:FireClient(player,"Text",{text="The switch clicks. Nothing happens."})
    end
end)
for i=1,3 do
    local index=i; local obj=dream:WaitForChild("Interaction"..index); local prompt=obj:WaitForChild("Remember")
    prompt.Triggered:Connect(function(player)
        local s=states[player]; local root=characterParts(player)
        if not s or not root or s.phase~="dream" or (root.Position-obj.Position).Magnitude>13 then return end
        if State.collect(s,index) then update:FireClient(player,"Memory",{index=index}); update:FireClient(player,"Text",{text=messages[index]}) end
        if index==3 and State.portal(s,os.clock()) then recover(player,markers.HallwaySpawn,"A small door. A room that cannot possibly fit behind it.") end
    end)
end
dream:WaitForChild("HallwayReturn"):WaitForChild("Remember").Triggered:Connect(function(player)
    local s=states[player]; local root=characterParts(player)
    if s and root and (root.Position-dream.HallwayReturn.Position).Magnitude<13 and State.portal(s,os.clock()) then
        recover(player,markers.PortalReturn,"You step out somewhere else. The front door is still ahead.")
    end
end)
dream:WaitForChild("ExitPrompt"):WaitForChild("Remember").Triggered:Connect(function(player)
    local s=states[player]; local root=characterParts(player)
    if s and root and State.exit(s,os.clock(),(root.Position-markers.DreamExit.Position).Magnitude) then change(player,"blackout") end
end)
local elapsed=0
RunService.Heartbeat:Connect(function(dt)
    elapsed=elapsed+dt; if elapsed<.15 then return end; elapsed=0
    local now=os.clock()
    for player,s in pairs(states) do
        local root,humanoid=characterParts(player)
        if root and humanoid and humanoid.Health>0 and s.phase=="dream" then
            if Navigation.needsRecovery(root.Position.X,root.Position.Y,root.Position.Z,Config.GroundY) then
                recover(player,markers:FindFirstChild("Checkpoint"..s.checkpoint) or markers.DreamSpawn)
            end
            for i=1,8 do
                local cp=markers:FindFirstChild("Checkpoint"..i)
                if cp and (root.Position-cp.Position).Magnitude<18 then s.checkpoint=Navigation.checkpoint(s.checkpoint,i) end
            end
        end
        local progress=root and (Config.DreamStartZ-root.Position.Z)/(Config.DreamStartZ-Config.DreamEndZ) or 0
        local changed=State.tick(s,now,progress,Config)
        if changed then change(player,changed) end
        if s.phase=="dream" then
            update:FireClient(player,"Corruption",{value=s.corruption})
            if root and (root.Position-markers.DreamExit.Position).Magnitude<6 and State.exit(s,now,0) then change(player,"blackout") end
        end
    end
end)
