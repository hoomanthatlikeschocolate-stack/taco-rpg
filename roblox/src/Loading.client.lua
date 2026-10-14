-- Runs before Workspace/PlayerModule replication. The first visible frame is covered.
local Players=game:GetService("Players")
local ReplicatedFirst=game:GetService("ReplicatedFirst")
local player=Players.LocalPlayer
local gui=Instance.new("ScreenGui")
gui.Name="OpeningLoading"; gui.IgnoreGuiInset=true; gui.ResetOnSpawn=false; gui.DisplayOrder=1000
local cover=Instance.new("TextLabel")
cover.Size=UDim2.fromScale(1,1); cover.BackgroundColor3=Color3.new(0,0,0)
cover.Text=""; cover.BorderSizePixel=0; cover.Parent=gui
gui.Parent=player:WaitForChild("PlayerGui")
ReplicatedFirst:RemoveDefaultLoadingScreen()
-- The main client destroys this only after establishing the bedroom camera.
