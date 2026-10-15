"""Detailed owned props and interactive dream memories, shared by both versions."""
import math

def build_details(g):
    item,part,prop,matrix,color=[g[n] for n in ('item','part','prop','matrix','color')]
    E,room,dream,world=[g[n] for n in ('E','room','dream','world')]
    def name(o): return o.find("Properties/string[@name='Name']").text
    def child(o,n): return next(c for c in o.findall('Item') if name(c)==n)
    day=child(world,'Day'); kitchen=child(day,'Kitchen'); work=child(day,'Restaurant')
    def p(parent,n,s,pos,c,mat='plastic',rot=None,shape=1,trans=0):
        # Roblox cylinders run along local X; callers describe upright props in XYZ.
        if shape==2 and rot==matrix(0,0,90): s=(s[1],s[0],s[2])
        return part(parent,n,s,pos,c,mat,False,trans,rotation=rot,shape=shape)
    def text(parent,n,words,face=2,rgb=(229,223,205)):
        gui=item('SurfaceGui',n,parent);prop(gui,'token','Face',face);prop(gui,'float','PixelsPerStud',95)
        t=item('TextLabel','Words',gui);prop(t,'string','Text',words);prop(t,'float','BackgroundTransparency',1)
        color(t,'TextColor3',rgb);prop(t,'bool','TextScaled',True);prop(t,'bool','TextWrapped',True);prop(t,'token','Font',4)
        u=E.SubElement(t.find('Properties'),'UDim2',{'name':'Size'})
        for k,v in [('XS',1),('XO',0),('YS',1),('YO',0)]:E.SubElement(u,k).text=str(v)
        return t
    # Bedroom: layered furniture, joinery, soft furnishings and small daily objects.
    for x in [-17.4,17.4]:
        p(room,'WallSkirting',(.13,.65,29),(x,.34,0),(108,94,105),'wood')
        p(room,'CeilingMoulding',(.22,.25,29),(x,11.6,0),(120,113,129),'wood')
    for side in [-1,1]:
        p(room,'DoorArchitrave',(.22,8.6,.22),(side*3.6,4.3,14.38),(135,119,127),'wood')
        for z in [-10,-8,-6,-4,-2]:p(room,'BedRailJoin',(.12,.55,.45),(-10.56,.9,z),(149,120,118),'wood')
    p(room,'BedSideRail',(7.35,.35,.35),(-7,.53,.05),(118,93,107),'wood')
    for z in [-6.35,-5.35,-4.35,-3.35]:
        p(room,'BlanketDrapeLeft',(.12,.75,.96),(-10.4,1.98,z),(86,101,129),'fabric')
    for i in range(3):
        p(room,'PillowPleat',(.025,.016,1.55),(-7.75+i*.75,2.595,-8.5),(181,172,171),'fabric')
    for z in [6.2,8.7]:
        for x in [-14.8,-7.2]:p(room,'CouchFoot',(.28,.65,.28),(x,.4,z),(56,48,60),'wood')
    for i in range(3):
        p(room,'CushionPiping',(2.58,.045,.04),(-13.8+i*2.8,1.94,6.03),(168,172,178),'fabric')
    for x,angle in [(-14.7,-13),(-7.4,15)]:
        p(room,'CouchPillow',(1.3,1.4,.5),(x,2.55,8.55),(155,142,148),'fabric',matrix(0,0,angle))
        p(room,'CouchPillowSeam',(.045,1.25,.025),(x,2.55,8.28),(186,168,167),'fabric',matrix(0,0,angle))
    p(room,'Remote',(1.1,.16,.4),(-10.1,1.98,6.5),(30,33,43))
    for i in range(5):p(room,'RemoteButton',(.07,.02,.1),(-10.45+i*.17,2.073,6.5),(169,175,179))
    for i in range(7):
        p(room,'CurtainFold',(.09,6.5,.13),(-11.98+i*.13,7,-13.54),(88,91,119),'fabric')
        p(room,'CurtainFold',(.09,6.5,.13),(-2.78+i*.13,7,-13.54),(88,91,119),'fabric')
    for x in [-5.6,-4.6]:p(room,'ClockButton',(.14,.09,.2),(-1.2+(x+5.1)*.3,3.15,-4.9),(106,115,128))
    p(room,'BedsideGlass',(.45,.7,.45),(-2.3,2.82,-5.2),(175,194,203),'plastic',shape=2,rot=matrix(0,0,90),trans=.3)
    p(room,'WallOutlet',(.45,.7,.04),(2,.8,-14.42),(151,145,143))
    for x in [1.9,2.1]:p(room,'OutletSlot',(.035,.15,.016),(x,.83,-14.39),(46,46,57))
    p(room,'WallSwitch',(.5,.8,.05),(5,4.5,14.4),(190,180,167))
    p(room,'SwitchToggle',(.14,.26,.1),(5,4.5,14.33),(227,214,191))
    for x in [8.9,13.2]:
        for y in [2.7,6.6]:p(room,'ClosetPanel',(1.5,2.7,.06),(x,y,-9.26),(90,73,94),'wood')
    for x in [9.65,12.55]:p(room,'ClosetKnob',(.13,.3,.2),(x,4.35,-9.18),(175,146,126),'metal')
    p(room,'Shelf',(5.3,.23,1.3),(14.8,7.7,3),(132,109,118),'wood')
    for i in range(6):
        p(room,'ShelfBook',(.35,1.3+i%2*.25,.9),(13+i*.42,8.48,3),(98+i*12,107+i*7,124),'fabric',matrix(0,0,(i%3-1)*3))
    p(room,'PlantPot',(.8,.7,.8),(16.5,8.15,3),(171,123,99),'plastic',shape=2,rot=matrix(0,0,90))
    for i in range(5):p(room,'PlantLeaf',(.18,.9,.25),(16.5+math.sin(i*1.4)*.3,8.94,3+math.cos(i*1.4)*.25),(105,139,123),'grass',matrix(0,i*42,(i-2)*15),shape=0)
    for x in [5.2,10.8]:p(room,'DeskDrawer',(2.1,.75,2.7),(x,2.52,4),(99,82,107),'wood')
    for x in [5.2,10.8]:p(room,'DeskDrawerPull',(.65,.12,.15),(x,2.52,5.42),(174,149,135),'metal')
    p(room,'DeskPencil',(.1,.1,1.3),(10.2,3.56,3.7),(202,165,94),'wood',matrix(0,18,0))
    # Kitchen cabinets and a lived-in breakfast counter.
    p(kitchen,'LowerCabinets',(9.5,2.65,3.7),(-11,1.55,36),(120,140,130),'wood')
    for x in [-14.1,-11,-7.9]:
        p(kitchen,'CabinetDoor',(2.9,2.25,.12),(x,1.65,34.08),(153,166,145),'wood')
        p(kitchen,'CabinetPull',(.45,.1,.17),(x+.8,2.1,33.96),(87,99,100),'metal')
    for x in [-14,-11,-8]:
        p(kitchen,'UpperCabinet',(2.8,3.1,1.8),(x,8.5,40.9),(162,172,147),'wood')
        p(kitchen,'UpperPanel',(2.45,2.7,.08),(x,8.5,39.95),(186,190,164),'wood')
        p(kitchen,'UpperPull',(.12,.48,.15),(x+.8,8.2,39.82),(91,106,104),'metal')
    for x in range(-16,-5):
        for y in range(4,7):p(kitchen,'BacksplashTile',(.94,.94,.04),(x,y,42.44),(207 if (x+y)%2 else 191,204,182),'concrete')
    p(kitchen,'SinkRim',(2.5,.1,1.7),(-8,3.29,37.1),(157,171,174),'metal')
    p(kitchen,'SinkBasin',(2.1,.05,1.35),(-8,3.34,37.1),(79,105,111),'metal')
    for n,s,pos in [('Stem',(.15,1,.15),(-8,3.8,37.9)),('Arch',(.15,.15,.85),(-8,4.3,37.55)),('Spout',(.15,.45,.15),(-8,4.1,37.15)),('Handle',(.5,.1,.12),(-7.55,3.56,37.9))]:
        p(kitchen,'Faucet'+n,s,pos,(168,181,185),'metal')
    for i in range(4):p(kitchen,'DishRackWire',(.035,.3,1.1),(-14.6+i*.25,3.55,37.2),(160,176,178),'metal')
    p(kitchen,'BreadBag',(1.6,.65,1.15),(-14.1,3.6,35.3),(200,182,147),'fabric')
    p(kitchen,'BreadTie',(.18,.12,.4),(-14.85,3.8,35.3),(118,147,149))
    p(kitchen,'ButterDish',(1,.12,.65),(-8.6,3.4,34.5),(231,222,198))
    p(kitchen,'Butter',(.6,.22,.42),(-8.6,3.56,34.5),(239,210,130))
    p(kitchen,'ButterKnife',(.08,.045,1.1),(-9.4,3.38,34.9),(170,185,190),'metal',matrix(0,24,0))
    p(kitchen,'ToasterLever',(.16,.12,.2),(-10.76,3.94,35.6),(59,64,68),'metal')
    for i in range(5):p(kitchen,'ToasterVent',(.035,.24,.02),(-12.8+i*.38,3.9,34.98),(92,99,99),'metal')
    for x in [-13.3,-11.8]:p(kitchen,'FridgeAttach_Magnet',(.26,.26,.08),(x,6.2,22.74),(157,94 if x< -12 else 154,105))
    p(kitchen,'FruitBowl',(1.8,.2,1.8),(9,2.98,31),(204,190,156),shape=2,rot=matrix(0,0,90))
    for i in range(4):p(kitchen,'Fruit',(.65,.65,.65),(8.5+i%2*.7,3.28,30.7+i//2*.65),(185+i*12,117+i*14,76),shape=0)
    for side in [-1,1]:
        p(kitchen,'KitchenSkirting',(.14,.6,27),(side*17.42,.3,29),(131,146,132),'wood')
        p(kitchen,'DoorCasing',(.24,8.6,.22),(side*3.6,4.3,42.4),(212,203,180),'wood')
    # Restaurant: tiled surfaces, machine construction, packaging and full food models.
    for x in range(33,84,6):
        for z in range(318,385,6):p(work,'FloorTile',(5.9,.018,5.9),(x,.015,z),(188+(x+z)%2*7,180,163),'concrete')
    for z in [315.54,384.45]:p(work,'WallTileBand',(52,.22,.035),(57,4.6,z),(177,98,74),'concrete')
    p(work,'WallTileBand',(.035,.22,69),(83.45,4.6,350),(177,98,74),'concrete')
    for x in [54,62,70,78]:
        p(work,'BackCabinet',(7.5,2.7,3.3),(x,1.5,382),(167,175,172),'metal')
        p(work,'BackCabinetTop',(7.7,.2,3.5),(x,3,382),(201,209,202),'metal')
        for dx in [-1.8,1.8]:
            p(work,'SteelDoor',(3.4,2.3,.08),(x+dx,1.6,380.3),(150,164,163),'metal')
            p(work,'SteelHandle',(.6,.1,.15),(x+dx,2,380.19),(222,222,209),'metal')
    p(work,'CounterEdge',(.12,.25,26),(48.95,2.98,347),(115,115,105),'metal')
    for z in [337,343,349,355]:
        p(work,'CounterPanel',(.08,2.35,5.65),(49.44,1.4,z),(154,80,59),'wood')
        p(work,'CounterPanelTrim',(.1,2.25,.08),(49.35,1.4,z+2.6),(191,111,77),'wood')
    p(work,'RegisterScreen',(.12,.65,1.15),(49.82,3.8,343),(112,156,152),'neon')
    for i in range(9):p(work,'RegisterKey',(.18,.045,.15),(50.5+i%3*.25,4.28,342.7+i//3*.2),(179,185,175))
    for x in [63.3,68.7]:p(work,'GrillSide',(.13,.3,3.8),(x,3.2,327),(186,192,187),'metal')
    for z in [325.15,328.85]:p(work,'GrillRim',(5.7,.3,.13),(66,3.2,z),(186,192,187),'metal')
    for i in range(10):p(work,'GrillGroove',(.08,.02,3.2),(63.7+i*.5,3.215,327),(74,77,76),'metal')
    for x in [64.3,66,67.7]:
        p(work,'GrillKnob',(.35,.35,.15),(x,2.1,329.08),(51,59,62),'plastic',shape=0)
        p(work,'KnobMarker',(.045,.14,.025),(x,2.16,329.17),(216,196,151))
    p(work,'ExtractorHood',(9,1.1,5.3),(66,8.1,326.4),(159,170,168),'metal')
    p(work,'ExtractorDuct',(3.5,4,3),(66,10.4,326),(144,158,157),'metal')
    for x in range(63,70):p(work,'HoodFilter',(.04,.03,4.4),(x,7.52,326.4),(73,89,91),'metal')
    p(work,'FryerOil',(3.5,.03,2.9),(76,3.13,327),(109,81,41))
    p(work,'FryerBasketHandle',(.5,.15,2),(76,3.55,329.1),(52,62,64),'metal')
    for i in range(7):p(work,'BasketWire',(.04,.4,2.6),(74.65+i*.45,3.35,327),(183,187,161),'metal')
    for i in range(3):
        p(work,'SodaLabel',(.7,.9,.025),(77+i,4,346.31),[(210,150,77),(179,84,68),(137,173,141)][i])
        p(work,'SodaCup',(.55,.85,.55),(77+i*.7,1.1,346.3),(227,215,191),'plastic',rot=matrix(0,0,90),shape=2)
        p(work,'SodaCupStripe',(.56,.22,.56),(77+i*.7,1.08,346.3),(177,75,54),'plastic',rot=matrix(0,0,90),shape=2)
    for i in range(5):p(work,'CupStack',(.75,.12,.75),(72.5,3.25+i*.1,381.4),(231,225,204),shape=2,rot=matrix(0,0,90))
    p(work,'NapkinDispenser',(1.2,.9,1),(50.7,3.65,358.5),(163,177,178),'metal')
    p(work,'NapkinTop',(.9,.03,.7),(50.7,4.12,358.5),(236,228,211),'fabric')
    for i in range(3):p(work,'TakeoutBag',(1.1,1.6,.75),(57+i*1.25,3.85,382),(193,161,113),'fabric')
    for i in range(3):
        board=p(work,'MenuBoard',(.16,2.8,6.5),(30.7,8.2,324+i*7.5),(37,51,54))
        text(board,'Menu'+str(i),['BURGER\n5.00','FRIES\n3.00','SODA\n2.00'][i],face=0)
    for n,x,z in [('Customer',47,343),('Coworker',71,365)]:
        actor=child(work,n)
        if n=='Coworker':
            p(actor,'UniformCap',(1.9,.32,1.7),(x,5.85,z),(174,61,44),'fabric')
            p(actor,'CapBrim',(2,.12,1),(x,5.68,z-.65),(153,53,39),'fabric')
            p(actor,'Apron',(1.5,1.8,.06),(x,2.65,z-.55),(211,193,151),'fabric')
            p(actor,'ApronPocket',(.85,.5,.07),(x,2.45,z-.6),(188,166,127),'fabric')
        for dx in [-.55,.55]:p(actor,'Shoe',(.98,.34,1.25),(x+dx,.18,z-.12),(42,47,55))
    # Tray contents are revealed as the actual order is prepared.
    def food(n,s,pos,c,shape=1,rot=None):return p(work,n,s,pos,c,rot=rot,shape=shape,trans=1)
    for n,s,y,c in [('BunBottom',(1.2,.22,1.2),3.52,(215,164,87)),('Patty',(1.15,.19,1.15),3.72,(91,57,39)),('Cheese',(1.27,.06,1.2),3.85,(242,190,73)),('Lettuce',(1.35,.09,1.3),3.94,(124,166,88)),('BunTop',(1.3,.42,1.3),4.15,(225,175,95))]:
        food('TrayBurger_'+n,s,(50.8,y,352.65),c,shape=2,rot=matrix(0,0,90))
    for i in range(5):food('TrayBurger_Seed'+str(i),(.08,.035,.12),(50.5+i%3*.24,4.37,352.4+i//3*.3),(245,221,170))
    food('TrayFries_Carton',(.8,.7,.6),(51.1,3.77,353.65),(186,67,47))
    for i in range(7):food('TrayFries_Fry'+str(i),(.12,.65+i%2*.13,.12),(50.8+i%4*.18,4.24,353.45+i//4*.2),(241,200,96),rot=matrix(0,0,(i%3-1)*8))
    food('TrayDrink_Cup',(.7,1.1,.7),(51.9,3.93,352.7),(228,218,190),2,matrix(0,0,90))
    food('TrayDrink_Lid',(.78,.12,.78),(51.9,4.53,352.7),(222,226,214),2,matrix(0,0,90))
    food('TrayDrink_Straw',(.08,.7,.08),(51.95,4.92,352.7),(185,66,52))
    # Dream: soft islands made from mismatched, recognizable domestic memories.
    for i,(x,z) in enumerate([(-8,-254),(4,-294),(-6,-319),(12,-369)]):
        p(dream,'MemoryCarpet'+str(i),(17,.035,13),(x,8.07,z),(184+i*5,175,193-i*4),'fabric')
        for side in [-1,1]:
            for j in range(7):p(dream,'CarpetTassel',(.1,.03,.65),(x-6+j*2,8.095,z+side*6.6),(215,203,210),'fabric')
        for j in range(6):
            q=j*math.pi/3
            p(dream,'Float_MemoryPetal'+str(i)+'_'+str(j),(1.2,.12,2.4),(x+math.cos(q)*10,9.8,z+math.sin(q)*8),(219,194,206),'fabric',matrix(0,-j*60,10),shape=0)
    # Book pages lift and their words change rather than becoming a platform.
    p(dream,'BookPedestal',(3,.25,2.5),(-8,10.15,-255),(145,126,159),'wood')
    p(dream,'BookCover',(3.6,.18,2.3),(-8,10.42,-255),(116,137,155),'fabric')
    for i in range(1,5):
        page=p(dream,'Float_ReadPage'+str(i),(2.8,.035,1.8),(-8+(i-2.5)*.12,10.56+i*.045,-255),(235,221,197),'fabric')
        text(page,'DreamBookPage'+str(i),'YOU WERE HERE',face=1,rgb=(92,85,109))
    # A sink that sends water upward and releases a small following paper flotilla.
    p(dream,'DreamSink',(4,.45,3),(2,10.3,-292),(204,208,205),'plastic')
    p(dream,'DreamSinkBasin',(3.4,.04,2.3),(2,10.55,-292),(116,161,169),'metal')
    for n,s,pos in [('Stem',(.2,1.7,.2),(2,11.2,-293.1)),('Spout',(.2,.2,1.5),(2,12,-292.5)),('Tip',(.2,.45,.2),(2,11.85,-291.85))]:
        p(dream,'DreamTap'+n,s,pos,(178,194,193),'metal')
    p(dream,'DreamTapHandle',(.65,.12,.18),(3,10.8,-293.05),(178,194,193),'metal')
    p(dream,'DreamPond',(18,.03,13),(2,8.13,-295),(164,204,214),'plastic',trans=.55)
    for i in range(12):p(dream,'Float_WaterDrop'+str(i),(.14,.35,.14),(2,10.7,-291.85),(188,223,231),'neon',shape=0,trans=1)
    for i in range(1,4):
        bx,bz=-3+i*1.7,-296+i*.8
        for n,s,offset,rot in [('Hull',(1.5,.16,.65),(0,0,0),matrix()),('FoldL',(.8,.08,.75),(-.3,.22,0),matrix(0,0,28)),('FoldR',(.8,.08,.75),(.3,.22,0),matrix(0,0,-28)),('Sail',(.08,1,.65),(0,.7,0),matrix(0,0,10))]:
            p(dream,'Float_Boat'+str(i)+n,s,(bx+offset[0],8.5+offset[1],bz+offset[2]),(230,221,200),'fabric',rot)
    # Photograph: the bedroom window becomes a tiny restaurant in the same frame.
    p(dream,'PhotoTable',(4.6,.25,2.8),(-6,10.1,-319),(153,132,157),'wood')
    for side in [-1,1]:p(dream,'DreamPhotoFrame',(.22,3.4,.35),(-6+side*2,11.9,-319.5),(198,173,150),'wood')
    for yy in [10.2,13.6]:p(dream,'DreamPhotoFrame',(4.2,.22,.35),(-6,yy,-319.5),(198,173,150),'wood')
    p(dream,'DreamPhotoBacking',(3.8,3.1,.08),(-6,11.9,-319.7),(118,135,155))
    p(dream,'DreamPhotoHome_Window',(2.7,2.2,.07),(-6,12,-319.35),(182,207,218),'neon')
    p(dream,'DreamPhotoHome_Bar',(.1,2.2,.09),(-6,12,-319.28),(226,211,192),'wood')
    p(dream,'DreamPhotoHome_Bed',(2.8,.4,.65),(-6,10.8,-319.15),(109,132,162),'fabric')
    p(dream,'DreamPhotoWork_Counter',(3.5,.65,.5),(-6,10.9,-319.15),(181,82,58),'wood',trans=1)
    p(dream,'DreamPhotoWork_Soda',(.5,1.25,.35),(-4.8,11.85,-319.22),(192,79,58),trans=1)
    p(dream,'DreamPhotoWork_Light',(2.5,.16,.2),(-6,13.1,-319.25),(246,220,176),'neon',trans=1)
    # A coat rack becomes a little tree when the player releases it.
    p(dream,'CoatStandBase',(2,.18,2),(13,8.3,-367),(151,131,147),'wood')
    p(dream,'CoatStand',(.2,5,.2),(13,10.9,-367),(151,131,147),'wood')
    p(dream,'CoatHanger',(2.8,.15,.18),(13,12.85,-367),(182,163,159),'wood')
    p(dream,'Float_CoatBody',(1.8,2.6,.35),(13,11.4,-366.8),(136,155,154),'fabric')
    for side in [-1,1]:p(dream,'Float_CoatSleeve'+str(side),(.6,2.3,.35),(13+side*1.13,11.6,-366.8),(136,155,154),'fabric',matrix(0,0,side*17))
    for i in range(14):
        q=i*2.4
        p(dream,'Float_Leaf'+str(i),(1.15,.06,.55),(13+math.sin(q)*.8,12+i%3*.45,-367+math.cos(q)*.6),(171+i%3*9,193,157),'fabric',matrix(0,i*33,10),shape=0,trans=1)
    for i,(pos,act,title) in enumerate([
        ((-8,11,-253),'Read','A book you almost remember'),
        ((2,11,-289),'Turn the handle','A sink with no floor'),
        ((-6,11,-316),'Look closer','A photograph of a place you know'),
        ((13,11,-365),'Let go','Your coat, growing leaves'),
    ],7):
        obj=p(dream,'Interaction'+str(i),(.4,.4,.4),pos,(255,255,255),trans=1)
        pr=item('ProximityPrompt','Remember',obj)
        for n,words in [('ActionText',act),('ObjectText',title)]:prop(pr,'string',n,words)
        prop(pr,'float','HoldDuration',.25);prop(pr,'float','MaxActivationDistance',11);prop(pr,'bool','RequiresLineOfSight',False)
        prop(pr,'token','KeyboardKeyCode',101);prop(pr,'token','GamepadKeyCode',1002)
    # Face the wardrobe toward the bed. At the old grazing angle its left leaf
    # physically hid both eyes, even with a correct first-person camera.
    turn=matrix(0,-65,0);pivot=(11,4.5,-12)
    def rotate_point(pos):
        local=[pos[i]-pivot[i] for i in range(3)]
        return tuple(pivot[i]+sum(turn[i][j]*local[j] for j in range(3)) for i in range(3))
    for obj in room.findall('Item'):
        if obj.attrib['class']!='Part' or not (name(obj).startswith('Closet') or name(obj) in ('EyeLeft','EyeRight')):continue
        cf=obj.find("Properties/CoordinateFrame[@name='CFrame']")
        pos=tuple(float(cf.findtext(k)) for k in 'XYZ');newpos=rotate_point(pos)
        old=[[float(cf.findtext(f'R{i}{j}')) for j in range(3)] for i in range(3)]
        for k,value in zip('XYZ',newpos):cf.find(k).text=str(value)
        for i in range(3):
            for j in range(3):cf.find(f'R{i}{j}').text=str(round(sum(turn[i][k]*old[k][j] for k in range(3)),9))
        for entry in g['manifest']:
            if entry['name']==name(obj) and entry['position']==pos:entry['position']=newpos;break
    g['closet_target']=rotate_point((11,5.4,-9.85))
