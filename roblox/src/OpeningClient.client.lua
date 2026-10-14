local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")
local TweenService = game:GetService("TweenService")
local Lighting = game:GetService("Lighting")
local UserInputService = game:GetService("UserInputService")
local SoundService = game:GetService("SoundService")
local player = Players.LocalPlayer
local shared = ReplicatedStorage:WaitForChild("OpeningShared")
local Config = require(shared:WaitForChild("Config"))
local Animator = require(shared:WaitForChild("ActorAnimator"))
local Music = require(shared:WaitForChild("Music"))
local remotes = ReplicatedStorage:WaitForChild("OpeningRemotes")
local action, update = remotes:WaitForChild("Action"), remotes:WaitForChild("Update")
local map = workspace:WaitForChild("OpeningWorld")
local room, dream, markers = map:WaitForChild("Bedroom"), map:WaitForChild("Dream"), map:WaitForChild("Markers")
local actorTemplate = ReplicatedStorage:WaitForChild("OpeningAssets"):WaitForChild("Sleeper")
local camera = workspace.CurrentCamera
local controls = nil
local ok, result = pcall(function()
    local module = player.PlayerScripts:WaitForChild("PlayerModule", 15)
    if module then return require(module):GetControls() end
end)
if ok then controls = result end
local phase, phaseAt, generation = "loading", os.clock(), 0
local corruption, targetCorruption, reduced = 0, 0, false
local actor, actorPivot, walking = nil, nil, false
local actorAnimator=nil; local poseValues={}; local recoveryToken=0
local music=Music.new(Config); local cameraLight=nil
local captionUntil, lastBand, focusPoint = 0, 0, Vector3.new(-5, 3, -5)
local tweens, decor, platformColors, memoryCollected, actorOffsets = {}, {}, {}, {}, {}
local function clamp(v, lo, hi) return math.max(lo, math.min(hi, v)) end
local function create(class, parent, props)
    local item = Instance.new(class)
    for key, value in pairs(props or {}) do item[key] = value end
    item.Parent = parent; return item
