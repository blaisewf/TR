import { NextResponse } from "next/server";
import { supabase, getTableName } from "@/lib/database/supabase";
import { converter } from "culori";
import type { Rgb } from "culori";

const toLab = converter("lab");
const toOklab = converter("oklab");
const toJab = converter("jab");

export async function GET() {
  const { data: sessions, error } = await supabase
    .from(getTableName())
    .select("*")
    .order("saved_at", { ascending: false });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const failed: Record<string, number[][]> = {
    RGB: [],
    CIELAB: [],
    Oklab: [],
    JzAzBz: [],
  };
  for (const session of sessions || []) {
    for (const round of session.rounds || []) {
      if (!round.correct) {
        const model = round.color_model;
        const base = round.base_color;
        if (failed[model] && Array.isArray(base) && base.length === 3) {
          failed[model].push(base);
        }
      }
    }
  }

  // normalize all RGB values to [0,1]
  const rgb: Record<string, number[][]> = {};
  for (const model of Object.keys(failed)) {
    rgb[model] = failed[model].map(rgb => rgb.map(v => v / 255));
  }

  // convert to native color spaces
  const native: Record<string, number[][]> = {};
  for (const model of Object.keys(failed)) {
    if (model === "RGB") {
      native[model] = failed[model].map(rgb => rgb.map(v => v / 255));
    } else {
      native[model] = failed[model].map(rgb => {
        const rgbNorm: Rgb = { mode: "rgb", r: rgb[0] / 255, g: rgb[1] / 255, b: rgb[2] / 255 };
        if (model === "CIELAB") {
          const c = toLab(rgbNorm);
          return c ? [c.l, c.a, c.b] : [0, 0, 0];
        }
        if (model === "Oklab") {
          const c = toOklab(rgbNorm);
          return c ? [c.l, c.a, c.b] : [0, 0, 0];
        }
        if (model === "JzAzBz") {
          const c = toJab(rgbNorm);
          return c ? [c.j, c.a, c.b] : [0, 0, 0];
        }
        return [0, 0, 0];
      });
    }
  }

  return NextResponse.json({ rgb, native });
} 