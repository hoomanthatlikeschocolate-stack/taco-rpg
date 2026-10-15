-- Real pure modules: timing, progression and driving bounds.
local s=State.new(0)
assert(not State.enterDream(s,1,Config))
assert(State.begin(s,0)); assert(not State.begin(s,1))
assert(not State.enterDream(s,8,Config)); assert(State.enterDream(s,9,Config))
for i=1,10 do assert(State.collect(s,i)); assert(not State.collect(s,i)) end
assert(not State.collect(s,11))
for _,t in ipairs({9,10,20,40,53.99,54}) do
    assert(State.tick(s,t,1,Config)==nil); assert(s.corruption==0,'Exploration cannot corrupt the first 45 seconds')
    assert(not State.exit(s,t,0),'Dream doors cannot wake the player')
end
State.tick(s,55,1,Config); assert(s.corruption>0 and s.corruption<.03)
State.tick(s,80,0,Config); assert(s.corruption>.4 and s.corruption<=.65)
assert(State.tick(s,99,0,Config)=='blackout')
assert(State.tick(s,101.3,0,Config)=='awake')
assert(not State.lamp(s,106))
assert(State.tick(s,112.3,0,Config)=='lightsOut')
assert(not State.lamp(s,112.4)); assert(State.lamp(s,113.4)); assert(s.phase=='getup')
assert(not State.stand(s,114,Config)); assert(State.stand(s,117.1,Config))
assert(s.phase=='morning'); assert(not State.interact(s,'eat',118,Config))
assert(State.interact(s,'tv',118,Config)); assert(not State.interact(s,'fridge',119,Config))
assert(State.tick(s,143,0,Config)=='breakfast')
assert(not State.interact(s,'eat',143,Config)); assert(State.interact(s,'fridge',144,Config))
assert(not State.interact(s,'fridge',145,Config)); assert(State.interact(s,'toaster',145,Config))
assert(State.tick(s,148,0,Config)==nil)
assert(State.tick(s,149,0,Config)=='breakfastUpdate'); assert(State.interact(s,'eat',150,Config))
assert(State.interact(s,'carHome',151,Config)); assert(State.arrive(s,170)); assert(s.phase=='work')
for i,order in ipairs(Config.Orders) do
    assert(s.order==i); assert(not State.interact(s,'serve',170+i,Config))
    assert(State.interact(s,'order',170+i,Config))
    assert(not State.interact(s,'serve',170+i,Config))
    for _,food in ipairs(order.items) do
        assert(State.promptEnabled(s,food,Config)); assert(State.interact(s,food,175+i,Config))
        assert(not State.interact(s,food,175+i,Config))
    end
    assert(State.promptEnabled(s,'serve',Config)); assert(State.interact(s,'serve',180+i,Config))
end
assert(s.phase=='cleanup'); assert(not State.interact(s,'carWork',184,Config))
assert(State.interact(s,'trash',185,Config)); assert(s.phase=='cleanup')
assert(State.interact(s,'counter',186,Config)); assert(s.phase=='return')
assert(State.interact(s,'carWork',187,Config)); assert(State.arrive(s,210)); assert(s.phase=='home')
assert(State.interact(s,'bed',212,Config)); assert(not State.finish(s,213,Config))
assert(State.finish(s,222,Config)); assert(s.completed and s.phase=='complete')
assert(State.begin(s,223)); assert(s.phase=='bedtime' and not s.completed and next(s.lights)==nil)
local recovery=State.new(0); State.begin(recovery,0); State.enterDream(recovery,9,Config)
recovery.lights[4]=true; recovery.checkpoint=5
assert(State.recover(recovery,12,Config)); assert(not State.recover(recovery,12.1,Config))
assert(State.recover(recovery,13.1,Config)); assert(recovery.lights[4] and recovery.checkpoint==5)
assert(Navigation.clearance(0,2,2)>=3.8 and Navigation.clearance(2,2,0)>=3.8)
assert(Navigation.clearance(5,4,0)>7 and Navigation.checkpoint(5,2)==5)
assert(Navigation.needsRecovery(0,2,-330,8)); assert(not Navigation.needsRecovery(0,11.8,-330,8))
local car=Driving.new(-10,62,math.pi,0)
assert(not Driving.input(car,0/0,1,0)); assert(not Driving.input(car,2,0,0))
for i=1,200 do Driving.input(car,1,0,i*.1); Driving.tick(car,.1,i*.1,Config) end
assert(car.z<=Config.RoadMaxZ and car.speed<=Config.CarMaxSpeed and car.distance>100)
Driving.input(car,1,0,21); Driving.tick(car,.1,22,Config)
assert(car.speed<Config.CarMaxSpeed,'Stale inputs must stop accelerating')
car.x=10; car.z=350; car.speed=0
assert(Driving.canPark(car,10,350,23)); car.speed=9; assert(not Driving.canPark(car,10,350,23))
assert(not Driving.canPark(Driving.new(10,350,0,0),10,350,4),'Cannot skip a drive from the start')
assert(Config.CorruptionDelay==45 and Config.DreamTimeout>45)
-- The new cloth bends locally; a lift cannot detach the foot/far edges.
for _,open in ipairs({0,.25,.5,.75,1}) do
    for _,loft in ipairs({0,.5,1}) do
        for i=0,24 do
            local u=i/24
            local x,y,z=Cloth.point(u,0,open,loft)
            assert(math.abs(x-(-10.35+u*6.7))<1e-8 and math.abs(y-2.35)<1e-8 and math.abs(z+2.85)<1e-8)
            for j=0,24 do local a,b,c=Cloth.point(u,j/24,open,loft);assert(a==a and b==b and c==c and b>=2.3 and b<5.5) end
        end
    end
end
local x0,y0,z0=Cloth.point(0,.6,0,0)
local x1,y1,z1=Cloth.point(0,.6,1,0)
assert(x0==x1 and y0==y1 and z0==z1)
local dx,dy,dz,rx,ry,rz,alpha=DreamMotion.offset('Float_WaterDrop1',2,10,-292,20,{},0,-290)
assert(alpha==0)
dx,dy,dz,rx,ry,rz,alpha=DreamMotion.offset('Float_WaterDrop1',2,10,-292,20,{[8]=10},0,-290)
assert(alpha>.7 and dy>=0 and dy<5)
local ax,ay,az=DreamMotion.offset('Float_Boat1Hull',-1.3,8.5,-295.2,20,{[8]=10},5,-310)
local bx,by,bz=DreamMotion.offset('Float_Boat1Sail',-1.3,9.2,-295.2,20,{[8]=10},5,-310)
assert(ax==bx and ay==by and az==bz,'Boat pieces must stay together')