end
local gui = create("ScreenGui", player:WaitForChild("PlayerGui"), { Name = "OpeningUI", ResetOnSpawn = false, IgnoreGuiInset = true, DisplayOrder = 100 })
local fade = create("Frame", gui, { Name = "Fade", Size = UDim2.fromScale(1, 1), BackgroundColor3 = Color3.new(0, 0, 0), BackgroundTransparency = 0, BorderSizePixel = 0, ZIndex = 20 })
local caption = create("TextLabel", gui, { Name = "Caption", AnchorPoint = Vector2.new(.5, 1), Position = UDim2.fromScale(.5, .86), Size = UDim2.fromScale(.8, .09), BackgroundTransparency = 1, TextColor3 = Color3.fromRGB(224, 228, 239), TextStrokeTransparency = .5, TextWrapped = true, TextSize = 19, Font = Enum.Font.Gotham, Text = "Loading the bedroom...", ZIndex = 30 })
local hint = create("TextLabel", gui, { Name = "Controls", AnchorPoint = Vector2.new(.5, 1), Position = UDim2.fromScale(.5, .97), Size = UDim2.fromScale(.92, .06), BackgroundTransparency = 1, TextColor3 = Color3.fromRGB(158, 168, 193), TextStrokeTransparency = .45, TextWrapped = true, TextSize = 14, Font = Enum.Font.Gotham, Text = "", ZIndex = 30 })
local label = create("TextLabel", gui, { Name = "Scene", Position = UDim2.fromScale(.04, .045), Size = UDim2.fromScale(.6, .05), BackgroundTransparency = 1, TextColor3 = Color3.fromRGB(195, 204, 220), TextXAlignment = Enum.TextXAlignment.Left, TextSize = 12, Font = Enum.Font.Gotham, Text = "BEDROOM / 00:14", ZIndex = 30 })
local menu = create("Frame", gui, { Name = "Start", Position = UDim2.fromScale(.07, .28), Size = UDim2.fromScale(.58, .48), BackgroundTransparency = 1, Visible = false, ZIndex = 31 })
create("TextLabel", menu, { Size = UDim2.fromScale(1, .12), BackgroundTransparency = 1, Text = "THE HOUSE IS QUIET.", TextColor3 = Color3.fromRGB(175, 184, 204), TextXAlignment = Enum.TextXAlignment.Left, TextSize = 13, Font = Enum.Font.Gotham, ZIndex = 31 })
create("TextLabel", menu, { Position = UDim2.fromScale(0, .17), Size = UDim2.fromScale(1, .25), BackgroundTransparency = 1, Text = "It's late.", TextColor3 = Color3.fromRGB(233, 233, 241), TextXAlignment = Enum.TextXAlignment.Left, TextScaled = true, Font = Enum.Font.GothamMedium, ZIndex = 31 })
create("TextLabel", menu, { Position = UDim2.fromScale(0, .46), Size = UDim2.fromScale(1, .16), BackgroundTransparency = 1, Text = "One more night. One more dream.", TextColor3 = Color3.fromRGB(159, 167, 185), TextXAlignment = Enum.TextXAlignment.Left, TextWrapped = true, TextSize = 16, Font = Enum.Font.Gotham, ZIndex = 31 })
local begin = create("TextButton", menu, { Position = UDim2.fromScale(0, .72), Size = UDim2.fromScale(.6, .22), Text = "Go to sleep  >", BackgroundColor3 = Color3.fromRGB(222, 227, 238), TextColor3 = Color3.fromRGB(20, 24, 38), TextSize = 18, Font = Enum.Font.GothamMedium, BorderSizePixel = 0, ZIndex = 31 })
create("UICorner", begin, { CornerRadius = UDim.new(0, 5) })
local replay = create("TextButton", gui, { AnchorPoint = Vector2.new(1, 1), Position = UDim2.fromScale(.96, .9), Size = UDim2.fromOffset(155, 38), Text = "Replay opening", BackgroundColor3 = Color3.fromRGB(22, 25, 38), TextColor3 = Color3.fromRGB(194, 200, 216), TextSize = 14, Font = Enum.Font.Gotham, BorderSizePixel = 0, Visible = false, ZIndex = 35 })
create("UICorner", replay, { CornerRadius = UDim.new(0, 5) })
local effectsButton = create("TextButton", gui, { AnchorPoint = Vector2.new(1, 0), Position = UDim2.fromScale(.97, .035), Size = UDim2.fromOffset(136, 30), Text = "Effects: full", BackgroundColor3 = Color3.fromRGB(16, 20, 30), BackgroundTransparency = .3, TextColor3 = Color3.fromRGB(175, 185, 206), TextSize = 12, Font = Enum.Font.Gotham, BorderSizePixel = 0, ZIndex = 35 })
local slices = {}
for i = 1, 10 do slices[i] = create("Frame", gui, { BackgroundColor3 = Color3.fromRGB(3, 4, 9), BackgroundTransparency = 1, BorderSizePixel = 0, ZIndex = 25, Size = UDim2.fromScale(1, .01) }) end
local correction = create("ColorCorrectionEffect", Lighting, { Name = "OpeningColor", Saturation = -.12, Contrast = .08 })
local blur = create("BlurEffect", Lighting, { Name = "OpeningBlur", Size = 0 })
local atmosphere = Lighting:FindFirstChildOfClass("Atmosphere") or create("Atmosphere", Lighting, { Name = "OpeningAtmosphere" })
local roomLamp = room:WaitForChild("LampBulb"):WaitForChild("WarmLight")
local eyes = { room:WaitForChild("EyeLeft"), room:WaitForChild("EyeRight") }
for _, eye in ipairs(eyes) do eye.Transparency = 1; eye:FindFirstChildOfClass("PointLight").Brightness = 0 end
for _, item in ipairs(dream:GetDescendants()) do
    if item:IsA("BasePart") then
        if string.sub(item.Name, 1, 8) == "Distort_" then decor[item] = { cf = item.CFrame, color = item.Color } end
        if string.sub(item.Name, 1, 8) == "Platform" then platformColors[item] = item.Color end
    end
end
local function sound(name,volume)
    music:setPhase(phase)
