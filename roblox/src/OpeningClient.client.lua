local Players=game:GetService("Players")
local ReplicatedStorage=game:GetService("ReplicatedStorage")
local RunService=game:GetService("RunService")
local TweenService=game:GetService("TweenService")
local Lighting=game:GetService("Lighting")
local UIS=game:GetService("UserInputService")
local player=Players.LocalPlayer
local shared=ReplicatedStorage:WaitForChild("OpeningShared")
local Config=require(shared:WaitForChild("Config"))
local State=require(shared:WaitForChild("State"))
local Animator=require(shared:WaitForChild("ActorAnimator"))
local Music=require(shared:WaitForChild("Music"))
local remotes=ReplicatedStorage:WaitForChild("OpeningRemotes")
local action,update=remotes:WaitForChild("Action"),remotes:WaitForChild("Update")
local map=workspace:WaitForChild("OpeningWorld")
local room,dream,markers,day=map:WaitForChild("Bedroom"),map:WaitForChild("Dream"),map:WaitForChild("Markers"),map:WaitForChild("Day")
local actorTemplate=ReplicatedStorage:WaitForChild("OpeningAssets"):WaitForChild("Sleeper")
local camera=workspace.CurrentCamera
local phase,phaseAt,generation="loading",os.clock(),0
local snapshot={phase="loading",breakfast="bread",order=1,job="take",tray={},cleaned={}}
local corruption,targetCorruption,reduced=0,0,false
local actor,actorPivot,actorAnimator=nil,nil,nil
local poseValues,tweens,decor,floaters,floors={},{},{},{},{}
local recoveryToken,captionUntil,lastBand,lastGlitch=0,0,0,-1
local focusPoint,reachTarget=Vector3.new(-5,3,-5),nil
local dreamElapsed,interactionTimes=0,{}
local controls,music,cameraLight=nil,Music.new(Config),nil
local free={dream=true,morning=true,breakfast=true,leave=true,work=true,cleanup=true,["return"]=true,home=true}
local car,carCF,carTarget,carSpeed,driveTimer=nil,nil,nil,0,0
local held,stick={forward=false,back=false,left=false,right=false},Vector2.zero
local function clamp(n,a,b) return math.max(a,math.min(b,n)) end
local function create(class,parent,props)
    local obj=Instance.new(class)
    for k,v in pairs(props or {}) do obj[k]=v end
    obj.Parent=parent; return obj
end
local gui=create("ScreenGui",player:WaitForChild("PlayerGui"),{Name="OpeningUI",ResetOnSpawn=false,IgnoreGuiInset=true,DisplayOrder=100})
local fade=create("Frame",gui,{Name="Fade",Size=UDim2.fromScale(1,1),BackgroundColor3=Color3.new(0,0,0),BackgroundTransparency=0,BorderSizePixel=0,ZIndex=20})
local function label(name,pos,size,text,sizeText)
    return create("TextLabel",gui,{Name=name,Position=pos,Size=size,Text=text,TextSize=sizeText or 17,
        TextColor3=Color3.fromRGB(231,232,235),TextStrokeTransparency=.45,TextWrapped=true,
        TextXAlignment=Enum.TextXAlignment.Left,BackgroundTransparency=1,Font=Enum.Font.Gotham,ZIndex=30})
end
local scene=label("Scene",UDim2.fromScale(.04,.04),UDim2.fromScale(.55,.045),"",12)
local objective=label("Objective",UDim2.fromScale(.04,.105),UDim2.fromScale(.65,.075),"",16)
local caption=label("Caption",UDim2.fromScale(.09,.78),UDim2.fromScale(.82,.13),"",19)
caption.TextXAlignment=Enum.TextXAlignment.Center
local hint=label("Controls",UDim2.fromScale(.04,.94),UDim2.fromScale(.92,.045),"",13)
hint.TextXAlignment=Enum.TextXAlignment.Center
local function button(parent,name,text,pos,size)
    local b=create("TextButton",parent,{Name=name,Text=text,Position=pos,Size=size,TextSize=15,Font=Enum.Font.Gotham,
        TextColor3=Color3.fromRGB(221,226,238),BackgroundColor3=Color3.fromRGB(24,29,43),BackgroundTransparency=.15,BorderSizePixel=0,ZIndex=35})
    create("UICorner",b,{CornerRadius=UDim.new(0,6)}); return b
