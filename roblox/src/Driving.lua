-- Server-owned arcade driving, on a continuous road. No fragile wheel constraints.
local Driving = {}
local function clamp(n,a,b) return math.max(a,math.min(b,n)) end
function Driving.new(x,z,yaw,now)
    return {x=x,z=z,yaw=yaw,speed=0,throttle=0,steer=0,inputAt=now,startedAt=now,distance=0}
end
function Driving.input(car,throttle,steer,now)
    if type(throttle)~="number" or type(steer)~="number" or throttle~=throttle or steer~=steer
        or math.abs(throttle)>1 or math.abs(steer)>1 then return false end
    car.throttle=throttle; car.steer=steer; car.inputAt=now; return true
end
function Driving.tick(car,dt,now,c)
    dt=clamp(dt,0,.1)
    local throttle=now-car.inputAt<.5 and car.throttle or 0
    local steer=now-car.inputAt<.5 and car.steer or 0
    local target=throttle*c.CarMaxSpeed
    if throttle<0 then target=throttle*10 end
    local rate=throttle==0 and c.CarBrake or c.CarAcceleration
    car.speed=car.speed+clamp(target-car.speed,-rate*dt,rate*dt)
    car.yaw=car.yaw-steer*c.CarTurnRate*dt*clamp(car.speed/12,-1,1)
    local dx=-math.sin(car.yaw)*car.speed*dt
    local dz=-math.cos(car.yaw)*car.speed*dt
    local x,z=car.x+dx,car.z+dz
    car.x=clamp(x,c.RoadMinX,c.RoadMaxX); car.z=clamp(z,c.RoadMinZ,c.RoadMaxZ)
    if x~=car.x or z~=car.z then car.speed=0 end
    car.distance=car.distance+math.sqrt((car.x-(x-dx))^2+(car.z-(z-dz))^2)
end
function Driving.canPark(car,x,z,now)
    return now-car.startedAt>=3 and car.distance>=30 and math.abs(car.speed)<8
        and (car.x-x)^2+(car.z-z)^2<=14^2
end
return Driving
