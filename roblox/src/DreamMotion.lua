-- Dream interactions rearrange familiar things; corruption still has its own 45s gate.
local Motion={}
local function clamp(n,a,b) return math.max(a,math.min(b,n)) end
function Motion.offset(name,x,y,z,now,times,px,pz)
    local seed=x*.13+z*.07
    local dy=math.sin(now*.65+seed)*.35
    local dx,dz,rx,ry,rz,alpha=0,0,0,0,0,nil
    if name:find('Rain') then dy=(now*.7+seed)%6
    elseif name:find('Lantern') and times[6] then dy=dy+math.min(18,(now-times[6])*1.6)
    elseif name:find('TeaStar') and times[5] then ry=(now-times[5])*.8
    elseif name=='Float_Receiver' and times[4] then dy=dy+math.max(0,1-(now-times[4])/4)
    elseif name:find('Coat') then dy=math.sin(now*.65+13*.13-367*.07)*.15
    elseif name:find('ReadPage') then
        local i=tonumber(name:match('ReadPage(%d+)')) or 1
        local t=times[7] and now-times[7] or 0; local a=clamp(t/1.2,0,1)
        dx=math.cos(now*.65+i)*a*.65; dy=math.sin(now*.65+i)*.12+a*(1.2+i*.12)
        dz=math.sin(now*.65+i)*a*.5; rz=math.sin(now*.5+i)*a*.16
    elseif name:find('WaterDrop') then
        local i=tonumber(name:match('WaterDrop(%d+)')) or 1
        alpha=times[8] and .72 or 0; dy=((now*2.1+i*.38)%5); dx=math.sin(i+now*.6)*.13
    elseif name:find('Boat') then
        local i=tonumber(name:match('Boat(%d+)')) or 1
        local a=times[8] and clamp((now-times[8])/4,0,1) or 0
        local bx,bz=-3+i*1.7,-296+i*.8
        dx=((px or bx)+math.sin(now*.4+i)*1.4-bx)*a
        dz=((pz or bz)+4+i*1.7-bz)*a
        dy=math.sin(now*.8+i)*.12
    elseif name:find('Leaf') then
        local i=tonumber(name:match('Leaf(%d+)')) or 1
        local t=times[10] and now-times[10] or 0;local a=clamp(t/1.2,0,1)
        alpha=a;dx=math.sin(now*.4+i)*a*(2+i*.12);dz=math.cos(now*.4+i)*a*(2+i*.12)
        dy=a*(1.3+(t*.35+i*.3)%5);rz=math.sin(now+i)*a*.4
    end
    return dx,dy,dz,rx,ry,rz,alpha
end
return Motion
