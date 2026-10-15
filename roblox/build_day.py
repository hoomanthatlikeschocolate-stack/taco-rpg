"""Owned geometry for the connected house, street, car and fast-food shift."""
import math

def build_day(g):
    item,part,prop,light,matrix,cframe,vec,color = [g[n] for n in ('item','part','prop','light','matrix','cframe','vec','color')]
    world,room,markers=g['world'],g['room'],g['markers']
    E=g['E']
    day=item('Model','Day',world)
    interactions=item('Folder','Interactions',day)
    def prompt(name,pos,act,title,hold=.4):
        obj=part(interactions,name,(.4,.4,.4),pos,collide=False,transparency=1)
        p=item('ProximityPrompt','Use',obj)
        for key,value in [('ActionText',act),('ObjectText',title)]: prop(p,'string',key,value)
        prop(p,'float','HoldDuration',hold); prop(p,'float','MaxActivationDistance',9)
        prop(p,'bool','RequiresLineOfSight',False); prop(p,'token','KeyboardKeyCode',101); prop(p,'token','GamepadKeyCode',1002)
    def text(parent,name,value,face=5,rgb=(239,234,215),background=1):
        gui=item('SurfaceGui',name+'Gui',parent); prop(gui,'token','Face',face); prop(gui,'float','PixelsPerStud',45)
        t=item('TextLabel',name,gui); prop(t,'string','Text',value); prop(t,'float','BackgroundTransparency',background)
        color(t,'TextColor3',rgb); prop(t,'bool','TextScaled',True); prop(t,'bool','TextWrapped',True); prop(t,'token','Font',4)
        size=E.SubElement(t.find('Properties'),'UDim2',{'name':'Size'})
        for k,v in [('XS',1),('XO',0),('YS',1),('YO',0)]: E.SubElement(size,k).text=str(v)
        return t
    # Bedroom lounge faces the television, clear of the bed choreography aisle.
    part(room,'CouchBase',(9,1.05,3.8),(-11,1.05,7.9),(102,111,132),'fabric')
    part(room,'CouchBack',(9,2.8,.65),(-11,2.1,9.7),(92,104,129),'fabric')
    for x in [-15.5,-6.5]: part(room,'CouchArm',(.65,1.8,3.8),(x,1.7,7.9),(99,112,135),'fabric')
    for i in range(3): part(room,'CouchCushion'+str(i),(2.6,.38,3),(-13.8+i*2.8,1.73,7.5),(130,143,159),'fabric',False)
    part(room,'TVStand',(8,1.6,1.5),(-11,.8,2.1),(74,60,70),'wood')
    part(room,'TVFrame',(7.9,4.9,.35),(-11,4.1,2.1),(15,18,26),collide=False)
    screen=part(room,'TVScreen',(7.25,4.2,.1),(-11,4.1,2.32),(10,15,23),'neon',False)
    news=item('SurfaceGui','NewsScreen',screen); prop(news,'token','Face',2); prop(news,'float','PixelsPerStud',100)
    for name,value,ys,yp,rgb in [('Headline','MORNING REPORT',.15,0,(238,232,215)),('Report','',.62,.18,(226,233,244)),('Ticker','LOCAL NEWS  |  06:42',.14,.85,(245,194,118))]:
        t=item('TextLabel',name,news); prop(t,'string','Text',value); prop(t,'float','BackgroundTransparency',1)
        color(t,'TextColor3',rgb); prop(t,'bool','TextScaled',True); prop(t,'bool','TextWrapped',True); prop(t,'token','Font',4)
        for pname,values in [('Size',(1,0,ys,0)),('Position',(0,0,yp,0))]:
            u=E.SubElement(t.find('Properties'),'UDim2',{'name':pname})
            for k,v in zip(('XS','XO','YS','YO'),values): E.SubElement(u,k).text=str(v)
    light(screen,'TVGlow',(139,179,240),0,16)
    ceiling=part(room,'CeilingLight',(3,.12,3),(0,11.7,2),(245,227,191),'neon',False)
    light(ceiling,'RoomLight',(255,219,175),0,36)
    prompt('tv',(-10,3,6.4),'Sit and turn on TV','Couch / morning news')
    prompt('bed',(-1.8,3,-2.2),'Go to sleep','Your bed',.6)
    # Kitchen adjoins the bedroom through a seven-stud doorway.
    kitchen=item('Model','Kitchen',day)
    part(kitchen,'Floor',(36,1,28),(0,-.5,29),(175,167,149),'woodplanks')
    for name,size,pos in [('LeftWall',(1,12,28),(-18,6,29)),('RightWall',(1,12,28),(18,6,29)),('FrontLeft',(14.5,12,1),(-10.75,6,43)),('FrontRight',(14.5,12,1),(10.75,6,43)),('DoorHeader',(7,3.5,1),(0,10.25,43)),('Ceiling',(36,1,28),(0,12.5,29))]:
        part(kitchen,name,size,pos,(181,179,166),'concrete')
    part(kitchen,'Fridge',(4,8,4),(-12,4,25),(196,207,204),'metal')
    part(kitchen,'FridgeDoor',(4.1,8,.18),(-12,4,22.9),(220,226,218),'metal',False)
    part(kitchen,'FridgeHandle',(.16,2.2,.25),(-10.5,4.5,22.7),(90,100,104),'metal',False)
    part(kitchen,'FridgeNote',(1.5,.9,.04),(-12.4,5.4,22.78),(229,212,166),collide=False)
    text(kitchen.findall('Item')[-1],'Note','WORK 08:00')
    part(kitchen,'Counter',(10,.5,4),(-11,3,36),(196,191,178),'wood')
    for x in [-15.5,-6.5]: part(kitchen,'CounterLeg',(1,2.8,3.7),(x,1.4,36),(124,137,126),'wood')
    part(kitchen,'Toaster',(2.3,1.3,1.4),(-12,3.9,35.7),(193,172,125),'metal',False)
    for x in [-12.6,-11.4]:
        part(kitchen,'ToastSlot',(.7,.03,.15),(x,4.565,35.7),(38,29,24),collide=False)
        part(kitchen,'Toast',(.75,1.2,.12),(x,4.8,35.7),(217,162,89),'wood',False,1)
    part(kitchen,'BreakfastPlate',(2.5,.12,2),(-8,3.33,35.4),(234,231,216),collide=False)
    part(kitchen,'Mug',(.7,.8,.7),(-6.9,3.7,35.8),(116,151,141),collide=False)
    part(kitchen,'Table',(6,.5,5),(9,2.65,31),(151,132,105),'wood')
    for x in [6.6,11.4]:
        for z in [29,33]: part(kitchen,'TableLeg',(.4,2.4,.4),(x,1.2,z),(116,100,87),'wood')
    window=part(kitchen,'DayWindow',(.15,5,8),(17.42,7,31),(167,209,217),'neon',False)
    light(window,'WindowLight',(242,212,170),1.2,35)
    bulb=part(kitchen,'KitchenLight',(2,.15,2),(0,11.6,29),(245,235,191),'neon',False)
    light(bulb,'Glow',(255,223,175),1.8,35)
    prompt('fridge',(-12,3,21),'Take bread','Refrigerator')
    prompt('toaster',(-12,3.6,33),'Make toast','Toaster',.8)
    prompt('eat',(-8,3.6,33),'Eat breakfast','Toast',1)
    # One continuous street connects home and work. No load screens or void gaps.
    street=item('Model','Street',day)
    part(street,'Ground',(300,1,460),(0,-1,200),(123,151,126),'grass')
    part(street,'Road',(42,1,330),(0,-.5,211),(68,75,81),'concrete')
    for x in [-25,25]: part(street,'Sidewalk',(8,.3,330),(x,.15,211),(180,178,167),'concrete')
    part(street,'FrontPath',(8,.2,15),(0,.1,49.5),(192,182,162),'concrete')
    for z in range(55,375,16): part(street,'LaneMark',(.3,.03,7),(0,.02,z),(227,209,146),collide=False)
    for x in [-21,21]: part(street,'RoadEdge',(.15,.02,330),(x,.02,211),(227,220,194),collide=False)
    for x in [-68,105]: part(street,'WorldBarrier',(2,35,440),(x,15,200),collide=True,transparency=1)
    for side in [-1,1]: part(street,'RoadEndGate'+str(side),(17,6,1),(side*12.5,3,45),(117,123,118),'concrete')
    part(street,'RoadEnd',(42,6,1),(0,3,380),(117,123,118),'concrete')
    for i,z in enumerate(range(90,340,46)):
        for side in [-1,1]:
            x=side*42
            part(street,'TreeTrunk'+str(i)+str(side),(1.7,12,1.7),(x,6,z),(108,94,81),'wood')
            part(street,'TreeCrown'+str(i)+str(side),(14,13,14),(x,15,z),(94,130+i*3,113),'grass',shape=0)
    for z in [98,180,260,360]:
        for x in [-25,25]:
            part(street,'StreetPole',(.3,13,.3),(x,6.5,z),(86,96,101),'metal')
            bulb=part(street,'StreetLamp',(2,.3,1.3),(x,13,z),(231,226,193),'neon',False)
            light(bulb,'Glow',(255,219,174),.5,25)
    for i,z in enumerate([114,178,241]):
        x=-46
        part(street,'NeighborHouse'+str(i),(23,17,29),(x,8.5,z),(145+i*12,155,158),'concrete')
        part(street,'NeighborRoof'+str(i),(26,2,32),(x,18,z),(95,108,123),'wood')
        for dz in [-8,8]: part(street,'NeighborWindow',(1,4,5),(x+11.6,9,z+dz),(212,215,190),'neon',False)
    def car(name,x,z,yaw):
        m=item('Model',name,day); rot=matrix(0,yaw,0)
        def cp(n,size,pos,rgb,mat='plastic',trans=0,shape=1):
            wx=x+rot[0][0]*pos[0]+rot[0][2]*pos[2]; wz=z+rot[2][0]*pos[0]+rot[2][2]*pos[2]
            return part(m,n,size,(wx,2.3+pos[1],wz),rgb,mat,False,trans,rotation=rot,shape=shape)
        root=cp('Root',(.3,.3,.3),(0,0,0),(0,0,0),trans=1); prop(m,'Ref','PrimaryPart',root.attrib['referent'])
        cp('Body',(5.8,1.2,10.4),(0,0,0),(79,127,142),'metal')
        cp('Hood',(5.5,.45,3.6),(0,.8,-3.1),(93,141,153),'metal')
        cp('Roof',(5.3,.3,4.9),(0,2.2,.4),(72,115,132),'metal')
        cp('Windshield',(5,.95,.12),(0,1.45,-2.15),(166,199,214),trans=.25)
        cp('RearGlass',(5,.95,.12),(0,1.45,2.85),(166,199,214),trans=.25)
        for sx in [-1,1]:
            cp('SideGlass'+str(sx),(.12,1.15,4.6),(sx*2.7,1.45,.35),(161,190,203),trans=.4)
            cp('Seat'+str(sx),(1.8,.45,1.9),(sx*1.3,.7,.4),(47,57,66),'fabric')
            for zz in [-3.3,3.3]: cp('Wheel'+str(sx)+str(zz),(.7,2.2,2.2),(sx*2.95,-.95,zz),(28,32,38),shape=2)
            cp('Headlight'+str(sx),(1.2,.4,.12),(sx*1.7,.2,-5.25),(252,238,189),'neon')
            cp('TailLight'+str(sx),(1.1,.3,.12),(sx*1.7,.2,5.25),(196,65,65),'neon')
        cp('SteeringWheel',(1,.2,1),(-1.3,1.3,-1.35),(32,35,43))
        return m
    car('HomeCar',-10,62,180); car('WorkCar',10,350,0)
    prompt('carHome',(-10,3,62),'Get in / drive to work','Your car',.5)
    prompt('carWork',(10,3,350),'Get in / drive home','Your car',.5)
    # Fast-food restaurant: counter on the left, kitchen behind it to the right.
    work=item('Model','Restaurant',day)
    part(work,'Floor',(54,1,70),(57,-.5,350),(199,189,169),'concrete')
    for name,size,pos in [('BackWall',(54,13,1),(57,6.5,385)),('FrontWall',(54,13,1),(57,6.5,315)),('RightWall',(1,13,70),(84,6.5,350)),('EntranceNorth',(1,13,29),(30,6.5,330)),('EntranceSouth',(1,13,29),(30,6.5,370)),('EntranceHeader',(1,4,12),(30,11,350)),('Ceiling',(54,1,70),(57,13.5,350))]:
        part(work,name,size,pos,(215,197,164),'concrete')
    sign=part(work,'Sign',(.4,4,23),(29.4,10,335),(196,79,59),collide=False)
    text(sign,'SignText','BURGER / FRIES',face=3)
    part(work,'Counter',(3,2.8,26),(51,1.4,347),(137,67,50),'wood')
    part(work,'CounterTop',(4,.35,27),(51,3,347),(228,215,183),'plastic')
    part(work,'Register',(1.8,1.1,1.4),(50.8,3.7,343),(49,53,61),collide=False)
    part(work,'PickupTray',(2.8,.15,2),(51,3.28,353),(84,91,99),collide=False)
    part(work,'Grill',(6,3,4),(66,1.5,327),(128,135,138),'metal')
    part(work,'GrillTop',(5.7,.15,3.7),(66,3.12,327),(44,48,53),'metal',False)
    for x in [64.8,66,67.2]: part(work,'Patty',(.9,.18,.9),(x,3.3,327),(112,68,44),collide=False,shape=0)
    part(work,'Fryer',(5,3,4),(76,1.5,327),(167,167,153),'metal')
    part(work,'FryBasket',(3,.4,2.5),(76,3.25,327),(201,161,82),'metal',False)
    for i in range(9): part(work,'Fries',(.17,.4,1.4),(75+i%3*.55,3.5,326.5+i//3*.5),(238,199,94),collide=False)
    part(work,'DrinkMachine',(4,6,3),(78,3,348),(180,62,48),'metal')
    part(work,'DrinkFront',(3.7,3,.12),(78,4,346.4),(40,49,56),collide=False)
    for x in [77,78,79]: part(work,'DrinkLever',(.25,.6,.45),(x,2.8,346.2),(177,191,189),'metal',False)
    part(work,'TrashCan',(3,3.5,3),(77,1.75,376),(100,115,117),'metal')
    for x,z in [(37,323),(38,373),(44,379)]:
        part(work,'Table',(5,.4,4),(x,2.6,z),(169,145,110),'wood')
        part(work,'TableStem',(.5,2.4,.5),(x,1.2,z),(105,109,106),'metal')
        for dx in [-3.1,3.1]:
            part(work,'Chair',(2,.35,2),(x+dx,1.5,z),(154,68,54),'fabric')
            part(work,'ChairBack',(2,2.5,.25),(x+dx,2.8,z+1),(154,68,54),'fabric')
    for z in [328,350,375]:
        bulb=part(work,'Light',(14,.1,1.7),(63,12.6,z),(246,235,209),'neon',False)
        light(bulb,'Glow',(255,235,204),1.5,40)
    # Customers and coworker are simple Roblox-style models, not flat signs.
    def person(name,x,z,facing,shirt):
        m=item('Model',name,work)
        rot=matrix(0,facing,0)
        for n,size,pos,rgb in [('Torso',(2,2,1),(0,3,0),shirt),('Head',(1.6,1.5,1.4),(0,4.8,0),(220,185,157)),('Hair',(1.68,.3,1.5),(0,5.6,0),(55,46,44)),('ArmL',(.8,2,.8),(-1.4,3,0),shirt),('ArmR',(.8,2,.8),(1.4,3,0),shirt),('LegL',(.9,2,.9),(-.55,1,0),(58,69,86)),('LegR',(.9,2,.9),(.55,1,0),(58,69,86)),('EyeL',(.12,.12,.06),(-.3,4.95,-.72),(29,31,35)),('EyeR',(.12,.12,.06),(.3,4.95,-.72),(29,31,35))]:
            part(m,n,size,(x+rot[0][0]*pos[0]+rot[0][2]*pos[2],pos[1],z+rot[2][0]*pos[0]+rot[2][2]*pos[2]),rgb,collide=False,rotation=rot)
    person('Customer',47,343,-90,(104,149,161))
    person('Coworker',71,365,45,(183,72,57))
    prompt('order',(54.5,3.7,343),'Take order','Customer / register')
    prompt('burger',(66,3.5,331),'Grill and assemble','Burger station',1.2)
    prompt('fries',(76,3.5,331),'Fill a carton','Fries station',1)
    prompt('drink',(78,3,344),'Pour a soda','Drink station',1)
    prompt('serve',(54.5,3.5,353),'Serve order','Pickup counter',.7)
    prompt('counter',(54.5,3.5,361),'Wipe down','Counter',1.4)
    prompt('trash',(75,3,376),'Empty trash','Trash can',1.4)
    prompt('coworker',(69,3,365),'Talk','Coworker')
    for name,pos,yaw in [
        ('MorningSpawn',(-1.25,4,-2.3),0),('CouchStand',(-4.2,4,7),90),
        ('ActorCouch',(-11,2.9,7.5),0),('ActorCouchApproach',(-11,3.18,5.15),180),('TVView',(-10.7,4.95,6.7),0),
        ('CarHome',(-10,2.3,62),180),('CarWork',(10,2.3,350),0),
        ('HomeArrival',(-4,4,61),0),('WorkArrival',(24,4,350),-90),
        ('WorkEntry',(55.5,4,343),-90)]:
        part(markers,name,(.4,.4,.4),pos,collide=False,transparency=1,rotation=matrix(0,yaw,0))
    return day