end
local musicButton=create("TextButton",gui,{AnchorPoint=Vector2.new(1,0),Position=UDim2.fromScale(.97,.09),Size=UDim2.fromOffset(136,30),Text="Music: on [M]",BackgroundColor3=Color3.fromRGB(16,20,30),BackgroundTransparency=.3,TextColor3=Color3.fromRGB(175,185,206),TextSize=12,Font=Enum.Font.Gotham,BorderSizePixel=0,ZIndex=35})
local function toggleMusic()
    music:setEnabled(not music.enabled); musicButton.Text=music.enabled and "Music: on [M]" or "Music: off [M]"
end
musicButton.Activated:Connect(toggleMusic)
local blanketBase=room:WaitForChild("Blanket").CFrame
local stripes={}
for _,part in ipairs(room:GetChildren()) do if part.Name=="BlanketStripe" then stripes[part]=part.CFrame end end
for _,name in ipairs({"walk","sit","lean","look","reach","sleep","eyes"}) do poseValues[name]=create("NumberValue",nil,{Name=name,Value=0}) end
local function tween(item, duration, properties)
    local tw = TweenService:Create(item, TweenInfo.new(duration, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut), properties)
    table.insert(tweens, tw); tw:Play(); return tw
end
local function pose(duration,values)
    for name,value in pairs(values) do tween(poseValues[name],duration,{Value=value}) end
end
local function safetyLight(enabled)
    local char=player.Character; local root=char and char:FindFirstChild("HumanoidRootPart")
    if root and enabled then
        cameraLight=root:FindFirstChild("DreamSafetyLight") or create("PointLight",root,{Name="DreamSafetyLight",Color=Color3.fromRGB(204,220,255),Brightness=.85,Range=34,Shadows=false})
        cameraLight.Enabled=true
    elseif cameraLight and cameraLight.Parent then cameraLight.Enabled=false end
end
local function cancelTweens()
    for _, tw in ipairs(tweens) do tw:Cancel() end; tweens = {}
end
local function text(message, duration)
    caption.Text = message; caption.TextTransparency = 0; captionUntil = os.clock() + (duration or 5.5)
end
local function control(enabled)
    if controls then if enabled then controls:Enable() else controls:Disable() end end
    UserInputService.MouseBehavior = Enum.MouseBehavior.Default
end
local function hideCharacter(hidden)
    local char = player.Character
    if not char then return end
    for _, item in ipairs(char:GetDescendants()) do if item:IsA("BasePart") then item.LocalTransparencyModifier = hidden and 1 or 0 end end
end
local function resetWorld()
    correction.Saturation = -.12; correction.Contrast = .08; correction.TintColor = Color3.new(1, 1, 1); blur.Size = 0
    Lighting.ClockTime = .23; Lighting.Brightness = 1.4; Lighting.Ambient = Color3.fromRGB(38, 42, 64)
    Lighting.OutdoorAmbient = Color3.fromRGB(43, 51, 77); Lighting.FogColor = Color3.fromRGB(21, 27, 46); Lighting.FogStart = 0; Lighting.FogEnd = 150
    atmosphere.Density = .18; atmosphere.Color = Color3.fromRGB(139, 158, 192); atmosphere.Decay = Color3.fromRGB(61, 69, 101)
    roomLamp.Brightness = 1.7; room.Blanket.CFrame=blanketBase
    for part,cf in pairs(stripes) do part.CFrame=cf end
    for _,value in pairs(poseValues) do value.Value=0 end
    memoryCollected = {}; corruption = 0; targetCorruption = 0; lastBand = 0
    for part, data in pairs(decor) do part.CFrame = data.cf; part.Color = data.color; part.Transparency = 0 end
    for part, color in pairs(platformColors) do part.Color = color end
    for i = 1, 3 do local item = dream:FindFirstChild("Memory" .. i); if item then item.Transparency = 0; local light = item:FindFirstChildOfClass("PointLight"); if light then light.Enabled = true end end end
    for _, eye in ipairs(eyes) do eye.Transparency = 1; eye:FindFirstChildOfClass("PointLight").Brightness = 0 end
