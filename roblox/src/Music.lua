local SoundService = game:GetService("SoundService")
local ContentProvider = game:GetService("ContentProvider")
local Music = {}; Music.__index = Music
function Music.new(config)
    local self=setmetatable({sounds={},enabled=true,phase="ready",corruption=0},Music)
    for name,id in pairs(config.Sounds) do
        local s=Instance.new("Sound"); s.Name="OpeningMusic_"..name; s.SoundId=id
        s.Looped=name~="Wake"; s.Volume=0; s.Parent=SoundService; self.sounds[name]=s
        local reverb=Instance.new("ReverbSoundEffect"); reverb.DecayTime=name=="Room" and 1.8 or 3.5
        reverb.WetLevel=name=="Room" and -22 or -15; reverb.DryLevel=0; reverb.Parent=s
        local eq=Instance.new("EqualizerSoundEffect"); eq.Name="DreamFilter"; eq.Parent=s
        task.spawn(function()
            local ok=pcall(function() ContentProvider:PreloadAsync({s}) end)
            if not ok then warn("Opening audio unavailable: "..name..". Replace its Creator Store ID in Config.") end
        end)
    end
    self.sounds.Room.PlaybackSpeed=.93; self.sounds.Drone.PlaybackSpeed=.46
    return self
end
function Music:setEnabled(enabled) self.enabled=enabled end
function Music:setPhase(phase)
    self.phase=phase
    if phase=="awake" then self.sounds.Wake.TimePosition=0; self.sounds.Wake.Volume=self.enabled and .16 or 0; self.sounds.Wake:Play() end
    for name,s in pairs(self.sounds) do if name~="Wake" and not s.IsPlaying then s:Play() end end
end
function Music:update(dt,corruption)
    self.corruption=corruption
    local dream=self.phase=="dream"
    local room=self.phase=="ready" or self.phase=="bedtime" or self.phase=="secondBedtime"
    local day=self.phase=="morning" or self.phase=="breakfast" or self.phase=="leave" or self.phase=="driveWork"
        or self.phase=="work" or self.phase=="cleanup" or self.phase=="return" or self.phase=="driveHome" or self.phase=="home"
    local volumes={Room=room and .12 or day and .055 or 0,Dream=dream and .24 or 0,
        Drone=(dream and math.max(0,corruption-.28)*.16) or (self.phase=="awake" and .075 or 0)}
    for name,target in pairs(volumes) do
        local s=self.sounds[name]; local desired=self.enabled and target or 0
        s.Volume=s.Volume+(desired-s.Volume)*math.min(1,dt*1.4)
    end
    if not self.enabled then self.sounds.Wake.Volume=0 end
    local s=self.sounds.Dream
    s.PlaybackSpeed=1-corruption*.17
    local eq=s:FindFirstChild("DreamFilter"); eq.HighGain=-corruption*12; eq.MidGain=-corruption*3
end
return Music
