"use client"

import { Palette } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTheme } from "@/components/theme-provider"
import { themePresets, type ThemePreset } from "@/theme/presets"

export function ThemePresetSelector() {
  const { themePreset, setThemePreset } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-11 w-11 bg-white/10 hover:bg-white/20 rounded-full transition-all duration-300 hover:scale-110 hover:shadow-lg group"
          aria-label="Select theme preset"
        >
          <Palette className="h-5 w-5 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuLabel>Theme Preset</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {Object.entries(themePresets).map(([key, preset]) => (
          <DropdownMenuItem
            key={key}
            onClick={() => setThemePreset(key as ThemePreset)}
            className={themePreset === key ? "bg-accent" : ""}
          >
            {preset.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