end
local function spawnActor()
    if actor then actor:Destroy() end
    actor = actorTemplate:Clone(); actor.Name = "LocalSleeper"; actor.Parent = workspace
    actor.PrimaryPart = actor:FindFirstChild("Root"); actor:PivotTo(markers.ActorStart.CFrame)
    actorAnimator=Animator.new(actor)
    actorOffsets = {}
    for _, item in ipairs(actor:GetDescendants()) do if item:IsA("BasePart") then actorOffsets[item] = actor:GetPivot():ToObjectSpace(item.CFrame) end end
end
local function moveActor(target, duration, token)
    if token ~= generation or not actor then return false end
    actorPivot = create("CFrameValue", nil, { Value = actor:GetPivot() })
    local value = actorPivot
    local connection = value.Changed:Connect(function(cf) if actor and token == generation then actor:PivotTo(cf) end end)
    local tw = tween(value, duration, { Value = target }); tw.Completed:Wait(); connection:Disconnect(); value:Destroy()
    if actorPivot == value then actorPivot = nil end
    return token == generation
end
local function bedroomCamera()
    camera.CameraType = Enum.CameraType.Scriptable; camera.FieldOfView = 65
    camera.CFrame = CFrame.lookAt(markers.IntroCamera.Position, Vector3.new(-5, 3.4, -5.5)); focusPoint = Vector3.new(-5, 3.4, -5.5)
end
local function bedtime(token)
    spawnActor(); resetWorld(); hideCharacter(true); control(false); safetyLight(false); bedroomCamera(); menu.Visible=false; replay.Visible=false
    fade.BackgroundTransparency=1; label.Text="BEDROOM / 00:14"; hint.Text=""; caption.Text=""; sound("Room",.12)
    poseValues.walk.Value=1; poseValues.look.Value=-.4; walking=true
    local stop=markers.ActorBedside.CFrame*CFrame.Angles(0,math.pi,0)
    if not moveActor(stop,3.5,token) then return end
    walking=false; pose(.35,{walk=0,look=0})
    if not moveActor(markers.ActorBedside.CFrame,.55,token) then return end
    pose(.9,{sit=1,lean=.15})
    if not moveActor(markers.ActorSit.CFrame,.9,token) then return end
    pose(.85,{reach=1,look=.4}); task.wait(.9); if token~=generation then return end
    tween(roomLamp,.4,{Brightness=0}); task.wait(.45); if token~=generation then return end
    pose(.6,{reach=0,lean=.25,look=0}); task.wait(.6); if token~=generation then return end
    pose(1.6,{sit=0,lean=0,sleep=1})
    if not moveActor(markers.ActorSleep.CFrame,1.6,token) then return end
    local sheetTarget=blanketBase*CFrame.new(0,1,-.8)
    tween(room.Blanket,1,{CFrame=sheetTarget})
    for part,cf in pairs(stripes) do tween(part,1,{CFrame=cf*CFrame.new(0,1,-.8)}) end
    pose(1,{eyes=1}); task.wait(1.25); if token~=generation then return end
    local head=actor:FindFirstChild("Head"); if not head then return end
    focusPoint=head.Position
    tween(camera,1.2,{CFrame=CFrame.lookAt(head.Position+Vector3.new(1.5,4.3,4.2),head.Position),FieldOfView=52}).Completed:Wait()
    if token~=generation then return end
    tween(camera,3.4,{CFrame=CFrame.lookAt(head.Position+Vector3.new(.01,.22,.05),head.Position),FieldOfView=38})
    task.wait(2.6); if token~=generation then return end
    tween(fade,.8,{BackgroundTransparency=0}); tween(blur,.8,{Size=reduced and 0 or 7}); task.wait(.9)
    if token==generation then action:FireServer("EnterDream") end
