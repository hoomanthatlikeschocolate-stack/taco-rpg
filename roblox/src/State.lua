local State = {}
local function clamp(v,lo,hi) return math.max(lo,math.min(hi,v)) end
local function set(s,phase,now) s.phase=phase; s.startedAt=now; return phase end
function State.new(now)
    return {phase="ready",startedAt=now,dreamAt=0,corruption=0,furthest=0,lights={},checkpoint=1,
        completed=false,lampAt=-100,recoveringUntil=0,recoverySerial=0,portalAt=-100,
        breakfast="bread",toastAt=0,order=1,job="take",tray={},cleaned={},driving=nil}
end
function State.begin(s,now)
    if s.phase~="ready" and s.phase~="complete" then return false end
    local fresh=State.new(now); fresh.recoverySerial=s.recoverySerial+1
    for k in pairs(s) do s[k]=nil end
    for k,v in pairs(fresh) do s[k]=v end
    set(s,"bedtime",now); return true
end
function State.enterDream(s,now,c)
    if s.phase~="bedtime" or now-s.startedAt<c.MinimumBedtime then return false end
    set(s,"dream",now); s.dreamAt=now; return true
end
function State.collect(s,index)
    if type(index)~="number" or index<1 or index>10 or index%1~=0 then return false end
    if s.phase~="dream" or s.lights[index] then return false end
    s.lights[index]=true; return true
end
function State.tick(s,now,progress,c)
    if s.phase=="dream" then
        s.furthest=math.max(s.furthest,clamp(progress,0,1))
        -- No location, interaction or portal can bypass the quiet first 45 seconds.
        local elapsed=now-s.dreamAt
        local timed=clamp((elapsed-c.CorruptionDelay)/c.CorruptionDuration,0,1)
        s.corruption=math.min(c.NavigationCorruptionCap,timed*c.NavigationCorruptionCap)
        if elapsed>=c.DreamTimeout then return set(s,"blackout",now) end
    elseif s.phase=="blackout" and now-s.startedAt>=2.2 then
        return set(s,"awake",now)
    elseif s.phase=="awake" and now-s.startedAt>=c.EyeVanishDelay then
        return set(s,"lightsOut",now)
    elseif s.phase=="news" and now-s.startedAt>=c.NewsDuration then
        return set(s,"breakfast",now)
    elseif s.phase=="breakfast" and s.breakfast=="toasting" and now-s.toastAt>=c.ToastDuration then
        s.breakfast="eat"; return "breakfastUpdate"
    end
    return nil
end
-- Doors belong to the dream. Only its timer wakes the player.
function State.exit() return false end
function State.lamp(s,now)
    if s.phase~="lightsOut" or now-s.startedAt<1 or now-s.lampAt<1.6 then return false end
    s.lampAt=now; set(s,"getup",now); return true
end
function State.stand(s,now,c)
    if s.phase~="getup" or now-s.startedAt<c.GetUpDuration then return false end
    set(s,"morning",now); return true
end
function State.recover(s,now,c)
    if s.phase~="dream" or now<s.recoveringUntil then return false end
    s.recoverySerial=s.recoverySerial+1
    s.recoveringUntil=now+c.RecoveryControlDelay+.3
    return s.recoverySerial
end
function State.portal(s,now)
    if s.phase~="dream" or now-s.portalAt<1.5 then return false end
    s.portalAt=now; return true
