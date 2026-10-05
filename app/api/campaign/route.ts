import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";

function fallback(count:number){
  return Array.from({length:count},(_,i)=>({
    day:i+1,
    title:`Content idea ${i+1}`,
    objective:["Awareness","Engagement","Education","Conversion"][i%4],
    format:["Carousel","Single Image","Reel"][i%3],
    hook:"Hook konten yang kuat dan relevan.",
    caption:"Caption akan disesuaikan dengan brand dan target audience.",
    cta:"Ajak audiens berinteraksi.",
    hashtags:["#content","#instagram","#marketing"],
    image_brief:"Visual yang merepresentasikan caption dengan gaya brand yang konsisten."
  }));
}

export async function POST(req:Request){
  try{
    const body=await req.json();
    const {brand="My Brand",niche="Bisnis",audience="Target audience",tone="Friendly",count=1}=body;
    const allowed=[1,7,14,30];
    if(!allowed.includes(count)) return NextResponse.json({error:"Count harus 1, 7, 14, atau 30."},{status:400});

    const apiKey=process.env.GEMINI_API_KEY;
    if(!apiKey) return NextResponse.json({
      days:fallback(count),
      demo:true,
      message:"GEMINI_API_KEY belum di-set. Menampilkan fallback demo."
    });

    const genAI=new GoogleGenerativeAI(apiKey);
    const model=genAI.getGenerativeModel({model:"gemini-3.5-flash-lite"});
    const prompt=`You are a social media content strategist. Create exactly ${count} Instagram content plans for brand "${brand}", niche "${niche}", audience "${audience}", tone "${tone}". Return JSON only as an array. Each item must have: day(number), title(string), objective(one of Awareness, Engagement, Education, Conversion), format(one of Carousel, Single Image, Reel), hook, caption, cta, hashtags(array of 3-8 strings), image_brief. Make each day materially different and make image_brief semantically match the caption. Do not use markdown fences.`;

    const result=await model.generateContent(prompt);
    const raw=result.response.text().trim();
    const cleaned=raw.replace(/^\`\`\`json\s*/,"").replace(/^\`\`\`\s*/,"").replace(/\s*\`\`\`$/,"").trim();
    const parsed=JSON.parse(cleaned);
    if(!Array.isArray(parsed) || parsed.length!==count) throw new Error("Model returned invalid batch.");
    return NextResponse.json({days:parsed});
  }catch(err){
    return NextResponse.json({error:err instanceof Error?err.message:"Generation failed"}, {status:500});
  }
}