end
local menu=create("Frame",gui,{Name="Start",Position=UDim2.fromScale(.07,.28),Size=UDim2.fromScale(.55,.45),BackgroundTransparency=1,Visible=false,ZIndex=31})
local title=create("TextLabel",menu,{Size=UDim2.fromScale(1,.35),Text="It's late.",TextScaled=true,Font=Enum.Font.GothamMedium,TextColor3=Color3.fromRGB(233,233,241),TextXAlignment=Enum.TextXAlignment.Left,BackgroundTransparency=1,ZIndex=31})
create("TextLabel",menu,{Position=UDim2.fromScale(0,.4),Size=UDim2.fromScale(1,.22),Text="You should get some sleep.",TextSize=17,TextWrapped=true,Font=Enum.Font.Gotham,TextColor3=Color3.fromRGB(174,184,204),TextXAlignment=Enum.TextXAlignment.Left,BackgroundTransparency=1,ZIndex=31})
local begin=button(menu,"Begin","Go to sleep  >",UDim2.fromScale(0,.72),UDim2.fromScale(.64,.24))
local replay=button(gui,"Replay","Play again",UDim2.fromScale(.75,.86),UDim2.fromScale(.2,.07)); replay.Visible=false
local effects=button(gui,"Effects","Effects: full [V]",UDim2.fromScale(.78,.035),UDim2.fromScale(.19,.043))
local musicButton=button(gui,"Music","Music: on [M]",UDim2.fromScale(.78,.09),UDim2.fromScale(.19,.043))
local lampButton=button(gui,"Lamp","Turn on lamp [E]",UDim2.fromScale(.36,.68),UDim2.fromScale(.28,.06)); lampButton.Visible=false
local returnButton=button(gui,"Return","Return to path",UDim2.fromScale(.75,.72),UDim2.fromScale(.22,.06)); returnButton.Visible=false
local parkButton=button(gui,"Park","Park / get out [E]",UDim2.fromScale(.36,.68),UDim2.fromScale(.28,.06)); parkButton.Visible=false
local drivePad=create("Frame",gui,{Name="DriveControls",Position=UDim2.fromScale(.05,.62),Size=UDim2.fromScale(.29,.28),BackgroundTransparency=1,Visible=false,ZIndex=34})
for _,entry in ipairs({{"forward","W / Go",.34,0},{"back","S / Brake",.34,.66},{"left","A",0,.33},{"right","D",.68,.33}}) do
    local key=entry[1]; local b=button(drivePad,key,entry[2],UDim2.fromScale(entry[3],entry[4]),UDim2.fromScale(.31,.3))
    b.InputBegan:Connect(function(input) if input.UserInputType==Enum.UserInputType.Touch or input.UserInputType==Enum.UserInputType.MouseButton1 then held[key]=true end end)
    b.InputEnded:Connect(function(input) if input.UserInputType==Enum.UserInputType.Touch or input.UserInputType==Enum.UserInputType.MouseButton1 then held[key]=false end end)
end
UIS.WindowFocusReleased:Connect(function() for k in pairs(held) do held[k]=false end; stick=Vector2.zero end)
UIS.InputChanged:Connect(function(input) if input.KeyCode==Enum.KeyCode.Thumbstick1 then stick=Vector2.new(input.Position.X,input.Position.Y) end end)
local slices={}
for i=1,10 do slices[i]=create("Frame",gui,{Size=UDim2.fromScale(1,.01),BackgroundColor3=Color3.fromRGB(3,4,9),BackgroundTransparency=1,BorderSizePixel=0,ZIndex=25}) end
local correction=create("ColorCorrectionEffect",Lighting,{Name="OpeningColor",Saturation=-.12,Contrast=.08})
local blur=create("BlurEffect",Lighting,{Name="OpeningBlur",Size=0})
local atmosphere=Lighting:FindFirstChildOfClass("Atmosphere") or create("Atmosphere",Lighting,{Name="OpeningAtmosphere"})
local roomLamp=room:WaitForChild("LampBulb"):WaitForChild("WarmLight")
local roomLight=room:WaitForChild("CeilingLight"):WaitForChild("RoomLight")
local eyes={room:WaitForChild("EyeLeft"),room:WaitForChild("EyeRight")}
local tv=room.TVScreen; local newsScreen=tv.NewsScreen
local fridge=day.Kitchen.FridgeDoor; local fridgeCF,handleCF=fridge.CFrame,day.Kitchen.FridgeHandle.CFrame
local carColors={}
for _,model in ipairs({day.HomeCar,day.WorkCar}) do for _,p in ipairs(model:GetDescendants()) do if p:IsA("BasePart") then carColors[p]=p.Transparency end end end
local panels={}
for i=1,6 do panels[i]={part=room:WaitForChild("BlanketPanel"..i),stripe=room:WaitForChild("BlanketStripe"..i)} end
local clothOpen=create("NumberValue",nil,{Value=0}); local clothLoft=create("NumberValue",nil,{Value=0})
for _,name in ipairs({"walk","sit","lean","look","reach","sleep","eyes"}) do poseValues[name]=create("NumberValue",nil,{Name=name,Value=0}) end
for _,p in ipairs(dream:GetDescendants()) do
    if p:IsA("BasePart") then
        local data={cf=p.CFrame,color=p.Color}
        if p.Name:sub(1,8)=="Distort_" then decor[p]=data
        elseif p.Name:sub(1,6)=="Float_" then floaters[p]=data end
        if p.Name:sub(1,8)=="Platform" then floors[p]=p.Color end
    end
end
local beacon=create("Part",workspace,{Name="LocalObjective",Shape=Enum.PartType.Ball,Size=Vector3.new(.6,.6,.6),
    Material=Enum.Material.Neon,Color=Color3.fromRGB(248,222,145),Anchored=true,CanCollide=false,CanTouch=false,CanQuery=false,Transparency=1})
local function tween(obj,duration,props)
    local t=TweenService:Create(obj,TweenInfo.new(duration,Enum.EasingStyle.Sine,Enum.EasingDirection.InOut),props)
    table.insert(tweens,t); t:Play(); return t
end
local function cancelTweens() for _,t in ipairs(tweens) do t:Cancel() end; tweens={} end
local function pose(duration,values) for n,v in pairs(values) do tween(poseValues[n],duration,{Value=v}) end end
local function text(message,duration) caption.Text=message; caption.TextTransparency=0; captionUntil=os.clock()+(duration or 5.5) end
local function control(enabled)
    if controls then if enabled then controls:Enable() else controls:Disable() end end
    UIS.MouseBehavior=Enum.MouseBehavior.Default
end
local function hideCharacter(hidden)
    local char=player.Character; if not char then return end
    for _,p in ipairs(char:GetDescendants()) do if p:IsA("BasePart") then p.LocalTransparencyModifier=hidden and 1 or 0 end end
