"use client";

import { SimulatorConfig, DEFAULT_SIM_CONFIG } from "./trajectory";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Monitor } from "lucide-react";

interface SimulatorConfigPanelProps {
  config: SimulatorConfig;
  onChange: (config: SimulatorConfig) => void;
}

export function SimulatorConfigPanel({ config, onChange }: SimulatorConfigPanelProps) {
  const update = (field: keyof SimulatorConfig, value: string) => {
    const num = parseFloat(value);
    if (!isNaN(num) && num > 0) {
      onChange({ ...config, [field]: num });
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Monitor className="w-4 h-4" />
          Room Setup
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Screen Distance</Label>
            <div className="flex items-center gap-1">
              <Input
                type="number"
                step="0.5"
                min="5"
                max="30"
                value={config.screenDistanceFt}
                onChange={(e) => update("screenDistanceFt", e.target.value)}
                className="h-8 text-sm"
              />
              <span className="text-xs text-muted-foreground">ft</span>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Screen Width</Label>
            <div className="flex items-center gap-1">
              <Input
                type="number"
                step="0.5"
                min="6"
                max="20"
                value={config.screenWidthFt}
                onChange={(e) => update("screenWidthFt", e.target.value)}
                className="h-8 text-sm"
              />
              <span className="text-xs text-muted-foreground">ft</span>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Screen Height</Label>
            <div className="flex items-center gap-1">
              <Input
                type="number"
                step="0.5"
                min="4"
                max="15"
                value={config.screenHeightFt}
                onChange={(e) => update("screenHeightFt", e.target.value)}
                className="h-8 text-sm"
              />
              <span className="text-xs text-muted-foreground">ft</span>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Tee Height</Label>
            <div className="flex items-center gap-1">
              <Input
                type="number"
                step="0.25"
                min="0"
                max="3"
                value={config.teeHeightFt}
                onChange={(e) => update("teeHeightFt", e.target.value)}
                className="h-8 text-sm"
              />
              <span className="text-xs text-muted-foreground">ft</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
