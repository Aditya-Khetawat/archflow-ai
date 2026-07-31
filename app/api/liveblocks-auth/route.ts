import { currentUser } from "@clerk/nextjs/server";
import { getLiveblocks, getUserColor } from "@/lib/liveblocks";
import {
  getCurrentProjectIdentity,
  userHasProjectAccess,
} from "@/lib/project-access";

export async function POST(request: Request) {
  const identity = await getCurrentProjectIdentity();

  if (!identity.userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { room } = await request.json();

  if (!room || typeof room !== "string") {
    return new Response("Bad Request", { status: 400 });
  }

  const hasAccess = await userHasProjectAccess(room, identity);

  if (!hasAccess) {
    return new Response("Forbidden", { status: 403 });
  }

  const lb = getLiveblocks();

  // Ensure the room exists (private by default)
  await lb.getOrCreateRoom(room, { defaultAccesses: [] });

  // Explicitly grant this user write access on every auth request.
  // Required for ID token auth — room permissions are enforced by Liveblocks
  // server-side, not embedded in the token.
  await lb.updateRoom(room, {
    usersAccesses: {
      [identity.userId]: ["room:write"],
    },
  });

  const user = await currentUser();
  const name =
    user?.fullName ??
    user?.primaryEmailAddress?.emailAddress ??
    "Anonymous";
  const avatar = user?.imageUrl ?? "";
  const color = getUserColor(identity.userId);

  // Use identifyUser (ID token) instead of prepareSession (access token).
  // ID tokens are valid for ALL Liveblocks APIs including Feeds, Comments,
  // Notifications — not just the specific room.
  const { status, body } = await lb.identifyUser(
    { userId: identity.userId, groupIds: [] },
    { userInfo: { name, avatar, color } }
  );

  return new Response(body, { status });
}