end
local function change(nextPhase)
    if nextPhase == "complete" then replay.Visible = true; hint.Text = "Move the mouse to look. E: bedside lamp."; return end
    generation = generation + 1; local token = generation; cancelTweens(); phase = nextPhase; phaseAt = os.clock(); walking = false
    music:setPhase(nextPhase); safetyLight(nextPhase=="dream")
    if nextPhase == "ready" then
        resetWorld(); spawnActor(); hideCharacter(true); control(false); bedroomCamera(); menu.Visible = true; replay.Visible = false
        player.CameraMode = Enum.CameraMode.Classic; fade.BackgroundTransparency = 1; caption.Text = ""; hint.Text = ""; label.Text = "BEDROOM / 00:14"
    elseif nextPhase == "bedtime" then task.spawn(bedtime, token)
    elseif nextPhase == "dream" then
        if actor then actor:Destroy(); actor = nil end
        hideCharacter(false); control(true); player.CameraMode = Enum.CameraMode.LockFirstPerson
        local char = player.Character; if char then camera.CameraSubject = char:WaitForChild("Humanoid") end
        camera.CameraType = Enum.CameraType.Custom; camera.FieldOfView = 72; blur.Size = 0
        menu.Visible = false; replay.Visible = false; label.Text = "DREAM / FIND YOUR WAY HOME"
        hint.Text = UserInputService.TouchEnabled and "Walk the pale path. Touch the things you remember." or "WASD: walk   E: interact   R: return to path   M: music"
        text("It feels like somewhere you have been before."); tween(fade, 1.2, { BackgroundTransparency = 1 }); sound("Dream", .3)
    elseif nextPhase == "blackout" then
        control(false); hideCharacter(true); label.Text = ""; hint.Text = ""; caption.Text = ""
        tween(fade, .55, { BackgroundTransparency = 0 }); sound("Drone", .12)
    elseif nextPhase == "awake" then
        resetWorld(); spawnActor(); actor:PivotTo(markers.ActorSleep.CFrame); poseValues.sleep.Value=1; hideCharacter(true); control(false)
        player.CameraMode = Enum.CameraMode.Classic; camera.CameraType = Enum.CameraType.Scriptable; camera.FieldOfView = 63
        focusPoint = markers.EyeTarget.Position; camera.CFrame = CFrame.lookAt(markers.WakeCamera.Position, focusPoint)
        roomLamp.Brightness = 0; Lighting.Brightness = .55; Lighting.Ambient = Color3.fromRGB(13, 18, 33); correction.Saturation = -.35
        fade.BackgroundTransparency = 0; tween(fade, 1.7, { BackgroundTransparency = 1 }); blur.Size = reduced and 0 or 6; tween(blur, 2.5, { Size = 0 })
        label.Text = "BEDROOM? / 00:14"; hint.Text = "Move the mouse to look. E: bedside lamp."; text("You woke up. You must have.", 3); sound("Wake", .28)
        task.delay(Config.EyeDelay, function()
            if token ~= generation then return end
            for _, eye in ipairs(eyes) do tween(eye, 1.4, { Transparency = 0 }); tween(eye:FindFirstChildOfClass("PointLight"), 1.4, { Brightness = 1.4 }) end
            text("Do not move.", 6)
        end)
    end
