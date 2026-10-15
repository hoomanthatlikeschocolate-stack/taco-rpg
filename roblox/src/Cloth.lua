-- A corner lift with a pinned far edge and foot edge, not a rotating sheet.
-- Pure numbers keep the exact same cloth surface usable by both engines.
local Cloth={Columns=6,Rows=8}
function Cloth.point(u,v,open,loft)
    local anchor=math.sin(v*math.pi*.5)^.45
    local lift=open*u*u*anchor
    local foot=math.sin(math.min(1,v*3)*math.pi*.5)
    local body=math.sin(math.pi*u)*1.15*loft*foot*(.8+.2*math.sin(v*math.pi*.5))
    local fold=math.sin(u*math.pi*4+v*2)*.035*open*math.sin(math.pi*u)*anchor
    return -10.35+u*6.7+.55*lift,
        2.35+1.65*lift+body+fold,
        -2.85-v*4+.35*loft*v*v-.18*lift
end
return Cloth
