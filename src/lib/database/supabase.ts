import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type RoundData = {
  level: number
  base_color: [number, number, number]
  changed_color: [number, number, number]
  color_model: "RGB" | "CIELAB" | "CIECAM02-UCS" | "Oklab"
  changed_position: [number, number]
  click_position: [number, number]
  click_coords: [number, number]
  time: number
  correct: boolean
}

export type GameSessionData = {
  session_id: string
  player_id: string
  total_time: number
  final_level: number
  rounds: RoundData[]
  device_info: {
    user_agent: string
    platform: string
    language: string
    screen_width: number
    screen_height: number
    color_depth: number
    pixel_ratio: number
    is_mobile: boolean
  }
}

export async function saveCompleteSession(sessionData: GameSessionData) {
  try {
    const { data, error } = await supabase
      .from("data")
      .insert([
        {
          session_id: sessionData.session_id,
          player_id: sessionData.player_id,
          total_time: sessionData.total_time,
          final_level: sessionData.final_level,
          rounds: sessionData.rounds,
          device_info: sessionData.device_info
        },
      ])
      .select()

    if (error) {
      console.error("Error saving complete session:", error.message, error.details, error.hint)
      throw new Error(`Failed to save session: ${error.message}`)
    }

    console.log("Complete session saved successfully:", data)
    return data
  } catch (error) {
    console.error("Error in saveCompleteSession:", error)
    throw error
  }
}
