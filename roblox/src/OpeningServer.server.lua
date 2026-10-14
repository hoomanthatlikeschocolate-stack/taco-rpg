local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")
local shared = ReplicatedStorage:WaitForChild("OpeningShared")
local Config = require(shared:WaitForChild("Config"))
local State = require(shared:WaitForChild("State"))
local remotes = ReplicatedStorage:WaitForChild("OpeningRemotes")
local action = remotes:WaitForChild("Action")
local update = remotes:WaitForChild("Update")
local map = workspace:WaitForChild("OpeningWorld")
local room = map:WaitForChild("Bedroom")
local dream = map:WaitForChild("Dream")
local markers = map:WaitForChild("Markers")
local states, lastRequest = {}, {}
local messages = { "I have been here before.", "That door wasn't here before.", "Someone else is dreaming with me." }
local function characterParts(player)
    local char = player.Character
    if not char then return nil, nil end
    return char:FindFirstChild("HumanoidRootPart"), char:FindFirstChildOfClass("Humanoid")
end
local function freeze(player, marker)
    local root, humanoid = characterParts(player)
    if root then
        root.Anchored = true; root.AssemblyLinearVelocity = Vector3.zero; root.AssemblyAngularVelocity = Vector3.zero
        root.CFrame = marker.CFrame
    end
    if humanoid then
        humanoid.WalkSpeed = 0; humanoid.UseJumpPower = true; humanoid.JumpPower = 0
        humanoid.AutoRotate = false; humanoid.DisplayDistanceType = Enum.HumanoidDisplayDistanceType.None
    end
end
local function release(player, marker)
    local root, humanoid = characterParts(player)
    if root then root.CFrame = marker.CFrame; root.AssemblyLinearVelocity = Vector3.zero; root.Anchored = false end
    if humanoid then humanoid.WalkSpeed = Config.WalkSpeed; humanoid.JumpPower = Config.JumpPower; humanoid.AutoRotate = true end
end
local function phase(player, name)
    local s = states[player]
    if not s then return end
    if name == "dream" then release(player, markers:WaitForChild("DreamSpawn"))
    elseif name == "bedtime" or name == "blackout" or name == "awake" or name == "ready" then freeze(player, markers:WaitForChild("RoomSpawn")) end
    update:FireClient(player, "Phase", { phase = name, corruption = s.corruption })
end
local function added(player)
    if states[player] then return end
    states[player] = State.new(os.clock())
    player.CharacterAdded:Connect(function(char)
        local root = char:WaitForChild("HumanoidRootPart", 20)
        local humanoid = char:WaitForChild("Humanoid", 20)
        if not root or not humanoid then return end
        local s = states[player]; if not s then return end
        if s.phase == "dream" then
            local checkpoint = markers:FindFirstChild("Checkpoint" .. s.checkpoint) or markers.DreamSpawn
            release(player, checkpoint); update:FireClient(player, "Phase", { phase = "dream", corruption = s.corruption })
        else
            states[player] = State.new(os.clock()); phase(player, "ready")
        end
    end)
    if player.Character then
        task.spawn(function()
            player.Character:WaitForChild("HumanoidRootPart", 20)
            if states[player] then phase(player, "ready") end
        end)
    end
end
Players.PlayerAdded:Connect(added)
for _, player in ipairs(Players:GetPlayers()) do added(player) end
Players.PlayerRemoving:Connect(function(player) states[player] = nil; lastRequest[player] = nil end)
action.OnServerEvent:Connect(function(player, command)
    if type(command) ~= "string" then return end
    local now = os.clock()
    local s = states[player]; if not s then added(player); s = states[player] end
    if now - (lastRequest[player] or -100) < .09 then return end
    lastRequest[player] = now
    if command == "Ready" then phase(player, s.phase); return end
    if command == "Begin" then
        local root, humanoid = characterParts(player)
        if root and humanoid and State.begin(s, now) then phase(player, "bedtime") end
    elseif command == "EnterDream" then
        if State.enterDream(s, now, Config) then phase(player, "dream") end
    elseif command == "Exit" then
        local root = characterParts(player)
        if root and State.exit(s, now, (root.Position - markers.DreamExit.Position).Magnitude) then phase(player, "blackout") end
    elseif command == "Lamp" and State.lamp(s, now) then
        update:FireClient(player, "Lamp", {}); update:FireClient(player, "Text", { text = "The switch clicks. Nothing happens." })
    end
end)
local elapsed = 0
RunService.Heartbeat:Connect(function(dt)
    elapsed = elapsed + dt; if elapsed < .15 then return end; elapsed = 0
    local now = os.clock()
    for player, s in pairs(states) do
        local root = characterParts(player)
        if root and s.phase == "dream" then
            if root.Position.Y < -4 then
                local cp = markers:FindFirstChild("Checkpoint" .. s.checkpoint) or markers.DreamSpawn
                root.CFrame = cp.CFrame; root.AssemblyLinearVelocity = Vector3.zero
                update:FireClient(player, "Text", { text = "You fall. You are still here." })
            end
            for i = 1, 8 do
                local cp = markers:FindFirstChild("Checkpoint" .. i)
                if cp and (root.Position - cp.Position).Magnitude < 16 then s.checkpoint = i end
            end
            for i = 1, 3 do
                local light = dream:FindFirstChild("Memory" .. i)
                if light and (root.Position - light.Position).Magnitude < 7 and State.collect(s, i) then
                    update:FireClient(player, "Memory", { index = i }); update:FireClient(player, "Text", { text = messages[i] })
                end
            end
        end
        local progress = root and (Config.DreamStartZ - root.Position.Z) / (Config.DreamStartZ - Config.DreamEndZ) or 0
        local changed = State.tick(s, now, progress, Config)
        if changed then phase(player, changed) end
        if s.phase == "dream" then
            update:FireClient(player, "Corruption", { value = s.corruption })
            if root and (root.Position - markers.DreamExit.Position).Magnitude < 7 and State.exit(s, now, 0) then phase(player, "blackout") end
        end
    end
end)