end
local function safetyLight(enabled)
    local root=player.Character and player.Character:FindFirstChild("HumanoidRootPart")
    if root and enabled then
        cameraLight=root:FindFirstChild("DreamSafetyLight") or create("PointLight",root,{Name="DreamSafetyLight",Color=Color3.fromRGB(204,220,255),Brightness=.85,Range=34,Shadows=false})
        cameraLight.Enabled=true
    elseif cameraLight and cameraLight.Parent then cameraLight.Enabled=false end
end
local function hideEyes(duration)
    for _,eye in ipairs(eyes) do tween(eye,duration,{Transparency=1}); tween(eye:FindFirstChildOfClass("PointLight"),duration,{Brightness=0}) end
end
local function cars(home,work)
    for _,entry in ipairs({{day.HomeCar,home},{day.WorkCar,work}}) do
        for _,p in ipairs(entry[1]:GetDescendants()) do if p:IsA("BasePart") then p.Transparency=entry[2] and carColors[p] or 1 end end
    end
end
local function roomMood()
    correction.Saturation=-.12; correction.Contrast=.08; correction.TintColor=Color3.new(1,1,1); blur.Size=0
    Lighting.ClockTime=.23; Lighting.Brightness=1.1; Lighting.Ambient=Color3.fromRGB(31,34,49)
    Lighting.OutdoorAmbient=Color3.fromRGB(37,43,63); Lighting.FogColor=Color3.fromRGB(21,27,46); Lighting.FogStart=40; Lighting.FogEnd=230
    atmosphere.Density=.1; atmosphere.Color=Color3.fromRGB(139,158,192); atmosphere.Decay=Color3.fromRGB(61,69,101)
    roomLamp.Brightness=1.7; roomLight.Brightness=0
end
local function dayMood()
    local evening=phase=="driveHome" or phase=="home"
    Lighting.ClockTime=evening and 18.6 or phase=="work" and 11 or 6.8
    Lighting.Brightness=evening and 1.1 or 2
    Lighting.Ambient=evening and Color3.fromRGB(77,73,98) or Color3.fromRGB(119,126,134)
    Lighting.OutdoorAmbient=evening and Color3.fromRGB(102,88,113) or Color3.fromRGB(143,145,143)
    Lighting.FogStart=120; Lighting.FogEnd=650; Lighting.FogColor=Color3.fromRGB(201,193,180)
    atmosphere.Density=.12; atmosphere.Color=Color3.fromRGB(210,200,183); atmosphere.Decay=Color3.fromRGB(126,133,150)
    correction.Saturation=-.04; correction.Contrast=.03; correction.TintColor=Color3.new(1,1,1); blur.Size=0
    roomLight.Brightness=1.6; roomLamp.Brightness=1.7
end
local function reset()
    roomMood(); clothOpen.Value=0; clothLoft.Value=0; reachTarget=nil
    for _,v in pairs(poseValues) do v.Value=0 end
    for p,data in pairs(decor) do p.CFrame=data.cf; p.Color=data.color end
    for p,data in pairs(floaters) do p.CFrame=data.cf; p.Color=data.color end
    for p,color in pairs(floors) do p.Color=color end
    for _,eye in ipairs(eyes) do eye.Transparency=1; eye:FindFirstChildOfClass("PointLight").Brightness=0 end
    for i=1,3 do dream["Memory"..i].Transparency=0; dream["Memory"..i]:FindFirstChildOfClass("PointLight").Enabled=true end
    for _,p in ipairs(day.Kitchen:GetChildren()) do if p.Name=="Toast" then p.Transparency=1 end end
    fridge.CFrame=fridgeCF; day.Kitchen.FridgeHandle.CFrame=handleCF
    newsScreen.Report.Text=""; tv.TVGlow.Brightness=0; cars(true,false)
    corruption=0; targetCorruption=0; interactionTimes={}; lastBand=0
end
local function spawnActor(marker)
    if actor then actor:Destroy() end
    actor=actorTemplate:Clone(); actor.Name="LocalSleeper"; actor.Parent=workspace
    actor.PrimaryPart=actor:FindFirstChild("Root"); actor:PivotTo((marker or markers.ActorStart).CFrame)
    actorAnimator=Animator.new(actor)
end
local function destroyActor() if actor then actor:Destroy(); actor=nil end; actorAnimator=nil; actorPivot=nil end
local function moveActor(cf,duration,token)
    if token~=generation or not actor then return false end
    local value=create("CFrameValue",nil,{Value=actor:GetPivot()}); actorPivot=value
    local conn=value.Changed:Connect(function(v) if actor and token==generation then actor:PivotTo(v) end end)
    tween(value,duration,{Value=cf}).Completed:Wait()
    conn:Disconnect(); value:Destroy(); if actorPivot==value then actorPivot=nil end
    return token==generation
end
local function waitFor(duration,token) task.wait(duration); return token==generation end
local function bedroomCamera()
    camera.CameraType=Enum.CameraType.Scriptable; camera.FieldOfView=65
    focusPoint=Vector3.new(-5,3.4,-5.5); camera.CFrame=CFrame.lookAt(markers.IntroCamera.Position,focusPoint)
end
local function firstPerson()
    destroyActor(); hideCharacter(false); control(true); player.CameraMode=Enum.CameraMode.LockFirstPerson
    local hum=player.Character and player.Character:FindFirstChildOfClass("Humanoid")
    if hum then camera.CameraSubject=hum end
    camera.CameraType=Enum.CameraType.Custom; camera.FieldOfView=72
