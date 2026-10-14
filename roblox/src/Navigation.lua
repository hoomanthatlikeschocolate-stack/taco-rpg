-- Pure numerical helpers; the server performs the actual ground raycast.
local Navigation = {}
function Navigation.clearance(hipHeight, rootHeight, legHeight)
    return math.max(3.8, math.max(0, hipHeight) + rootHeight * .5 + .8,
        rootHeight * .5 + math.max(0, legHeight) + .8)
end
function Navigation.needsRecovery(x, y, z, floorY)
    return x ~= x or y ~= y or z ~= z or y < floorY - 5
        or math.abs(x) > 86 or z > -184 or z < -500
end
function Navigation.checkpoint(current, candidate)
    return math.max(current, candidate)
end
return Navigation