end
begin.Activated:Connect(function() action:FireServer("Begin") end)
replay.Activated:Connect(function() action:FireServer("Begin") end)
local function toggleEffects() reduced=not reduced; effectsButton.Text=reduced and "Effects: reduced [V]" or "Effects: full [V]" end
effectsButton.Activated:Connect(toggleEffects)
UserInputService.InputBegan:Connect(function(input, processed)
    if processed then return end
    if input.KeyCode==Enum.KeyCode.M then toggleMusic(); return end
    if input.KeyCode==Enum.KeyCode.V then toggleEffects(); return end
    if (input.KeyCode==Enum.KeyCode.R or input.KeyCode==Enum.KeyCode.ButtonY) and phase=="dream" then action:FireServer("Return"); return end
    if input.KeyCode == Enum.KeyCode.E or input.KeyCode == Enum.KeyCode.ButtonX then
        if phase == "awake" then action:FireServer("Lamp") elseif phase == "ready" then action:FireServer("Begin") end
    end
end)
local lampButton = create("TextButton", gui, { AnchorPoint = Vector2.new(.5, 1), Position = UDim2.fromScale(.5, .77), Size = UDim2.fromOffset(150, 34), Text = "Bedside lamp", BackgroundColor3 = Color3.fromRGB(24, 29, 44), BackgroundTransparency = .2, TextColor3 = Color3.fromRGB(200, 207, 223), TextSize = 14, Font = Enum.Font.Gotham, Visible = false, BorderSizePixel = 0, ZIndex = 35 })
lampButton.Activated:Connect(function() if phase == "awake" then action:FireServer("Lamp") elseif phase == "dream" then action:FireServer("Exit") end end)
local returnButton=create("TextButton",gui,{AnchorPoint=Vector2.new(1,1),Position=UDim2.fromScale(.97,.82),Size=UDim2.fromOffset(145,34),Text="Return to path",BackgroundColor3=Color3.fromRGB(25,30,46),TextColor3=Color3.fromRGB(193,205,227),TextSize=13,Font=Enum.Font.Gotham,Visible=false,BorderSizePixel=0,ZIndex=35})
returnButton.Activated:Connect(function() if phase=="dream" then action:FireServer("Return") end end)
local function pauseForRecovery(duration)
    recoveryToken=recoveryToken+1; local token=recoveryToken; local gen=generation
    control(false); local humanoid=player.Character and player.Character:FindFirstChildOfClass("Humanoid")
    if humanoid then humanoid:Move(Vector3.zero) end
    task.delay(duration or .65,function() if token==recoveryToken and gen==generation and phase=="dream" then control(true) end end)