end
local function bedtime(token,again)
    reset(); spawnActor(again and markers.ActorBedside or markers.ActorStart); hideCharacter(true); control(false)
    bedroomCamera(); menu.Visible=false; replay.Visible=false; objective.Text=""
    if again then scene.Text="BEDROOM / 22:16"; text("I just need a normal night's sleep.",3)
    else scene.Text="BEDROOM / 00:14"; caption.Text="" end
    fade.BackgroundTransparency=1; hint.Text=""
    if not again then
        poseValues.walk.Value=1
        if not moveActor(markers.ActorWalk1.CFrame,1.5,token) then return end
        if not moveActor(markers.ActorWalk2.CFrame,1,token) then return end
        if not moveActor(CFrame.new(markers.ActorBedside.Position),.8,token) then return end
        pose(.3,{walk=0})
        if not moveActor(markers.ActorBedside.CFrame,.45,token) then return end
    end
    -- Hand lifts the near edge. Cloth rotates around the far mattress edge.
    reachTarget=Vector3.new(-3.52,3.3,-3.5); pose(.6,{reach=1,look=.4})
    if not waitFor(.6,token) then return end
    tween(clothOpen,.95,{Value=1})
    if not waitFor(1,token) then return end
    pose(.4,{reach=0,look=0})
    local facingOut=markers.ActorBedside.CFrame*CFrame.Angles(0,math.pi,0)
    if not moveActor(facingOut,.45,token) then return end
    pose(.8,{sit=1})
    if not moveActor(markers.ActorSit.CFrame,.8,token) then return end
    pose(.65,{sit=.8,lean=.25})
    if not moveActor(CFrame.new(-5.7,3.8,-3.6)*markers.ActorSit.CFrame.Rotation,.65,token) then return end
    pose(1.3,{sit=0,lean=0,sleep=1})
    if not moveActor(markers.ActorSleep.CFrame,1.3,token) then return end
    -- Already underneath the open blanket; settle it over the body.
    clothLoft.Value=1; reachTarget=Vector3.new(-8.7,3.4,-6.3); pose(.4,{reach=.8})
    tween(clothOpen,1.1,{Value=0}); if not waitFor(1.2,token) then return end
    pose(.6,{reach=0,eyes=1})
    roomLamp.Brightness=0; if not waitFor(.9,token) then return end
    local head=actor.Head; focusPoint=head.Position
    tween(camera,1.2,{CFrame=CFrame.lookAt(head.Position+Vector3.new(1.5,4.3,4.2),head.Position),FieldOfView=52}).Completed:Wait()
    if token~=generation then return end
    tween(camera,3.4,{CFrame=CFrame.lookAt(head.Position+Vector3.new(.01,.22,.05),head.Position),FieldOfView=38})
    if not waitFor(2.6,token) then return end
    tween(fade,.8,{BackgroundTransparency=0}); if not waitFor(.9,token) then return end
    action:FireServer(again and "SleepAgain" or "EnterDream")
end
local function getUp(token)
    tween(roomLamp,.55,{Brightness=2}); tween(roomLight,.55,{Brightness=1.3})
    focusPoint=Vector3.new(-5,3.4,-5.5)
    tween(camera,.8,{CFrame=CFrame.lookAt(markers.IntroCamera.Position,focusPoint),FieldOfView=65})
    pose(.3,{eyes=0}); tween(clothOpen,.65,{Value=1})
    if not waitFor(.7,token) then return end
    pose(.6,{sleep=0,sit=.8})
    if not moveActor(CFrame.new(-5.7,3.8,-3.6)*markers.ActorSit.CFrame.Rotation,.6,token) then return end
    pose(.6,{sit=1})
    if not moveActor(markers.ActorSit.CFrame,.65,token) then return end
    pose(1.2,{sit=0,lean=0})
    if not moveActor(markers.ActorBedside.CFrame,1.2,token) then return end
    tween(clothLoft,.65,{Value=0}); tween(clothOpen,.65,{Value=0})
    if not waitFor(.8,token) then return end
    action:FireServer("Stand")