end
function State.interact(s,kind,now,c)
    if kind=="tv" and s.phase=="morning" then set(s,"news",now); return true
    elseif kind=="fridge" and s.phase=="breakfast" and s.breakfast=="bread" then
        s.breakfast="toast"; return true
    elseif kind=="toaster" and s.phase=="breakfast" and s.breakfast=="toast" then
        s.breakfast="toasting"; s.toastAt=now; return true
    elseif kind=="eat" and s.phase=="breakfast" and s.breakfast=="eat" then
        set(s,"leave",now); return true
    elseif kind=="carHome" and s.phase=="leave" then set(s,"driveWork",now); return true
    elseif kind=="carWork" and s.phase=="return" then set(s,"driveHome",now); return true
    elseif kind=="bed" and s.phase=="home" then set(s,"secondBedtime",now); return true
    end
    if s.phase=="work" then
        local order=c.Orders[s.order]
        if kind=="order" and s.job=="take" then s.job="prepare"; s.tray={}; return true end
        if s.job=="prepare" then
            for _,food in ipairs(order.items) do
                if kind==food and not s.tray[food] then s.tray[food]=true; return true end
            end
            if kind=="serve" then
                for _,food in ipairs(order.items) do if not s.tray[food] then return false end end
                if s.order>=#c.Orders then set(s,"cleanup",now)
                else s.order=s.order+1; s.job="take"; s.tray={} end
                return true
            end
        end
    elseif s.phase=="cleanup" and (kind=="counter" or kind=="trash") and not s.cleaned[kind] then
        s.cleaned[kind]=true
        if s.cleaned.counter and s.cleaned.trash then set(s,"return",now) end
        return true
    end
    return false
end
function State.arrive(s,now)
    if s.phase=="driveWork" then s.driving=nil; set(s,"work",now); return true
    elseif s.phase=="driveHome" then s.driving=nil; set(s,"home",now); return true end
    return false
end
function State.finish(s,now,c)
    if s.phase~="secondBedtime" or now-s.startedAt<c.MinimumBedtime then return false end
    s.completed=true; set(s,"complete",now); return true
end
function State.objective(s,c)
    local goals={
        dream="Explore the dream. Touch the things that feel familiar.",
        awake="Stay still. Watch the closet.",
        lightsOut="The red light is gone. Turn on the bedside lamp [E].",
        getup="Get out of bed.",
        morning="Sit on the couch and turn on the TV.",
        news="Watch the morning news.",
        leave="Go outside and get into your car.",
        driveWork="Drive up the road to work. Slow down and park [E].",
        driveHome="Drive back home. Slow down and park [E].",
        ["return"]="Your shift is over. Get in the car outside.",
        home="Go inside. Return to your bed.",
        secondBedtime="It's been a long day.",
        complete="Day one complete.",
    }
    if s.phase=="breakfast" then return ({
        bread="Breakfast: open the fridge and take the bread.",
        toast="Put the bread in the toaster.",
        toasting="Wait for the toast. The kitchen is quiet.",
        eat="Eat the toast on the counter.",
    })[s.breakfast] end
    if s.phase=="work" then
        if s.job=="take" then return "Order "..s.order.."/"..#c.Orders..": greet the customer at the register." end
        local missing={}
        for _,food in ipairs(c.Orders[s.order].items) do if not s.tray[food] then table.insert(missing,food) end end
        if #missing==0 then return "Order "..s.order..": take the tray to the pickup counter." end
        return "Order "..s.order..": prepare "..table.concat(missing,", ").."."
    end
    if s.phase=="cleanup" then
        if not s.cleaned.counter then return "Close the shift: wipe the counter." end
        return "Close the shift: empty the trash."
    end
    return goals[s.phase] or ""
end
function State.promptEnabled(s,kind,c)
    if kind=="tv" then return s.phase=="morning"
    elseif kind=="fridge" then return s.phase=="breakfast" and s.breakfast=="bread"
    elseif kind=="toaster" then return s.phase=="breakfast" and s.breakfast=="toast"
    elseif kind=="eat" then return s.phase=="breakfast" and s.breakfast=="eat"
    elseif kind=="carHome" then return s.phase=="leave"
    elseif kind=="carWork" then return s.phase=="return"
    elseif kind=="bed" then return s.phase=="home"
    elseif kind=="order" then return s.phase=="work" and s.job=="take"
    elseif kind=="serve" then
        if s.phase~="work" or s.job~="prepare" then return false end
        for _,food in ipairs(c.Orders[s.order].items) do if not s.tray[food] then return false end end
        return true
    elseif kind=="counter" or kind=="trash" then return s.phase=="cleanup" and not s.cleaned[kind] end
    if s.phase=="work" and s.job=="prepare" and not s.tray[kind] then
        for _,food in ipairs(c.Orders[s.order].items) do if kind==food then return true end end
    end
    return false
end
return State