end
update.OnClientEvent:Connect(function(kind, data)
    if kind == "Phase" then
        if data.phase~=phase or data.phase=="complete" then change(data.phase) end
        if data.phase=="dream" then targetCorruption=data.corruption or 0; memoryCollected=data.memories or memoryCollected; if data.recovering and data.recovering>0 then pauseForRecovery(data.recovering) end end
        if data.completed and phase=="awake" then replay.Visible=true end
    elseif kind=="Recovery" then pauseForRecovery(data.duration)
    elseif kind == "Text" then text(data.text)
    elseif kind == "Corruption" then targetCorruption = clamp(data.value, 0, 1)
    elseif kind == "Memory" then
        memoryCollected[data.index] = true; local item = dream:FindFirstChild("Memory" .. data.index)
        if item then item.Transparency = 1; local light = item:FindFirstChildOfClass("PointLight"); if light then light.Enabled = false end end
    elseif kind == "Lamp" then
        roomLamp.Brightness = .2; task.delay(.12, function() if phase == "awake" then roomLamp.Brightness = 0 end end)
    end
end)
local lastGlitch = -1
RunService:BindToRenderStep("OpeningCameraAndEffects", Enum.RenderPriority.Camera.Value + 1, function(dt)
    local now = os.clock()
    if caption.Text ~= "" and now > captionUntil and phase ~= "loading" then caption.TextTransparency = math.min(1, caption.TextTransparency + dt) end
    camera = workspace.CurrentCamera
    if camera.CameraType == Enum.CameraType.Scriptable then camera.Focus = CFrame.new(focusPoint) end
    if actor and actorAnimator then
        local pivot=actorPivot and actorPivot.Value or actor:GetPivot(); local values={}
        for name,value in pairs(poseValues) do values[name]=value.Value end
        values.target=room.LampBulb.Position; actorAnimator:apply(pivot,now,values)
    end
    music:update(dt,corruption)
    returnButton.Visible=phase=="dream" and UserInputService.TouchEnabled
    lampButton.Visible = phase == "awake" and UserInputService.TouchEnabled
    if phase == "dream" then
        corruption = corruption + (targetCorruption - corruption) * math.min(1, dt * 2.7)
        local k = corruption
        local mood=clamp(k/Config.NavigationCorruptionCap,0,1)
        Lighting.ClockTime=14+mood*3.5; Lighting.Brightness=2.2-mood*.65
        Lighting.Ambient=Color3.fromRGB(118,126,149):Lerp(Color3.fromRGB(68,76,108),mood)
        Lighting.OutdoorAmbient=Color3.fromRGB(131,139,157):Lerp(Color3.fromRGB(78,87,120),mood)
        Lighting.FogStart=30; Lighting.FogEnd=230-mood*95
        Lighting.FogColor=Color3.fromRGB(180,174,201):Lerp(Color3.fromRGB(86,85,124),mood)
        atmosphere.Density=.16+mood*.14; atmosphere.Color=Color3.fromRGB(210,190,208):Lerp(Color3.fromRGB(128,117,160),mood)
        correction.Saturation=-.08-mood*.52; correction.Contrast=.03+mood*.09; correction.TintColor=Color3.new(1,1-mood*.12,1-mood*.03)
        blur.Size=reduced and 0 or mood*.8
        for part,data in pairs(decor) do
            local seed=data.cf.Position.X*.2+data.cf.Position.Z*.07
            local shift=reduced and 0 or math.sin(now*.55+seed)*mood*1.6
            part.CFrame=data.cf*CFrame.new(shift,math.sin(seed+now*.3)*mood*.5,0)*CFrame.Angles(0,0,reduced and 0 or math.sin(seed)*mood*.12)
            part.Color=data.color:Lerp(Color3.fromRGB(25,20,41),mood*.65)
        end
        -- Walkable surfaces stay legible. Only scenery loses its color.
        for part,color in pairs(platformColors) do part.Color=color:Lerp(Color3.fromRGB(118,126,155),mood*.35) end
        local clock=markers:FindFirstChild("ClockPivot")
        if clock then
            local base=clock.CFrame*CFrame.new(0,0,.55)
            dream.ClockMinute.CFrame=base*CFrame.Angles(0,0,now*(reduced and .04 or .22))*CFrame.new(0,2,0)
            dream.ClockHour.CFrame=base*CFrame.Angles(0,0,now*.022)*CFrame.new(0,1.45,0)
        end
        local tick = math.floor(now * 2)
        if tick ~= lastGlitch then
            lastGlitch = tick
            for i, slice in ipairs(slices) do
                local visible = not reduced and k > .24 and i < k * 9
                slice.BackgroundTransparency = visible and (1 - k * .58) or 1
                slice.Position = UDim2.fromScale(0, ((tick * 37 + i * 17) % 97) / 100)
                slice.Size = UDim2.fromScale(1, .005 + ((i * 13 + tick) % 6) / 200)
            end
        end
        if now - phaseAt > 1.3 then fade.BackgroundTransparency=1 end
        local band = k > .59 and 4 or k > .48 and 3 or k > .33 and 2 or k > .18 and 1 or 0
        if band > lastBand then
            lastBand = band; text(({ "The wind stopped.", "You cannot remember the way back.", "Wake up. Wake up. Wake up.", "This is not your dream anymore." })[band])
        end
        label.Text=k<.3 and "DREAM / FOLLOW THE PALE PATH" or k<.52 and "DREAM / SOMETHING IS WRONG" or "DREAM / THE FRONT DOOR IS AHEAD"
    else for _, slice in ipairs(slices) do slice.BackgroundTransparency = 1 end end
    if phase == "awake" and now - phaseAt > 2 then
        local viewport = camera.ViewportSize; local mouse = UserInputService:GetMouseLocation()
        local x = clamp((mouse.X / math.max(1, viewport.X) - .5) * 2, -1, 1)
        local y = clamp((mouse.Y / math.max(1, viewport.Y) - .5) * 2, -1, 1)
        local origin = markers.WakeCamera.Position
        camera.CFrame = CFrame.lookAt(origin, focusPoint) * CFrame.Angles(-y * .12, -x * .38, 0)
    end
end)
player.CharacterAdded:Connect(function(char)
    task.wait(.6)
    if phase=="dream" then
        hideCharacter(false); safetyLight(true)
        camera.CameraSubject=char:WaitForChild("Humanoid"); camera.CameraType=Enum.CameraType.Custom
    end
    action:FireServer("Ready")
end)
local initialCharacter = player.Character or player.CharacterAdded:Wait()
initialCharacter:WaitForChild("HumanoidRootPart")
initialCharacter:WaitForChild("Humanoid")
action:FireServer("Ready")
