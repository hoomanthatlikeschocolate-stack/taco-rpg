local State = {}
local function clamp(v, lo, hi)
    return math.max(lo, math.min(hi, v))
end
function State.new(now)
    return { phase = "ready", startedAt = now, dreamAt = 0, corruption = 0,
        furthest = 0, lights = {}, checkpoint = 1, completed = false, lampAt = -100 }
end
function State.begin(s, now)
    if s.phase ~= "ready" and not (s.phase == "awake" and s.completed) then return false end
    s.phase = "bedtime"; s.startedAt = now; s.dreamAt = 0; s.corruption = 0
    s.furthest = 0; s.lights = {}; s.checkpoint = 1; s.completed = false; s.lampAt = -100
    return true
end
function State.enterDream(s, now, config)
    if s.phase ~= "bedtime" or now - s.startedAt < config.MinimumBedtime then return false end
    s.phase = "dream"; s.dreamAt = now; return true
end
function State.collect(s, index)
    if type(index) ~= "number" or index < 1 or index > 3 or index % 1 ~= 0 then return false end
    if s.phase ~= "dream" or s.lights[index] then return false end
    s.lights[index] = true; return true
end
function State.tick(s, now, progress, config)
    if s.phase == "dream" then
        s.furthest = math.max(s.furthest, clamp(progress, 0, 1))
        local timed = clamp((now - s.dreamAt - config.CorruptionDelay) / config.CorruptionDuration, 0, 1)
        s.corruption = math.max(s.corruption, math.min(.94, s.furthest), timed)
        if now - s.dreamAt >= config.DreamTimeout or s.corruption >= .998 then
            s.phase = "blackout"; s.startedAt = now; return "blackout"
        end
    elseif s.phase == "blackout" and now - s.startedAt >= 2.2 then
        s.phase = "awake"; s.startedAt = now; return "awake"
    elseif s.phase == "awake" and not s.completed and now - s.startedAt >= config.ReplayDelay then
        s.completed = true; return "complete"
    end
    return nil
end
function State.exit(s, now, distance)
    if s.phase ~= "dream" or s.corruption < .72 or distance > 14 then return false end
    s.phase = "blackout"; s.startedAt = now; return true
end
function State.lamp(s, now)
    if s.phase ~= "awake" or now - s.lampAt < 1.6 then return false end
    s.lampAt = now; return true
end
return State
