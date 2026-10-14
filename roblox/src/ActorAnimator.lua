-- A segmented cinematic actor: feet plant, knees bend, arms reach, and breathing remains subtle.
local Animator = {}
Animator.__index = Animator
function Animator.new(model)
    local self = setmetatable({ model = model, parts = {}, offsets = {} }, Animator)
    for _, part in ipairs(model:GetDescendants()) do
        if part:IsA("BasePart") then self.parts[part.Name] = part; self.offsets[part.Name] = model:GetPivot():ToObjectSpace(part.CFrame) end
    end
    return self
end
local function blend(a,b,t) return a + (b-a)*t end
function Animator:apply(pivot, time, pose)
    local p = self.parts; if not p.Root then return end
    local sit = pose.sit or 0; local walk = pose.walk or 0; local sleep = pose.sleep or 0
    local step = math.sin(time * 8.4) * walk
    local bob = math.abs(math.sin(time * 8.4)) * walk * .035
    local root = pivot * CFrame.new(0,bob,0)
    for name, part in pairs(p) do part.CFrame = root * self.offsets[name] end
    p.Root.CFrame = root
    local body = root * CFrame.Angles((pose.lean or 0) * .16, 0, 0)
    p.Torso.CFrame = body * self.offsets.Torso
    local breath = sleep * math.sin(time * 1.6) * .015
    -- Raise the back of the sleeping head onto the pillow rather than through it.
    local head = body * self.offsets.Head * CFrame.new(0,breath,-sleep*.32) * CFrame.Angles(0,(pose.look or 0)*.12,0)
    p.Head.CFrame = head
    for _, name in ipairs({"Hair","FaceEyeL","FaceEyeR","Mouth"}) do
        p[name].CFrame = head * self.offsets.Head:Inverse() * self.offsets[name]
    end
    local shut = pose.eyes or 0
    p.FaceEyeL.Size = Vector3.new(.13, blend(.13,.025,shut),.055)
    p.FaceEyeR.Size = p.FaceEyeL.Size
    for _, side in ipairs({-1,1}) do
        local leg = side < 0 and "Left" or "Right"
        local hipAngle = sit * math.pi/2 + step * .43 * side * (1-sit)
        local kneeAngle = -sit * math.pi/2 - math.max(0,-step*side)*.24*(1-sit)
        local hip = body * CFrame.new(side*.55,-.5,0) * CFrame.Angles(hipAngle,0,0)
        p[leg.."Leg"].CFrame = hip * CFrame.new(0,-.575,0)
        local knee = hip * CFrame.new(0,-1.15,0) * CFrame.Angles(kneeAngle,0,0)
        p[leg.."LowerLeg"].CFrame = knee * CFrame.new(0,-.625,0)
        p[leg.."Foot"].CFrame = knee * CFrame.new(0,-1.39,-.12)
        local shoulder = body * CFrame.new(side*1.36,1.15,0)
        local angle = -step*.23*side + sit*.22
        local upper = shoulder * CFrame.Angles(angle,0,side*-.03)
        p[leg.."Arm"].CFrame = upper * CFrame.new(0,-.55,0)
        local elbow = upper * CFrame.new(0,-1.1,0) * CFrame.Angles(-.12-sit*.35,0,0)
        p[leg.."Forearm"].CFrame = elbow * CFrame.new(0,-.42,0)
        p[leg.."Hand"].CFrame = elbow * CFrame.new(0,-.97,0)
    end
    if pose.reach and pose.reach > 0 and pose.target then
        local shoulder = (body * CFrame.new(1.36,1.15,0)).Position
        local ordinary = p.RightHand.Position
        local target = ordinary:Lerp(pose.target,pose.reach)
        local delta = target-shoulder; if delta.Magnitude > 2.5 then target=shoulder+delta.Unit*2.5 end
        local elbow = shoulder:Lerp(target,.52) + body.RightVector*.12 + body.UpVector*.13
        local function bone(part,a,b)
            part.Size = Vector3.new(part.Size.X,(b-a).Magnitude,part.Size.Z)
            part.CFrame = CFrame.lookAt((a+b)*.5,b) * CFrame.Angles(math.pi/2,0,0)
        end
        bone(p.RightArm,shoulder,elbow); bone(p.RightForearm,elbow,target)
        p.RightHand.CFrame = CFrame.new(target) * root.Rotation
    else
        p.RightArm.Size = Vector3.new(.85,1.1,.9); p.RightForearm.Size=Vector3.new(.72,.84,.8)
    end
end
return Animator
