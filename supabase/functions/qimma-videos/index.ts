import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json; charset=utf-8",
};

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: corsHeaders });

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "استخدم طلب POST." });

  const apiKey = Deno.env.get("YOUTUBE_API_KEY");
  if (!apiKey) return json(503, { error: "مفتاح YouTube غير مضبوط في إعدادات الخادم." });

  try {
    const body = await req.json();
    const query = String(body?.query ?? "").trim().slice(0, 160);
    if (query.length < 2) return json(400, { error: "اكتب اسم المادة أو الدرس أولًا." });

    const params = new URLSearchParams({
      part: "snippet",
      type: "video",
      q: `مدرس شرح ${query}`,
      maxResults: "8",
      safeSearch: "strict",
      order: "relevance",
      regionCode: "EG",
      relevanceLanguage: "ar",
      videoCategoryId: "27",
      videoEmbeddable: "true",
      key: apiKey,
    });

    const response = await fetch("https://www.googleapis.com/youtube/v3/search?" + params.toString());
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      const reason = payload?.error?.errors?.[0]?.reason;
      if (response.status === 403 && (reason === "quotaExceeded" || reason === "dailyLimitExceeded")) {
        return json(429, { error: "وصلنا إلى حد البحث اليومي في يوتيوب. جرّب غدًا." });
      }
      console.error("YouTube API error", response.status, reason || payload?.error?.message || "unknown");
      return json(502, { error: "تعذر البحث في يوتيوب الآن. تأكد من تفعيل YouTube Data API v3 وقيود المفتاح." });
    }

    const videos = (payload.items || []).flatMap((item: any) => {
      const videoId = String(item?.id?.videoId || "");
      if (!/^[A-Za-z0-9_-]{11}$/.test(videoId)) return [];
      const snippet = item.snippet || {};
      return [{
        videoId,
        title: String(snippet.title || "فيديو تعليمي").slice(0, 180),
        description: String(snippet.description || "").slice(0, 300),
        channelTitle: String(snippet.channelTitle || "").slice(0, 100),
        publishedAt: String(snippet.publishedAt || ""),
        thumbnailUrl: String(snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url || ""),
      }];
    });

    return json(200, { videos });
  } catch (_error) {
    return json(400, { error: "تعذر قراءة طلب البحث. حاول مرة أخرى." });
  }
});
