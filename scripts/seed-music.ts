import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://lxkugbswxdrkdhuyorwf.supabase.co",
  "sb_secret_Lm7q0gbdIzHnAUNQ4h7WFA_OkWY1YkE"
);

async function main() {
  // Delete all existing music
  const {error: delError} = await supabase.from("church_music").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  
  if (delError) {
    // Try truncating via RPC
    const {error: rpcError} = await supabase.rpc("exec_sql", { sql: "TRUNCATE church_music RESTART IDENTITY CASCADE;" });
    if (rpcError) console.error("Error truncating:", rpcError.message);
    else console.log("Truncated church_music table");
  } else {
    console.log("Deleted existing music files");
  }

  // Read ALL music names from file (mp3 + wav + wma)
  const fs = require("fs");
  const allNames = [];
  
  // Read mp3 names
  try {
    const mp3Names = fs.readFileSync("scripts/music-names.txt", "utf8").split("\n").filter((n: string) => n.trim().length > 0);
    allNames.push(...mp3Names);
  } catch(e) { console.log("No music-names.txt"); }
  
  // Read wav/wma names
  try {
    const otherNames = fs.readFileSync("scripts/music-other.txt", "utf8").split("\n").filter((n: string) => n.trim().length > 0);
    allNames.push(...otherNames);
  } catch(e) { console.log("No music-other.txt"); }

  console.log("Found", allNames.length, "music names to seed");

  // Make titles unique by adding index suffix if duplicate
  const titleSet = new Set();
  const musicToInsert = allNames.map((name: string, i: number) => {
    let title = name.replace(/\.[^./]+$/, "");  // Remove extension
    // Make unique if needed
    let uniqueTitle = title;
    let count = 0;
    while (titleSet.has(uniqueTitle)) {
      count++;
      uniqueTitle = title + "(" + count + ")";
    }
    titleSet.add(uniqueTitle);
    
    return {
      title: uniqueTitle,
      artist_choir: "GLORIOUS Choir",
      audio_url: "local://" + name,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  });

  const {error} = await supabase.from("church_music").insert(musicToInsert);
  
  if (error) console.error("Error inserting music:", error.message);
  else console.log("Inserted", musicToInsert.length, "music files");
}

main().catch(console.error);
