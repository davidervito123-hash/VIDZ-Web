const ONLINE_TIMEOUT = 30000;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store"
    }
  });
}

export async function onRequestGet(context) {
  try {
    const row = await context.env.DB
      .prepare(
        "SELECT last_seen FROM owner_status WHERE id = 1"
      )
      .first();

    const lastSeen = Number(row?.last_seen || 0);
    const now = Date.now();

    const online =
      lastSeen > 0 &&
      now - lastSeen < ONLINE_TIMEOUT;

    return json({
      online,
      lastSeen
    });

  } catch (error) {
    return json({
      online: false,
      error: "Database error"
    }, 500);
  }
}

export async function onRequestPost(context) {
  try {
    const token =
      context.request.headers.get("X-VIDZ-OWNER-TOKEN");

    if (!token || token !== context.env.OWNER_TOKEN) {
      return json({
        error: "Unauthorized"
      }, 401);
    }

    const now = Date.now();

    await context.env.DB
      .prepare(
        "UPDATE owner_status SET last_seen = ? WHERE id = 1"
      )
      .bind(now)
      .run();

    return json({
      success: true,
      online: true,
      lastSeen: now
    });

  } catch (error) {
    return json({
      error: "Database error"
    }, 500);
  }
}