end
local function newsSequence(token,elapsed)
    spawnActor(markers.ActorCouchApproach); poseValues.sit.Value=0; poseValues.sleep.Value=0; poseValues.eyes.Value=0
    hideCharacter(true); control(false); player.CameraMode=Enum.CameraMode.Classic
    camera.CameraType=Enum.CameraType.Scriptable; focusPoint=markers.ActorCouch.Position
    camera.CFrame=CFrame.lookAt(Vector3.new(-1,7,11),focusPoint); camera.FieldOfView=60
    pose(.85,{sit=1})
    if not moveActor(markers.ActorCouch.CFrame,.85,token) then return end
    if not waitFor(.4,token) then return end
    camera.CameraType=Enum.CameraType.Scriptable; camera.FieldOfView=55
    focusPoint=tv.Position
    tween(camera,.9,{CFrame=CFrame.lookAt(markers.TVView.Position+Vector3.new(.3,0,2),focusPoint)})
    tv.TVGlow.Brightness=1.1; newsScreen.Headline.Text="TWO OVERNIGHT DEATHS"
    local last=-1
    while token==generation and phase=="news" do
        local t=os.clock()-phaseAt
        local index=math.min(#Config.News,math.floor(t/(Config.NewsDuration/#Config.News))+1)
        if index~=last then last=index; newsScreen.Report.Text=Config.News[index]; text("News anchor: "..Config.News[index],6.5) end
        task.wait(.2)
    end
end
local function refreshPrompts()
    snapshot.phase=phase
    for _,obj in ipairs(day.Interactions:GetChildren()) do
        obj.Use.Enabled=obj.Name=="coworker" and (phase=="work" or phase=="cleanup" or phase=="return")
            or State.promptEnabled(snapshot,obj.Name,Config)
    end
    for _,p in ipairs(dream:GetDescendants()) do if p:IsA("ProximityPrompt") then p.Enabled=phase=="dream" end end
end
local function change(nextPhase,elapsed)
    local old=phase; generation=generation+1; local token=generation; cancelTweens()
    phase=nextPhase; phaseAt=os.clock()-(elapsed or 0); snapshot.phase=phase
    music:setPhase(phase); safetyLight(phase=="dream")
    menu.Visible=false; replay.Visible=false; lampButton.Visible=false; parkButton.Visible=false
    if car then car:Destroy(); car=nil end
    carCF=nil; carTarget=nil; carSpeed=0; for k in pairs(held) do held[k]=false end
    if phase=="ready" then
        reset(); spawnActor(); hideCharacter(true); control(false); bedroomCamera()
        player.CameraMode=Enum.CameraMode.Classic; menu.Visible=true; fade.BackgroundTransparency=1
        scene.Text="BEDROOM / 00:14"; caption.Text=""; objective.Text=""; hint.Text=""
        local loading=player.PlayerGui:FindFirstChild("OpeningLoading"); if loading then loading:Destroy() end
    elseif phase=="bedtime" or phase=="secondBedtime" then
        if phase=="secondBedtime" then fade.BackgroundTransparency=0 end
        task.spawn(bedtime,token,phase=="secondBedtime")
    elseif phase=="dream" then
        firstPerson(); blur.Size=0; dreamElapsed=elapsed or 0
        scene.Text="DREAM"; hint.Text=UIS.TouchEnabled and "Explore. Touch objects to interact." or "WASD: explore   E: interact   R: return to path   M: music"
        text("Everything is familiar. Nothing is where it belongs."); tween(fade,1.2,{BackgroundTransparency=1})
    elseif phase=="blackout" then
        control(false); hideCharacter(true); scene.Text=""; objective.Text=""; hint.Text=""; caption.Text=""
        tween(fade,.55,{BackgroundTransparency=0})
    elseif phase=="awake" then
        reset(); spawnActor(markers.ActorSleep); clothLoft.Value=1; poseValues.sleep.Value=1
        hideCharacter(true); control(false); player.CameraMode=Enum.CameraMode.Classic
        camera.CameraType=Enum.CameraType.Scriptable; camera.FieldOfView=63
        focusPoint=markers.EyeTarget.Position; camera.CFrame=CFrame.lookAt(markers.WakeCamera.Position,focusPoint)
        roomLamp.Brightness=0; roomLight.Brightness=0; Lighting.Brightness=.25
        Lighting.Ambient=Color3.fromRGB(8,10,19); Lighting.OutdoorAmbient=Color3.fromRGB(14,18,30)
        correction.Saturation=-.35; atmosphere.Density=.08
        fade.BackgroundTransparency=0; tween(fade,1.7,{BackgroundTransparency=1})
        blur.Size=reduced and 0 or 5; tween(blur,2.5,{Size=0})
        scene.Text="BEDROOM / 06:42"; hint.Text="Look toward the closet."; text("I'm awake... right?",3)
        task.delay(math.max(0,Config.EyeDelay-(elapsed or 0)),function()
            if token~=generation then return end
            for _,eye in ipairs(eyes) do tween(eye,1.4,{Transparency=0}); tween(eye:FindFirstChildOfClass("PointLight"),1.4,{Brightness=1.4}) end
            text("There is something in the closet.",5)
        end)
    elseif phase=="lightsOut" then
        hideEyes(.8); hint.Text="E / gamepad X: turn on the lamp"; text("Gone. It was there a second ago.",4)
    elseif phase=="getup" then
        hint.Text=""; text("Just get up. Turn on the news.",4); task.spawn(getUp,token)
    elseif phase=="news" then
        dayMood(); scene.Text="MORNING NEWS / 06:42"; hint.Text="Watch the report. M: music"
        task.spawn(newsSequence,token,elapsed or 0)
    elseif phase=="driveWork" or phase=="driveHome" then
        destroyActor(); hideCharacter(true); control(false); dayMood(); cars(false,false)
        player.CameraMode=Enum.CameraMode.Classic; camera.CameraType=Enum.CameraType.Scriptable; camera.FieldOfView=70
        car=day.HomeCar:Clone(); car.Name="LocalDrivingCar"; car.Parent=workspace
        for _,p in ipairs(car:GetDescendants()) do if p:IsA("BasePart") then p.Transparency=p.Name=="Root" and 1 or (p.Name:find("Glass") and .3 or p.Name=="Windshield" and .25 or 0) end end
        local origin=car:GetPivot()
        for _,part in ipairs({
            {"DriverTorso",Vector3.new(1.3,1,.7),Vector3.new(-1.3,.7,.65),Color3.fromRGB(110,134,164)},
            {"DriverHead",Vector3.new(1.1,1,1),Vector3.new(-1.3,1.55,.45),Color3.fromRGB(221,184,155)},
            {"DriverHair",Vector3.new(1.16,.22,1.05),Vector3.new(-1.3,2.08,.45),Color3.fromRGB(43,33,44)},
            {"DriverEyeL",Vector3.new(.1,.1,.05),Vector3.new(-1.52,1.65,-.07),Color3.fromRGB(40,33,39)},
            {"DriverEyeR",Vector3.new(.1,.1,.05),Vector3.new(-1.08,1.65,-.07),Color3.fromRGB(40,33,39)},
        }) do create("Part",car,{Name=part[1],Size=part[2],CFrame=origin*CFrame.new(part[3]),Color=part[4],Anchored=true,CanCollide=false,CanTouch=false,CanQuery=false}) end
        local marker=phase=="driveWork" and markers.CarHome or markers.CarWork
        carTarget=marker.CFrame; carCF=carTarget; car:PivotTo(carCF)
        scene.Text=phase=="driveWork" and "COMMUTE / 07:40" or "DRIVING HOME / 18:05"
        hint.Text="W / S: accelerate / brake   A / D: steer   E: park near destination"
        tween(fade,.4,{BackgroundTransparency=1})
    elseif free[phase] then
        firstPerson(); dayMood(); fade.BackgroundTransparency=1
        scene.Text=({morning="BEDROOM / 06:42",breakfast="KITCHEN / 07:05",leave="HOME / 07:20",work="WORK / 08:00",
            cleanup="END OF SHIFT / 16:30",["return"]="WORK / 17:10",home="HOME / 20:50"})[phase] or ""
        hint.Text=UIS.TouchEnabled and "Walk to the glowing marker. Touch a prompt to interact." or "WASD: walk   E: interact   M: music"
        if phase=="breakfast" and old=="news" then text("I should probably eat some breakfast.",5)
        elseif phase=="work" and old=="driveWork" then cars(false,true); text("Coworker: Morning. Register's yours. Three orders, then we can clean up.",6)
        elseif phase=="home" then cars(true,false); text("Home. Maybe tonight will be better.",5)
        elseif phase=="morning" then text("The room looks normal. I'll put the TV on.",5) end
    elseif phase=="complete" then
        destroyActor(); hideCharacter(true); control(false); fade.BackgroundTransparency=0
        scene.Text=""; objective.Text=""; hint.Text=""; text("Later that night...",100); replay.Visible=true
    end
    refreshPrompts()
end
local function toggleMusic() music:setEnabled(not music.enabled); musicButton.Text=music.enabled and "Music: on [M]" or "Music: off [M]" end
local function toggleEffects() reduced=not reduced; effects.Text=reduced and "Effects: reduced [V]" or "Effects: full [V]" end
begin.Activated:Connect(function() action:FireServer("Begin") end)
replay.Activated:Connect(function() action:FireServer("Begin") end)
musicButton.Activated:Connect(toggleMusic); effects.Activated:Connect(toggleEffects)
lampButton.Activated:Connect(function() if phase=="lightsOut" then action:FireServer("Lamp") end end)
parkButton.Activated:Connect(function() action:FireServer("Park") end)
returnButton.Activated:Connect(function() if phase=="dream" then action:FireServer("Return") end end)
UIS.InputBegan:Connect(function(input,processed)
    if processed then return end
    if input.KeyCode==Enum.KeyCode.M then toggleMusic()
    elseif input.KeyCode==Enum.KeyCode.V then toggleEffects()
    elseif (input.KeyCode==Enum.KeyCode.R or input.KeyCode==Enum.KeyCode.ButtonY) and phase=="dream" then action:FireServer("Return")
    elseif input.KeyCode==Enum.KeyCode.E or input.KeyCode==Enum.KeyCode.ButtonX then
        if phase=="ready" then action:FireServer("Begin")
        elseif phase=="lightsOut" then action:FireServer("Lamp")
        elseif phase=="driveWork" or phase=="driveHome" then action:FireServer("Park") end
    end
end)
local function pauseForRecovery(duration)
    recoveryToken=recoveryToken+1; local token,gen=recoveryToken,generation
    control(false); local hum=player.Character and player.Character:FindFirstChildOfClass("Humanoid")
    if hum then hum:Move(Vector3.zero) end
    task.delay(duration or .65,function() if token==recoveryToken and gen==generation and free[phase] then control(true) end end)
end
local function dayInteraction(kind)
    if kind=="fridge" then
        local hinge=CFrame.new(-14,4,22.9)
        tween(fridge,.6,{CFrame=hinge*CFrame.Angles(0,math.rad(82),0)*hinge:Inverse()*fridgeCF})
        tween(day.Kitchen.FridgeHandle,.6,{CFrame=hinge*CFrame.Angles(0,math.rad(82),0)*hinge:Inverse()*handleCF})
        local token=generation
        task.delay(1.8,function() if token==generation then tween(fridge,.6,{CFrame=fridgeCF}); tween(day.Kitchen.FridgeHandle,.6,{CFrame=handleCF}) end end)
    elseif kind=="toaster" then text("The toaster ticks. Wait for it to pop.",4)
    elseif kind=="eat" then
        for _,p in ipairs(day.Kitchen:GetChildren()) do if p.Name=="Toast" then p.Transparency=1 end end
    end
end
update.OnClientEvent:Connect(function(kind,data)
    if kind=="Phase" then
        snapshot=data
        if data.phase~=phase then change(data.phase,data.sceneElapsed) else refreshPrompts() end
        objective.Text=data.objective or ""
        if phase=="dream" then targetCorruption=data.corruption or 0; dreamElapsed=data.dreamElapsed or dreamElapsed
            if data.recovering and data.recovering>0 then pauseForRecovery(data.recovering) end
            for i=1,3 do if data.memories and data.memories[i] then dream["Memory"..i].Transparency=1; dream["Memory"..i]:FindFirstChildOfClass("PointLight").Enabled=false end end
        elseif phase=="breakfast" and data.breakfast=="eat" then
            for _,p in ipairs(day.Kitchen:GetChildren()) do if p.Name=="Toast" then p.Transparency=0 end end
            text("The toast pops up. Breakfast is ready.",4)
        end
    elseif kind=="Text" then text(data.text)
    elseif kind=="Recovery" then pauseForRecovery(data.duration)
    elseif kind=="Corruption" then targetCorruption=clamp(data.value,0,Config.NavigationCorruptionCap); dreamElapsed=data.elapsed or dreamElapsed
    elseif kind=="Memory" then
        if data.index<=3 then local p=dream["Memory"..data.index]; p.Transparency=1; p:FindFirstChildOfClass("PointLight").Enabled=false end
    elseif kind=="DreamInteraction" then interactionTimes[data.index]=os.clock()
    elseif kind=="DayInteraction" then dayInteraction(data.kind)
    elseif kind=="Drive" then carTarget=CFrame.new(data.x,2.3,data.z)*CFrame.Angles(0,data.yaw,0); carSpeed=data.speed end
end)
local function waypoint()
    if phase=="driveWork" then return markers.CarWork.Position elseif phase=="driveHome" then return markers.CarHome.Position end
    if not free[phase] or phase=="dream" then return nil end
    local kind=nil
    if phase=="morning" then kind="tv"
    elseif phase=="breakfast" then kind=({bread="fridge",toast="toaster",eat="eat"})[snapshot.breakfast]
    elseif phase=="leave" then kind="carHome" elseif phase=="return" then kind="carWork"
    elseif phase=="home" then kind="bed"
    elseif phase=="cleanup" then kind=not snapshot.cleaned.counter and "counter" or "trash"
    elseif phase=="work" then
        if snapshot.job=="take" then kind="order"
        else
            for _,food in ipairs(Config.Orders[snapshot.order].items) do if not snapshot.tray[food] then kind=food; break end end
            kind=kind or "serve"
        end
    end
    return kind and day.Interactions[kind].Position or nil
end
local function cloth()
    local hinge=CFrame.new(-10.35,2.35,-4.85)*CFrame.Angles(0,0,math.rad(72)*clothOpen.Value)
    for i,p in ipairs(panels) do
        local x=(i-.5)*6.7/6; local height=math.sin(math.pi*x/6.7)*1.15*clothLoft.Value
        local tilt=math.cos(math.pi*x/6.7)*.4*clothLoft.Value
        p.part.CFrame=hinge*CFrame.new(x,height,0)*CFrame.Angles(0,0,tilt)
        p.stripe.CFrame=p.part.CFrame*CFrame.new(0,.08,0)
    end
end
RunService:BindToRenderStep("OpeningCameraAndEffects",Enum.RenderPriority.Camera.Value+1,function(dt)
    local now=os.clock(); camera=workspace.CurrentCamera
    if caption.Text~="" and now>captionUntil then caption.TextTransparency=math.min(1,caption.TextTransparency+dt) end
    if camera.CameraType==Enum.CameraType.Scriptable then camera.Focus=CFrame.new(focusPoint) end
    if not free[phase] then hideCharacter(true) end
    cloth()
    if actor and actorAnimator then
        local values={}; for name,value in pairs(poseValues) do values[name]=value.Value end
        values.target=reachTarget or room.LampBulb.Position
        actorAnimator:apply(actorPivot and actorPivot.Value or actor:GetPivot(),now,values)
    end
    music:update(dt,corruption)
    lampButton.Visible=phase=="lightsOut" and now-phaseAt>=1
    returnButton.Visible=phase=="dream" and UIS.TouchEnabled
    parkButton.Visible=phase=="driveWork" or phase=="driveHome"
    drivePad.Visible=parkButton.Visible and UIS.TouchEnabled
    local goal=waypoint()
    beacon.Transparency=goal and .2 or 1
    if goal then beacon.Position=goal+Vector3.new(0,3+math.sin(now*2)*.25,0) end
    if phase=="driveWork" or phase=="driveHome" then
        if car and carTarget then
            carCF=(carCF or carTarget):Lerp(carTarget,math.min(1,dt*12)); car:PivotTo(carCF)
            focusPoint=(carCF*CFrame.new(0,1,-5)).Position
            camera.CFrame=CFrame.lookAt((carCF*CFrame.new(0,8,17)).Position,focusPoint)
            local dist=goal and (carCF.Position-goal).Magnitude or 0
            objective.Text=(snapshot.objective or "").."  /  "..math.floor(dist).." studs"
            scene.Text=(phase=="driveWork" and "TO WORK" or "TO HOME").." / SPEED "..math.floor(math.abs(carSpeed))
        end
        driveTimer=driveTimer+dt
        if driveTimer>=.075 then
            driveTimer=0
            local f=(held.forward or UIS:IsKeyDown(Enum.KeyCode.W) or UIS:IsKeyDown(Enum.KeyCode.Up)) and 1 or 0
            local b=(held.back or UIS:IsKeyDown(Enum.KeyCode.S) or UIS:IsKeyDown(Enum.KeyCode.Down)) and 1 or 0
            local l=(held.left or UIS:IsKeyDown(Enum.KeyCode.A) or UIS:IsKeyDown(Enum.KeyCode.Left)) and 1 or 0
            local r=(held.right or UIS:IsKeyDown(Enum.KeyCode.D) or UIS:IsKeyDown(Enum.KeyCode.Right)) and 1 or 0
            local throttle=f-b; local steer=r-l
            if math.abs(stick.Y)>.15 then throttle=stick.Y end; if math.abs(stick.X)>.15 then steer=stick.X end
            action:FireServer("DriveInput",throttle,steer)
        end
    end
    if phase=="dream" then
        corruption=corruption+(targetCorruption-corruption)*math.min(1,dt*2.7)
        local k=corruption; local mood=clamp(k/Config.NavigationCorruptionCap,0,1)
        Lighting.ClockTime=14+mood*3.5; Lighting.Brightness=2.2-mood*.65
        Lighting.Ambient=Color3.fromRGB(142,139,166):Lerp(Color3.fromRGB(68,76,108),mood)
        Lighting.OutdoorAmbient=Color3.fromRGB(152,147,172):Lerp(Color3.fromRGB(78,87,120),mood)
        Lighting.FogStart=30; Lighting.FogEnd=260-mood*110
        Lighting.FogColor=Color3.fromRGB(206,187,207):Lerp(Color3.fromRGB(86,85,124),mood)
        atmosphere.Density=.12+mood*.14; atmosphere.Color=Color3.fromRGB(225,201,220):Lerp(Color3.fromRGB(128,117,160),mood)
        correction.Saturation=.04-mood*.6; correction.Contrast=.03+mood*.09
        correction.TintColor=Color3.new(1,1-mood*.12,1-mood*.03); blur.Size=reduced and 0 or mood*.8
        for p,data in pairs(decor) do
            local seed=data.cf.Position.X*.2+data.cf.Position.Z*.07
            local shift=reduced and 0 or math.sin(now*.55+seed)*mood*1.6
            p.CFrame=data.cf*CFrame.new(shift,math.sin(seed+now*.3)*mood*.5,0)*CFrame.Angles(0,0,reduced and 0 or math.sin(seed)*mood*.12)
            p.Color=data.color:Lerp(Color3.fromRGB(25,20,41),mood*.75)
        end
        for p,data in pairs(floaters) do
            local seed=data.cf.Position.X*.13+data.cf.Position.Z*.07
            local y=math.sin(now*.65+seed)*.35
            local rot=0
            if p.Name:find("Rain") then y=(now*.7+seed)%6
            elseif p.Name:find("Lantern") and interactionTimes[6] then y=y+math.min(18,(now-interactionTimes[6])*1.6)
            elseif p.Name:find("TeaStar") and interactionTimes[5] then rot=(now-interactionTimes[5])*.8
            elseif p.Name=="Float_Receiver" and interactionTimes[4] then y=y+math.max(0,1-(now-interactionTimes[4])/4) end
            p.CFrame=data.cf*CFrame.new(0,y,0)*CFrame.Angles(0,rot,0)
            p.Color=data.color:Lerp(Color3.fromRGB(31,24,43),mood*.7)
        end
        for p,c in pairs(floors) do p.Color=c:Lerp(Color3.fromRGB(118,126,155),mood*.35) end
        local base=markers.ClockPivot.CFrame*CFrame.new(0,0,.55)
        dream.ClockMinute.CFrame=base*CFrame.Angles(0,0,now*.12)*CFrame.new(0,2,0)
        dream.ClockHour.CFrame=base*CFrame.Angles(0,0,now*.022)*CFrame.new(0,1.45,0)
        local tick=math.floor(now*2)
        if tick~=lastGlitch then lastGlitch=tick
            for i,slice in ipairs(slices) do
                slice.BackgroundTransparency=not reduced and k>.24 and i<k*9 and (1-k*.58) or 1
                slice.Position=UDim2.fromScale(0,((tick*37+i*17)%97)/100); slice.Size=UDim2.fromScale(1,.005+((i*13+tick)%6)/200)
            end
        end
        if now-phaseAt>1.3 then fade.BackgroundTransparency=1 end
        local band=k>.59 and 4 or k>.48 and 3 or k>.33 and 2 or k>.18 and 1 or 0
        if band>lastBand then lastBand=band; text(({"The rain stopped rising.","Everything is listening.","Something is trying to wake you.","Those shadows aren't yours."})[band]) end
        scene.Text=k<.18 and "DREAM / THERE IS NO HURRY" or k<.48 and "DREAM / SOMETHING IS WRONG" or "DREAM / WAKE UP"
    else for _,slice in ipairs(slices) do slice.BackgroundTransparency=1 end end
    if (phase=="awake" or phase=="lightsOut") and now-phaseAt>1 then
        local view=camera.ViewportSize; local mouse=UIS:GetMouseLocation()
        local x=clamp((mouse.X/math.max(1,view.X)-.5)*2,-1,1)
        local y=clamp((mouse.Y/math.max(1,view.Y)-.5)*2,-1,1)
        camera.CFrame=CFrame.lookAt(markers.WakeCamera.Position,markers.EyeTarget.Position)*CFrame.Angles(-y*.12,-x*.3,0)
    end
end)
player.CharacterAdded:Connect(function(char)
    char.DescendantAdded:Connect(function(p) if p:IsA("BasePart") and not free[phase] then p.LocalTransparencyModifier=1 end end)
    task.spawn(function()
        local hum=char:WaitForChild("Humanoid",20); char:WaitForChild("HumanoidRootPart",20)
        hideCharacter(not free[phase])
        if free[phase] and hum then camera.CameraSubject=hum; camera.CameraType=Enum.CameraType.Custom; safetyLight(phase=="dream") end
        action:FireServer("Ready")
    end)
end)
-- UI and event receivers exist BEFORE asking the server to spawn a character.
task.spawn(function()
    local ok,result=pcall(function() return require(player:WaitForChild("PlayerScripts"):WaitForChild("PlayerModule",20)):GetControls() end)
    if ok then controls=result; control(free[phase] or false) end
end)
refreshPrompts()
action:FireServer("Ready")
